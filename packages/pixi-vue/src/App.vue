<script setup lang="ts">
import RenderWrapper from "./components/RenderWrapper.vue";
import BarChart from "./components/BarChart.vue";
import LineChart from "./components/charts/LineChart.vue";
import GraphChart from "./components/charts/GraphChart.vue";

const urlQuery = new URLSearchParams(window.location.search);
</script>

<template>
  <div class="w-full min-h-screen bg-orange-100 p-8 flex flex-col gap-8">
    <RenderWrapper
      class="min-w-[500px] h-[500px]"
      :renderer="urlQuery.get('renderer') === 'pixi' ? 'pixi' : 'canvas'"
    >
      <GraphChart></GraphChart>
    </RenderWrapper>
    <RenderWrapper
      class="min-w-[500px] h-[300px]"
      :renderer="urlQuery.get('renderer') === 'pixi' ? 'pixi' : 'canvas'"
    >
      <BarChart width="100%" height="100%" />
    </RenderWrapper>
    <RenderWrapper
      class="min-w-[500px] h-[300px]"
      :renderer="urlQuery.get('renderer') === 'pixi' ? 'pixi' : 'canvas'"
    >
      <LineChart width="100%" height="100%" />
    </RenderWrapper>
  </div>
</template>
