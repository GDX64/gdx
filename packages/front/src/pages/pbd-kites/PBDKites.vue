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
import PbdRopeExample from './PBDRopeExample.vue';
import FilterResponseExample from './FilterResponseExample.vue';
import { VueComponentWith } from './PBDKites.md';

const VueComponent = VueComponentWith({
  LatexMath,
  PbdRopeExample,
  FilterResponseExample,
});
</script>
