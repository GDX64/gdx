<template>
  <div v-html="messageHTML(value)"></div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  value: string;
  search?: string;
}>();

function messageHTML(message: string) {
  if (!props.search) {
    return message;
  }
  const rgx = new RegExp(props.search, 'ig');
  return message.replaceAll(rgx, (match) => {
    return `<span class="log-view-hightlight">${match}</span>`;
  });
}
</script>

<style>
.log-view-hightlight {
  @apply bg-prime-200 rounded-sm;
}
</style>
