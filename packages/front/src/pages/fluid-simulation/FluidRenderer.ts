import { FluidSimulation } from './FluidSimulation';

// Packs a float32 into the bit pattern of an IEEE 754 half-float (as a
// uint16), since JS has no native half-float typed array. Adapted from the
// well-known compact float32-to-float16 conversion (e.g. three.js DataUtils).
function toHalfFloat(value: number): number {
  floatView[0] = value;
  const x = int32View[0];

  let bits = (x >> 16) & 0x8000;
  let m = (x >> 12) & 0x07ff;
  const e = (x >> 23) & 0xff;

  if (e < 103) return bits;
  if (e > 142) {
    bits |= 0x7c00;
    bits |= (e === 255 ? 0 : 1) & (x & 0x007fffff ? 1 : 0);
    return bits;
  }
  if (e < 113) {
    m |= 0x0800;
    bits |= (m >> (114 - e)) + ((m >> (113 - e)) & 1);
    return bits;
  }
  bits |= ((e - 112) << 10) | (m >> 1);
  bits += m & 1;
  return bits;
}

const floatView = new Float32Array(1);
const int32View = new Int32Array(floatView.buffer);

export interface FluidRendererOptions {}

// Fullscreen triangle-strip quad, no vertex buffer needed: positions come
// straight out of the vertex index.
const vertexShader = /*wgsl*/ `
struct VertexOut {
  @builtin(position) position: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOut {
  var positions = array<vec2<f32>, 4>(
    vec2<f32>(-1.0, -1.0),
    vec2<f32>(-1.0, 1.0),
    vec2<f32>(1.0, -1.0),
    vec2<f32>(1.0, 1.0),
  );
  let pos = positions[vertexIndex];
  var out: VertexOut;
  out.position = vec4<f32>(pos, 0.0, 1.0);
  out.uv = vec2<f32>(pos.x * 0.5 + 0.5, 0.5 - pos.y * 0.5);
  return out;
}
`;

const fragmentShader = /*wgsl*/ `
@group(0) @binding(0) var densitySampler: sampler;
@group(0) @binding(1) var densityTexture: texture_2d<f32>;

// Thermal-camera style colormap: black - purple - red - orange - yellow - white.
fn heatmap(t: f32) -> vec3<f32> {
  let x = clamp(t, 0.0, 1.0);
  let c0 = vec3<f32>(0.0, 0.0, 0.0);
  let c1 = vec3<f32>(0.35, 0.0, 0.45);
  let c2 = vec3<f32>(0.75, 0.0, 0.15);
  let c3 = vec3<f32>(1.0, 0.45, 0.0);
  let c4 = vec3<f32>(1.0, 0.95, 0.25);
  let c5 = vec3<f32>(1.0, 1.0, 1.0);

  if (x < 0.2) {
    return mix(c0, c1, x / 0.2);
  } else if (x < 0.4) {
    return mix(c1, c2, (x - 0.2) / 0.2);
  } else if (x < 0.6) {
    return mix(c2, c3, (x - 0.4) / 0.2);
  } else if (x < 0.8) {
    return mix(c3, c4, (x - 0.6) / 0.2);
  } else {
    return mix(c4, c5, (x - 0.8) / 0.2);
  }
}

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let d = textureSample(densityTexture, densitySampler, uv).r;
  return vec4<f32>(heatmap(d), 1.0);
}
`;

// Renders a FluidSimulation's density field on the GPU: the density grid is
// uploaded as a single-channel texture, and one fullscreen-quad draw call
// with a fragment shader colors every pixel — no per-cell CPU drawing.
export class FluidRenderer {
  private readonly densityData: Uint16Array;

  private constructor(
    private readonly device: GPUDevice,
    private readonly context: GPUCanvasContext,
    private readonly pipeline: GPURenderPipeline,
    private readonly gridSize: number,
    private readonly texture: GPUTexture,
    private readonly bindGroup: GPUBindGroup
  ) {
    this.densityData = new Uint16Array(gridSize * gridSize);
  }

  static async create(
    canvas: HTMLCanvasElement,
    gridSize: number,
    _options: FluidRendererOptions = {}
  ): Promise<FluidRenderer> {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('WebGPU is not supported in this browser');
    const device = await adapter.requestDevice();

    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });

    const texture = device.createTexture({
      size: [gridSize, gridSize],
      format: 'r16float',
      usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST,
    });
    const sampler = device.createSampler({ magFilter: 'linear', minFilter: 'linear' });

    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: device.createShaderModule({ code: vertexShader }),
        entryPoint: 'main',
      },
      fragment: {
        module: device.createShaderModule({ code: fragmentShader }),
        entryPoint: 'main',
        targets: [{ format }],
      },
      primitive: { topology: 'triangle-strip' },
    });

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: texture.createView() },
      ],
    });

    return new FluidRenderer(device, context, pipeline, gridSize, texture, bindGroup);
  }

  draw(simulation: FluidSimulation): void {
    const n = this.gridSize;
    const stride = n + 2;
    const density = simulation.density;

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const value = density[i + 1 + stride * (j + 1)];
        this.densityData[i + n * j] = toHalfFloat(Math.max(0, value));
      }
    }

    this.device.queue.writeTexture(
      { texture: this.texture },
      this.densityData,
      { bytesPerRow: n * 2 },
      { width: n, height: n }
    );

    const commandEncoder = this.device.createCommandEncoder();
    const passEncoder = commandEncoder.beginRenderPass({
      colorAttachments: [
        {
          view: this.context.getCurrentTexture().createView(),
          clearValue: { r: 0, g: 0, b: 0, a: 1 },
          loadOp: 'clear',
          storeOp: 'store',
        },
      ],
    });
    passEncoder.setPipeline(this.pipeline);
    passEncoder.setBindGroup(0, this.bindGroup);
    passEncoder.draw(4);
    passEncoder.end();
    this.device.queue.submit([commandEncoder.finish()]);
  }
}
