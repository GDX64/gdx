<script setup lang="ts">
import { RouterView } from 'vue-router';
import Toast from 'primevue/toast';
</script>

<template>
  <Toast></Toast>
  <router-view></router-view>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
