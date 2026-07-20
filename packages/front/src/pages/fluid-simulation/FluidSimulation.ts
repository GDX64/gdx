// Grid-based fluid solver following Jos Stam's Stable Fluids method
// (see FluidSimulation.md for the derivation of every step below).

export interface FluidSimulationParams {
  size: number;
  diffusion: number;
  viscosity: number;
  dt: number;
  solverIterations: number;
}

const DEFAULT_PARAMS: FluidSimulationParams = {
  size: 64,
  diffusion: 0,
  viscosity: 0.0001,
  dt: 0.1,
  solverIterations: 20,
};

export class FluidSimulation {
  readonly size: number;
  readonly diffusion: number;
  readonly viscosity: number;
  readonly dt: number;
  readonly solverIterations: number;

  private readonly n: number; // number of cells per side including the ghost border

  density: Float32Array;
  private densityPrev: Float32Array;
  velocityX: Float32Array;
  velocityY: Float32Array;
  private velocityXPrev: Float32Array;
  private velocityYPrev: Float32Array;

  constructor(params: Partial<FluidSimulationParams> = {}) {
    const merged = { ...DEFAULT_PARAMS, ...params };
    this.size = merged.size;
    this.diffusion = merged.diffusion;
    this.viscosity = merged.viscosity;
    this.dt = merged.dt;
    this.solverIterations = merged.solverIterations;

    this.n = this.size + 2;
    const cellCount = this.n * this.n;
    this.density = new Float32Array(cellCount);
    this.densityPrev = new Float32Array(cellCount);
    this.velocityX = new Float32Array(cellCount);
    this.velocityY = new Float32Array(cellCount);
    this.velocityXPrev = new Float32Array(cellCount);
    this.velocityYPrev = new Float32Array(cellCount);
  }

  private index(i: number, j: number): number {
    return i + this.n * j;
  }

  addDensity(i: number, j: number, amount: number): void {
    this.density[this.index(i, j)] += amount;
  }

  addVelocity(i: number, j: number, amountX: number, amountY: number): void {
    const idx = this.index(i, j);
    this.velocityX[idx] += amountX;
    this.velocityY[idx] += amountY;
  }

  step(): void {
    const { dt, diffusion, viscosity, solverIterations: iter } = this;

    [this.velocityX, this.velocityXPrev] = [this.velocityXPrev, this.velocityX];
    this.diffuse(1, this.velocityX, this.velocityXPrev, viscosity, dt, iter);
    [this.velocityY, this.velocityYPrev] = [this.velocityYPrev, this.velocityY];
    this.diffuse(2, this.velocityY, this.velocityYPrev, viscosity, dt, iter);

    this.project(this.velocityX, this.velocityY, this.velocityXPrev, this.velocityYPrev, iter);

    [this.velocityX, this.velocityXPrev] = [this.velocityXPrev, this.velocityX];
    [this.velocityY, this.velocityYPrev] = [this.velocityYPrev, this.velocityY];
    this.advect(1, this.velocityX, this.velocityXPrev, this.velocityXPrev, this.velocityYPrev, dt);
    this.advect(2, this.velocityY, this.velocityYPrev, this.velocityXPrev, this.velocityYPrev, dt);

    this.project(this.velocityX, this.velocityY, this.velocityXPrev, this.velocityYPrev, iter);

    [this.density, this.densityPrev] = [this.densityPrev, this.density];
    this.diffuse(0, this.density, this.densityPrev, diffusion, dt, iter);
    [this.density, this.densityPrev] = [this.densityPrev, this.density];
    this.advect(0, this.density, this.densityPrev, this.velocityX, this.velocityY, dt);
  }

  // Reflects velocity components off walls (no-flow), copies density/pressure
  // through unchanged (zero-gradient), as described in the "Boundary
  // conditions" section of the write-up.
  private setBoundary(kind: 0 | 1 | 2, field: Float32Array): void {
    const n = this.size;
    for (let i = 1; i <= n; i++) {
      field[this.index(0, i)] = kind === 1 ? -field[this.index(1, i)] : field[this.index(1, i)];
      field[this.index(n + 1, i)] = kind === 1 ? -field[this.index(n, i)] : field[this.index(n, i)];
      field[this.index(i, 0)] = kind === 2 ? -field[this.index(i, 1)] : field[this.index(i, 1)];
      field[this.index(i, n + 1)] = kind === 2 ? -field[this.index(i, n)] : field[this.index(i, n)];
    }
    field[this.index(0, 0)] = 0.5 * (field[this.index(1, 0)] + field[this.index(0, 1)]);
    field[this.index(0, n + 1)] = 0.5 * (field[this.index(1, n + 1)] + field[this.index(0, n)]);
    field[this.index(n + 1, 0)] = 0.5 * (field[this.index(n, 0)] + field[this.index(n + 1, 1)]);
    field[this.index(n + 1, n + 1)] =
      0.5 * (field[this.index(n, n + 1)] + field[this.index(n + 1, n)]);
  }

