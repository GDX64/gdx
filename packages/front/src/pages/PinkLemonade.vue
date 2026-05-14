<template></template>

<script setup lang="ts">
import { example } from 'pink-lemonade';
import { onUnmounted } from 'vue';

const ctx = example();

onUnmounted(() => {
  ctx.destroy();
});
</script>
