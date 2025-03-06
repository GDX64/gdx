import { BasicAttrs } from "#els/renderTypes.ts";
import Yoga, { Gutter, Node } from "yoga-layout";

export class CanvasElement {
  attrs: BasicAttrs = {};
  children: CanvasElement[] = [];
  parent: CanvasElement | null = null;
  yogaNode = Yoga.Node.create();

  static root() {
    return new CanvasElement();
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
    switch (prop) {
      case "width": {
        this.attrs.width = next;
        this.yogaNode.setWidth(next);
        break;
      }
      case "height": {
        this.attrs.height = next;
        this.yogaNode.setHeight(next);
        break;
      }
      case "flexDirection": {
        this.attrs.flexDirection = next;
        this.yogaNode.setFlexDirection(next);
        break;
      }
      case "gap": {
        this.attrs.gap = next;
        this.yogaNode.setGap(Gutter.All, next);
      }
      case "padding": {
        this.yogaNode.setPadding(Yoga.EDGE_ALL, next);
        break;
      }
      case "margin": {
        this.yogaNode.setMargin(Yoga.EDGE_ALL, next);
        break;
      }
      case "display": {
        this.attrs.display = next;
        this.yogaNode.setDisplay(
          next === "flex" ? Yoga.DISPLAY_FLEX : Yoga.DISPLAY_NONE
        );
        break;
      }
      case "justify": {
        this.attrs.justify = next;
        this.yogaNode.setJustifyContent(next);
        break;
      }
      case "align": {
        this.attrs.align = next;
        this.yogaNode.setAlignItems(next);
        break;
      }
      case "grow": {
        this.attrs.grow = next;
        this.yogaNode.setFlexGrow(next);
        break;
      }
      case "wrap": {
        this.attrs.wrap = next;
        this.yogaNode.setFlexWrap(next);
        break;
      }
      case "maxWidth": {
        this.attrs.maxWidth = next;
        this.yogaNode.setMaxWidth(next);
        break;
      }
      case "maxHeight": {
        this.attrs.maxHeight = next;
        this.yogaNode.setMaxHeight(next);
        break;
      }
      case "fill": {
        this.attrs.fill = next;
        break;
      }
      default:
    }
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
