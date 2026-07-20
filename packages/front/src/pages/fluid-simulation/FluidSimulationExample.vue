<template>
  <div class="flex gap-8 flex-wrap w-full text-base">
    <div ref="guiContainer" class="gui-container"></div>
    <canvas
      ref="canvas"
      class="w-full h-[500px] border-black cursor-crosshair"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointerleave="onPointerUp"
    ></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAnimationFrames, useCanvasDPI, useVisibility } from '@gdx/utils';
import GUI from 'lil-gui';
import { FluidSimulation } from './FluidSimulation';
import { FluidRenderer } from './FluidRenderer';

const guiContainer = ref<HTMLDivElement | null>(null);
const { canvas, size, dpi } = useCanvasDPI();
const { isVisible } = useVisibility(canvas);

const params = {
  size: 96,
  diffusion: 0,
  viscosity: 0.0001,
  dt: 0.15,
  solverIterations: 16,
  showVelocity: false,
};

let simulation = new FluidSimulation(params);
let renderer: FluidRenderer | null = null;

function rebuildSimulation() {
  simulation = new FluidSimulation(params);
}

onMounted(() => {
  const gui = new GUI({ container: guiContainer.value ?? undefined });
  gui.add(params, 'viscosity', 0, 0.001, 0.00001).name('Viscosity');
  gui.add(params, 'diffusion', 0, 0.001, 0.00001).name('Diffusion');
  gui.add(params, 'dt', 0.01, 0.3, 0.01).name('Time step');
  gui.add(params, 'solverIterations', 1, 40, 1).name('Solver iterations');
  gui.add(params, 'showVelocity').name('Show velocity');
  gui.add({ reset: rebuildSimulation }, 'reset').name('Reset');
});

let pointerDown = false;
let lastPointer: { i: number; j: number } | null = null;

function pointerToGrid(event: PointerEvent): { i: number; j: number } {
  const rect = canvas.value!.getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width;
  const py = (event.clientY - rect.top) / rect.height;
  const i = Math.min(simulation.size, Math.max(1, Math.floor(px * simulation.size) + 1));
  const j = Math.min(simulation.size, Math.max(1, Math.floor(py * simulation.size) + 1));
  return { i, j };
}

function onPointerDown(event: PointerEvent) {
  pointerDown = true;
  lastPointer = pointerToGrid(event);
}

function onPointerMove(event: PointerEvent) {
  if (!pointerDown) return;
  const { i, j } = pointerToGrid(event);
  simulation.addDensity(i, j, 6);
  if (lastPointer) {
    const dx = i - lastPointer.i;
    const dy = j - lastPointer.j;
    simulation.addVelocity(i, j, dx * 4, dy * 4);
  }
  lastPointer = { i, j };
}

function onPointerUp() {
  pointerDown = false;
  lastPointer = null;
}

useAnimationFrames(() => {
  if (!isVisible.value) return;
  const c = canvas.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  if (!renderer) {
    renderer = new FluidRenderer(ctx, { showVelocity: params.showVelocity });
  }
  renderer.options.showVelocity = params.showVelocity;

  simulation.step();

  ctx.save();
  ctx.scale(dpi, dpi);
  renderer.draw(simulation, Math.max(1, size.width | 0), Math.max(1, size.height | 0));
  ctx.restore();
});
</script>
