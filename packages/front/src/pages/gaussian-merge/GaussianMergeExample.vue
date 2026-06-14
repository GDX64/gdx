<template>
  <div class="flex gap-8 flex-wrap w-full text-base">
    <div ref="guiContainer" class="gui-container"></div>
    <canvas ref="canvas" class="w-full h-[500px] border-black"></canvas>
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

const BACKGROUND_COLOR = '#ffffff';

interface Drawable {
  draw(ctx: CanvasRenderingContext2D, scale: Scale): void;
  getColor(): string;
  getName(): string;
  getLineStyle(): LineStyle;
}

type LineStyle = 'continuous' | 'dashed';

const lineStyleOptions: LineStyle[] = ['continuous', 'dashed'];

function applyLineStyle(ctx: CanvasRenderingContext2D, lineStyle: LineStyle) {
  ctx.setLineDash(lineStyle === 'dashed' ? [8, 6] : []);
}

class Gaussian implements Drawable {
  name = 'Gaussian';
  constructor(
    public sigma: number,
    public u: number,
    public weight: number,
    public color: string,
    public lineStyle: LineStyle = 'continuous'
  ) {}

  getColor(): string {
    return this.color;
  }

  getName() {
    return this.name;
  }

  getLineStyle(): LineStyle {
    return this.lineStyle;
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
    applyLineStyle(ctx, this.lineStyle);
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
    public color: string,
    public lineStyle: LineStyle = 'continuous'
  ) {}

  getColor(): string {
    return this.color;
  }

  getName() {
    return this.name;
  }

  getLineStyle(): LineStyle {
    return this.lineStyle;
  }

