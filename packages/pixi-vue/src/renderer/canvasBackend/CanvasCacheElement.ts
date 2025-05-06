import { CanvasElement } from "./canvasElement";

export class CanvasCacheElement extends CanvasElement {
  offscreenCanvas: OffscreenCanvas | null = null;
  patch(prop: string, prev: any, next: any): void {
    super.patch(prop, prev, next);
    switch (prop) {
      case "cacheKey":
        if (prev !== next) {
          this.invalidateCache();
        }
        break;
      default:
        break;
    }
  }

  private invalidateCache() {
    this.offscreenCanvas = null;
  }

  drawSelf(ctx: CanvasRenderingContext2D) {}

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.offscreenCanvas) {
      this.drawFromCache(ctx);
    } else {
      const matrix = ctx.getTransform();
      const scaleX = matrix.a * (this.attrs.scaleX ?? 1);
      const scaleY = matrix.d * (this.attrs.scaleY ?? 1);
      console.log({ scaleX, scaleY });
      const canvas = new OffscreenCanvas(
        this.getWidth() * scaleX,
        this.getHeight() * scaleY
      );
      const cacheCtx = canvas.getContext("2d")!;
      cacheCtx.scale(scaleX, scaleY);
      this.children.forEach((child) => {
        child.draw(cacheCtx as unknown as CanvasRenderingContext2D);
      });
      this.offscreenCanvas = canvas;
      this.drawFromCache(ctx);
    }
  }

  private drawFromCache(ctx: CanvasRenderingContext2D) {
    if (this.offscreenCanvas) {
      ctx.drawImage(
        this.offscreenCanvas,
        this.getLeft(),
        this.getTop(),
        this.offscreenCanvas.width / devicePixelRatio,
        this.offscreenCanvas.height / devicePixelRatio
      );
    }
  }
}
