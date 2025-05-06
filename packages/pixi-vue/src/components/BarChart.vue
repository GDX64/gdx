<template>
  <g-raw fill="pink" :width="100" :height="100" :drawFunction="drawFn"> </g-raw>
</template>

<script setup lang="ts">
import { GRaw } from "#els/appRenderers.ts";
import { ElementInterface } from "#els/renderTypes.ts";

function drawFn(ctx: CanvasRenderingContext2D, element: ElementInterface) {
  const w = element.getWidth();
  const h = element.getHeight();
  if (element.hovered) {
    ctx.fillStyle = "red";
  }
  ctx.fillRect(0, 0, w / 2, h / 2);
}
</script>
