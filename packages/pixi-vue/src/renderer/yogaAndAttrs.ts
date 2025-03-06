import { BasicAttrs } from "./renderTypes";
import Yoga, { Gutter } from "yoga-layout";

export class YogaAndAttrs {
  attrs: BasicAttrs = {};
  yogaNode = Yoga.Node.create();

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
}
