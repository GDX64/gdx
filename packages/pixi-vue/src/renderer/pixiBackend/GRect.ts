import { GElement } from "./Elements";
import * as PIXI from "pixi.js";
export class GRect extends GElement {
  pixiRef = new PIXI.Graphics();
  patch(prop: string, prev: any, next: any): void {
    switch (prop) {
      case "fill": {
        this.attrs.fill = next;
        this.updateDraw();
        break;
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
      this.pixiRef
        .roundRect(
          0,
          0,
          this.yogaNode.getComputedWidth(),
          this.yogaNode.getComputedHeight(),
          this.attrs.roundness
        )
        .fill({ color: this.attrs?.fill });
    } else {
      this.pixiRef
        .rect(
          0,
          0,
          this.yogaNode.getComputedWidth(),
          this.yogaNode.getComputedHeight()
        )
        .fill({ color: this.attrs?.fill });
    }
  }
}
