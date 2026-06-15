<template>
  <div
    class="latex-math"
    :class="{ 'latex-math-inline': props.inline }"
    v-html="mathml"
  ></div>
</template>

<script setup lang="ts">
import temml from 'temml';
import { computed, type Slots, type VNode, useSlots } from 'vue';

const props = defineProps<{
  inline?: boolean;
}>();

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
    displayMode: false,
    throwOnError: false,
  });
});
</script>

<style>
.latex-math {
  margin-bottom: 20px;
}

.latex-math-inline {
  display: inline;
  margin: 0;
}

.latex-math-inline math {
  margin: 0;
}
</style>
