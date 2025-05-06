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
import testImg from "../assets/bat.png";
import { reactive } from "vue";
import BarChart from "./BarChart.vue";

const img = new Image();
img.src = testImg;

const orders = reactive(
  [...Array(10)].map((_, i) => {
    return {
      id: i,
      position: i * 20 + 20,
      price: Math.random() * 1000,
    };
  })
);
</script>
