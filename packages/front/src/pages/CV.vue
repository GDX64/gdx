<template>
  <div class="h-full overflow-y-auto bg-white">
    <CVSimpleVue></CVSimpleVue>
  </div>
</template>

<script lang="ts" setup>
import CVSimpleVue from '../components/CV/CVSimple.vue';
import { provideCV } from '../components/CV/CVStore';
import cvData from '../components/CV/silviaCVData';

provideCV(cvData);
</script>
