// Facade over the Rust/wasm port of Jos Stam's Stable Fluids solver (see
// FluidSimulation.md for the derivation, packages/fluid-sim/src/lib.rs for
// the implementation). This file just loads the wasm module once, forwards
// calls, and exposes a Float32Array view into the density grid for
// FluidRenderer to read.
import init, { FluidSimulation as WasmFluidSimulation } from 'fluid-sim/pkg';

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

let wasmReady: Promise<unknown> | null = null;
function ensureWasmInit(): Promise<unknown> {
  if (!wasmReady) wasmReady = init();
  return wasmReady;
}

export class FluidSimulation {
  readonly size: number;
  readonly diffusion: number;
  readonly viscosity: number;
  readonly dt: number;
  readonly solverIterations: number;

  private readonly inner: WasmFluidSimulation;

  private constructor(params: FluidSimulationParams, inner: WasmFluidSimulation) {
    this.size = params.size;
    this.diffusion = params.diffusion;
    this.viscosity = params.viscosity;
    this.dt = params.dt;
    this.solverIterations = params.solverIterations;
    this.inner = inner;
  }

  static async create(params: Partial<FluidSimulationParams> = {}): Promise<FluidSimulation> {
    await ensureWasmInit();
    const merged = { ...DEFAULT_PARAMS, ...params };
    const inner = new WasmFluidSimulation(
      merged.size,
      merged.diffusion,
      merged.viscosity,
      merged.dt,
      merged.solverIterations
    );
    return new FluidSimulation(merged, inner);
  }

  // A view into wasm memory, only valid until the next call into the wasm
  // module (see FluidSimulation::density in lib.rs) — read it immediately,
  // don't hold onto the returned array across frames.
  get density(): Float32Array {
    return this.inner.density();
  }

  addDensity(i: number, j: number, amount: number): void {
    this.inner.add_density(i, j, amount);
  }

  addVelocity(i: number, j: number, amountX: number, amountY: number): void {
    this.inner.add_velocity(i, j, amountX, amountY);
  }

  step(): void {
    this.inner.step();
  }
}
