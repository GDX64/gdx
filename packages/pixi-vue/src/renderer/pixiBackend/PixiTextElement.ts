import * as PIXI from "pixi.js";
import { GElement } from "./Elements";

export class PixiTextElement extends GElement {
  pixiRef: PIXI.Text = new PIXI.Text({
    style: {
      fontSize: 16,
    },
  });

  patch(prop: string, prev: any, next: any): void {
    super.patch(prop, prev, next);
    switch (prop) {
      case "text": {
        this.pixiRef.text = next;
        this.updateTextMeasure();
        break;
      }
      case "fontSize": {
        this.pixiRef.style.fontSize = next;
        this.updateTextMeasure();
        break;
      }
      case "fontFamily": {
        this.pixiRef.style.fontFamily;
        this.updateTextMeasure();
      }
      case "fill": {
        this.pixiRef.style.fill = next;
        break;
      }
    }
  }

  private updateTextMeasure() {
    this.yogaNode.setWidth(this.pixiRef.width);
    this.yogaNode.setHeight(this.pixiRef.height);
  }
}
