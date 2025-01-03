<template>
  <canvas ref="canvas" class="absolute top-0 left-0 h-full w-full"></canvas>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useCanvasDPI } from '../../utils/rxjsUtils';
import { Renderer } from '@gdx/pink-lemonade';

const { canvas, canvasPromise } = useCanvasDPI();

onMounted(async () => {
  const canvas = await canvasPromise;
  const renderer = await Renderer.new(canvas);
  renderer.render();
});
</script>
