<template>
  <canvas
    ref="canvas"
    class="absolute top-0 left-0 h-full w-full"
    @pointermove="updateMousePos($event)"
    @pointerdown="onPointerDown($event)"
    @pointerup="onPointerUp($event)"
  ></canvas>
</template>

<script lang="ts" setup>
import { shallowRef } from 'vue';
import { useCanvasDPI } from '../../utils/rxjsUtils';
import { start } from '../../webgpu/BallsSimulation';
import { onUnmounted } from 'vue';
import { GUI } from 'lil-gui';

const { canvas, canvasPromise } = useCanvasDPI();
const gui = new GUI();
const updateMousePos = shallowRef((event: PointerEvent) => {});
const simData = canvasPromise.then((canvas) => {
  const data = start(canvas, 10000);
  updateMousePos.value = data.updateMousePos;
  gui
    .add({ force: data.forceConstant[0] }, 'force', 0, 3)
    .onChange((v: number) => {
      data.forceConstant[0] = v;
    })
    .name('Repulsion Force');
  return data;
});

function onPointerDown(event: PointerEvent) {
  simData.then((data) => {
    data.mouseDown = true;
  });
}
function onPointerUp(event: PointerEvent) {
  simData.then((data) => {
    data.mouseDown = false;
  });
}

onUnmounted(async () => {
  const data = await simData;
  data.killed = true;
  gui.destroy();
});
</script>
