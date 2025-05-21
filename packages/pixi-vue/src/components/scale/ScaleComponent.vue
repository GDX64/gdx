<template>
  <g-raw
    fill="white"
    :border="1"
    borderColor="#000000"
    @layoutupdate="onLayoutUpdate"
    :drawFunction="drawScale"
  >
    <slot name="default" :scales="scales"> </slot>
  </g-raw>
</template>

<script setup lang="ts">
import { GRaw } from "#els/appRenderers.ts";
import { ScaleLimits, useScales } from "./scaleComposable";
import { ElementInterface } from "#els/renderTypes.ts";

const props = defineProps<{
  domain: ScaleLimits;
  drawXTicks?: boolean;
  drawYTicks?: boolean;
}>();

const { drawScale, size, scales } = useScales(() => props.domain, props);

function onLayoutUpdate(element: ElementInterface) {
  size.width = element.getWidth();
  size.height = element.getHeight();
}
</script>