  draw(ctx: CanvasRenderingContext2D, scale: Scale) {
    ctx.strokeStyle = this.color;
    applyLineStyle(ctx, this.lineStyle);
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

type Mat2 = [number, number, number, number]; // [a, b, b, d] symmetric: a=sxx, b=sxy, d=syy

interface EllipseScale {
  toCanvasX(value: number): number;
  toCanvasY(value: number): number;
  unit: number; // pixels per world unit (equal aspect)
  plot: PlotArea;
}

// A weighted 2D Gaussian described by mean, covariance and weight, drawn as a
// constant-density contour ellipse on the x/y plane.
class Gaussian2D {
  constructor(
    public x: number,
    public y: number,
    public sigmaX: number,
    public sigmaY: number,
    public theta: number, // rotation in radians
    public weight: number,
    public color: string,
    public name = 'Gaussian',
    public lineStyle: LineStyle = 'continuous'
  ) {}

  getColor() {
    return this.color;
  }

  getName() {
    return this.name;
  }

  getLineStyle() {
    return this.lineStyle;
  }

  // Build the covariance matrix from the intuitive (sigmaX, sigmaY, theta) controls:
  // P = R diag(sx^2, sy^2) R^T
  covariance(): Mat2 {
    const c = Math.cos(this.theta);
    const s = Math.sin(this.theta);
    const sx2 = this.sigmaX * this.sigmaX;
    const sy2 = this.sigmaY * this.sigmaY;
    const sxx = sx2 * c * c + sy2 * s * s;
    const syy = sx2 * s * s + sy2 * c * c;
    const sxy = (sx2 - sy2) * c * s;
    return [sxx, sxy, sxy, syy];
  }

  // Moment-preserving merge of two 2D Gaussians (full matrix form).
  static merge(a: Gaussian2D, b: Gaussian2D, color: string, name: string): Gaussian2D {
    const wa = a.weight;
    const wb = b.weight;
    const w = wa + wb;
    const mx = (wa * a.x + wb * b.x) / w;
    const my = (wa * a.y + wb * b.y) / w;

    const Pa = a.covariance();
    const Pb = b.covariance();
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const spread = (wa * wb) / (w * w);

    // P = (wa/w)Pa + (wb/w)Pb + (wa wb / w^2) (mu_a - mu_b)(mu_a - mu_b)^T
    const sxx = (wa * Pa[0] + wb * Pb[0]) / w + spread * dx * dx;
    const sxy = (wa * Pa[1] + wb * Pb[1]) / w + spread * dx * dy;
    const syy = (wa * Pa[3] + wb * Pb[3]) / w + spread * dy * dy;

    const merged = new Gaussian2D(mx, my, 1, 1, 0, w, color, name, 'dashed');
    merged.setCovariance([sxx, sxy, sxy, syy]);
    return merged;
  }

  // Recover (sigmaX, sigmaY, theta) from a covariance matrix via its eigen-decomposition,
  // so the merged component can be drawn with the same machinery.
  setCovariance(P: Mat2) {
    const [a, b, , d] = P;
    const tr = a + d;
    const det = a * d - b * b;
    const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
    const l1 = tr / 2 + disc;
    const l2 = tr / 2 - disc;
    this.sigmaX = Math.sqrt(Math.max(0, l1));
    this.sigmaY = Math.sqrt(Math.max(0, l2));
    this.theta = Math.abs(b) < 1e-9 && Math.abs(a - d) < 1e-9 ? 0 : 0.5 * Math.atan2(2 * b, a - d);
  }

  draw(ctx: CanvasRenderingContext2D, scale: EllipseScale) {
    const cx = scale.toCanvasX(this.x);
    const cy = scale.toCanvasY(this.y);
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2.5;
    // Draw 1-sigma and 2-sigma contours.
    for (const k of [1, 2]) {
      applyLineStyle(ctx, k === 1 ? this.lineStyle : 'dashed');
      ctx.beginPath();
      ctx.ellipse(
        cx,
        cy,
        this.sigmaX * k * scale.unit,
        this.sigmaY * k * scale.unit,
        -this.theta, // canvas y points down, so negate the rotation
        0,
        Math.PI * 2
      );
      ctx.stroke();
    }
    // Mark the mean.
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlane(gaussians: Gaussian2D[], range: number) {
  const c = canvas.value;
  if (!c) return;
  const ctx = c.getContext('2d');
  if (!ctx) return;

  const width = Math.max(1, size.width | 0);
  const height = Math.max(1, size.height | 0);

  ctx.save();
  ctx.scale(dpi, dpi);
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, width, height);

  const padding = 24;
  const plot: PlotArea = {
    left: padding,
    top: padding,
    width: Math.max(1, width - padding * 2),
    height: Math.max(1, height - padding * 2),
  };

  // Equal aspect ratio: same pixels-per-unit on both axes.
  const span = range * 2;
  const unit = Math.min(plot.width, plot.height) / span;
  const centerX = plot.left + plot.width / 2;
  const centerY = plot.top + plot.height / 2;

  const scale: EllipseScale = {
    toCanvasX: (x) => centerX + x * unit,
    toCanvasY: (y) => centerY - y * unit,
    unit,
    plot,
  };

  // Axes.
  ctx.strokeStyle = 'rgb(150 160 140)';
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(plot.left, centerY);
  ctx.lineTo(plot.left + plot.width, centerY);
  ctx.moveTo(centerX, plot.top);
  ctx.lineTo(centerX, plot.top + plot.height);
  ctx.stroke();

  // Tick marks.
  ctx.strokeStyle = 'rgb(120 130 110)';
  ctx.fillStyle = 'rgb(60 70 55)';
  ctx.font = '10px monospace';
  for (let v = -range; v <= range; v++) {
    if (v === 0) continue;
    const px = scale.toCanvasX(v);
    const py = scale.toCanvasY(v);
    ctx.beginPath();
    ctx.moveTo(px, centerY - 4);
    ctx.lineTo(px, centerY + 4);
    ctx.moveTo(centerX - 4, py);
    ctx.lineTo(centerX + 4, py);
    ctx.stroke();
  }

  for (const g of gaussians) {
    g.draw(ctx, scale);
  }

  drawLegend(ctx, gaussians, plot);
  ctx.restore();
}

const { canvas, size, dpi } = useCanvasDPI({ dpi: 1 });

function createExample() {
  const gui = new GUI({ container: guiContainer.value ?? undefined });

  if (props.example === 'merge') {
    const gaussian1 = new Gaussian(1, -0.5, 1, '#b83280');
    gaussian1.name = 'Gaussian A';
    const gaussian2 = new Gaussian(1, 0.5, 1, '#1f6aa5');
    gaussian2.name = 'Gaussian B';

    gui.add(gaussian1, 'sigma', 0.2, 10, 0.1).name('Sigma A');
    gui.add(gaussian1, 'u', -10, 10, 0.1).name('U A');
    gui.add(gaussian1, 'weight', 0, 3, 0.05).name('Weight A');
    gui.add(gaussian1, 'lineStyle', lineStyleOptions).name('Line A');
    gui.add(gaussian2, 'sigma', 0.2, 10, 0.1).name('Sigma B');
    gui.add(gaussian2, 'u', -10, 10, 0.1).name('U B');
    gui.add(gaussian2, 'weight', 0, 3, 0.05).name('Weight B');
    gui.add(gaussian2, 'lineStyle', lineStyleOptions).name('Line B');

    const fn = new FunctionDraw((x) => {
      return gaussian1.value(x) + gaussian2.value(x);
    }, '#a07a16');
    gui.add(fn, 'lineStyle', lineStyleOptions).name('Line Sum');

    const derivedLineStyles = {
      merged: 'continuous' as LineStyle,
      error: 'dashed' as LineStyle,
    };
    gui.add(derivedLineStyles, 'merged', lineStyleOptions).name('Line Merged');
    gui.add(derivedLineStyles, 'error', lineStyleOptions).name('Line Error');

    fn.name = 'f(x) = N_a + N_b';

    return () => {
      const mergedGaussian = gaussian1.mergeWith(gaussian2);
      mergedGaussian.name = 'Merged Gaussian';
      mergedGaussian.color = '#2f2f2f';
      mergedGaussian.lineStyle = derivedLineStyles.merged;
      const bariceterMergeGaussian = gaussian1.baricenterMergeWith(gaussian2);
      bariceterMergeGaussian.name = 'Baricenter Merge Gaussian';
      bariceterMergeGaussian.color = '#1f8a70';
      mergedGaussian.lineStyle = 'dashed';

      const mergeError = new FunctionDraw((x: number) => {
        return Math.abs(mergedGaussian.value(x) - fn.fn(x));
      }, '#c44536');
      mergeError.name = 'Merge Error';
      mergeError.lineStyle = derivedLineStyles.error;
      draw([gaussian1, gaussian2, fn, mergedGaussian, mergeError], {
        x: [-5, 5],
        y: [-0.5, 2],
      });
    };
  }

  if (props.example === 'ellipse') {
    const a = new Gaussian2D(-1.2, -0.4, 1.4, 0.6, 0.4, 1, '#b83280', 'Gaussian A');
    const b = new Gaussian2D(1.2, 0.6, 0.7, 1.3, -0.5, 1, '#1f6aa5', 'Gaussian B');

    for (const [g, label] of [
      [a, 'A'],
      [b, 'B'],
    ] as const) {
      gui.add(g, 'x', -4, 4, 0.05).name(`X ${label}`);
      gui.add(g, 'y', -4, 4, 0.05).name(`Y ${label}`);
      gui.add(g, 'sigmaX', 0.2, 3, 0.05).name(`Sigma X ${label}`);
      gui.add(g, 'sigmaY', 0.2, 3, 0.05).name(`Sigma Y ${label}`);
      gui.add(g, 'theta', -Math.PI, Math.PI, 0.01).name(`Theta ${label}`);
      gui.add(g, 'weight', 0, 3, 0.05).name(`Weight ${label}`);
    }

    return () => {
      const merged = Gaussian2D.merge(a, b, '#2f2f2f', 'Merged Gaussian');
      drawPlane([a, b, merged], 5);
    };
  }

  const gaussian = new Gaussian(1, 0, 1, 'rgb(26 79 73)');
  gui.add(gaussian, 'sigma', 0.2, 10, 0.1).name('Sigma');
  gui.add(gaussian, 'lineStyle', lineStyleOptions).name('Line');

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

type LegendItem = Pick<Drawable, 'getColor' | 'getName' | 'getLineStyle'>;

function drawLegend(
  ctx: CanvasRenderingContext2D,
  drawables: LegendItem[],
  plot: PlotArea
) {
  const lineLen = 18;
  const padX = 10;
  const padY = 8;
  const fontSize = 16;
  const rowH = Math.ceil(fontSize * 1.5);

  ctx.font = `${fontSize}px monospace`;
  const textWidth = Math.max(...drawables.map((d) => ctx.measureText(d.getName()).width));
  const boxW = padX * 2 + lineLen + 6 + textWidth;
  const boxH = padY * 2 + drawables.length * rowH - (rowH - fontSize);

  const x = plot.left + plot.width - boxW - 8;
  const y = plot.top + 8;

  ctx.setLineDash([]);
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.strokeStyle = 'rgb(180 185 175)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH, 4);
  ctx.fill();
  ctx.stroke();

  drawables.forEach((d, i) => {
    const lineHeight = fontSize;
    const ry = y + padY + i * rowH + lineHeight / 2;
    ctx.strokeStyle = d.getColor();
    applyLineStyle(ctx, d.getLineStyle());
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + padX, ry);
    ctx.lineTo(x + padX + lineLen, ry);
    ctx.stroke();

    ctx.fillStyle = 'rgb(35 35 35)';
    ctx.textBaseline = 'middle';
    ctx.fillText(d.getName(), x + padX + lineLen + 6, ry);
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
    left: 18,
    right: 18,
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
  ctx.scale(dpi, dpi);

  ctx.fillStyle = BACKGROUND_COLOR;
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
* {
  box-sizing: border-box;
}

.hint {
  color: rgb(60 60 60);
  font-size: 0.9rem;
}
</style>
