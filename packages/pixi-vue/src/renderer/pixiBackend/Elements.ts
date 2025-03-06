import { YogaAndAttrs } from "#els/yogaAndAttrs.ts";
import * as PIXI from "pixi.js";
import Yoga from "yoga-layout";

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

export type ELKey = string | number | null;

export class GElement {
  pixiRef: PIXI.Container = new PIXI.Container();
  parent = null as GElement | null;
  children: GElement[] = [];
  yats = new YogaAndAttrs();
  elKey = null as ELKey;

  get yogaNode() {
    return this.yats.yogaNode;
  }

  get attrs() {
    return this.yats.attrs;
  }

  static root() {
    const nodeRoot = new GElement();
    nodeRoot.yogaNode.setHeight("100%");
    nodeRoot.yogaNode.setWidth("100%");
    return nodeRoot;
  }

  patch(prop: string, prev: any, next: any): void {
    this.yats.patch(prop, prev, next);
    switch (prop) {
      case "onClick": {
        this.pixiRef.interactive = true;
        this.pixiRef.onclick = next;
        break;
      }
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
