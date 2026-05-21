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
import { VueComponent } from './GaussianMerge.md';
import GaussianMergeExample from './GaussianMergeExample.ce.vue';
import { defineCustomElement } from 'vue';

const name = 'gaussian-merge-example';
if (!customElements.get(name)) {
  const example = defineCustomElement(GaussianMergeExample);
  customElements.define(name, example);
}
</script>
