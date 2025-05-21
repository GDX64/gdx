import { RawElementAttrs } from "#els/renderTypes.ts";
import { CanvasElement } from "./canvasElement";

export class CanvasRawElement extends CanvasElement<RawElementAttrs> {
  patch(prop: string, prev: any, next: any): void {
    super.patch(prop, prev, next);
  }

  drawSelf(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    this.attrs.drawFunction?.(ctx, this);
    ctx.restore();
  }
}
