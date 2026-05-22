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
import GaussianMergeExample from './GaussianMergeExample.vue';
import { VueComponentWith } from './GaussianMerge.md';

const VueComponent = VueComponentWith({
  LatexMath,
  GaussianMergeExample,
});
</script>
