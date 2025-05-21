import { CanvasElement } from "./canvasElement";

export class CanvasTextElement extends CanvasElement {
  updateScheduled = false;
  textMeasure: TextMetrics | null = null;

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
    ctx.textBaseline = "top";
    this.textMeasure = ctx.measureText(text);
    const { actualBoundingBoxAscent, actualBoundingBoxDescent, width } =
      this.textMeasure;
    this.yogaNode?.setWidth(width);
    this.yogaNode?.setHeight(
      actualBoundingBoxAscent + actualBoundingBoxDescent
    );
  }

  drawSelf(ctx: CanvasRenderingContext2D): void {
    const fill = this.getFill();
    if (fill) {
      ctx.fillStyle = fill;
    }
    ctx.font = this.getFont();
    const boundingBoxError = this.textMeasure?.actualBoundingBoxAscent ?? 0;
    ctx.textBaseline = "top";
    ctx.fillText(this.attrs.text ?? "", 0, boundingBoxError);
  }
}
