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
    if (prop.startsWith("on")) {
      (this.attrs as any)[prop] = next;
      return;
    }
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
    ctx.beginPath();
    if (this.attrs.roundness) {
      ctx.roundRect(
        0,
        0,
        this.yogaNode.getComputedWidth(),
        this.yogaNode.getComputedHeight(),
        this.attrs.roundness
      );
    } else {
      ctx.rect(
        0,
        0,
        this.yogaNode.getComputedWidth(),
        this.yogaNode.getComputedHeight()
      );
    }
    ctx.closePath();
    ctx.fill();
    if (this.attrs.border) {
      ctx.strokeStyle = this.attrs.borderColor ?? "black";
      ctx.lineWidth = this.attrs.border;
      ctx.stroke();
    }
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

  private hitsMe(x: number, y: number): boolean {
    const top = this.yogaNode.getComputedTop();
    const left = this.yogaNode.getComputedLeft();
    const width = this.yogaNode.getComputedWidth();
    const height = this.yogaNode.getComputedHeight();
    return x >= left && x <= left + width && y >= top && y <= top + height;
  }

  onClick(event: MouseEvent, x: number, y: number) {
    if (this.hitsMe(x, y)) {
      for (const child of this.children) {
        let adjustedX = x - this.yogaNode.getComputedLeft();
        let adjustedY = y - this.yogaNode.getComputedTop();
        child.onClick(event, adjustedX, adjustedY);
      }
      this.attrs.onClick?.(event);
    }
  }

  protected getFill() {
    return numberToHexString(this.attrs.fill);
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
