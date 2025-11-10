<template>
  <div>
    <h1 class="text-4xl" @click="onClick">Hello Vue 3!</h1>
    <input type="text" v-model="textValue"></input>
    <div class="">this is the text value: {{ textValue }}</div>
    <div class="">counter: {{  state.list.length }}</div>

    <div class="flex flex-col gap-2" v-for="item of state.list">
      {{ item }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import {  ref } from 'vue';
import { useTest } from './testStore';

const {state, actions} = useTest({
  list: [],
})

// This is a test Vue component for the Vue Bridge package.
const textValue = ref('');
function onClick() {
  actions.updateList();
}
</script>
