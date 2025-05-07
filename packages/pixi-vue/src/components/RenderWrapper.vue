<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createPixiRoot, createCanvasRoot } from "#els/appRenderers.ts";

const canvas = ref<HTMLCanvasElement>();
const slots = defineSlots<{
  default(): void;
}>();
const props = defineProps<{
  renderer?: "pixi" | "canvas";
}>();

let destroy = () => {};
onMounted(async () => {
  let app;
  if (props.renderer === "pixi") {
    app = await createPixiRoot(canvas.value!, slots.default);
  } else {
    app = await createCanvasRoot(canvas.value!, slots.default);
  }
  destroy = app.destroy;
});

onBeforeUnmount(() => {
  destroy();
});
</script>

<template>
  <div style="position: relative">
    <canvas
      ref="canvas"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"
    ></canvas>
  </div>
</template>
