import { CanvasElement } from "./canvasElement";

export class CanvasTextElement extends CanvasElement {
  updateScheduled = false;

  patch(prop: string, prev: any, next: any): void {
    super.patch(prop, prev, next);
    switch (prop) {
      case "text": {
        this.queueUpdate();
        break;
      }
    }
  }

  private queueUpdate() {
    if (!this.updateScheduled) {
      this.updateScheduled = true;
      queueMicrotask(() => {
        this.updateTextMeasure();
        this.updateScheduled = false;
      });
    }
  }

  private getFont() {
    return `${this.attrs.fontSize ?? 16}px ${this.attrs.fontFamily ?? "Arial"}`;
  }

  private updateTextMeasure() {
    const text = this.attrs.text ?? "";
    const ctx = new OffscreenCanvas(0, 0).getContext("2d")!;
    ctx.font = this.getFont();
    const { width, actualBoundingBoxAscent, actualBoundingBoxDescent } =
      ctx.measureText(text);
    this.yogaNode.setWidth(width);
    this.yogaNode.setHeight(actualBoundingBoxAscent + actualBoundingBoxDescent);
  }

  drawSelf(ctx: CanvasRenderingContext2D): void {
    const fill = this.getFill();
    if (fill) {
      ctx.fillStyle = fill;
    }
    ctx.font = this.getFont();
    ctx.textBaseline = "top";
    ctx.fillText(this.attrs.text ?? "", 0, 0);
  }
}
