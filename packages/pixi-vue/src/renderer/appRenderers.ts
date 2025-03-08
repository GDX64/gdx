import { Component } from "vue";
import { BasicAttrs } from "./renderTypes";
export { createPixiRoot } from "./pixiBackend/pixirRenderer";
export { createCanvasRoot } from "./canvasBackend/canvasRenderer";

export const GRect = makeComponent("g-rect");
export const GText = makeComponent("g-text");
export const GContainer = makeComponent("g-container");
export const GImage = makeComponent("g-image");

function makeComponent<Attrs = BasicAttrs>(name: string) {
  return name as any as Component<Attrs>;
}
