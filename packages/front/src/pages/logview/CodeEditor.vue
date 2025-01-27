<template>
  <Dialog v-model:visible="visible">
    <div class="w-[80vw] h-[80vh] overflow-hidden">
      <div class="w-full h-full" ref="editorContainer"></div>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import { startEditor } from './EditorSetup';

const editorContainer = ref<HTMLElement | null>(null);

const visible = defineModel<boolean>('visible');

watch(editorContainer, (container) => {
  if (!container) {
    return;
  }
  const editor = startEditor(container);

  editor.setValue('//Hello World!');
});
</script>
