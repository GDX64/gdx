// Grid-based fluid solver following Jos Stam's Stable Fluids method
// (see FluidSimulation.md), implemented as WebGPU compute shaders. Every
// iterative solve uses Jacobi relaxation rather than Gauss-Seidel: GS reads
// neighbors already updated earlier in the same sweep, which is fine
// sequentially on the CPU but has no meaning across parallel GPU threads.
// Jacobi instead always reads the previous iteration's buffer and writes a
// fresh one, so it needs an extra ping-pong buffer that the CPU version
// didn't.

export interface FluidSimulationParams {
  size: number;
  diffusion: number;
  viscosity: number;
  dt: number;
  solverIterations: number;
}

const DEFAULT_PARAMS: FluidSimulationParams = {
  size: 128,
  diffusion: 0,
  viscosity: 0.0001,
  dt: 0.1,
  solverIterations: 20,
};

const MAX_SPLATS = 256;
const SPLAT_FIELDS = 5; // i, j, dDensity, dvx, dvy

interface Splat {
  i: number;
  j: number;
  dDensity: number;
  dvx: number;
  dvy: number;
}

const splatShaderCode = /*wgsl*/ `
struct Splat {
  i: f32,
  j: f32,
  dDensity: f32,
  dvx: f32,
  dvy: f32,
};

@group(0) @binding(0) var<storage, read> splats: array<Splat>;
@group(0) @binding(1) var<storage, read_write> density: array<f32>;
@group(0) @binding(2) var<storage, read_write> velocityX: array<f32>;
@group(0) @binding(3) var<storage, read_write> velocityY: array<f32>;

@group(0) @binding(4) var<storage, read> splatCountBuf: array<u32>;

override STRIDE: u32;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let s = gid.x;
  if (s >= splatCountBuf[0]) {
    return;
  }
  let sp = splats[s];
  let idx = u32(sp.i) + STRIDE * u32(sp.j);
  density[idx] = density[idx] + sp.dDensity;
  velocityX[idx] = velocityX[idx] + sp.dvx;
  velocityY[idx] = velocityY[idx] + sp.dvy;
}
`;

// Reflects velocity components off walls (no-flow), copies density/pressure
// through unchanged (zero-gradient). Corners are a separate entry point
// because they read edge values written by *other* threads in the edge
// pass — WebGPU only guarantees ordering between separate dispatches, not
// between threads within the same one.
const boundaryShaderCode = /*wgsl*/ `
override N: u32;
override STRIDE: u32;

@group(0) @binding(0) var<storage, read_write> field: array<f32>;

fn idx(i: u32, j: u32) -> u32 {
  return i + STRIDE * j;
}

@compute @workgroup_size(64)
fn boundary_scalar(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x + 1u;
  if (i > N) {
    return;
  }
  field[idx(0u, i)] = field[idx(1u, i)];
  field[idx(N + 1u, i)] = field[idx(N, i)];
  field[idx(i, 0u)] = field[idx(i, 1u)];
  field[idx(i, N + 1u)] = field[idx(i, N)];
}

@compute @workgroup_size(64)
fn boundary_x(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x + 1u;
  if (i > N) {
    return;
  }
  field[idx(0u, i)] = -field[idx(1u, i)];
  field[idx(N + 1u, i)] = -field[idx(N, i)];
  field[idx(i, 0u)] = field[idx(i, 1u)];
  field[idx(i, N + 1u)] = field[idx(i, N)];
}

@compute @workgroup_size(64)
fn boundary_y(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x + 1u;
  if (i > N) {
    return;
  }
  field[idx(0u, i)] = field[idx(1u, i)];
  field[idx(N + 1u, i)] = field[idx(N, i)];
  field[idx(i, 0u)] = -field[idx(i, 1u)];
  field[idx(i, N + 1u)] = -field[idx(i, N)];
}

@compute @workgroup_size(1)
fn boundary_corners() {
  field[idx(0u, 0u)] = 0.5 * (field[idx(1u, 0u)] + field[idx(0u, 1u)]);
  field[idx(0u, N + 1u)] = 0.5 * (field[idx(1u, N + 1u)] + field[idx(0u, N)]);
  field[idx(N + 1u, 0u)] = 0.5 * (field[idx(N, 0u)] + field[idx(N + 1u, 1u)]);
  field[idx(N + 1u, N + 1u)] = 0.5 * (field[idx(N, N + 1u)] + field[idx(N + 1u, N)]);
}
`;

