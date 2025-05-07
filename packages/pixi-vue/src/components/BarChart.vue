<template>
  <ScaleComponent :domain="limits" v-slot="{ scales }">
    <g-rect
      height="100%"
      width="100%"
      :flexDirection="FlexDirection.Row"
      :gap="10"
      :paddingX="scales.scaleX(0) + 30"
      :paddingY="scales.scaleY(0)"
      :align="Align.FlexEnd"
    >
      <g-raw
        v-for="(bar, index) of bars"
        :key="bar.label"
        :metaData="bar"
        :grow="1"
        :height="Math.abs(scales.scaleY(bar.value) - scales.scaleY(0))"
        :fill="hovered.has(index) ? 'red' : bar.color"
        @pointerenter="hovered.add(index)"
        @pointerleave="hovered.delete(index)"
        :drawFunction="barDrawFn"
      >
      </g-raw>
    </g-rect>
  </ScaleComponent>
</template>

<script setup lang="ts">
import { Align, FlexDirection, GRaw, GRect } from "#els/appRenderers.ts";
import { ElementInterface } from "#els/renderTypes.ts";
import { computed, reactive, watchEffect } from "vue";
import { interpolateReds } from "d3";
import ScaleComponent from "./scale/ScaleComponent.vue";

const hovered = reactive(new Set<number>());

type BarData = {
  value: number;
  label: string;
  color?: string;
};

const barsRaw: BarData[] = [
  { value: 131, label: ".ts" },
  { value: 77, label: ".js" },
  { value: 52, label: ".html" },
  { value: 66, label: ".css" },
  { value: 89, label: ".svg" },
];

const limits = computed(() => {
  const minY = 0;
  const maxY = Math.max(...barsRaw.map((bar) => bar.value));
  const minX = 0;
  const maxX = barsRaw.length - 1;
  return { minY, maxY, minX, maxX };
});

const bars = computed(() => {
  return barsRaw.map((bar) => {
    const maxValue = Math.max(...barsRaw.map((b) => b.value));
    return {
      ...bar,
      color: interpolateReds(bar.value / maxValue),
    };
  });
});

const size = reactive({
  width: 800,
  height: 500,
});

function onLayoutUpdate(element: ElementInterface) {
  size.width = element.getWidth();
  size.height = element.getHeight();
}

function barDrawFn(ctx: CanvasRenderingContext2D, element: ElementInterface) {
  ctx.fillStyle = element.attrs.fill?.toString() ?? "white";
  ctx.beginPath();
  ctx.roundRect(0, 0, element.getWidth(), element.getHeight(), 5);
  ctx.closePath();
  ctx.fill();
  const metaData: BarData = element.attrs.metaData;
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    metaData.label,
    element.getWidth() / 2,
    element.getHeight() + 10
  );
}
</script>
