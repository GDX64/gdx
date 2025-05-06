<template>
  <g-raw
    fill="white"
    :width="size.width"
    :height="size.height"
    :drawFunction="drawFn"
    :border="1"
    borderColor="#000000"
    :padding="30"
  >
    <g-rect
      height="100%"
      width="100%"
      :flexDirection="FlexDirection.Row"
      :gap="10"
      :paddingX="30"
      :align="Align.FlexEnd"
    >
      <g-rect
        v-for="(bar, index) of bars"
        :height="Math.abs(scales.scaleY.deltaScale(bar.value))"
        :grow="1"
        :fill="hovered.has(index) ? 'red' : bar.color"
        @pointerenter="hovered.add(index)"
        @pointerleave="hovered.delete(index)"
      >
      </g-rect>
    </g-rect>
  </g-raw>
</template>

<script setup lang="ts">
import { Align, FlexDirection, GRaw, GRect } from "#els/appRenderers.ts";
import { ElementInterface } from "#els/renderTypes.ts";
import { LinScale } from "@gdx/utils";
import { computed, reactive, watchEffect } from "vue";
import { interpolateReds, min } from "d3";

const padding = 30;

const hovered = reactive(new Set<number>());

const barsRaw = [
  { value: 5 },
  { value: 6 },
  { value: 8 },
  { value: 3 },
  { value: 2 },
  { value: 21 },
];

function onPointerEnter() {}

const limits = computed(() => {
  const minY = 0;
  const maxY = Math.max(...barsRaw.map((bar) => bar.value));
  const minX = 0;
  const maxX = barsRaw.length - 1;
  return { minY, maxY, minX, maxX };
});

const bars = computed(() => {
  return barsRaw.map((bar) => {
    return {
      ...bar,
      color: interpolateReds(bar.value / 10),
    };
  });
});

const size = reactive({
  width: 800,
  height: 500,
});

const scales = computed(() => {
  const { minY, maxY, minX, maxX } = limits.value;
  const scaleX = LinScale.fromPoints(minX, padding, maxX, size.width - padding);
  const scaleY = LinScale.fromPoints(
    minY,
    size.height - padding,
    maxY,
    padding
  );
  return { scaleX, scaleY };
});

function drawTicks(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const { scaleX, scaleY } = scales.value;
  const { maxX, maxY } = limits.value;
  const ticks = Array.from(Array(maxY), (_, i) => i + 1);

  ticks.forEach((tickValue) => {
    const y = scaleY.scale(tickValue);
    ctx.beginPath();
    ctx.strokeStyle = "black";
    const x0 = scaleX.scale(0);
    ctx.moveTo(x0 - 5, y);
    ctx.lineTo(x0 + 5, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x0 + 5, y);
    ctx.lineTo(scaleX.scale(maxX), y);
    ctx.strokeStyle = "#d7d7d7";
    ctx.stroke();
    ctx.fillStyle = "black";
    ctx.textBaseline = "middle";
    ctx.fillText(tickValue.toString(), x0 - 20, y);
  });
  ctx.restore();
}

function drawFn(ctx: CanvasRenderingContext2D, element: ElementInterface) {
  const { scaleX, scaleY } = scales.value;
  const { minY, maxY, minX, maxX } = limits.value;
  ctx.beginPath();
  ctx.moveTo(scaleX.scale(0), scaleY.scale(0));
  ctx.lineTo(scaleX.scale(0), scaleY.scale(maxY));
  ctx.moveTo(scaleX.scale(0), scaleY.scale(0));
  ctx.lineTo(scaleX.scale(maxX), scaleY.scale(0));
  ctx.stroke();

  drawTicks(ctx);
}
</script>
