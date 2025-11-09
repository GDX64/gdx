<template>
  <div>
    <h1 class="text-4xl" @click="onClick">Hello Vue 3!</h1>
    <input type="text" v-model="textValue"></input>
    <div class="">this is the text value: {{ textValue }}</div>

    <div class="flex flex-col gap-2" v-for="item of list">
      {{ item }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// This is a test Vue component for the Vue Bridge package.
const list = ref(['item 1']);
const textValue = ref('');
function onClick() {
  list.value.push(`item ${list.value.length + 1}`);
}
</script>
