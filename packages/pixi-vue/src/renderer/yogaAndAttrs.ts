import { BasicAttrs } from "./renderTypes";
import Yoga, { Edge, Gutter, Node } from "yoga-layout";

export class YogaAndAttrs<T extends BasicAttrs> {
  attrs: Partial<T> = {};
  yogaNode: Node | null = null;

  private constructor() {}

  static withYoga<T extends BasicAttrs>() {
    const yats = new YogaAndAttrs<T>();
    yats.yogaNode = Yoga.Node.create();
    return yats;
  }

  static new<T extends BasicAttrs>() {
    return new YogaAndAttrs<T>();
  }

  patch(_prop: string, prev: any, next: any): void {
    const prop = _prop as keyof BasicAttrs;
    switch (prop) {
      case "width": {
        this.attrs.width = next;
        this.yogaNode?.setWidth(next);
        break;
      }
      case "height": {
        this.attrs.height = next;
        this.yogaNode?.setHeight(next);
        break;
      }
      case "flexDirection": {
        this.attrs.flexDirection = next;
        this.yogaNode?.setFlexDirection(next);
        break;
      }
      case "gap": {
        this.attrs.gap = next;
        this.yogaNode?.setGap(Gutter.All, next);
        break;
      }
      case "gapRow": {
        this.attrs.gapRow = next;
        this.yogaNode?.setGap(Gutter.Row, next);
        break;
      }
      case "gapCol": {
        this.attrs.gapCol = next;
        this.yogaNode?.setGap(Gutter.Column, next);
        break;
      }
      case "padding": {
        this.yogaNode?.setPadding(Yoga.EDGE_ALL, next);
        break;
      }
      case "paddingX": {
        this.yogaNode?.setPadding(Edge.Horizontal, next);
        break;
      }
      case "paddingY": {
        this.yogaNode?.setPadding(Edge.Vertical, next);
        break;
      }
      case "margin": {
        this.yogaNode?.setMargin(Yoga.EDGE_ALL, next);
        break;
      }
      case "display": {
        this.attrs.display = next;
        this.yogaNode?.setDisplay(
          next === "flex" ? Yoga.DISPLAY_FLEX : Yoga.DISPLAY_NONE
        );
        break;
      }
      case "overflow": {
        this.attrs.overflow = next;
        this.yogaNode?.setOverflow(next);
        break;
      }
      case "justify": {
        this.attrs.justify = next;
        this.yogaNode?.setJustifyContent(next);
        break;
      }
      case "align": {
        this.attrs.align = next;
        this.yogaNode?.setAlignItems(next);
        break;
      }
      case "grow": {
        this.attrs.grow = next;
        this.yogaNode?.setFlexGrow(next);
        break;
      }
      case "wrap": {
        this.attrs.wrap = next;
        this.yogaNode?.setFlexWrap(next);
        break;
      }
      case "maxWidth": {
        this.attrs.maxWidth = next;
        this.yogaNode?.setMaxWidth(next);
        break;
      }
      case "maxHeight": {
        this.attrs.maxHeight = next;
        this.yogaNode?.setMaxHeight(next);
        break;
      }
      case "border": {
        this.attrs.border = next;
        this.yogaNode?.setBorder(Yoga.EDGE_ALL, next);
        break;
      }
      case "top": {
        this.yogaNode?.setPosition(Yoga.EDGE_TOP, next);
        break;
      }
      case "left": {
        this.yogaNode?.setPosition(Yoga.EDGE_LEFT, next);
        break;
      }
      case "right": {
        this.yogaNode?.setPosition(Yoga.EDGE_RIGHT, next);
        break;
      }
      case "bottom": {
        this.yogaNode?.setPosition(Yoga.EDGE_BOTTOM, next);
        break;
      }
      case "position": {
        this.yogaNode?.setPositionType(next);
        break;
      }
      default:
        (this.attrs as any)[prop] = next;
    }
  }
}
