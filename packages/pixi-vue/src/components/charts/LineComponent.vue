<template>
  <g-raw :metaData="scales" :grow="1" :drawFunction="lineDrawFn"> </g-raw>
</template>

<script setup lang="ts">
import { GRaw } from "#els/appRenderers.ts";
import { ElementInterface } from "#els/renderTypes.ts";
import * as d3 from "d3";
import { useInjectScales } from "../scale/scaleComposable";

type DataRaw = {
  x: number;
  y: number;
};

const { scales } = useInjectScales();

const props = defineProps<{ data: DataRaw[] }>();

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
  ctx.beginPath();
  line(props.data);
  ctx.strokeStyle = "red";
  ctx.stroke();

  props.data.forEach((d) => {
    ctx.beginPath();
    ctx.arc(scaleX(d.x), scaleY(d.y), 3, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  });
}
</script>
