<template>
  <div class="w-full flex flex-col items-center gap-4 my-8">
    <canvas
      ref="canvas"
      class="w-full max-w-[640px] aspect-[4/3] rounded-md bg-bg-50 cursor-grab touch-none"
    ></canvas>
    <div class="flex flex-wrap gap-6 items-center justify-center text-base w-full">
      <label class="flex items-center gap-2">
        <span class="w-28">Gravity</span>
        <input type="range" min="0" max="40" step="0.5" v-model.number="gravity" />
        <span class="w-10 tabular-nums">{{ gravity.toFixed(1) }}</span>
      </label>
      <label class="flex items-center gap-2">
        <span class="w-28">Stiffness</span>
        <input type="range" min="1" max="6" step="1" v-model.number="iterations" />
        <span class="w-10 tabular-nums">{{ iterations }}</span>
      </label>
    </div>
    <p class="text-base text-text-label text-center">
      {{
        tied
          ? 'The far end is tied to a fixed point — drag the dark node to swing the rope from it.'
          : 'Drag inside the canvas to pull the anchor around.'
      }}
    </p>
  </div>
</template>

<script lang="ts" setup>
import { vec3 } from 'gl-matrix';
import { useAnimationFrames, useCanvasDPI } from '@gdx/utils';
import { onMounted, onUnmounted, ref, watchEffect } from 'vue';
import { PBDRope } from '../../components/kite/PDBRope';
import { primeColors } from '../../design/design';

const props = withDefaults(defineProps<{ tied?: boolean }>(), { tied: false });

const prime = primeColors;
const gravity = ref(20);
const iterations = ref(1);

const { canvas, size } = useCanvasDPI();

// world-space anchor that the dragged (first) node is pinned to (z stays 0 -> a 2D rope)
const anchor = vec3.fromValues(props.tied ? -4 : 0, 4, 0);
// when tied, the last node is nailed to this fixed point
const tiedPoint = vec3.fromValues(4, 4, 0);
const NODE_LEN = 0.25;
const ROPE_LENGTH = 8;

let rope = makeRope();

function makeRope() {
  const r = PBDRope.fromLength(ROPE_LENGTH, NODE_LEN, 0.1, vec3.clone(anchor));
  r.setConstForce(vec3.fromValues(0, -gravity.value, 0));
  return r;
}

watchEffect(() => {
  rope.setConstForce(vec3.fromValues(0, -gravity.value, 0));
});

// view: map world units to canvas pixels (origin centered, y up)
function project(p: vec3): [number, number] {
  const scale = size.height / 12; // 12 world units tall
  const cx = size.width / 2;
  const cy = size.height / 2;
  return [cx + p[0] * scale, cy - p[1] * scale];
}

function unproject(px: number, py: number): vec3 {
  const scale = size.height / 12;
  const cx = size.width / 2;
  const cy = size.height / 2;
  return vec3.fromValues((px - cx) / scale, (cy - py) / scale, 0);
}

let dragging = false;

function pointerToWorld(event: PointerEvent) {
  if (!canvas.value) return null;
  const rect = canvas.value.getBoundingClientRect();
  return unproject(event.clientX - rect.left, event.clientY - rect.top);
}

function onPointerDown(event: PointerEvent) {
  dragging = true;
  const w = pointerToWorld(event);
  if (w) vec3.copy(anchor, w);
}
function onPointerMove(event: PointerEvent) {
  if (!dragging) return;
  const w = pointerToWorld(event);
  if (w) vec3.copy(anchor, w);
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

useAnimationFrames(({ delta }) => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx || !size.width || !size.height) return;

  const dt = Math.min(delta, 16) / 1000;
  // re-pin the first node to the (possibly dragged) anchor, then integrate
  rope.updateFirstPosition(vec3.clone(anchor));
  // tie the far end to a fixed point so the rope hangs between two pins
  if (props.tied) {
    rope.updateLastPosition(vec3.clone(tiedPoint));
  }
  for (let i = 0; i < iterations.value; i++) {
    rope.evolve(dt / iterations.value);
  }

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, size.width, size.height);

  const nodes = rope.nodesPos;

  // links
  ctx.strokeStyle = prime[400];
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < nodes.length; i++) {
    const [x, y] = project(nodes[i]);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // nodes
  const lastIndex = nodes.length - 1;
  for (let i = 0; i < nodes.length; i++) {
    const [x, y] = project(nodes[i]);
    const pinned = i === 0 || (props.tied && i === lastIndex);
    ctx.beginPath();
    ctx.fillStyle = pinned ? prime[700] : prime[300];
    ctx.arc(x, y, pinned ? 6 : 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
});
</script>
