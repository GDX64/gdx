<template>
  <canvas
    ref="canvas"
    @pointermove="onPointerMove"
    @pointerdown="onPointerDown"
    @pointerleave="onPointerLeave"
    @pointerup="onPointerUp"
  ></canvas>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, watchEffect } from 'vue';
import { LinScale, useCanvasDPI, Vec2 } from '@gdx/utils';
import { primeColors } from '../../design/design';

const props = defineProps<{
  dates: { date: Date }[];
  startDate: Date;
  endDate: Date;
  selectedLog?: Date;
}>();

const emit = defineEmits({
  select: (selection: { startDate: Date; endDate: Date }) => true,
});

const mousePosRef = ref<Vec2 | null>(null);
const selectionStartRef = ref<Vec2 | null>(null);
const formatTime = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
  //UTC-0
  timeZone: 'UTC',
});

const { canvas, size } = useCanvasDPI();
window.addEventListener('pointerup', onPointerUp);
onUnmounted(() => {
  window.removeEventListener('pointerup', onPointerUp);
});

function onPointerLeave() {
  if (!selectionStartRef.value) {
    mousePosRef.value = null;
  }
}

function onPointerMove(event: PointerEvent) {
  mousePosRef.value = new Vec2(event.offsetX, event.offsetY);
}

function onPointerDown(event: PointerEvent) {
  selectionStartRef.value = new Vec2(event.offsetX, event.offsetY);
}

function onPointerUp(event: PointerEvent) {
  if (selectionStartRef.value) {
    const startX = Math.min(selectionStartRef.value?.x ?? 0, mousePosRef.value?.x ?? 0);
    const endX = Math.max(selectionStartRef.value?.x ?? 0, mousePosRef.value?.x ?? 0);
    const startDate = new Date(dateScale().invert(startX));
    const endDate = new Date(dateScale().invert(endX));
    emit('select', { startDate, endDate });
  }
  selectionStartRef.value = null;
  mousePosRef.value = null;
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
  if (selectionStartRef.value) {
    drawScalePoint(ctx, selectionStartRef.value);
  }
  if (mousePosRef.value && selectionStartRef.value) {
    drawSelectRect(ctx, selectionStartRef.value, mousePosRef.value);
  }
  if (props.selectedLog) {
    const selectedLogX = dateScale().scale(props.selectedLog.getTime());
    const point = new Vec2(selectedLogX, 0);
    drawScalePoint(ctx, point);
  }
  ctx.restore();
}

function drawSelectRect(ctx: CanvasRenderingContext2D, start: Vec2, end: Vec2) {
  const xStart = Math.min(start.x, end.x);
  const xEnd = Math.max(start.x, end.x);
  ctx.fillStyle = primeColors[500];
  ctx.globalAlpha = 0.5;
  ctx.fillRect(xStart, 0, xEnd - xStart, size.height);
}

function drawScalePoint(ctx: CanvasRenderingContext2D, point: Vec2) {
  //draw mouse as a line
  const timeScale = dateScale();
  if (point) {
    ctx.strokeStyle = primeColors[900];
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(point.x, 0);
    ctx.lineTo(point.x, size.height);
    ctx.stroke();
    const dateOfMouse = timeScale.invert(point.x);
    const date = new Date(dateOfMouse);
    ctx.fillText(formatTime.format(date), point.x + 5, 10);
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
