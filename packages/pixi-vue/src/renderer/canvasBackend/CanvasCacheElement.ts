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

  private invalidateCache() {}

  drawSelf(ctx: CanvasRenderingContext2D) {}

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.offscreenCanvas) {
      this.drawFromCache(ctx);
    } else {
      const canvas = new OffscreenCanvas(
        this.yogaNode.getComputedWidth(),
        this.yogaNode.getComputedHeight()
      );
      const cacheCtx = canvas.getContext("2d")!;
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
        this.yogaNode.getComputedLeft(),
        this.yogaNode.getComputedTop(),
        this.yogaNode.getComputedWidth(),
        this.yogaNode.getComputedHeight()
      );
    }
  }
}
