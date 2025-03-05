<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import Game from "./components/LayoutTest.vue";
import { createPixiRoot } from "#els/appRenderers.ts";

const canvas = ref<HTMLCanvasElement>();

let destroy = () => {};
onMounted(async () => {
  const app = await createPixiRoot(canvas.value!, Game);
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
