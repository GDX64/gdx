<template>
  <ScaleComponent :domain="limits" drawXTicks drawYTicks>
    <LineComponent :data="dataRaw" />
  </ScaleComponent>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScaleComponent from "../scale/ScaleComponent.vue";
import { ScaleLimits } from "../scale/scaleComposable";
import LineComponent from "./LineComponent.vue";

type DataRaw = {
  x: number;
  y: number;
};

const dataRaw: DataRaw[] = [-5, -3, -1, 1, 3, 5].map((x) => {
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
</script>
