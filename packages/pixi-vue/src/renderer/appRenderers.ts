import { Component } from "vue";
import { BasicAttrs } from "./renderTypes";
export { createPixiRoot } from "./pixiBackend/renderer";

declare module "vue" {
  export interface GlobalComponents {
    GRect: Component<BasicAttrs>;
    GContainer: Component<BasicAttrs>;
  }
}
