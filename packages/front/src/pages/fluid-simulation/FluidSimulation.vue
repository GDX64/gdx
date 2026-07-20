<template>
  <BackGround>
    <BlogFormat>
      <VueComponent />
    </BlogFormat>
  </BackGround>
</template>

<script lang="ts" setup>
import BlogFormat from '../../components/BlogFormat.vue';
import BackGround from '../BackGround.vue';
import LatexMath from '../../components/LatexMath.vue';
import FluidSimulationExample from './FluidSimulationExample.vue';
import { VueComponentWith } from './FluidSimulation.md';

const VueComponent = VueComponentWith({
  LatexMath,
  FluidSimulationExample,
});
</script>
