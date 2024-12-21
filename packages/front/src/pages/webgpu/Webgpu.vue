<template>
  <canvas
    ref="canvas"
    class="absolute top-0 left-0 h-full w-full"
    @pointermove="updateMousePos($event)"
  ></canvas>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import { useCanvasDPI } from '../../utils/rxjsUtils';
import { start } from '../../webgpu/BallsSimulation';
import { onUnmounted } from 'vue';

const { canvas, canvasPromise } = useCanvasDPI();

const updateMousePos = shallowRef((event: PointerEvent) => {});
const simData = canvasPromise.then((canvas) => {
  const data = start(canvas, 10000);
  updateMousePos.value = data.updateMousePos;
  return data;
});

onUnmounted(async () => {
  const data = await simData;
  data.killed = true;
});
</script>
