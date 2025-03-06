import { Component } from "vue";
import { BasicAttrs } from "./renderTypes";
export { createPixiRoot } from "./pixiBackend/pixirRenderer";
export { createCanvasRoot } from "./canvasBackend/canvasRenderer";

declare module "vue" {
  export interface GlobalComponents {
    GRect: Component<BasicAttrs>;
    GText: Component<BasicAttrs>;
    GContainer: Component<BasicAttrs>;
  }
}
