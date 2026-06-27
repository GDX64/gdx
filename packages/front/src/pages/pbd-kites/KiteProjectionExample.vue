<template>
  <div class="w-full flex flex-col items-center gap-4 my-8">
    <canvas
      ref="canvas"
      class="w-full max-w-[640px] aspect-[4/3] rounded-md bg-bg-50 cursor-grab touch-none"
    ></canvas>
    <div class="flex flex-wrap gap-x-6 gap-y-2 items-center justify-center text-base w-full">
      <label class="flex items-center gap-2">
        <span class="w-28">Camera distance</span>
        <input type="range" min="8" max="40" step="0.5" v-model.number="distance" />
        <span class="w-10 tabular-nums">{{ distance.toFixed(1) }}</span>
      </label>
      <label class="flex items-center gap-2">
        <span class="w-28">Roughness</span>
        <input type="range" min="0" max="3" step="0.1" v-model.number="roughness" />
        <span class="w-10 tabular-nums">{{ roughness.toFixed(1) }}</span>
      </label>
      <label class="flex items-center gap-2">
        <input type="checkbox" v-model="showVertices" />
        <span>Show projected vertices</span>
      </label>
    </div>
    <p class="text-base text-text-label text-center">
      Drag to spin the sail in 3D — each panel is projected onto the flat canvas by hand.
      A short camera distance exaggerates the perspective; a long one flattens it out.
    </p>
  </div>
</template>

<script lang="ts" setup>
import { vec3 } from 'gl-matrix';
import { useAnimationFrames, useCanvasDPI } from '@gdx/utils';
import { onMounted, onUnmounted, ref } from 'vue';
import { Camera, VertexObject } from '../../components/kite/HandDraw';
import { primeColors } from '../../design/design';

const prime = primeColors;
const distance = ref(16);
const roughness = ref(1.5);
const showVertices = ref(false);

const { canvas, size } = useCanvasDPI();

// The same four-panel sail the header kites use, centred on the origin so it
// spins in place instead of orbiting.
const HEIGHT = 3;
const width = (HEIGHT * 2) / 3;
const armHeight = (2 * HEIGHT) / 3;
const cy = HEIGHT / 2; // shift down so the sail's middle sits at y = 0
const down: vec3 = [0, -cy, 0];
const left: vec3 = [-width / 2, armHeight - cy, 0];
const up: vec3 = [0, HEIGHT - cy, 0];
const right: vec3 = [width / 2, armHeight - cy, 0];
const center: vec3 = [0, armHeight - cy, HEIGHT / 10];

const kite = new VertexObject();
kite.paths[0] = [down, left, center];
kite.paths[1] = [down, right, center];
kite.paths[2] = [up, left, center];
kite.paths[3] = [up, right, center];

// orientation the user drags around
let yaw = 0.6;
let pitch = -0.3;

let dragging = false;
let lastX = 0;
let lastY = 0;

function onPointerDown(event: PointerEvent) {
  dragging = true;
  lastX = event.clientX;
  lastY = event.clientY;
}
function onPointerMove(event: PointerEvent) {
  if (!dragging) return;
  yaw += (event.clientX - lastX) * 0.01;
  pitch += (event.clientY - lastY) * 0.01;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  lastX = event.clientX;
  lastY = event.clientY;
}
function onPointerUp() {
  dragging = false;
}

onMounted(() => {
  const el = canvas.value;
  if (!el) return;
  el.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
});

onUnmounted(() => {
  const el = canvas.value;
  if (el) el.removeEventListener('pointerdown', onPointerDown);
  window.removeEventListener('pointermove', onPointerMove);
  window.removeEventListener('pointerup', onPointerUp);
});

useAnimationFrames(() => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx || !size.width || !size.height) return;

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, size.width, size.height);

  // a fixed camera looking down the z axis; the slider just moves it nearer/farther
  const camera = new Camera([size.width, size.height]);
  camera.position = [0, 0, distance.value];
  camera.update();

  // drive the model matrix straight from the drag — this is the M in P·V·M·v
  kite.setRotation(pitch, yaw);
  kite.setPosition([0, 0, 0]);

  kite.drawAsPolygon(ctx, camera, {
    seed: 1,
    fillStyle: 'solid',
    fill: prime[400],
    roughness: roughness.value,
  });

  if (showVertices.value) {
    for (const path of kite.vertexTransform(camera)) {
      for (const [x, y] of path) {
        ctx.beginPath();
        ctx.fillStyle = prime[700];
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  ctx.restore();
});
</script>
