export { default as computeCode } from './ballsComputeShader.wgsl?raw';

export const workGroupSize = 256;

export const renderShaders = /*wgsl*/ `

struct Ball {
  radius: f32,
  position: vec2<f32>,
  velocity: vec2<f32>,
};

struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
}

struct Scene {
  width: f32,
  height: f32,
};

@group(0) @binding(0)
var<storage> balls: array<Ball>;

@group(0) @binding(1)
var<uniform> scene: Scene;

fn inverse_lerp(a: f32, b: f32, x: f32) -> f32 {
  return (x - a) / (b - a);
}

fn remap(a: f32, b: f32, c: f32, d: f32, x: f32) -> f32 {
  return c + (d - c) * inverse_lerp(a, b, x);
}

@vertex
fn mainVert(
  @builtin(instance_index) instanceIdx : u32,
  @builtin(vertex_index) VertexIndex : u32,
  @location(0) pos: vec2<f32>
  ) -> VertexOutput {
    var out: VertexOutput;
    let ball = balls[instanceIdx];
    out.position = vec4(pos + ball.position, 0.0, 1.0);
    out.position.x = remap(0.0, scene.width, -1.0, 1.0, out.position.x);
    out.position.y = remap(0.0, scene.height, -1.0, 1.0, out.position.y);
    let intensity = max(length(ball.velocity)*10, 0.1);
    out.color = vec4(intensity, intensity, intensity, 1.0);
    return out;
  }

@fragment
fn mainFrag(in: VertexOutput) -> @location(0) vec4<f32> {
  return in.color;
}
`;
