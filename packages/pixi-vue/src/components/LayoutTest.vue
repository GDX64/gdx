<template>
  <g-container
    height="100%"
    width="100%"
    :justify="Justify.SpaceAround"
    :align="Align.FlexStart"
    :paddingX="30"
  >
    <BarChart />
  </g-container>
</template>

<script setup lang="ts">
import { Align, Justify } from "yoga-layout";
import { GContainer } from "#els/appRenderers.ts";
import BarChart from "./BarChart.vue";
</script>
