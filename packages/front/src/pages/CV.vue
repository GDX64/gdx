<template>
  <div class="bg-white min-h-full">
    <CVSimpleVue></CVSimpleVue>
  </div>
</template>

<script lang="ts" setup>
import CVSimpleVue from '../components/CV/CVSimple.vue';
import { provideCV } from '../components/CV/CVStore';
import cvData from '../components/CV/silviaCVData';

provideCV(cvData);
</script>
