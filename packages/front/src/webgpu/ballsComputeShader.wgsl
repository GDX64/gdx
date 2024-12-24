struct Ball {
  radius: f32,
  position: vec2<f32>,
  velocity: vec2<f32>,
};

@group(0) @binding(0)
var<storage, read> input: array<Ball>;

@group(0) @binding(1)
var<storage, read_write> output: array<Ball>;

@group(0) @binding(4)
var<storage, read_write> vertex_data: array<vec2<f32>>;

struct Scene {
  width: f32,
  height: f32,
};

@group(0) @binding(2)
var<uniform> scene: Scene;

@group(0) @binding(3)
var<uniform> mouse: vec2<f32>;

@group(0) @binding(5)
var<uniform> force_constant: f32;

@group(0) @binding(6)
var<uniform> mouse_down: u32;

const PI: f32 = 3.14159;
const TIME_STEP: f32 = 0.16;
const MIN_DIST: f32 = 1.0;
const TOO_CLOSE: f32 = 0.01;
const GRAVITY_FORCE: vec2<f32> = vec2<f32>(0.0, -0.05);

fn calcForce(src_ball: Ball, other_ball: Ball, index_ratio: f32) -> vec2<f32> {
    let dist = src_ball.position - other_ball.position;
    let len = length(dist);
    if len >= MIN_DIST || len < TOO_CLOSE {
        return vec2<f32>(0.0, 0.0);
    }
    return normalize(dist) * pow((1.0 - len), 2.0) * 0.01;
}

fn constForce(src_ball: Ball, pos: vec2<f32>) -> vec2<f32> {
    let dist = src_ball.position - pos;
    return normalize(dist);
}

@compute @workgroup_size(256)
fn main(
    @builtin(global_invocation_id)
  global_id: vec3<u32>,
) {
    let num_balls = arrayLength(&output);
    if global_id.x >= num_balls {
        return;
    }
    var src_ball = input[global_id.x];
    let src_mass = 1.0;
    let dst_ball = &output[global_id.x];
    let mouse_ball = Ball(500.0, mouse, vec2(100, 100));
    let mouse_force = select(vec2<f32>(0.0), -constForce(src_ball, mouse) * 0.03, mouse_down == 1u);
    var gravity = mouse_force + GRAVITY_FORCE;

    (*dst_ball) = src_ball;

    // Ball/Ball collision
    for (var i = 0u; i < num_balls; i = i + 1u) {
        if i == global_id.x {
            continue;
        }
        let other_ball = input[i];
    //gravity calc
        let index_ratio = f32(i) / f32(global_id.x);
        gravity += calcForce(src_ball, other_ball, index_ratio) * force_constant;
    }

    // Apply velocity
    let damping = -src_ball.velocity / 2;
    gravity += damping;
    (*dst_ball).velocity += gravity / src_mass * TIME_STEP;
    (*dst_ball).position = (*dst_ball).position + (*dst_ball).velocity * TIME_STEP;

    // Ball/Wall collision
    if (*dst_ball).position.x - (*dst_ball).radius < -scene.width {
        (*dst_ball).position.x = -scene.width + (*dst_ball).radius;
        (*dst_ball).velocity.x = -(*dst_ball).velocity.x;
    }
    if (*dst_ball).position.y - (*dst_ball).radius < -scene.height {
        (*dst_ball).position.y = -scene.height + (*dst_ball).radius;
        (*dst_ball).velocity.y = -(*dst_ball).velocity.y;
    }
    if (*dst_ball).position.x + (*dst_ball).radius >= scene.width {
        (*dst_ball).position.x = scene.width - (*dst_ball).radius;
        (*dst_ball).velocity.x = -(*dst_ball).velocity.x;
    }
    if (*dst_ball).position.y + (*dst_ball).radius >= scene.height {
        (*dst_ball).position.y = scene.height - (*dst_ball).radius;
        (*dst_ball).velocity.y = -(*dst_ball).velocity.y;
    }

    vertex_data[global_id.x] = (*dst_ball).position;
}