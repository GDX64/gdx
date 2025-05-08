<template>
  <ScaleComponent :domain="limits" v-slot="{ scales }" drawXTicks drawYTicks>
    <g-raw :metaData="scales" :grow="1" :drawFunction="lineDrawFn"> </g-raw>
  </ScaleComponent>
</template>

<script setup lang="ts">
import { GRaw } from "#els/appRenderers.ts";
import { ElementInterface } from "#els/renderTypes.ts";
import { computed } from "vue";
import { ScaleLinear } from "d3";
import ScaleComponent from "../scale/ScaleComponent.vue";
import { ScaleLimits } from "../scale/scaleComposable";

type DataRaw = {
  x: number;
  y: number;
};

const dataRaw: DataRaw[] = [...Array(100)].map((_, index) => {
  const x = index / 10 - 5;
  return {
    x,
    y: x ** 2 * Math.sign(x),
  };
});

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
  ctx.beginPath();
  ctx.moveTo(scaleX(dataRaw[0].x), scaleY(dataRaw[0].y));
  dataRaw.slice(1).forEach((value) => {
    const { x, y } = value;
    ctx.lineTo(scaleX(x), scaleY(y));
  });
  ctx.strokeStyle = "red";
  ctx.stroke();
}
</script>
