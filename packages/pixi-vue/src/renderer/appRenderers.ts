import { Component } from "vue";
import { BasicAttrs, CacheElementAttrs, RawElementAttrs } from "./renderTypes";
export { createPixiRoot } from "./pixiBackend/pixirRenderer";
export { createCanvasRoot } from "./canvasBackend/canvasRenderer";

export {
  Align,
  FlexDirection,
  Edge,
  Justify,
  Unit,
  Gutter,
  Overflow,
  PositionType,
} from "yoga-layout";

export const GRect = makeComponent("g-rect");
export const GRaw = makeComponent<RawElementAttrs>("g-raw");
export const GText = makeComponent("g-text");
export const GContainer = makeComponent("g-container");
export const GImage = makeComponent("g-image");
export const GCache = makeComponent<CacheElementAttrs>("g-cache");

function makeComponent<Attrs = BasicAttrs>(name: string) {
  return name as unknown as Component<Attrs>;
}
