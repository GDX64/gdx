import {
  createRenderer,
  Component,
  inject,
  onUnmounted,
  reactive,
  h,
} from "vue";
import { CanvasElement } from "./canvasElement";
import { CanvasTextElement } from "./canvasTextElement";
import { CanvasImageElement } from "./CanvasImageElement";

function appRenderer() {
  const { createApp } = createRenderer<CanvasElement, CanvasElement>({
    createComment(text) {
      console.log("createcomment", text);
      const el = new CanvasElement();
      el.hide();
      return el;
    },
    createElement(type, namespace, isCustomizedBuiltIn, vnodeProps) {
      switch (type) {
        case "g-image":
          return new CanvasImageElement();
        case "g-text":
          return new CanvasTextElement();
        case "g-rect":
          return new CanvasElement();
        default:
          return new CanvasElement();
      }
    },
    createText(text) {
      console.log("createText", text);
      const el = new CanvasElement();
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

export async function createCanvasRoot(
  canvas: HTMLCanvasElement,
  comp: Component
): Promise<CreateRootResult> {
  const appData = reactive({ width: 0, height: 0 });
  const app = appRenderer().createApp(() => h(comp));
  const nodeRoot = CanvasElement.root();

  let lastWidth = 0;
  let lastHeight = 0;
  function checkUpdateDims() {
    const { offsetWidth, offsetHeight } = canvas;
    if (offsetWidth !== lastWidth || offsetHeight !== lastHeight) {
      lastWidth = offsetWidth;
      lastHeight = offsetHeight;
      appData.width = offsetWidth;
      appData.height = offsetHeight;
      canvas.width = offsetWidth * devicePixelRatio;
      canvas.height = offsetHeight * devicePixelRatio;
      return true;
    }
    return false;
  }
  checkUpdateDims();

  let isDestroyed = false;
  async function drawLoop() {
    while (true) {
      await raf();
      if (isDestroyed) {
        return;
      }
      if (checkUpdateDims()) {
        appData.width = lastWidth;
        appData.height;
      }
      drawCanvas();
    }
  }

  canvas.addEventListener("click", (e) => {
    nodeRoot.onClick(e, e.offsetX, e.offsetY);
  });

  drawLoop();

  function drawCanvas() {
    const ctx = canvas.getContext("2d")!;
    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(devicePixelRatio, devicePixelRatio);
    if (nodeRoot.yogaNode.isDirty()) {
      nodeRoot.yogaNode.calculateLayout(lastWidth, lastHeight);
      nodeRoot.updateLayout();
    }
    nodeRoot.draw(ctx);
    ctx.restore();
  }

  app.mount(nodeRoot);

  return {
    destroy: () => {
      app.unmount();
      isDestroyed = true;
    },
  };
}

function raf() {
  return new Promise((resolve) => requestAnimationFrame(resolve));
}
