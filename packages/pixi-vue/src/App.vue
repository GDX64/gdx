<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import Game from "./components/LayoutTest.vue";
import { createPixiRoot, createCanvasRoot } from "#els/appRenderers.ts";

const canvas = ref<HTMLCanvasElement>();

const urlQuery = new URLSearchParams(window.location.search);

let destroy = () => {};
onMounted(async () => {
  let app;
  if (urlQuery.get("renderer") === "pixi") {
    app = await createPixiRoot(canvas.value!, Game);
  } else {
    app = await createCanvasRoot(canvas.value!, Game);
  }
  destroy = app.destroy;
});

onBeforeUnmount(() => {
  destroy();
});
</script>

<template>
  <div
    style="
      width: 100vw;
      height: 100vh;
      position: relative;
      background-color: antiquewhite;
    "
  >
    <canvas
      ref="canvas"
      style="position: absolute; top: 0; left: 0; width: 100%; height: 100%"
    ></canvas>
  </div>
</template>

<style scoped></style>
