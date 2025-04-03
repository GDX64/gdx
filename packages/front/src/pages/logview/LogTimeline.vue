<template>
  <canvas
    class="transition-all"
    :class="bins.loading ? 'opacity-50 ' : ''"
    ref="canvas"
    @pointermove="onPointerMove"
    @pointerdown="onPointerDown"
    @pointerleave="onPointerLeave"
    @pointerup="onPointerUp"
  ></canvas>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, watchEffect } from 'vue';
import { LinScale, useCanvasDPI, useComputedGeneratorState, Vec2 } from '@gdx/utils';
import { primeColors } from '../../design/design';

const props = defineProps<{
  dates: { date: Date }[];
  startDate: Date;
  endDate: Date;
  selectedLog?: Date;
  showLocalTime: boolean;
}>();

const emit = defineEmits({
  select: (selection: { startDate: Date; endDate: Date }) => true,
});

const mousePosRef = ref<Vec2 | null>(null);
const selectionStartRef = ref<Vec2 | null>(null);
const timeFormatter = computed(() => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
    //UTC-0
    timeZone: props.showLocalTime ? undefined : 'UTC',
  });
});

const { canvas, size } = useCanvasDPI();

const bins = useComputedGeneratorState(calcbins, {
  arrbins: [],
  binWidth: 0,
  max: 0,
  loading: true,
});

window.addEventListener('pointerup', onPointerUp);
onUnmounted(() => {
  window.removeEventListener('pointerup', onPointerUp);
});

watchEffect(() => {
  drawHistogram();
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
  const { arrbins, binWidth, max } = bins.value;
  const scaleX = LinScale.fromPoints(0, 0, arrbins.length - 1, size.width - binWidth);
  const scaleY = LinScale.fromPoints(0, 0, max, size.height);

  ctx.save();
  ctx.scale(devicePixelRatio, devicePixelRatio);
  ctx.clearRect(0, 0, size.width, size.height);
  const { height } = size;
  ctx.fillStyle = primeColors[500];
  for (let i = 0; i < arrbins.length; i++) {
    const x = scaleX.scale(i);
    let barHeight = scaleY.scale(arrbins[i]);
    if (barHeight != 0) {
      const MIN_HEIGHT = 5;
      barHeight = Math.max(MIN_HEIGHT, barHeight);
    }
    ctx.fillRect(x, height - barHeight, binWidth, barHeight);
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
  ctx.save();
  ctx.fillStyle = primeColors[500];
  ctx.globalAlpha = 0.2;
  ctx.fillRect(xStart, 0, xEnd - xStart, size.height);
  ctx.restore();
}

function drawScalePoint(ctx: CanvasRenderingContext2D, point: Vec2) {
  //draw mouse as a line
  const timeScale = dateScale();
  ctx.save();
  if (point) {
    ctx.strokeStyle = primeColors[900];
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(point.x, 0);
    ctx.lineTo(point.x, size.height);
    ctx.stroke();
    const dateOfMouse = timeScale.invert(point.x);
    const date = new Date(dateOfMouse);
    const isCloseToTheRight = point.x + 100 > size.width;
    if (isCloseToTheRight) {
      ctx.textAlign = 'right';
      ctx.fillText(timeFormatter.value.format(date), point.x - 5, 10);
    } else {
      ctx.fillText(timeFormatter.value.format(date), point.x + 5, 10);
    }
  }
  ctx.restore();
}

function dateScale() {
  return LinScale.fromPoints(
    props.startDate.getTime(),
    0,
    props.endDate.getTime(),
    size.width
  );
}

function* calcbins() {
  const binWidth = 10;
  const bins = Math.ceil(size.width / binWidth);

  const arrbins = new Array(bins).fill(0);
  const scale = dateScale();
  let max = 0;
  let index = 0;
  for (const date of props.dates) {
    index += 1;
    const x = scale.scale(date.date.getTime());
    const bin = Math.floor(x / binWidth);
    arrbins[bin]++;
    max = Math.max(max, arrbins[bin]);
    if (index % 10_000 === 0) {
      yield {
        arrbins,
        binWidth,
        max,
        loading: true,
      };
    }
  }
  yield {
    arrbins,
    binWidth,
    max,
    loading: false,
  };
}
</script>