// One Jacobi relaxation sweep for the implicit diffusion / pressure Poisson
// systems (see "Step 3: Diffusion" and "Step 4: Projection"). Reused for
// velocity diffusion, density diffusion, and the pressure solve — only the
// A/C constants differ, baked in as pipeline-overridable constants.
const jacobiShaderCode = /*wgsl*/ `
override N: u32;
override STRIDE: u32;
override A: f32;
override C: f32;

@group(0) @binding(0) var<storage, read> fieldIn: array<f32>;
@group(0) @binding(1) var<storage, read> rhs: array<f32>;
@group(0) @binding(2) var<storage, read_write> fieldOut: array<f32>;

fn idx(i: u32, j: u32) -> u32 {
  return i + STRIDE * j;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x + 1u;
  let j = gid.y + 1u;
  if (i > N || j > N) {
    return;
  }
  let id = idx(i, j);
  let neighbors =
    fieldIn[idx(i - 1u, j)] + fieldIn[idx(i + 1u, j)] +
    fieldIn[idx(i, j - 1u)] + fieldIn[idx(i, j + 1u)];
  fieldOut[id] = (rhs[id] + A * neighbors) / C;
}
`;

const divergenceShaderCode = /*wgsl*/ `
override N: u32;
override STRIDE: u32;
override H: f32;

@group(0) @binding(0) var<storage, read> velocityX: array<f32>;
@group(0) @binding(1) var<storage, read> velocityY: array<f32>;
@group(0) @binding(2) var<storage, read_write> divergence: array<f32>;
@group(0) @binding(3) var<storage, read_write> pressure: array<f32>;

fn idx(i: u32, j: u32) -> u32 {
  return i + STRIDE * j;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x + 1u;
  let j = gid.y + 1u;
  if (i > N || j > N) {
    return;
  }
  let id = idx(i, j);
  divergence[id] = -0.5 * H * (
    velocityX[idx(i + 1u, j)] - velocityX[idx(i - 1u, j)] +
    velocityY[idx(i, j + 1u)] - velocityY[idx(i, j - 1u)]
  );
  pressure[id] = 0.0;
}
`;

const gradientSubtractShaderCode = /*wgsl*/ `
override N: u32;
override STRIDE: u32;
override H: f32;

@group(0) @binding(0) var<storage, read> pressure: array<f32>;
@group(0) @binding(1) var<storage, read_write> velocityX: array<f32>;
@group(0) @binding(2) var<storage, read_write> velocityY: array<f32>;

fn idx(i: u32, j: u32) -> u32 {
  return i + STRIDE * j;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x + 1u;
  let j = gid.y + 1u;
  if (i > N || j > N) {
    return;
  }
  let id = idx(i, j);
  velocityX[id] = velocityX[id] - 0.5 * (pressure[idx(i + 1u, j)] - pressure[idx(i - 1u, j)]) / H;
  velocityY[id] = velocityY[id] - 0.5 * (pressure[idx(i, j + 1u)] - pressure[idx(i, j - 1u)]) / H;
}
`;

