import { FluidSimulation } from './FluidSimulation';

export interface FluidRendererOptions {
  densityColor?: [number, number, number];
  backgroundColor?: [number, number, number];
}

const DEFAULT_OPTIONS: Required<FluidRendererOptions> = {
  densityColor: [40, 130, 220],
  backgroundColor: [5, 6, 8],
};

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
struct Colors {
  density: vec4<f32>,
  background: vec4<f32>,
};

@group(0) @binding(0) var densitySampler: sampler;
@group(0) @binding(1) var densityTexture: texture_2d<f32>;
@group(0) @binding(2) var<uniform> colors: Colors;

@fragment
fn main(@location(0) uv: vec2<f32>) -> @location(0) vec4<f32> {
  let d = textureSample(densityTexture, densitySampler, uv).r;
  return mix(colors.background, colors.density, clamp(d, 0.0, 1.0));
}
`;

// Renders a FluidSimulation's density field on the GPU: the density grid is
// uploaded as a single-channel texture, and one fullscreen-quad draw call
// with a fragment shader colors every pixel — no per-cell CPU drawing.
export class FluidRenderer {
  private readonly densityData: Uint8Array;

  private constructor(
    private readonly device: GPUDevice,
    private readonly context: GPUCanvasContext,
    private readonly pipeline: GPURenderPipeline,
    private readonly gridSize: number,
    private readonly texture: GPUTexture,
    private readonly bindGroup: GPUBindGroup
  ) {
    this.densityData = new Uint8Array(gridSize * gridSize);
  }

  static async create(
    canvas: HTMLCanvasElement,
    gridSize: number,
    options: FluidRendererOptions = {}
  ): Promise<FluidRenderer> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('WebGPU is not supported in this browser');
    const device = await adapter.requestDevice();

    const context = canvas.getContext('webgpu') as GPUCanvasContext;
    const format = navigator.gpu.getPreferredCanvasFormat();
    context.configure({ device, format, alphaMode: 'opaque' });

    const texture = device.createTexture({
      size: [gridSize, gridSize],
      format: 'r8unorm',
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

    const colorBuffer = device.createBuffer({
      size: 8 * 4, // two vec4<f32>: density color, background color
      usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    device.queue.writeBuffer(
      colorBuffer,
      0,
      new Float32Array([
        opts.densityColor[0] / 255,
        opts.densityColor[1] / 255,
        opts.densityColor[2] / 255,
        1,
        opts.backgroundColor[0] / 255,
        opts.backgroundColor[1] / 255,
        opts.backgroundColor[2] / 255,
        1,
      ])
    );

    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: sampler },
        { binding: 1, resource: texture.createView() },
        { binding: 2, resource: { buffer: colorBuffer } },
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
        this.densityData[i + n * j] = Math.max(0, Math.min(255, value * 255));
      }
    }

    this.device.queue.writeTexture(
      { texture: this.texture },
      this.densityData,
      { bytesPerRow: n },
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
