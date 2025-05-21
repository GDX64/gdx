import { BasicAttrs, ElementInterface } from "#els/renderTypes.ts";
import { YogaAndAttrs } from "#els/yogaAndAttrs.ts";
import Yoga, { Overflow, Node } from "yoga-layout";

export class CanvasElement<T extends BasicAttrs = BasicAttrs>
  implements ElementInterface<T>
{
  yats: YogaAndAttrs<T>;
  children: CanvasElement[] = [];
  parent: CanvasElement | null = null;
  hovered = false;

  constructor(yats?: YogaAndAttrs<T>) {
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

  updateLayout() {
    this.children.forEach((child) => {
      child.updateLayout();
    });
    this.attrs.onLayoutupdate?.(this);
  }

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
      const { adjustedX, adjustedY } = this.getAdjustedPoint(x, y);
      for (const child of this.children) {
        child.onClick(event, adjustedX, adjustedY);
      }
      this.attrs.onClick?.(event);
    }
  }

  private getAdjustedPoint(x: number, y: number) {
    let adjustedX = x - this.getLeft();
    let adjustedY = y - this.getTop();
    adjustedX = adjustedX / (this.attrs.scaleX ?? 1);
    adjustedY = adjustedY / (this.attrs.scaleY ?? 1);
    return { adjustedX, adjustedY };
  }

  onPointerUp(event: PointerEvent, x: number, y: number) {
    if (this.hitsMe(x, y)) {
      const { adjustedX, adjustedY } = this.getAdjustedPoint(x, y);
      for (const child of this.children) {
        child.onPointerUp(event, adjustedX, adjustedY);
      }
      this.attrs.onPointerup?.(event);
    }
  }

  onPointerDown(event: PointerEvent, x: number, y: number) {
    if (this.hitsMe(x, y)) {
      const { adjustedX, adjustedY } = this.getAdjustedPoint(x, y);
      for (const child of this.children) {
        child.onPointerDown(event, adjustedX, adjustedY);
      }
      this.attrs.onPointerdown?.(event);
    }
  }

  onPointerMove(event: PointerEvent, x: number, y: number): CanvasElement[] {
    if (this.hitsMe(x, y)) {
      const hits: CanvasElement[] = [this];
      const { adjustedX, adjustedY } = this.getAdjustedPoint(x, y);
      for (const child of this.children) {
        const childHits = child.onPointerMove(event, adjustedX, adjustedY);
        hits.push(...childHits);
      }
      this.attrs.onPointermove?.(event);
      return hits;
    }
    return [];
  }

  onPointerEnter(event: PointerEvent) {
    this.hovered = true;
    this.attrs.onPointerenter?.(event);
  }

  onPointerLeave(event: PointerEvent) {
    this.hovered = false;
    this.attrs.onPointerleave?.(event);
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