// Semi-Lagrangian backtrace with bilinear interpolation (see
// "Step 2: Advection (semi-Lagrangian)").
const advectShaderCode = /*wgsl*/ `
override N: u32;
override STRIDE: u32;
override DT: f32;

@group(0) @binding(0) var<storage, read> fieldPrev: array<f32>;
@group(0) @binding(1) var<storage, read> velocityX: array<f32>;
@group(0) @binding(2) var<storage, read> velocityY: array<f32>;
@group(0) @binding(3) var<storage, read_write> fieldOut: array<f32>;

fn idx(i: u32, j: u32) -> u32 {
  return i + STRIDE * j;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x + 1u;
  let j = gid.y + 1u;
  if (i > N || j > N) {
    return;
  }
  let id = idx(i, j);
  let nf = f32(N);

  var x = f32(i) - DT * nf * velocityX[id];
  var y = f32(j) - DT * nf * velocityY[id];
  x = clamp(x, 0.5, nf + 0.5);
  y = clamp(y, 0.5, nf + 0.5);

  let x0f = floor(x);
  let y0f = floor(y);
  let i0 = u32(x0f);
  let i1 = i0 + 1u;
  let j0 = u32(y0f);
  let j1 = j0 + 1u;

  let s1 = x - x0f;
  let s0 = 1.0 - s1;
  let t1 = y - y0f;
  let t0 = 1.0 - t1;

  fieldOut[id] =
    s0 * (t0 * fieldPrev[idx(i0, j0)] + t1 * fieldPrev[idx(i0, j1)]) +
    s1 * (t0 * fieldPrev[idx(i1, j0)] + t1 * fieldPrev[idx(i1, j1)]);
}
`;

function ceilDiv(a: number, b: number): number {
  return Math.ceil(a / b);
}

export class FluidSimulation {
  readonly size: number;
  readonly diffusion: number;
  readonly viscosity: number;
  readonly dt: number;
  readonly solverIterations: number;
  readonly device: GPUDevice;

  private readonly stride: number;
  private readonly iterations: number; // rounded up to even, see diffuse()/project()

  private density: GPUBuffer;
  private densityPrev: GPUBuffer;
  private velocityX: GPUBuffer;
  private velocityXPrev: GPUBuffer;
  private velocityY: GPUBuffer;
  private velocityYPrev: GPUBuffer;
  private readonly scratch: GPUBuffer;

  private readonly splatBuffer: GPUBuffer;
  private readonly splatCountBuffer: GPUBuffer;
  private readonly pendingSplats = new Map<number, Splat>();

  private readonly splatPipeline: GPUComputePipeline;
  private readonly boundaryScalarPipeline: GPUComputePipeline;
  private readonly boundaryXPipeline: GPUComputePipeline;
  private readonly boundaryYPipeline: GPUComputePipeline;
  private readonly boundaryCornersPipeline: GPUComputePipeline;
  private readonly velocityDiffusePipeline: GPUComputePipeline;
  private readonly densityDiffusePipeline: GPUComputePipeline;
  private readonly pressurePipeline: GPUComputePipeline;
  private readonly divergencePipeline: GPUComputePipeline;
  private readonly gradientSubtractPipeline: GPUComputePipeline;
  private readonly advectPipeline: GPUComputePipeline;

  private pass: GPUComputePassEncoder | null = null;

