import { CanvasElement } from "./canvasElement";

export class CanvasImageElement extends CanvasElement {
  imgElement: HTMLImageElement | null = null;
  patch(prop: string, prev: any, next: any): void {
    super.patch(prop, prev, next);
    switch (prop) {
      case "image":
        this.attrs.image = next;
        if (typeof this.attrs.image === "string") {
          this.imgElement = new Image();
          this.imgElement.src = this.attrs.image;
        } else if (this.attrs.image instanceof HTMLImageElement) {
          this.imgElement = this.attrs.image;
        } else {
          this.imgElement = null;
        }
        break;
    }
  }

  drawSelf(ctx: CanvasRenderingContext2D) {
    if (this.imgElement) {
      ctx.drawImage(this.imgElement, 0, 0, this.getWidth(), this.getHeight());
    }
  }
}
