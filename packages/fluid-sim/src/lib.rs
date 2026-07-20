// Grid-based fluid solver following Jos Stam's Stable Fluids method — a
// straight port of packages/front/src/pages/fluid-simulation/FluidSimulation.ts
// (see FluidSimulation.md for the derivation of every step). The TS file now
// only wraps this module: it forwards calls and exposes a zero-copy view
// into the density grid for rendering.
use wasm_bindgen::prelude::*;

// kind: 0 = scalar (density/pressure), 1 = velocity x, 2 = velocity y —
// controls how set_boundary reflects/copies the ghost border.
const KIND_SCALAR: u8 = 0;
const KIND_VELOCITY_X: u8 = 1;
const KIND_VELOCITY_Y: u8 = 2;

fn index(i: usize, j: usize, stride: usize) -> usize {
    i + stride * j
}

// Reflects velocity components off walls (no-flow), copies density/pressure
// through unchanged (zero-gradient). See "Boundary conditions" in the
// write-up.
fn set_boundary(kind: u8, field: &mut [f32], size: usize, stride: usize) {
    for i in 1..=size {
        let left = field[index(1, i, stride)];
        let right = field[index(size, i, stride)];
        field[index(0, i, stride)] = if kind == KIND_VELOCITY_X { -left } else { left };
        field[index(size + 1, i, stride)] = if kind == KIND_VELOCITY_X { -right } else { right };

        let top = field[index(i, 1, stride)];
        let bottom = field[index(i, size, stride)];
        field[index(i, 0, stride)] = if kind == KIND_VELOCITY_Y { -top } else { top };
        field[index(i, size + 1, stride)] = if kind == KIND_VELOCITY_Y { -bottom } else { bottom };
    }
    field[index(0, 0, stride)] = 0.5 * (field[index(1, 0, stride)] + field[index(0, 1, stride)]);
    field[index(0, size + 1, stride)] =
        0.5 * (field[index(1, size + 1, stride)] + field[index(0, size, stride)]);
    field[index(size + 1, 0, stride)] =
        0.5 * (field[index(size, 0, stride)] + field[index(size + 1, 1, stride)]);
    field[index(size + 1, size + 1, stride)] =
        0.5 * (field[index(size, size + 1, stride)] + field[index(size + 1, size, stride)]);
}

// Gauss-Seidel relaxation for the implicit diffusion / pressure Poisson
// systems. See "Step 3: Diffusion" and "Step 4: Projection".
fn linear_solve(
    kind: u8,
    field: &mut [f32],
    rhs: &[f32],
    a: f32,
    c: f32,
    size: usize,
    stride: usize,
    iterations: u32,
) {
    for _ in 0..iterations {
        for j in 1..=size {
            for i in 1..=size {
                let idx = index(i, j, stride);
                let neighbors = field[index(i - 1, j, stride)]
                    + field[index(i + 1, j, stride)]
                    + field[index(i, j - 1, stride)]
                    + field[index(i, j + 1, stride)];
                field[idx] = (rhs[idx] + a * neighbors) / c;
            }
        }
        set_boundary(kind, field, size, stride);
    }
}

fn diffuse(
    kind: u8,
    field: &mut [f32],
    rhs: &[f32],
    rate: f32,
    dt: f32,
    size: usize,
    stride: usize,
    iterations: u32,
) {
    let n = size as f32;
    let a = dt * rate * n * n;
    linear_solve(kind, field, rhs, a, 1.0 + 4.0 * a, size, stride, iterations);
}

// Semi-Lagrangian backtrace with bilinear interpolation. See
// "Step 2: Advection (semi-Lagrangian)".
fn advect(
    kind: u8,
    field: &mut [f32],
    prev: &[f32],
    velocity_x: &[f32],
    velocity_y: &[f32],
    dt: f32,
    size: usize,
    stride: usize,
) {
    let n = size as f32;
    let dtx = dt * n;
    let dty = dt * n;

    for j in 1..=size {
        for i in 1..=size {
            let idx = index(i, j, stride);
            let mut x = i as f32 - dtx * velocity_x[idx];
            let mut y = j as f32 - dty * velocity_y[idx];

            x = x.max(0.5).min(n + 0.5);
            y = y.max(0.5).min(n + 0.5);

            let x0 = x.floor();
            let y0 = y.floor();
            let s1 = x - x0;
            let s0 = 1.0 - s1;
            let t1 = y - y0;
            let t0 = 1.0 - t1;

            let i0 = x0 as usize;
            let i1 = i0 + 1;
            let j0 = y0 as usize;
            let j1 = j0 + 1;

            field[idx] = s0 * (t0 * prev[index(i0, j0, stride)] + t1 * prev[index(i0, j1, stride)])
                + s1 * (t0 * prev[index(i1, j0, stride)] + t1 * prev[index(i1, j1, stride)]);
        }
    }
    set_boundary(kind, field, size, stride);
}

