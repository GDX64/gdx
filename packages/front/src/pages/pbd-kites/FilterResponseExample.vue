<template>
  <div class="w-full flex flex-col items-center gap-4 my-8">
    <canvas
      ref="canvas"
      class="w-full max-w-[680px] aspect-[2/1] rounded-md bg-bg-50 touch-none"
    ></canvas>
    <div class="flex flex-wrap gap-x-6 gap-y-2 items-center justify-center text-base">
      <span class="flex items-center gap-2">
        <span
          class="inline-block w-5 h-[3px] rounded"
          :style="{ background: colors.noise }"
        ></span>
        white noise
      </span>
      <span class="flex items-center gap-2">
        <span
          class="inline-block w-5 h-[3px] rounded"
          :style="{ background: colors.high }"
        ></span>
        final movement (low + high)
      </span>
      <span class="flex items-center gap-2">
        <span
          class="inline-block w-5 h-[3px] rounded"
          :style="{ background: colors.pointer }"
        ></span>
        pointer position (screen-relative)
      </span>
    </div>
    <p class="text-base text-text-label text-center">
      Move your pointer to feed the high-pass filter — the chart shows the last 5 seconds.
    </p>
  </div>
</template>

<script lang="ts" setup>
import { useAnimationFrames, useCanvasDPI } from '@gdx/utils';
import { onMounted, onUnmounted } from 'vue';
import { IIRHighPassFilter, IIRLowPassFilter } from '../../components/kite/IIRFilter';

const WINDOW_MS = 5000;
const SAMPLE_RATE = 60;
const MOVE_GAIN = 3;
const NOISE_GAIN = 4;

const colors = {
  noise: '#cbd5e1', // slate-300
  high: 'rgb(247, 116, 23)', // orange-500
  pointer: '#d2a2ff', // purple-500
  zero: '#94a3b8', // slate-400
};

const { canvas, size } = useCanvasDPI();

// Same cutoffs the kites use: a slow low-pass on noise, a faster high-pass on input.
const lowPass = new IIRLowPassFilter(0.1, SAMPLE_RATE);
const highPass = new IIRHighPassFilter(0.5, SAMPLE_RATE);

// Pointer X mapped to the screen width: -1 at the left edge, 0 at the center,
// +1 at the right edge. This (not the movement integral) is fed to the high-pass.
let pointerX = 0;

type Sample = {
  t: number;
  noise: number;
  final: number;
  pointer: number;
};
const samples: Sample[] = [];

function gaussianNoise() {
  return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

function onPointerMove(event: PointerEvent) {
  pointerX = ((event.clientX / window.innerWidth) * 2 - 1) * MOVE_GAIN;
}

onMounted(() => {
  window.addEventListener('pointermove', onPointerMove);
});
onUnmounted(() => {
  window.removeEventListener('pointermove', onPointerMove);
});

useAnimationFrames(({ elapsed }) => {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx || !size.width || !size.height) return;

  // --- feed the filters one sample per frame ---
  const pointer = pointerX;
  const noise = gaussianNoise();
  const low = lowPass.process(noise * NOISE_GAIN);
  const high = highPass.process(pointer);
  // the value that actually drives the kite: wind drift plus your tug
  const final = low + high;
  samples.push({ t: elapsed, noise, final, pointer });

  // --- drop everything older than the 5s window so memory stays bounded ---
  const cutoff = elapsed - WINDOW_MS;
  while (samples.length && samples[0].t < cutoff) samples.shift();

  const w = size.width;
  const h = size.height;
  const pad = 8;
  const midY = h / 2;

  // shared vertical scale: largest magnitude in view, with a floor so a flat
  // signal doesn't blow up to full height.
  let maxAbs = 1;
  for (const s of samples) {
    maxAbs = Math.max(maxAbs, Math.abs(s.noise), Math.abs(s.final), Math.abs(s.pointer));
  }
  const yScale = (h / 2 - pad) / maxAbs;

  const xAt = (t: number) => pad + ((t - cutoff) / WINDOW_MS) * (w - 2 * pad);
  const yAt = (v: number) => midY - v * yScale;

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, w, h);

  // zero line
  ctx.strokeStyle = colors.zero;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pad, midY);
  ctx.lineTo(w - pad, midY);
  ctx.stroke();
  ctx.setLineDash([]);

  const drawSeries = (value: (s: Sample) => number, color: string, width: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const x = xAt(s.t);
      const y = yAt(value(s));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  drawSeries((s) => s.noise, colors.noise, 1);
  drawSeries((s) => s.pointer, colors.pointer, 2.5);
  drawSeries((s) => s.final, colors.high, 2.5);

  ctx.restore();
}, canvas);
</script>
