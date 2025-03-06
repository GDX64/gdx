import { YogaAndAttrs } from "#els/yogaAndAttrs.ts";
import Yoga from "yoga-layout";

export class CanvasElement {
  yats = new YogaAndAttrs();
  children: CanvasElement[] = [];
  parent: CanvasElement | null = null;

  static root() {
    return new CanvasElement();
  }

  get yogaNode() {
    return this.yats.yogaNode;
  }

  get attrs() {
    return this.yats.attrs;
  }

  hide() {
    this.attrs.display = "none";
    this.yogaNode.setDisplay(Yoga.DISPLAY_NONE);
  }

  addChild(el: CanvasElement) {
    this.children.push(el);
    el.parent = this;
    this.yogaNode.insertChild(el.yogaNode, this.yogaNode.getChildCount());
  }

  addChildAt(el: CanvasElement, index: number) {
    this.children.splice(index, 0, el);
    el.parent = this;
    this.yogaNode.insertChild(el.yogaNode, index);
  }

  removeChild(el: CanvasElement) {
    const index = this.children.findIndex((item) => item === el);
    if (index !== -1) {
      this.children.splice(index, 1);
      this.yogaNode.removeChild(el.yogaNode);
    }
  }

  patch(prop: string, prev: any, next: any): void {
    this.yats.patch(prop, prev, next);
  }

  destroy() {
    this.yogaNode.free();
  }

  setText(text: string) {}

  updateLayout() {}

  drawSelf(ctx: CanvasRenderingContext2D) {
    const fillStyle = numberToHexString(this.attrs.fill);
    if (!fillStyle) {
      return;
    }
    ctx.fillStyle = fillStyle;
    ctx.fillRect(
      0,
      0,
      this.yogaNode.getComputedWidth(),
      this.yogaNode.getComputedHeight()
    );
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(
      this.yogaNode.getComputedLeft(),
      this.yogaNode.getComputedTop()
    );
    ctx.save();
    this.drawSelf(ctx);
    ctx.restore();
    this.children.forEach((child) => {
      child.draw(ctx);
    });
    ctx.restore();
  }
}

function numberToHexString(num: number | string | undefined) {
  if (typeof num === "string") {
    return num;
  }
  if (num == null) {
    return null;
  }
  return `#${num.toString(16).padStart(6, "0")}`;
}
