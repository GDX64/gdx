<template>
  <canvas ref="canvas"> </canvas>
</template>

<script lang="ts" setup>
import { watchEffect } from 'vue';
import { LinScale, useCanvasDPI } from '@gdx/utils';
import { primeColors } from '../../design/design';

const props = defineProps<{
  dates: { date: Date }[];
  startDate: Date;
  endDate: Date;
}>();

const { canvas, size } = useCanvasDPI();

function drawHistogram() {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;
  const { arrBeans, beanWidth, max } = calcBeans();
  const scaleX = LinScale.fromPoints(0, 0, arrBeans.length - 1, size.width - beanWidth);
  const scaleY = LinScale.fromPoints(0, 0, max, size.height);

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = primeColors[500];
  for (let i = 0; i < arrBeans.length; i++) {
    const x = scaleX.scale(i);
    let height = scaleY.scale(arrBeans[i]);
    if (height != 0) {
      const MIN_HEIGHT = 5;
      height = Math.max(MIN_HEIGHT, height);
    }
    ctx.fillRect(x, size.height - height, beanWidth, height);
  }
  ctx.restore();
}

function calcBeans() {
  const beanWidth = size.width / 30;
  const beans = Math.floor(size.width / beanWidth);

  const arrBeans = new Array(beans).fill(0);
  const deltaTime = props.endDate.getTime() - props.startDate.getTime();
  const scale = LinScale.fromPoints(
    props.startDate.getTime(),
    0,
    props.endDate.getTime(),
    beans - 1
  );
  let max = 0;
  for (const date of props.dates) {
    const bean = Math.min(beans - 1, Math.floor(scale.scale(date.date.getTime())));
    arrBeans[bean]++;
    max = Math.max(max, arrBeans[bean]);
  }
  console.log({ max, arrBeans, beanWidth, beans, scale, deltaTime });
  return {
    arrBeans,
    beanWidth,
    max,
  };
}

watchEffect(() => {
  drawHistogram();
});
</script>
