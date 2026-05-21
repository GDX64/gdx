<template>
  <div class="latex-math" v-html="mathml"></div>
</template>

<script setup lang="ts">
import temml from 'temml';
import { computed, type Slots, type VNode, useSlots } from 'vue';

const slots = useSlots() as Slots;

const latex = computed(() => {
  const slotNodes = slots.default?.() ?? [];
  const text = slotNodes
    .map((node: VNode) => (typeof node.children === 'string' ? node.children : ''))
    .join('');
  return text.trim();
});

const mathml = computed(() => {
  if (!latex.value) {
    return '';
  }

  return temml.renderToString(latex.value, {
    displayMode: true,
    throwOnError: false,
  });
});
</script>

<style scoped>
.latex-math {
  overflow-x: auto;
}
</style>
