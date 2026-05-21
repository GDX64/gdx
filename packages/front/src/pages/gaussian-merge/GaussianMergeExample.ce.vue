<template>
  <div class="flex gap-8 flex-wrap w-full text-base">
    <canvas ref="canvas" class="gauss-canvas"></canvas>
    <div class="flex flex-col gap-3 min-w-72 grow">
      <div class="flex justify-between gap-2">
        <label>Sigma</label>
        <span>{{ sigma.toFixed(1) }}</span>
      </div>
      <input type="range" min="1" max="10" v-model.number="sigma" />
      <p class="hint">Single gaussian centered at origin, plotted as a function of x.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAnimationFrames, useCanvasDPI } from '@gdx/utils';

const props = defineProps<{
  example?: string;
}>();

const sigma = ref(28);

const { canvas, size } = useCanvasDPI();

function drawExample() {
  if (props.example === 'single') {
    const gaussian = new Gaussian(sigma.value, 0);
    draw([gaussian], {
      x: [-10, 10],
      y: [-1, 2],
    });
  } else if (props.example === 'merge') {
  }
}

useAnimationFrames(() => {
  drawExample();
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

type AxisRange = {
  x: [number, number];
  y: [number, number];
};

function drawGaussian(
  ctx: CanvasRenderingContext2D,
  gaussian: Gaussian,
  width: number,
  height: number,
  ranges: AxisRange
) {
  const xMin = ranges.x[0];
  const xMax = ranges.x[1];
  const yMin = ranges.y[0];
  const yMax = ranges.y[1];

  const xSpan = xMax - xMin;
  const ySpan = yMax - yMin;
  if (xSpan <= 0 || ySpan <= 0) {
    return;
  }

  ctx.beginPath();
  for (let px = 0; px < width; px++) {
    const x = xMin + (px / Math.max(1, width - 1)) * xSpan;
    const y = gaussian.value(x);
    const py = ((yMax - y) / ySpan) * height;
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
  height: number,
  ranges: AxisRange
) {
  const xMin = ranges.x[0];
  const xMax = ranges.x[1];
  const yMin = ranges.y[0];
  const yMax = ranges.y[1];
  const xSpan = xMax - xMin;
  const ySpan = yMax - yMin;
  if (xSpan <= 0 || ySpan <= 0) {
    return;
  }

  const toCanvasX = (x: number) => ((x - xMin) / xSpan) * width;
  const toCanvasY = (y: number) => ((yMax - y) / ySpan) * height;

  ctx.strokeStyle = 'rgb(120 130 110)';
  ctx.fillStyle = 'rgb(60 70 55)';
  ctx.lineWidth = 1;
  ctx.font = '10px monospace';

  const xAxisY = toCanvasY(0);
  const yAxisX = toCanvasX(0);

  const xTickCount = 8;
  const xTickStep = xSpan / xTickCount;
  for (let i = 0; i <= xTickCount; i++) {
    const xValue = xMin + i * xTickStep;
    const px = toCanvasX(xValue);
    ctx.beginPath();
    ctx.moveTo(px, xAxisY - 4);
    ctx.lineTo(px, xAxisY + 4);
    ctx.stroke();
    if (Math.abs(xValue) > 1e-8) {
      ctx.fillText(`${xValue.toFixed(1)}`, px - 10, xAxisY + 16);
    }
  }

  const yTicks = [0.25, 0.5, 0.75, 1].filter((t) => t >= yMin && t <= yMax);
  for (const t of yTicks) {
    const py = toCanvasY(t);
    ctx.beginPath();
    ctx.moveTo(yAxisX - 4, py);
    ctx.lineTo(yAxisX + 4, py);
    ctx.stroke();
    ctx.fillText(t.toFixed(2), yAxisX + 7, py + 3);
  }
}

function draw(gaussians: Gaussian[], ranges: AxisRange) {
  const c = canvas.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;

  const width = Math.max(1, size.width | 0);
  const height = Math.max(1, size.height | 0);

  const xMin = ranges.x[0];
  const xMax = ranges.x[1];
  const yMin = ranges.y[0];
  const yMax = ranges.y[1];
  const xSpan = xMax - xMin;
  const ySpan = yMax - yMin;
  if (xSpan <= 0 || ySpan <= 0) {
    return;
  }

  const toCanvasX = (x: number) => ((x - xMin) / xSpan) * width;
  const toCanvasY = (y: number) => ((yMax - y) / ySpan) * height;

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);

  ctx.fillStyle = 'rgb(245 247 242)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgb(150 160 140)';
  ctx.lineWidth = 1;
  const xAxisY = toCanvasY(0);
  if (xAxisY >= 0 && xAxisY <= height) {
    ctx.beginPath();
    ctx.moveTo(0, xAxisY);
    ctx.lineTo(width, xAxisY);
    ctx.stroke();
  }
  const yAxisX = toCanvasX(0);
  if (yAxisX >= 0 && yAxisX <= width) {
    ctx.beginPath();
    ctx.moveTo(yAxisX, 0);
    ctx.lineTo(yAxisX, height);
    ctx.stroke();
  }

  drawTicks(ctx, width, height, ranges);

  ctx.strokeStyle = 'rgb(26 79 73)';
  ctx.lineWidth = 2.5;
  for (const gaussian of gaussians) {
    drawGaussian(ctx, gaussian, width, height, ranges);
  }

  ctx.fillStyle = 'rgb(35 35 35)';
  ctx.font = '12px monospace';
  ctx.fillText('x', width - 14, xAxisY - 6);
  ctx.fillText('f(x)', yAxisX + 6, 12);
  ctx.fillText('0', yAxisX + 4, xAxisY + 14);

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
