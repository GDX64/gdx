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
const { canvas, canvasPromise } = useCanvasDPI();
const { isVisible } = useVisibility(canvas);

const params = {
  size: 96,
  diffusion: 0,
  viscosity: 0.0001,
  dt: 0.15,
  solverIterations: 16,
};

let simulation: FluidSimulation | null = null;
let renderer: FluidRenderer | null = null;

async function rebuildSimulation() {
  simulation = await FluidSimulation.create(params);
}

onMounted(async () => {
  const gui = new GUI({ container: guiContainer.value ?? undefined });
  gui.add(params, 'viscosity', 0, 0.001, 0.00001).name('Viscosity');
  gui.add(params, 'diffusion', 0, 0.001, 0.00001).name('Diffusion');
  gui.add(params, 'dt', 0.01, 0.3, 0.01).name('Time step');
  gui.add(params, 'solverIterations', 1, 40, 1).name('Solver iterations');
  gui.add({ reset: rebuildSimulation }, 'reset').name('Reset');

  const [canvasEl] = await Promise.all([canvasPromise, rebuildSimulation()]);
  renderer = await FluidRenderer.create(canvasEl, params.size);
});

let pointerDown = false;
let lastPointer: { i: number; j: number } | null = null;

function pointerToGrid(sim: FluidSimulation, event: PointerEvent): { i: number; j: number } {
  const rect = canvas.value!.getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width;
  const py = (event.clientY - rect.top) / rect.height;
  const i = Math.min(sim.size, Math.max(1, Math.floor(px * sim.size) + 1));
  const j = Math.min(sim.size, Math.max(1, Math.floor(py * sim.size) + 1));
  return { i, j };
}

function onPointerDown(event: PointerEvent) {
  if (!simulation) return;
  pointerDown = true;
  lastPointer = pointerToGrid(simulation, event);
}

function onPointerMove(event: PointerEvent) {
  if (!pointerDown || !simulation) return;
  const { i, j } = pointerToGrid(simulation, event);
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
  if (!isVisible.value || !renderer || !simulation) return;
  simulation.step();
  renderer.draw(simulation);
});
</script>
