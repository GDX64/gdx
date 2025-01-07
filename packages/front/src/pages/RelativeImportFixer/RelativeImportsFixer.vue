<template>
  <div class="flex flex-col w-full gap-4 p-4 min-h-screen">
    <h1>Relative Imports Fixer</h1>
    <InputText v-model="location" placeholder="Location"></InputText>
    <InputText v-model="subpath" placeholder="Subpath"></InputText>
    <InputText v-model="alias" placeholder="Alias"></InputText>
    <TextArea v-model="source" class="max-w-[800px] w-full min-h-52"> </TextArea>
    <div class="w-full border border-prime-700 min-h-[200px] bg-white overflow-x-scroll">
      <pre>{{ transformed }}</pre>
    </div>
  </div>
</template>

<script lang="ts" setup>
import TextArea from 'primevue/textarea';
import { computed, ref, watchEffect } from 'vue';
import { parseFilesImports } from './relativeFixer';
import InputText from 'primevue/inputtext';

const location = ref('');
const source = ref('');
const alias = ref('');
const subpath = ref('');

loadFromLocalStorage();

function saveToLocalStorage() {
  const state = {
    location: location.value,
    source: source.value,
    alias: alias.value,
    subpath: subpath.value,
  };
  localStorage.setItem('relative-import-fixer', JSON.stringify(state));
}

function loadFromLocalStorage() {
  const state = localStorage.getItem('relative-import-fixer');
  if (state) {
    const parsed = JSON.parse(state);
    location.value = parsed.location;
    source.value = parsed.source;
    alias.value = parsed.alias;
    subpath.value = parsed.subpath;
  }
}

watchEffect(() => {
  saveToLocalStorage();
});

const transformed = computed(() => {
  return parseFilesImports(source.value, location.value, subpath.value, alias.value);
});
</script>
