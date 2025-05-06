<script setup lang="ts">
import Test from "./components/LayoutTest.vue";
import RenderWrapper from "./components/RenderWrapper.vue";

const urlQuery = new URLSearchParams(window.location.search);
</script>

<template>
  <RenderWrapper
    style="width: 100vw; height: 100vh; background-color: antiquewhite"
    :renderer="urlQuery.get('renderer') === 'pixi' ? 'pixi' : 'canvas'"
  >
    <Test></Test>
  </RenderWrapper>
</template>
