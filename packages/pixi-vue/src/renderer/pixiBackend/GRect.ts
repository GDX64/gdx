import { GElement } from "./Elements";
import * as PIXI from "pixi.js";
export class GRect extends GElement {
  pixiRef = new PIXI.Graphics();
  texture: PIXI.Texture | null = null;
  patch(prop: string, prev: any, next: any): void {
    switch (prop) {
      case "fill": {
        this.attrs.fill = next;
        this.updateDraw();
        break;
      }
      case "image": {
        this.attrs.image = next;
        if (this.attrs.image) {
          const texture = PIXI.Texture.from(this.attrs.image);
          this.texture = texture;
        } else {
          this.texture = null;
        }
      }
      default:
        super.patch(prop, prev, next);
    }
  }

  updateLayout() {
    super.updateLayout();
    this.updateDraw();
  }

  private updateDraw() {
    this.pixiRef.clear();
    if (this.attrs.roundness) {
      this.pixiRef.roundRect(
        0,
        0,
        this.yogaNode.getComputedWidth(),
        this.yogaNode.getComputedHeight(),
        this.attrs.roundness
      );
    } else {
      this.pixiRef.rect(
        0,
        0,
        this.yogaNode.getComputedWidth(),
        this.yogaNode.getComputedHeight()
      );
    }
    const texture =
      this.texture?.width && this.texture?.height ? this.texture : null;
    if (texture) {
      this.pixiRef.context.fill(texture);
    } else {
      this.pixiRef.context.fill({
        color: this.attrs?.fill,
        texture,
      });
    }
    if (this.attrs.border) {
      // this.pixiRef.context.stroke(this.attrs.borderColor ?? "black");
    }
  }
}
