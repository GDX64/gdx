import * as PIXI from "pixi.js";
import Yoga, { Node } from "yoga-layout";

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

export type BasicAttrs = {
  fill?: number | string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  alpha?: number;
  blendMode?: PIXI.BLEND_MODES;
  scale?: number;
};

export type ELKey = string | number | null;

export class GElement {
  pixiRef: PIXI.Container = new PIXI.Container();
  parent = null as GElement | null;
  children: GElement[] = [];
  yogaNode: Node = Yoga.Node.create();
  attrs: BasicAttrs = {};
  elKey = null as ELKey;

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
    this.pixiRef.x = this.yogaNode.getComputedLeft();
    this.pixiRef.y = this.yogaNode.getComputedTop();
    this.pixiRef.width = this.yogaNode.getComputedWidth();
    this.pixiRef.height = this.yogaNode.getComputedHeight();
    this.children.forEach((child) => child.updateLayout());
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
}
