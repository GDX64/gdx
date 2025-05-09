<template>
  <ScaleComponent :domain="limits" v-slot="{ scales }" drawXTicks drawYTicks>
    <g-raw :metaData="scales" :grow="1" :drawFunction="lineDrawFn"> </g-raw>
  </ScaleComponent>
</template>

<script setup lang="ts">
import { GRaw } from "#els/appRenderers.ts";
import { ElementInterface } from "#els/renderTypes.ts";
import { computed } from "vue";
import * as d3 from "d3";
import ScaleComponent from "../scale/ScaleComponent.vue";
import { ScaleLimits } from "../scale/scaleComposable";

type DataRaw = {
  x: number;
  y: number;
};

const dataRaw: DataRaw[] = [...Array(10)].map((_, index) => {
  const x = index - 5;
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
    scaleX: d3.ScaleLinear<number, number>;
    scaleY: d3.ScaleLinear<number, number>;
  } = element.attrs.metaData;
  const line = d3
    .line<DataRaw>()
    .x((d) => scaleX(d.x))
    .y((d) => scaleY(d.y))
    .context(ctx);
  line.curve(d3.curveCatmullRom.alpha(1));
  line(dataRaw);
  ctx.strokeStyle = "red";
  ctx.stroke();
  dataRaw.forEach((d) => {
    ctx.beginPath();
    ctx.arc(scaleX(d.x), scaleY(d.y), 3, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  });
}
</script>
