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
import { CanvasCacheElement } from "./CanvasCacheElement";
import { CanvasRawElement } from "./CanvasRawElement";

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
        case "g-cache": {
          return new CanvasCacheElement();
        }
        case "g-raw": {
          return new CanvasRawElement();
        }
        default:
          return new CanvasElement();
      }
    },
    createText(text) {
      const el = new CanvasElement();
      el.hide();
      return el;
    },
    insert(el, parent, anchor) {
      const index = parent.children.findIndex((item) => item === anchor);
      if (index === -1) {
        parent.addChild(el);
      } else {
        parent.addChildAt(el, index - 1);
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
      const dimsUpdated = checkUpdateDims();
      if (dimsUpdated) {
        appData.width = lastWidth;
        appData.height;
      }
      if (nodeRoot.yogaNode?.isDirty() || dimsUpdated) {
        nodeRoot.yogaNode?.calculateLayout(lastWidth, lastHeight);
        nodeRoot.updateLayout();
      }
      const ctx = canvas.getContext("2d")!;
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(devicePixelRatio, devicePixelRatio);
      nodeRoot.draw(ctx);
      ctx.restore();
    }
  }

  canvas.addEventListener("click", (e) => {
    nodeRoot.onClick(e, e.offsetX, e.offsetY);
  });

  let lastHits: CanvasElement[] = [];
  canvas.addEventListener("pointermove", (e) => {
    const hitsNow = nodeRoot.onPointerMove(e, e.offsetX, e.offsetY);
    const newHits = hitsNow.filter((item) => !lastHits.includes(item));
    const oldHits = lastHits.filter((item) => !hitsNow.includes(item));
    lastHits = hitsNow;
    newHits.forEach((item) => item.onPointerEnter?.(e));
    oldHits.forEach((item) => item.onPointerLeave?.(e));
  });

  canvas.addEventListener("pointerdown", (e) => {
    nodeRoot.onPointerDown(e, e.offsetX, e.offsetY);
  });

  canvas.addEventListener("pointerup", (e) => {
    nodeRoot.onPointerUp(e, e.offsetX, e.offsetY);
  });

  drawLoop();

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
