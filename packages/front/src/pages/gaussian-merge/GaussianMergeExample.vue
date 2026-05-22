<template>
  <div class="flex gap-8 flex-wrap w-full text-base">
    <div ref="guiContainer" class="gui-container"></div>
    <canvas ref="canvas" class="gauss-canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useAnimationFrames, useCanvasDPI } from '@gdx/utils';
import GUI from 'lil-gui';

const props = defineProps<{
  example?: string;
}>();

const guiContainer = ref<HTMLDivElement | null>(null);
let destroyExample = () => {};

class Gaussian {
  constructor(
    public sigma: number,
    public u: number,
    public weight: number,
    public color: string
  ) {}

  mergeWith(other: Gaussian) {
    const sigma1Sq = this.sigma * this.sigma;
    const sigma2Sq = other.sigma * other.sigma;
    const mergedSigma = Math.sqrt(sigma1Sq + sigma2Sq);
    const mergedWeight = this.weight + other.weight;
    const mergedU =
      mergedWeight > 0
        ? (this.u * this.weight + other.u * other.weight) / mergedWeight
        : (this.u + other.u) * 0.5;
    return new Gaussian(mergedSigma, mergedU, mergedWeight, 'rgb(35 35 35)');
  }

  value(x: number) {
    return this.weight * Math.exp(-((x - this.u) ** 2) / (2 * this.sigma * this.sigma));
  }

  draw(ctx: CanvasRenderingContext2D, scale: Scale) {
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < scale.plot.width; i++) {
      const x = scale.toWorldX(i);
      const y = this.value(x);
      const px = scale.plot.left + i;
      const py = scale.toCanvasY(y);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }
}

const { canvas, size } = useCanvasDPI();

function createExample() {
  const gui = new GUI({ container: guiContainer.value ?? undefined });

  if (props.example === 'merge') {
    const gaussian1 = new Gaussian(1, -5, 0.8, 'rgb(190 70 55)');
    const gaussian2 = new Gaussian(1, 5, 1.2, 'rgb(55 95 170)');

    gui.add(gaussian1, 'sigma', 0.2, 10, 0.1).name('Sigma A');
    gui.add(gaussian1, 'u', -10, 10, 0.1).name('U A');
    gui.add(gaussian1, 'weight', 0, 3, 0.05).name('Weight A');
    gui.add(gaussian2, 'sigma', 0.2, 10, 0.1).name('Sigma B');
    gui.add(gaussian2, 'u', -10, 10, 0.1).name('U B');
    gui.add(gaussian2, 'weight', 0, 3, 0.05).name('Weight B');

    return () => {
      const mergedGaussian = gaussian1.mergeWith(gaussian2);
      draw([gaussian1, gaussian2, mergedGaussian], {
        x: [-10, 10],
        y: [-1, 3],
      });
    };
  }

  const gaussian = new Gaussian(1, 0, 1, 'rgb(26 79 73)');
  gui.add(gaussian, 'sigma', 0.2, 10, 0.1).name('Sigma');

  return () =>
    draw([gaussian], {
      x: [-10, 10],
      y: [-1, 2],
    });
}

let drawExampleFn: () => void = () => {};

onMounted(() => {
  drawExampleFn = createExample();
});

useAnimationFrames(() => {
  drawExampleFn();
});

type Scale = {
  toCanvasX(value: number): number;
  toCanvasY(value: number): number;
  toWorldX(plotX: number): number;
  plot: PlotArea;
};

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
  const toWorldX = (plotX: number) =>
    xMin + (plotX / Math.max(1, plot.width - 1)) * xSpan;

  const scale: Scale = {
    toCanvasX,
    toCanvasY,
    toWorldX,
    plot,
  };

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

  ctx.lineWidth = 2.5;
  for (const gaussian of gaussians) {
    gaussian.draw(ctx, scale);
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
  max-width: 840px;
  height: 420px;
  /* aspect-ratio: 1; */
  border: 1px solid black;
  touch-action: none;
}

* {
  box-sizing: border-box;
}

.hint {
  color: rgb(60 60 60);
  font-size: 0.9rem;
}
</style>
