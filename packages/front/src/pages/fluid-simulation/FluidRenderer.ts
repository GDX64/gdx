import { FluidSimulation } from './FluidSimulation';

export interface FluidRendererOptions {
  showVelocity?: boolean;
  densityColor?: [number, number, number];
}

const DEFAULT_OPTIONS: Required<FluidRendererOptions> = {
  showVelocity: false,
  densityColor: [40, 130, 220],
};

// Draws a FluidSimulation's density (and optionally velocity) field onto a
// 2D canvas, one filled rect per grid cell.
export class FluidRenderer {
  options: Required<FluidRendererOptions>;

  constructor(
    private ctx: CanvasRenderingContext2D,
    options: FluidRendererOptions = {}
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  draw(simulation: FluidSimulation, width: number, height: number): void {
    const { ctx } = this;
    const n = simulation.size;
    const cellW = width / n;
    const cellH = height / n;

    ctx.fillStyle = '#050608';
    ctx.fillRect(0, 0, width, height);

    const [r, g, b] = this.options.densityColor;
    for (let j = 1; j <= n; j++) {
      for (let i = 1; i <= n; i++) {
        const idx = i + (n + 2) * j;
        const d = simulation.density[idx];
        if (d <= 0.001) continue;
        const alpha = Math.min(1, d);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fillRect((i - 1) * cellW, (j - 1) * cellH, cellW + 0.5, cellH + 0.5);
      }
    }

    if (this.options.showVelocity) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let j = 1; j <= n; j++) {
        for (let i = 1; i <= n; i++) {
          const idx = i + (n + 2) * j;
          const x = (i - 0.5) * cellW;
          const y = (j - 0.5) * cellH;
          const vx = simulation.velocityX[idx];
          const vy = simulation.velocityY[idx];
          ctx.moveTo(x, y);
          ctx.lineTo(x + vx * cellW * 4, y + vy * cellH * 4);
        }
      }
      ctx.stroke();
    }
  }
}
