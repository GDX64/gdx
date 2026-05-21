<template>
  <div class="flex gap-8 flex-wrap w-full text-base">
    <canvas ref="canvas" class="gauss-canvas"></canvas>
    <div class="flex flex-col gap-3 min-w-72 grow">
      <div class="flex justify-between gap-2">
        <label>Sigma</label>
        <span>{{ sigma.toFixed(1) }}</span>
      </div>
      <input type="range" min="8" max="120" v-model.number="sigma" />
      <p class="hint">Single gaussian centered at origin, plotted as a function of x.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAnimationFrames, useCanvasDPI } from '@gdx/utils';

const sigma = ref(28);

const { canvas, size } = useCanvasDPI();

useAnimationFrames(() => {
  draw();
});

class Gaussian {
  constructor(
    public sigma: number,
    public u: number
  ) {}

  value(x: number) {
    return Math.exp(-((x - this.u) ** 2) / (2 * this.sigma * this.sigma));
  }
}

function drawGaussian(
  ctx: CanvasRenderingContext2D,
  gaussian: Gaussian,
  width: number,
  cx: number,
  cy: number,
  amplitude: number
) {
  ctx.beginPath();
  for (let px = 0; px < width; px++) {
    const x = px - cx;
    const y = gaussian.value(x);
    const py = cy - y * amplitude;
    if (px === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
}

function drawTicks(
  ctx: CanvasRenderingContext2D,
  width: number,
  cx: number,
  cy: number,
  amplitude: number
) {
  ctx.strokeStyle = 'rgb(120 130 110)';
  ctx.fillStyle = 'rgb(60 70 55)';
  ctx.lineWidth = 1;
  ctx.font = '10px monospace';

  const xTickStep = Math.max(24, Math.round(width / 8));
  for (let px = cx; px < width; px += xTickStep) {
    const relative = Math.round(px - cx);
    ctx.beginPath();
    ctx.moveTo(px, cy - 4);
    ctx.lineTo(px, cy + 4);
    ctx.stroke();
    if (relative !== 0) {
      ctx.fillText(`${relative}`, px - 8, cy + 16);
    }
  }
  for (let px = cx - xTickStep; px > 0; px -= xTickStep) {
    const relative = Math.round(px - cx);
    ctx.beginPath();
    ctx.moveTo(px, cy - 4);
    ctx.lineTo(px, cy + 4);
    ctx.stroke();
    ctx.fillText(`${relative}`, px - 10, cy + 16);
  }

  const yTicks = [0.25, 0.5, 0.75, 1];
  for (const t of yTicks) {
    const py = cy - amplitude * t;
    ctx.beginPath();
    ctx.moveTo(cx - 4, py);
    ctx.lineTo(cx + 4, py);
    ctx.stroke();
    ctx.fillText(t.toFixed(2), cx + 7, py + 3);
  }
}

function draw() {
  const c = canvas.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;

  const width = Math.max(1, size.width | 0);
  const height = Math.max(1, size.height | 0);
  const cx = width * 0.5;
  const cy = height * 0.78;
  const amplitude = height * 0.58;

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);

  ctx.fillStyle = 'rgb(245 247 242)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgb(150 160 140)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, cy);
  ctx.lineTo(width, cy);
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, height);
  ctx.stroke();

  drawTicks(ctx, width, cx, cy, amplitude);

  ctx.strokeStyle = 'rgb(26 79 73)';
  ctx.lineWidth = 2.5;
  const gaussian = new Gaussian(sigma.value, 0);
  drawGaussian(ctx, gaussian, width, cx, cy, amplitude);

  ctx.fillStyle = 'rgb(35 35 35)';
  ctx.font = '12px monospace';
  ctx.fillText('x', width - 14, cy - 6);
  ctx.fillText('f(x)', cx + 6, 12);
  ctx.fillText('0', cx + 4, cy + 14);

  ctx.restore();
}
</script>

<style>
.gauss-canvas {
  width: 100%;
  max-width: 420px;
  aspect-ratio: 1;
  border: 1px solid rgb(20 20 20);
  touch-action: none;
}

.hint {
  color: rgb(60 60 60);
  font-size: 0.9rem;
}
</style>
