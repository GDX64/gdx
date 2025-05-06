import { BasicAttrs } from "#els/renderTypes.ts";
import { YogaAndAttrs } from "#els/yogaAndAttrs.ts";
import Yoga, { Overflow, Node } from "yoga-layout";

export class CanvasElement {
  yats: YogaAndAttrs<BasicAttrs>;
  children: CanvasElement[] = [];
  parent: CanvasElement | null = null;

  constructor(yats?: YogaAndAttrs<BasicAttrs>) {
    if (yats) {
      this.yats = yats;
    } else {
      this.yats = YogaAndAttrs.withYoga();
    }
  }

  static root() {
    return new CanvasElement();
  }

  get yogaNode(): Node | null {
    return this.yats.yogaNode;
  }

  get attrs() {
    return this.yats.attrs;
  }

  getTop() {
    return this.yogaNode?.getComputedTop() ?? 0;
  }

  getLeft() {
    return this.yogaNode?.getComputedLeft() ?? 0;
  }

  getWidth() {
    return this.yogaNode?.getComputedWidth() ?? 0;
  }

  getHeight() {
    return this.yogaNode?.getComputedHeight() ?? 0;
  }

  hide() {
    this.attrs.display = "none";
    this.yogaNode?.setDisplay(Yoga.DISPLAY_NONE);
  }

  addChild(el: CanvasElement) {
    this.children.push(el);
    el.parent = this;
    if (el.yogaNode) {
      this.yogaNode?.insertChild(el.yogaNode, this.yogaNode?.getChildCount());
    }
  }

  addChildAt(el: CanvasElement, index: number) {
    this.children.splice(index, 0, el);
    el.parent = this;
    if (el.yogaNode) {
      this.yogaNode?.insertChild(el.yogaNode, index);
    }
  }

  removeChild(el: CanvasElement) {
    const index = this.children.findIndex((item) => item === el);
    if (index !== -1 && el.yogaNode) {
      this.children.splice(index, 1);
      this.yogaNode?.removeChild(el.yogaNode);
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
    this.yogaNode?.free();
  }

  setText(text: string) {}

  updateLayout() {}

  drawSelf(ctx: CanvasRenderingContext2D) {
    const fillStyle = numberToHexString(this.attrs.fill);
    const border = this.attrs.border;
    if (!fillStyle && !border) {
      return;
    }
    if (fillStyle) {
      ctx.fillStyle = fillStyle;
      ctx.beginPath();
      this.fillPath(ctx);
      ctx.closePath();
      ctx.fill();
    }
    if (border) {
      ctx.strokeStyle = this.attrs.borderColor ?? "black";
      ctx.lineWidth = border;
      ctx.beginPath();
      this.borderPath(ctx);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.closePath();
  }

  private fillPath(ctx: CanvasRenderingContext2D) {
    if (this.attrs.roundness) {
      ctx.roundRect(
        0,
        0,
        this.getWidth(),
        this.getHeight(),
        this.attrs.roundness
      );
    } else {
      ctx.rect(0, 0, this.getWidth(), this.getHeight());
    }
  }

  private borderPath(ctx: CanvasRenderingContext2D) {
    if (this.attrs.roundness) {
      ctx.roundRect(
        0.5,
        0.5,
        this.getWidth() - 1,
        this.getHeight() - 1,
        this.attrs.roundness
      );
    } else {
      ctx.rect(0.5, 0.5, this.getWidth() - 1, this.getHeight() - 1);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.translate(this.getLeft(), this.getTop());
    if (this.attrs.scaleX || this.attrs.scaleY) {
      ctx.scale(this.attrs.scaleX ?? 1, this.attrs.scaleY ?? 1);
    }
    ctx.save();
    this.drawSelf(ctx);
    ctx.restore();
    if (this.attrs.overflow === Overflow.Hidden) {
      ctx.beginPath();
      this.fillPath(ctx);
      ctx.clip();
      ctx.closePath();
    }
    this.children.forEach((child) => {
      child.draw(ctx);
    });
    ctx.restore();
  }

  private hitsMe(x: number, y: number): boolean {
    const top = this.getTop();
    const left = this.getLeft();
    const width = this.getWidth();
    const height = this.getHeight();
    return x >= left && x <= left + width && y >= top && y <= top + height;
  }

  onClick(event: MouseEvent, x: number, y: number) {
    if (this.hitsMe(x, y)) {
      for (const child of this.children) {
        let adjustedX = x - this.getLeft();
        let adjustedY = y - this.getTop();
        child.onClick(event, adjustedX, adjustedY);
      }
      this.attrs.onClick?.(event);
    }
  }

  onPointerUp(event: PointerEvent, x: number, y: number) {
    if (this.hitsMe(x, y)) {
      for (const child of this.children) {
        let adjustedX = x - this.getLeft();
        let adjustedY = y - this.getTop();
        child.onPointerUp(event, adjustedX, adjustedY);
      }
      this.attrs.onPointerUp?.(event);
    }
  }

  onPointerDown(event: PointerEvent, x: number, y: number) {
    if (this.hitsMe(x, y)) {
      for (const child of this.children) {
        let adjustedX = x - this.getLeft();
        let adjustedY = y - this.getTop();
        child.onPointerDown(event, adjustedX, adjustedY);
      }
      this.attrs.onPointerDown?.(event);
    }
  }

  onPointerMove(event: PointerEvent, x: number, y: number): CanvasElement[] {
    if (this.hitsMe(x, y)) {
      const hits: CanvasElement[] = [this];
      for (const child of this.children) {
        let adjustedX = x - this.getLeft();
        let adjustedY = y - this.getTop();
        const childHits = child.onPointerMove(event, adjustedX, adjustedY);
        hits.push(...childHits);
      }
      this.attrs.onPointerMove?.(event);
      return hits;
    }
    return [];
  }

  onPointerEnter(event: PointerEvent) {
    this.attrs.onPointerEnter?.(event);
  }

  onPointerLeave(event: PointerEvent) {
    this.attrs.onPointerLeave?.(event);
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
