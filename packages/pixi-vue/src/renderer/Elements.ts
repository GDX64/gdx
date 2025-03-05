import * as PIXI from "pixi.js";
import Yoga, {
  Node,
  FlexDirection,
  Gutter,
  Justify,
  Align,
  Wrap,
} from "yoga-layout";

export enum ElTags {
  TEXT = "g-text",
  RECT = "g-rect",
  GRAPHICS = "g-graphics",
  CONTAINER = "g-container",
  RAW = "g-raw",
  SPRITE = "g-sprite",
  ANIMATED_SPRITE = "g-animated-sprite",
}

export type LayoutBox = {
  width: number;
  height: number;
  x: number;
  y: number;
};

type Percent = `${number}%`;

export type BasicAttrs = {
  fill?: number | string;
  width?: number | "auto" | Percent;
  maxWidth?: number | "auto" | Percent;
  height?: number | "auto" | Percent;
  maxHeight?: number | "auto" | Percent;
  display?: "flex" | "none";
  flexDirection?: FlexDirection;
  justify?: Justify;
  align?: Align;
  gap?: number | Percent;
  padding?: number | Percent;
  margin?: number | Percent;
  grow?: number;
  wrap?: Wrap;
};

export type ELKey = string | number | null;

export class GElement {
  pixiRef: PIXI.Container = new PIXI.Container();
  parent = null as GElement | null;
  children: GElement[] = [];
  yogaNode: Node = Yoga.Node.create();
  attrs: BasicAttrs = {};
  elKey = null as ELKey;

  static root() {
    const nodeRoot = new GElement();
    nodeRoot.yogaNode.free();
    const yogaConfig = Yoga.Config.create();
    yogaConfig.setUseWebDefaults(true);
    const yogaRoot = Yoga.Node.createWithConfig(yogaConfig);
    nodeRoot.yogaNode = yogaRoot;
    nodeRoot.yogaNode.setHeight("100%");
    nodeRoot.yogaNode.setWidth("100%");
    return nodeRoot;
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
      default:
    }
  }

  addChild(child: GElement): void {
    child.parent = this;
    this.children.push(child);
    this.pixiRef.addChild(child.pixiRef);
    this.yogaNode.insertChild(child.yogaNode, this.children.length - 1);
  }

  setText(str: string): void {
    console.log("set text", str);
  }

  addChildAt(child: GElement, index: number): void {
    child.parent = this;
    this.children.splice(index, 0, child);
    this.pixiRef.addChildAt(child.pixiRef, index);
    this.yogaNode.insertChild(child.yogaNode, index);
  }

  updateLayout() {
    if (this.yogaNode.hasNewLayout() || true) {
      this.pixiRef.x = this.yogaNode.getComputedLeft();
      this.pixiRef.y = this.yogaNode.getComputedTop();
      this.children.forEach((child) => child.updateLayout());
      this.yogaNode.markLayoutSeen();
    }
  }

  removeChild(child: GElement): void {
    const index = this.children.findIndex((item) => item === child);
    if (index === -1) return;
    this.children.splice(index, 1);
    this.pixiRef.removeChild(child.pixiRef);
    this.yogaNode.removeChild(child.yogaNode);
  }

  replacePixiChild(oldNode: PIXI.Container, newNode: PIXI.Container): void {
    this.pixiRef.swapChildren(oldNode, newNode);
  }

  destroy(): void {
    this.pixiRef.destroy({ children: true });
    this.yogaNode.freeRecursive();
  }

  hide() {
    this.attrs.display = "none";
    this.pixiRef.visible = false;
    this.yogaNode.setDisplay(Yoga.DISPLAY_NONE);
  }
}
