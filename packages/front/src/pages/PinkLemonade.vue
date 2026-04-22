<template></template>

<script setup lang="ts">
import { example } from 'pink-lemonade';
import { onUnmounted } from 'vue';

const ctx = example();

const canvas = document.querySelector('canvas')!;
canvas.style.position = 'fixed';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.zIndex = '10';

onUnmounted(() => {
  ctx.destroy();
});
</script>
