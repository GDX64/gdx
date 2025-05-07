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
import { Align, FlexDirection, GRaw, GRect } from "#els/appRenderers.ts";
import { reactive } from "vue";
import { ScaleLimits, useScales } from "./scaleComposable";
import { ElementInterface } from "#els/renderTypes.ts";

const props = defineProps<{
  domain: ScaleLimits;
}>();

const { drawScale, size, scales } = useScales(() => props.domain);

function onLayoutUpdate(element: ElementInterface) {
  size.width = element.getWidth();
  size.height = element.getHeight();
}
</script>
