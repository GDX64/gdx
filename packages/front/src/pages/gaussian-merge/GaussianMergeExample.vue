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

interface Drawable {
  draw(ctx: CanvasRenderingContext2D, scale: Scale): void;
  getColor(): string;
  getName(): string;
}

class Gaussian implements Drawable {
  name = 'Gaussian';
  constructor(
    public sigma: number,
    public u: number,
    public weight: number,
    public color: string
  ) {}

  getColor(): string {
    return this.color;
  }

  getName() {
    return this.name;
  }

  mergeWith(other: Gaussian) {
    const sigma1Sq = this.sigma * this.sigma;
    const sigma2Sq = other.sigma * other.sigma;
    const totalArea = this.weight * this.sigma + other.weight * other.sigma;
    const mergedU =
      (this.u * this.weight * this.sigma + other.u * other.weight * other.sigma) /
      totalArea;
    const mergedSigma = Math.sqrt(
      (this.weight * this.sigma * (sigma1Sq + (this.u - mergedU) ** 2) +
        other.weight * other.sigma * (sigma2Sq + (other.u - mergedU) ** 2)) /
        totalArea
    );
    const mergedWeight = totalArea / mergedSigma;
    return new Gaussian(mergedSigma, mergedU, mergedWeight, 'rgb(35 35 35)');
  }

  baricenterMergeWith(other: Gaussian) {
    const totalWeight = this.weight + other.weight;
    const mergedU = (this.u * this.weight + other.u * other.weight) / totalWeight;
    return new Gaussian(this.sigma, mergedU, totalWeight, 'rgb(35 35 35)');
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

class FunctionDraw implements Drawable {
  name = 'FunctionDraw';

  constructor(
    public fn: (x: number) => number,
    public color: string
  ) {}

  getColor(): string {
    return this.color;
  }

  getName() {
    return this.name;
  }

  draw(ctx: CanvasRenderingContext2D, scale: Scale) {
    ctx.strokeStyle = this.color;
    ctx.beginPath();
    for (let i = 0; i < scale.plot.width; i++) {
      const x = scale.toWorldX(i);
      const y = this.fn(x);
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
    gaussian1.name = 'Gaussian A';
    const gaussian2 = new Gaussian(1, 5, 1.2, 'rgb(55 95 170)');
    gaussian2.name = 'Gaussian B';

    gui.add(gaussian1, 'sigma', 0.2, 10, 0.1).name('Sigma A');
    gui.add(gaussian1, 'u', -10, 10, 0.1).name('U A');
    gui.add(gaussian1, 'weight', 0, 3, 0.05).name('Weight A');
    gui.add(gaussian2, 'sigma', 0.2, 10, 0.1).name('Sigma B');
    gui.add(gaussian2, 'u', -10, 10, 0.1).name('U B');
    gui.add(gaussian2, 'weight', 0, 3, 0.05).name('Weight B');

    const fn = new FunctionDraw((x) => {
      return gaussian1.value(x) + gaussian2.value(x);
    }, '#a8a632');

    fn.name = 'f(x) = A + B';

    return () => {
      const mergedGaussian = gaussian1.mergeWith(gaussian2);
      mergedGaussian.name = 'Merged Gaussian';
      const bariceterMergeGaussian = gaussian1.baricenterMergeWith(gaussian2);
      bariceterMergeGaussian.name = 'Baricenter Merge Gaussian';
      bariceterMergeGaussian.color = '#326655';
      draw([gaussian1, gaussian2, mergedGaussian, bariceterMergeGaussian, fn], {
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

function drawLegend(
  ctx: CanvasRenderingContext2D,
  drawables: Drawable[],
  plot: PlotArea
) {
  const lineLen = 18;
  const rowH = 18;
  const padX = 10;
  const padY = 8;
  const fontSize = 11;

  ctx.font = `${fontSize}px monospace`;
  const textWidth = Math.max(...drawables.map((d) => ctx.measureText(d.getName()).width));
  const boxW = padX * 2 + lineLen + 6 + textWidth;
  const boxH = padY * 2 + drawables.length * rowH - (rowH - fontSize);

  const x = plot.left + plot.width - boxW - 8;
  const y = plot.top + 8;

  ctx.fillStyle = 'rgba(245 247 242 / 0.85)';
  ctx.strokeStyle = 'rgb(180 185 175)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  drawables.forEach((d, i) => {
    const ry = y + padY + i * rowH + fontSize / 2;
    ctx.strokeStyle = d.getColor();
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + padX, ry);
    ctx.lineTo(x + padX + lineLen, ry);
    ctx.stroke();

    ctx.fillStyle = 'rgb(35 35 35)';
    ctx.fillText(d.getName(), x + padX + lineLen + 6, ry + fontSize / 2 - 1);
  });
}

function draw(gaussians: Drawable[], ranges: AxisRange) {
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

  drawLegend(ctx, gaussians, plot);

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
