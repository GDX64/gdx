<template>
  <div class="">
    <header
      ref="header"
      class="flex justify-between sm:items-start w-full mb-1 flex-col sm:flex-row"
    >
      <div class="font-semibold text-sec-800">{{ main }}</div>
      <div class="text-sm text-sec-700">{{ dateAndPlace }}</div>
    </header>
    <div class="text-sec-800 pl-2 text-justify" ref="descriptionEl" v-if="description">
      •
      <LinkProcess :text="description" class="text-sm"></LinkProcess>
    </div>
  </div>
</template>

<script lang="ts" setup>
import LinkProcess from './LinkProcess';
import { ref } from 'vue';

defineEmits<{
  (event: 'update:main', value: string): void;
  (event: 'update:description', value: string): void;
  (event: 'update:dateAndPlace', value: string): void;
}>();

defineProps<{
  main: string;
  dateAndPlace?: string;
  title?: string;
  description?: string;
}>();
const header = ref<HTMLElement>();
const descriptionEl = ref<HTMLElement>();
</script>