  private constructor(device: GPUDevice, params: FluidSimulationParams) {
    this.device = device;
    this.size = params.size;
    this.diffusion = params.diffusion;
    this.viscosity = params.viscosity;
    this.dt = params.dt;
    this.solverIterations = params.solverIterations;
    this.iterations =
      params.solverIterations % 2 === 0
        ? params.solverIterations
        : params.solverIterations + 1;

    this.stride = this.size + 2;
    const cellCount = this.stride * this.stride;
    const bufferSize = cellCount * 4;

    const makeField = () =>
      device.createBuffer({ size: bufferSize, usage: GPUBufferUsage.STORAGE });

    this.density = makeField();
    this.densityPrev = makeField();
    this.velocityX = makeField();
    this.velocityXPrev = makeField();
    this.velocityY = makeField();
    this.velocityYPrev = makeField();
    this.scratch = makeField();

    this.splatBuffer = device.createBuffer({
      size: MAX_SPLATS * SPLAT_FIELDS * 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });
    this.splatCountBuffer = device.createBuffer({
      size: 4,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
    });

    const n = this.size;
    const stride = this.stride;
    const a = this.dt * this.viscosity * n * n;
    const dDiffA = this.dt * this.diffusion * n * n;
    const h = 1 / n;

    const splatModule = device.createShaderModule({ code: splatShaderCode });
    this.splatPipeline = device.createComputePipeline({
      layout: 'auto',
      compute: { module: splatModule, entryPoint: 'main', constants: { STRIDE: stride } },
    });

    const boundaryModule = device.createShaderModule({ code: boundaryShaderCode });
    const boundaryConstants = { N: n, STRIDE: stride };
    this.boundaryScalarPipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: boundaryModule,
        entryPoint: 'boundary_scalar',
        constants: boundaryConstants,
      },
    });
    this.boundaryXPipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: boundaryModule,
        entryPoint: 'boundary_x',
        constants: boundaryConstants,
      },
    });
    this.boundaryYPipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: boundaryModule,
        entryPoint: 'boundary_y',
        constants: boundaryConstants,
      },
    });
    this.boundaryCornersPipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: boundaryModule,
        entryPoint: 'boundary_corners',
        constants: boundaryConstants,
      },
    });

    const jacobiModule = device.createShaderModule({ code: jacobiShaderCode });
    this.velocityDiffusePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: jacobiModule,
        entryPoint: 'main',
        constants: { N: n, STRIDE: stride, A: a, C: 1 + 4 * a },
      },
    });
    this.densityDiffusePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: jacobiModule,
        entryPoint: 'main',
        constants: { N: n, STRIDE: stride, A: dDiffA, C: 1 + 4 * dDiffA },
      },
    });
    this.pressurePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: jacobiModule,
        entryPoint: 'main',
        constants: { N: n, STRIDE: stride, A: 1, C: 4 },
      },
    });

    this.divergencePipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: device.createShaderModule({ code: divergenceShaderCode }),
        entryPoint: 'main',
        constants: { N: n, STRIDE: stride, H: h },
      },
    });
    this.gradientSubtractPipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: device.createShaderModule({ code: gradientSubtractShaderCode }),
        entryPoint: 'main',
        constants: { N: n, STRIDE: stride, H: h },
      },
    });
    this.advectPipeline = device.createComputePipeline({
      layout: 'auto',
      compute: {
        module: device.createShaderModule({ code: advectShaderCode }),
        entryPoint: 'main',
        constants: { N: n, STRIDE: stride, DT: this.dt },
      },
    });
  }

  static async new(
    params: Partial<FluidSimulationParams> = {}
  ): Promise<FluidSimulation> {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('WebGPU is not supported in this browser');
    const device = await adapter.requestDevice();
    return new FluidSimulation(device, { ...DEFAULT_PARAMS, ...params });
  }

  get densityBuffer(): GPUBuffer {
    return this.density;
  }

  addDensity(i: number, j: number, amount: number): void {
    const splat = this.getOrCreateSplat(i, j);
    if (splat) splat.dDensity += amount;
  }

  addVelocity(i: number, j: number, amountX: number, amountY: number): void {
    const splat = this.getOrCreateSplat(i, j);
    if (splat) {
      splat.dvx += amountX;
      splat.dvy += amountY;
    }
  }

  private getOrCreateSplat(i: number, j: number): Splat | undefined {
    const key = i + this.stride * j;
    let splat = this.pendingSplats.get(key);
    if (!splat && this.pendingSplats.size < MAX_SPLATS) {
      splat = { i, j, dDensity: 0, dvx: 0, dvy: 0 };
      this.pendingSplats.set(key, splat);
    }
    return splat;
  }

  step(): void {
    this.uploadSplats();

    const encoder = this.device.createCommandEncoder();
    this.pass = encoder.beginComputePass();

    this.dispatchSplats();

    [this.velocityX, this.velocityXPrev] = [this.velocityXPrev, this.velocityX];
    this.diffuse(
      this.boundaryXPipeline,
      this.velocityX,
      this.velocityXPrev,
      this.velocityDiffusePipeline
    );
    [this.velocityY, this.velocityYPrev] = [this.velocityYPrev, this.velocityY];
    this.diffuse(
      this.boundaryYPipeline,
      this.velocityY,
      this.velocityYPrev,
      this.velocityDiffusePipeline
    );

    this.project(this.velocityX, this.velocityY, this.velocityXPrev, this.velocityYPrev);

    [this.velocityX, this.velocityXPrev] = [this.velocityXPrev, this.velocityX];
    [this.velocityY, this.velocityYPrev] = [this.velocityYPrev, this.velocityY];
    this.advect(
      this.boundaryXPipeline,
      this.velocityX,
      this.velocityXPrev,
      this.velocityXPrev,
      this.velocityYPrev
    );
    this.advect(
      this.boundaryYPipeline,
      this.velocityY,
      this.velocityYPrev,
      this.velocityXPrev,
      this.velocityYPrev
    );

    this.project(this.velocityX, this.velocityY, this.velocityXPrev, this.velocityYPrev);

    [this.density, this.densityPrev] = [this.densityPrev, this.density];
    this.diffuse(
      this.boundaryScalarPipeline,
      this.density,
      this.densityPrev,
      this.densityDiffusePipeline
    );
    [this.density, this.densityPrev] = [this.densityPrev, this.density];
    this.advect(
      this.boundaryScalarPipeline,
      this.density,
      this.densityPrev,
      this.velocityX,
      this.velocityY
    );

    this.pass.end();
    this.pass = null;
    this.device.queue.submit([encoder.finish()]);
  }

  // Jacobi relaxation for the implicit-diffusion system: `field` ping-pongs
  // against the shared scratch buffer while `rhs` (the pre-diffuse
  // snapshot) stays fixed. `this.iterations` is always even, so the result
  // lands back in `field` — the caller never has to track parity.
  private diffuse(
    boundaryPipeline: GPUComputePipeline,
    field: GPUBuffer,
    rhs: GPUBuffer,
    jacobiPipeline: GPUComputePipeline
  ): void {
    let src = field;
    let dst = this.scratch;
    for (let k = 0; k < this.iterations; k++) {
      this.dispatchJacobi(jacobiPipeline, src, rhs, dst);
      this.dispatchBoundary(boundaryPipeline, dst);
      [src, dst] = [dst, src];
    }
  }

  private project(
    velocityX: GPUBuffer,
    velocityY: GPUBuffer,
    pressure: GPUBuffer,
    divergence: GPUBuffer
  ): void {
    this.dispatchDivergence(velocityX, velocityY, divergence, pressure);
    this.dispatchBoundary(this.boundaryScalarPipeline, divergence);
    this.dispatchBoundary(this.boundaryScalarPipeline, pressure);

    let src = pressure;
    let dst = this.scratch;
    for (let k = 0; k < this.iterations; k++) {
      this.dispatchJacobi(this.pressurePipeline, src, divergence, dst);
      this.dispatchBoundary(this.boundaryScalarPipeline, dst);
      [src, dst] = [dst, src];
    }

    this.dispatchGradientSubtract(pressure, velocityX, velocityY);
    this.dispatchBoundary(this.boundaryXPipeline, velocityX);
    this.dispatchBoundary(this.boundaryYPipeline, velocityY);
  }

  private advect(
    boundaryPipeline: GPUComputePipeline,
    fieldOut: GPUBuffer,
    fieldPrev: GPUBuffer,
    velocityX: GPUBuffer,
    velocityY: GPUBuffer
  ): void {
    this.dispatchAdvect(fieldPrev, velocityX, velocityY, fieldOut);
    this.dispatchBoundary(boundaryPipeline, fieldOut);
  }

  private uploadSplats(): void {
    const data = new Float32Array(MAX_SPLATS * SPLAT_FIELDS);
    let k = 0;
    for (const splat of this.pendingSplats.values()) {
      data[k * SPLAT_FIELDS + 0] = splat.i;
      data[k * SPLAT_FIELDS + 1] = splat.j;
      data[k * SPLAT_FIELDS + 2] = splat.dDensity;
      data[k * SPLAT_FIELDS + 3] = splat.dvx;
      data[k * SPLAT_FIELDS + 4] = splat.dvy;
      k++;
    }
    this.device.queue.writeBuffer(this.splatBuffer, 0, data);
    this.device.queue.writeBuffer(this.splatCountBuffer, 0, new Uint32Array([k]));
    this.pendingSplats.clear();
  }

  private dispatchSplats(): void {
    const bindGroup = this.device.createBindGroup({
      layout: this.splatPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.splatBuffer } },
        { binding: 1, resource: { buffer: this.density } },
        { binding: 2, resource: { buffer: this.velocityX } },
        { binding: 3, resource: { buffer: this.velocityY } },
        { binding: 4, resource: { buffer: this.splatCountBuffer } },
      ],
    });
    this.pass!.setPipeline(this.splatPipeline);
    this.pass!.setBindGroup(0, bindGroup);
    this.pass!.dispatchWorkgroups(ceilDiv(MAX_SPLATS, 64), 1, 1);
  }

  private dispatchBoundary(edgePipeline: GPUComputePipeline, buffer: GPUBuffer): void {
    const bindGroup = this.device.createBindGroup({
      layout: edgePipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer } }],
    });
    this.pass!.setPipeline(edgePipeline);
    this.pass!.setBindGroup(0, bindGroup);
    this.pass!.dispatchWorkgroups(ceilDiv(this.size, 64), 1, 1);

    const cornersBindGroup = this.device.createBindGroup({
      layout: this.boundaryCornersPipeline.getBindGroupLayout(0),
      entries: [{ binding: 0, resource: { buffer } }],
    });
    this.pass!.setPipeline(this.boundaryCornersPipeline);
    this.pass!.setBindGroup(0, cornersBindGroup);
    this.pass!.dispatchWorkgroups(1, 1, 1);
  }

  private dispatchJacobi(
    pipeline: GPUComputePipeline,
    fieldIn: GPUBuffer,
    rhs: GPUBuffer,
    fieldOut: GPUBuffer
  ): void {
    const bindGroup = this.device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: fieldIn } },
        { binding: 1, resource: { buffer: rhs } },
        { binding: 2, resource: { buffer: fieldOut } },
      ],
    });
    const groups = ceilDiv(this.size, 8);
    this.pass!.setPipeline(pipeline);
    this.pass!.setBindGroup(0, bindGroup);
    this.pass!.dispatchWorkgroups(groups, groups, 1);
  }

  private dispatchDivergence(
    velocityX: GPUBuffer,
    velocityY: GPUBuffer,
    divergence: GPUBuffer,
    pressure: GPUBuffer
  ): void {
    const bindGroup = this.device.createBindGroup({
      layout: this.divergencePipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: velocityX } },
        { binding: 1, resource: { buffer: velocityY } },
        { binding: 2, resource: { buffer: divergence } },
        { binding: 3, resource: { buffer: pressure } },
      ],
    });
    const groups = ceilDiv(this.size, 8);
    this.pass!.setPipeline(this.divergencePipeline);
    this.pass!.setBindGroup(0, bindGroup);
    this.pass!.dispatchWorkgroups(groups, groups, 1);
  }

  private dispatchGradientSubtract(
    pressure: GPUBuffer,
    velocityX: GPUBuffer,
    velocityY: GPUBuffer
  ): void {
    const bindGroup = this.device.createBindGroup({
      layout: this.gradientSubtractPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: pressure } },
        { binding: 1, resource: { buffer: velocityX } },
        { binding: 2, resource: { buffer: velocityY } },
      ],
    });
    const groups = ceilDiv(this.size, 8);
    this.pass!.setPipeline(this.gradientSubtractPipeline);
    this.pass!.setBindGroup(0, bindGroup);
    this.pass!.dispatchWorkgroups(groups, groups, 1);
  }

  private dispatchAdvect(
    fieldPrev: GPUBuffer,
    velocityX: GPUBuffer,
    velocityY: GPUBuffer,
    fieldOut: GPUBuffer
  ): void {
    const bindGroup = this.device.createBindGroup({
      layout: this.advectPipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: fieldPrev } },
        { binding: 1, resource: { buffer: velocityX } },
        { binding: 2, resource: { buffer: velocityY } },
        { binding: 3, resource: { buffer: fieldOut } },
      ],
    });
    const groups = ceilDiv(this.size, 8);
    this.pass!.setPipeline(this.advectPipeline);
    this.pass!.setBindGroup(0, bindGroup);
    this.pass!.dispatchWorkgroups(groups, groups, 1);
  }
}
