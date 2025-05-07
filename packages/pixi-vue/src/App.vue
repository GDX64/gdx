<script setup lang="ts">
import RenderWrapper from "./components/RenderWrapper.vue";
import { Align, Justify } from "yoga-layout";
import { GContainer } from "#els/appRenderers.ts";
import BarChart from "./BarChart.vue";

const urlQuery = new URLSearchParams(window.location.search);
</script>

<template>
  <RenderWrapper
    style="width: 100vw; height: 100vh; background-color: antiquewhite"
    :renderer="urlQuery.get('renderer') === 'pixi' ? 'pixi' : 'canvas'"
  >
    <g-container
      height="100%"
      width="100%"
      :justify="Justify.SpaceAround"
      :align="Align.FlexStart"
      :paddingX="30"
    >
      <BarChart />
    </g-container>
  </RenderWrapper>
</template>