// Pressure projection: solve the Poisson equation for pressure, then
// subtract its gradient to make the field divergence-free. See
// "Step 4: Projection".
fn project(
    velocity_x: &mut [f32],
    velocity_y: &mut [f32],
    pressure: &mut [f32],
    divergence: &mut [f32],
    size: usize,
    stride: usize,
    iterations: u32,
) {
    let h = 1.0 / size as f32;

    for j in 1..=size {
        for i in 1..=size {
            let idx = index(i, j, stride);
            divergence[idx] = -0.5
                * h
                * (velocity_x[index(i + 1, j, stride)] - velocity_x[index(i - 1, j, stride)]
                    + velocity_y[index(i, j + 1, stride)]
                    - velocity_y[index(i, j - 1, stride)]);
            pressure[idx] = 0.0;
        }
    }
    set_boundary(KIND_SCALAR, divergence, size, stride);
    set_boundary(KIND_SCALAR, pressure, size, stride);

    linear_solve(KIND_SCALAR, pressure, divergence, 1.0, 4.0, size, stride, iterations);

    for j in 1..=size {
        for i in 1..=size {
            let idx = index(i, j, stride);
            velocity_x[idx] -=
                0.5 * (pressure[index(i + 1, j, stride)] - pressure[index(i - 1, j, stride)]) / h;
            velocity_y[idx] -=
                0.5 * (pressure[index(i, j + 1, stride)] - pressure[index(i, j - 1, stride)]) / h;
        }
    }
    set_boundary(KIND_VELOCITY_X, velocity_x, size, stride);
    set_boundary(KIND_VELOCITY_Y, velocity_y, size, stride);
}

#[wasm_bindgen]
pub struct FluidSimulation {
    size: usize,
    stride: usize,
    diffusion: f32,
    viscosity: f32,
    dt: f32,
    solver_iterations: u32,

    density: Vec<f32>,
    density_prev: Vec<f32>,
    velocity_x: Vec<f32>,
    velocity_x_prev: Vec<f32>,
    velocity_y: Vec<f32>,
    velocity_y_prev: Vec<f32>,
}

#[wasm_bindgen]
impl FluidSimulation {
    #[wasm_bindgen(constructor)]
    pub fn new(size: u32, diffusion: f32, viscosity: f32, dt: f32, solver_iterations: u32) -> FluidSimulation {
        let size = size as usize;
        let stride = size + 2;
        let cell_count = stride * stride;
        FluidSimulation {
            size,
            stride,
            diffusion,
            viscosity,
            dt,
            solver_iterations,
            density: vec![0.0; cell_count],
            density_prev: vec![0.0; cell_count],
            velocity_x: vec![0.0; cell_count],
            velocity_x_prev: vec![0.0; cell_count],
            velocity_y: vec![0.0; cell_count],
            velocity_y_prev: vec![0.0; cell_count],
        }
    }

    pub fn size(&self) -> u32 {
        self.size as u32
    }

    // Zero-copy view into the wasm heap. Only valid until the next wasm
    // allocation (e.g. the next call into this module), so callers must
    // re-request it every frame rather than caching the returned array.
    pub fn density(&self) -> js_sys::Float32Array {
        unsafe { js_sys::Float32Array::view(&self.density) }
    }

    pub fn add_density(&mut self, i: u32, j: u32, amount: f32) {
        let idx = index(i as usize, j as usize, self.stride);
        self.density[idx] += amount;
    }

    pub fn add_velocity(&mut self, i: u32, j: u32, amount_x: f32, amount_y: f32) {
        let idx = index(i as usize, j as usize, self.stride);
        self.velocity_x[idx] += amount_x;
        self.velocity_y[idx] += amount_y;
    }

    pub fn step(&mut self) {
        let size = self.size;
        let stride = self.stride;
        let dt = self.dt;
        let diffusion = self.diffusion;
        let viscosity = self.viscosity;
        let iterations = self.solver_iterations;

        std::mem::swap(&mut self.velocity_x, &mut self.velocity_x_prev);
        diffuse(
            KIND_VELOCITY_X,
            &mut self.velocity_x,
            &self.velocity_x_prev,
            viscosity,
            dt,
            size,
            stride,
            iterations,
        );
        std::mem::swap(&mut self.velocity_y, &mut self.velocity_y_prev);
        diffuse(
            KIND_VELOCITY_Y,
            &mut self.velocity_y,
            &self.velocity_y_prev,
            viscosity,
            dt,
            size,
            stride,
            iterations,
        );

        project(
            &mut self.velocity_x,
            &mut self.velocity_y,
            &mut self.velocity_x_prev,
            &mut self.velocity_y_prev,
            size,
            stride,
            iterations,
        );

        std::mem::swap(&mut self.velocity_x, &mut self.velocity_x_prev);
        std::mem::swap(&mut self.velocity_y, &mut self.velocity_y_prev);
        advect(
            KIND_VELOCITY_X,
            &mut self.velocity_x,
            &self.velocity_x_prev,
            &self.velocity_x_prev,
            &self.velocity_y_prev,
            dt,
            size,
            stride,
        );
        advect(
            KIND_VELOCITY_Y,
            &mut self.velocity_y,
            &self.velocity_y_prev,
            &self.velocity_x_prev,
            &self.velocity_y_prev,
            dt,
            size,
            stride,
        );

        project(
            &mut self.velocity_x,
            &mut self.velocity_y,
            &mut self.velocity_x_prev,
            &mut self.velocity_y_prev,
            size,
            stride,
            iterations,
        );

        std::mem::swap(&mut self.density, &mut self.density_prev);
        diffuse(
            KIND_SCALAR,
            &mut self.density,
            &self.density_prev,
            diffusion,
            dt,
            size,
            stride,
            iterations,
        );
        std::mem::swap(&mut self.density, &mut self.density_prev);
        advect(
            KIND_SCALAR,
            &mut self.density,
            &self.density_prev,
            &self.velocity_x,
            &self.velocity_y,
            dt,
            size,
            stride,
        );
    }
}
