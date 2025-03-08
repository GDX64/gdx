import { GElement } from "./Elements";
import * as PIXI from "pixi.js";

export class PixiImageElement extends GElement {
  pixiRef = new PIXI.Sprite();
  lastAbort = new AbortController();
  patch(prop: string, prev: any, next: any): void {
    switch (prop) {
      case "image": {
        this.attrs.image = next;
        if (this.attrs.image instanceof HTMLImageElement) {
          const image = this.attrs.image;
          this.lastAbort.abort();
          this.lastAbort = new AbortController();
          image.addEventListener(
            "load",
            () => {
              this.pixiRef.texture = PIXI.Texture.from(image);
            },
            { once: true, signal: this.lastAbort.signal }
          );
        }
      }
      default:
        super.patch(prop, prev, next);
    }
  }

  destroy() {
    super.destroy();
    this.lastAbort.abort();
  }

  updateLayout() {
    super.updateLayout();
    this.pixiRef.width = this.yogaNode.getComputedWidth();
    this.pixiRef.height = this.yogaNode.getComputedHeight();
  }
}
