<template>
  <ScaleComponent :domain="limits" v-slot="{ scales }">
    <g-raw :metaData="scales" :grow="1" :drawFunction="lineDrawFn"> </g-raw>
  </ScaleComponent>
</template>

<script setup lang="ts">
import { Align, FlexDirection, GRaw, GRect } from "#els/appRenderers.ts";
import { ElementInterface } from "#els/renderTypes.ts";
import { computed, reactive, watchEffect } from "vue";
import { interpolateReds, min, ScaleLinear } from "d3";
import ScaleComponent from "../scale/ScaleComponent.vue";
import { ScaleLimits } from "../scale/scaleComposable";

type DataRaw = {
  x: number;
  y: number;
};

const dataRaw: DataRaw[] = [
  { x: 0, y: 0 },
  { x: 1, y: 1 },
  { x: 2, y: 4 },
  { x: 3, y: 9 },
  { x: 4, y: 16 },
];

const limits = computed((): ScaleLimits => {
  const minY = Math.min(...dataRaw.map((bar) => bar.y));
  const maxY = Math.max(...dataRaw.map((bar) => bar.y));
  const minX = Math.min(...dataRaw.map((bar) => bar.x));
  const maxX = Math.max(...dataRaw.map((bar) => bar.x));
  return { minY, maxY, minX, maxX };
});

function lineDrawFn(ctx: CanvasRenderingContext2D, element: ElementInterface) {
  const {
    scaleX,
    scaleY,
  }: {
    scaleX: ScaleLinear<number, number>;
    scaleY: ScaleLinear<number, number>;
  } = element.attrs.metaData;
  console.log(scaleX(0), scaleY(0));
  ctx.beginPath();
  ctx.moveTo(scaleX(dataRaw[0].x), scaleY(dataRaw[0].y));
  dataRaw.slice(1).forEach((value) => {
    const { x, y } = value;
    ctx.lineTo(scaleX(x), scaleY(y));
  });
  ctx.strokeStyle = "black";
  ctx.stroke();
}
</script>
