import { CanvasElement } from "./canvasElement";

export class CanvasImageElement extends CanvasElement {
  drawSelf(ctx: CanvasRenderingContext2D) {
    if (this.attrs.image) {
      ctx.drawImage(
        this.attrs.image,
        0,
        0,
        this.yogaNode.getComputedWidth(),
        this.yogaNode.getComputedHeight()
      );
    }
  }
}
