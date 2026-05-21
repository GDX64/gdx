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

const sigma = ref(1);

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

type PlotArea = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function drawGaussian(
  ctx: CanvasRenderingContext2D,
  gaussian: Gaussian,
  plot: PlotArea,
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
  for (let i = 0; i < plot.width; i++) {
    const x = xMin + (i / Math.max(1, plot.width - 1)) * xSpan;
    const y = gaussian.value(x);
    const px = plot.left + i;
    const py = plot.top + ((yMax - y) / ySpan) * plot.height;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.stroke();
}

function drawTicks(ctx: CanvasRenderingContext2D, plot: PlotArea, ranges: AxisRange) {
  const xMin = ranges.x[0];
  const xMax = ranges.x[1];
  const yMin = ranges.y[0];
  const yMax = ranges.y[1];
  const xSpan = xMax - xMin;
  const ySpan = yMax - yMin;
  if (xSpan <= 0 || ySpan <= 0) {
    return;
  }

  const toCanvasX = (x: number) => plot.left + ((x - xMin) / xSpan) * plot.width;
  const toCanvasY = (y: number) => plot.top + ((yMax - y) / ySpan) * plot.height;

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

  const yTickCount = 8;
  const yTickStep = ySpan / yTickCount;
  for (let i = 0; i <= yTickCount; i++) {
    const yValue = yMin + i * yTickStep;
    const py = toCanvasY(yValue);
    ctx.beginPath();
    ctx.moveTo(yAxisX - 4, py);
    ctx.lineTo(yAxisX + 4, py);
    ctx.stroke();
    if (Math.abs(yValue) > 1e-8) {
      ctx.fillText(yValue.toFixed(2), yAxisX + 7, py + 3);
    }
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

  const padding = {
    left: 12,
    right: 12,
    top: 12,
    bottom: 12,
  };

  const plot: PlotArea = {
    left: padding.left,
    top: padding.top,
    width: Math.max(1, width - padding.left - padding.right),
    height: Math.max(1, height - padding.top - padding.bottom),
  };

  const toCanvasX = (x: number) => plot.left + ((x - xMin) / xSpan) * plot.width;
  const toCanvasY = (y: number) => plot.top + ((yMax - y) / ySpan) * plot.height;

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);

  ctx.fillStyle = 'rgb(245 247 242)';
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = 'rgb(150 160 140)';
  ctx.lineWidth = 1;
  const xAxisY = toCanvasY(0);
  if (xAxisY >= plot.top && xAxisY <= plot.top + plot.height) {
    ctx.beginPath();
    ctx.moveTo(plot.left, xAxisY);
    ctx.lineTo(plot.left + plot.width, xAxisY);
    ctx.stroke();
  }
  const yAxisX = toCanvasX(0);
  if (yAxisX >= plot.left && yAxisX <= plot.left + plot.width) {
    ctx.beginPath();
    ctx.moveTo(yAxisX, plot.top);
    ctx.lineTo(yAxisX, plot.top + plot.height);
    ctx.stroke();
  }

  drawTicks(ctx, plot, ranges);

  ctx.strokeStyle = 'rgb(26 79 73)';
  ctx.lineWidth = 2.5;
  for (const gaussian of gaussians) {
    drawGaussian(ctx, gaussian, plot, ranges);
  }

  //   ctx.fillStyle = 'rgb(35 35 35)';
  //   ctx.font = '12px monospace';
  //   ctx.fillText('x', width - 14, xAxisY - 6);
  //   ctx.fillText('f(x)', yAxisX + 50, 12);
  //   ctx.fillText('0', yAxisX + 4, xAxisY + 14);

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
