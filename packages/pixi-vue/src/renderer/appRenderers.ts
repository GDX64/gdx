import { Component } from "vue";
import { BasicAttrs } from "./renderTypes";
export { createPixiRoot } from "./pixiBackend/pixirRenderer";
export { createCanvasRoot } from "./canvasBackend/canvasRenderer";

export const GRect = "g-rect" as any as Component<BasicAttrs>;
export const GText = "g-text" as any as Component<BasicAttrs>;
export const GContainer = "g-container" as any as Component<BasicAttrs>;
