<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { createRoot } from "./renderer/renderer";
import Game from "./components/Game.vue";

const canvas = ref<HTMLCanvasElement>();

let destroy = () => {};
onMounted(async () => {
  const app = await createRoot(canvas.value!, Game);
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
