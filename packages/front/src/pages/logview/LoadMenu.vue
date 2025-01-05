<template>
  <Dialog v-model:visible="visible" modal header="Files" class="w-[500px]">
    <div class="flex flex-col gap-4">
      <div class="flex">
        <FileUpload mode="basic" name="logUpload" @select="upload" />
      </div>
      <Listbox
        v-model="selectedFile"
        :options="options"
        optionLabel="name"
        option-value="value"
      >
      </Listbox>

      <Button @click="loadSelected" :disabled="!selectedFile"> Load </Button>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { LogsDatabase } from './LogsDatabase';
import FileUpload, {
  FileUploadSelectEvent,
  FileUploadUploadEvent,
} from 'primevue/fileupload';
import { observableToRef } from '@gdx/utils';
import Dialog from 'primevue/dialog';
import Listbox from 'primevue/listbox';
import Button from 'primevue/button';
import { computed, ref } from 'vue';

type Option = {
  name: string;
  value: string;
};

const emit = defineEmits({
  load: (file: string) => true,
});

const visible = defineModel('visible', { default: false });
const selectedFile = ref<string>();
const db = new LogsDatabase();
const files = observableToRef(db.filesObserver(), <string[]>[]);

const options = computed(() =>
  files.value.map((file): Option => {
    return { name: file, value: file };
  })
);

async function loadSelected() {
  if (!selectedFile.value) return;
  const fileContent = await db.loadLogFile(selectedFile.value);
  if (!fileContent) return;
  emit('load', fileContent);
  visible.value = false;
}

async function upload(event: FileUploadSelectEvent) {
  const file = [event.files].flat()[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    db.saveLogFile(file.name, content);
  };
  reader.readAsText(file);
}
</script>
