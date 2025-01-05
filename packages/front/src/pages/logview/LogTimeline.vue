<template>
  <canvas
    ref="canvas"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
  ></canvas>
</template>

<script lang="ts" setup>
import { ref, watchEffect } from 'vue';
import { LinScale, useCanvasDPI, Vec2 } from '@gdx/utils';
import { primeColors } from '../../design/design';

const props = defineProps<{
  dates: { date: Date }[];
  startDate: Date;
  endDate: Date;
}>();

const emit = defineEmits({
  select: (selection: { startDate: Date; endDate: Date }) => true,
});

const mousePosRef = ref<Vec2 | null>(null);
const selectionStartRef = ref<Vec2 | null>(null);

const { canvas, size } = useCanvasDPI();

function onPointerMove(event: PointerEvent) {
  mousePosRef.value = new Vec2(event.offsetX, event.offsetY);
}

function onPointerLeave() {
  mousePosRef.value = null;
}

function onPointerDown(event: PointerEvent) {
  selectionStartRef.value = new Vec2(event.offsetX, event.offsetY);
}

function onPointerUp(event: PointerEvent) {
  const endPoint = new Vec2(event.offsetX, event.offsetY);
  if (selectionStartRef.value) {
    const start = selectionStartRef.value;
    const startDate = new Date(dateScale().invert(start.x));
    const endDate = new Date(dateScale().invert(endPoint.x));
    emit('select', { startDate, endDate });
  }
  selectionStartRef.value = null;
}

function drawHistogram() {
  const ctx = canvas.value?.getContext('2d');
  if (!ctx) return;
  const { arrBeans, beanWidth, max } = calcBeans();
  const scaleX = LinScale.fromPoints(0, 0, arrBeans.length - 1, size.width - beanWidth);
  const scaleY = LinScale.fromPoints(0, 0, max, size.height);

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, size.width, size.height);
  const { height } = size;
  ctx.fillStyle = primeColors[500];
  for (let i = 0; i < arrBeans.length; i++) {
    const x = scaleX.scale(i);
    let barHeight = scaleY.scale(arrBeans[i]);
    if (barHeight != 0) {
      const MIN_HEIGHT = 5;
      barHeight = Math.max(MIN_HEIGHT, barHeight);
    }
    ctx.fillRect(x, height - barHeight, beanWidth, barHeight);
  }
  if (mousePosRef.value) {
    drawScalePoint(ctx, mousePosRef.value);
  }
  ctx.restore();
}

function drawScalePoint(ctx: CanvasRenderingContext2D, point: Vec2) {
  //draw mouse as a line
  const timeScale = dateScale();
  if (mousePosRef.value) {
    ctx.strokeStyle = primeColors[900];
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(mousePosRef.value.x, 0);
    ctx.lineTo(mousePosRef.value.x, size.height);
    ctx.stroke();
    const dateOfMouse = timeScale.invert(mousePosRef.value.x);
    const date = new Date(dateOfMouse);
    ctx.fillText(date.toISOString(), mousePosRef.value.x + 5, 10);
  }
}

function dateScale() {
  return LinScale.fromPoints(
    props.startDate.getTime(),
    0,
    props.endDate.getTime(),
    size.width
  );
}

function calcBeans() {
  const beanWidth = 10;
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