  // Gauss-Seidel relaxation solving the implicit diffusion system, then
  // implicit-viscosity system derived in "Step 3: Diffusion".
  private diffuse(
    kind: 0 | 1 | 2,
    field: Float32Array,
    prev: Float32Array,
    rate: number,
    dt: number,
    iterations: number
  ): void {
    const n = this.size;
    const a = dt * rate * n * n;
    this.linearSolve(kind, field, prev, a, 1 + 4 * a, iterations);
  }

  private linearSolve(
    kind: 0 | 1 | 2,
    field: Float32Array,
    prev: Float32Array,
    a: number,
    c: number,
    iterations: number
  ): void {
    const n = this.size;
    for (let k = 0; k < iterations; k++) {
      for (let j = 1; j <= n; j++) {
        for (let i = 1; i <= n; i++) {
          const idx = this.index(i, j);
          field[idx] =
            (prev[idx] +
              a *
                (field[this.index(i - 1, j)] +
                  field[this.index(i + 1, j)] +
                  field[this.index(i, j - 1)] +
                  field[this.index(i, j + 1)])) /
            c;
        }
      }
      this.setBoundary(kind, field);
    }
  }

  // Semi-Lagrangian backtrace with bilinear interpolation, from
  // "Step 2: Advection (semi-Lagrangian)".
  private advect(
    kind: 0 | 1 | 2,
    field: Float32Array,
    prev: Float32Array,
    velocityX: Float32Array,
    velocityY: Float32Array,
    dt: number
  ): void {
    const n = this.size;
    const dtx = dt * n;
    const dty = dt * n;

    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        const idx = this.index(i, j);
        let x = i - dtx * velocityX[idx];
        let y = j - dty * velocityY[idx];

        x = Math.min(Math.max(x, 0.5), n + 0.5);
        y = Math.min(Math.max(y, 0.5), n + 0.5);

        const i0 = Math.floor(x);
        const i1 = i0 + 1;
        const j0 = Math.floor(y);
        const j1 = j0 + 1;

        const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;

        field[idx] =
          s0 * (t0 * prev[this.index(i0, j0)] + t1 * prev[this.index(i0, j1)]) +
          s1 * (t0 * prev[this.index(i1, j0)] + t1 * prev[this.index(i1, j1)]);
      }
    }
    this.setBoundary(kind, field);
  }

  // Pressure projection: solve the Poisson equation for pressure, then
  // subtract its gradient to make the field divergence-free. See
  // "Step 4: Projection".
  private project(
    velocityX: Float32Array,
    velocityY: Float32Array,
    pressure: Float32Array,
    divergence: Float32Array,
    iterations: number
  ): void {
    const n = this.size;
    const h = 1 / n;

    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        const idx = this.index(i, j);
        divergence[idx] =
          -0.5 *
          h *
          (velocityX[this.index(i + 1, j)] -
            velocityX[this.index(i - 1, j)] +
            velocityY[this.index(i, j + 1)] -
            velocityY[this.index(i, j - 1)]);
        pressure[idx] = 0;
      }
    }
    this.setBoundary(0, divergence);
    this.setBoundary(0, pressure);

    this.linearSolve(0, pressure, divergence, 1, 4, iterations);

    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        const idx = this.index(i, j);
        velocityX[idx] -=
          (0.5 * (pressure[this.index(i + 1, j)] - pressure[this.index(i - 1, j)])) / h;
        velocityY[idx] -=
          (0.5 * (pressure[this.index(i, j + 1)] - pressure[this.index(i, j - 1)])) / h;
      }
    }
    this.setBoundary(1, velocityX);
    this.setBoundary(2, velocityY);
  }
}
