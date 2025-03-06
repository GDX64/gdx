import { createRenderer, Component, inject, onUnmounted, reactive } from "vue";
import * as PIXI from "pixi.js";
import { GElement } from "./Elements";
import { GRect } from "./GRect";
import { PixiTextElement } from "./PixiTextElement";

function appRenderer() {
  const { createApp } = createRenderer<GElement, GElement>({
    createComment(text) {
      console.log("createcomment", text);
      const el = new GElement();
      el.hide();
      return el;
    },
    createElement(type, namespace, isCustomizedBuiltIn, vnodeProps) {
      switch (type) {
        case "g-text":
          return new PixiTextElement();
        case "g-rect":
          return new GRect();
        default:
          return new GElement();
      }
    },
    createText(text) {
      console.log("createText", text);
      const el = new GElement();
      el.hide();
      return el;
    },
    insert(el, parent, anchor) {
      const index = parent.children.findIndex((item) => item === anchor);
      if (index === -1) {
        parent.addChild(el);
      } else {
        parent.addChildAt(el, index + 1);
      }
    },
    nextSibling(node) {
      const index = node.parent?.parent?.children.findIndex(
        (item) => item === node
      );
      if (index === -1 || index == null) return null;
      return node.parent?.children[index + 1] ?? null;
    },
    parentNode(node) {
      return node.parent ?? null;
    },
    patchProp(el, key, prevValue, nextValue) {
      el.patch(key, prevValue, nextValue);
    },
    remove(el) {
      el.parent?.removeChild(el);
      el.destroy();
    },
    setElementText(node, text) {
      node.setText(text);
    },
    setText(node, text) {
      node.setText(text);
    },
  });
  return { createApp };
}

export type CreateRootResult = {
  destroy: () => void;
};

export async function createPixiRoot(
  canvas: HTMLCanvasElement,
  comp: Component
): Promise<CreateRootResult> {
  const pApp = new PIXI.Application();
  await pApp.init({
    canvas: canvas,
    resolution: devicePixelRatio,
    resizeTo: canvas.parentElement!,
    antialias: true,
    backgroundAlpha: 0,
    background: "#00000000",
    clearBeforeRender: true,
    powerPreference: "low-power",
    preference: "webgpu",
  });

  const appData = reactive({ width: 0, height: 0 });
  const app = appRenderer().createApp(comp);
  app.provide("pixiApp", pApp).provide("pixiAppData", appData);
  const nodeRoot = GElement.root();
  console.log(nodeRoot);

  let lastWidth = 0;
  let lastHeight = 0;
  function checkUpdateDims() {
    const { width, height } = pApp.screen;
    if (width !== lastWidth || height !== lastHeight) {
      lastWidth = width;
      lastHeight = height;
      appData.width = width;
      appData.height = height;
      pApp.queueResize();
      return true;
    }
    return false;
  }
  checkUpdateDims();
  pApp.ticker.add(
    () => {
      const hasChanged = checkUpdateDims();
      if (nodeRoot.yogaNode.isDirty() || hasChanged) {
        nodeRoot.yogaNode.calculateLayout(lastWidth, lastHeight);
        nodeRoot.updateLayout();
      }
    },
    null,
    PIXI.UPDATE_PRIORITY.INTERACTION
  );

  nodeRoot.pixiRef = pApp.stage;
  app.mount(nodeRoot);

  return {
    destroy: () => {
      app.unmount();
      pApp.stop();
      pApp.renderer.destroy();
    },
  };
}

export function usePixiApp(): PIXI.Application {
  return inject<PIXI.Application>("pixiApp")!;
}

export function usePixiAppData(): { width: number; height: number } {
  return inject<{ width: number; height: number }>("pixiAppData")!;
}

export function usePixiAnimation(fn: (ticker: PIXI.Ticker) => void): void {
  const app = usePixiApp();
  app.ticker.add(fn);
  onUnmounted(() => {
    app.ticker.remove(fn);
  });
}
