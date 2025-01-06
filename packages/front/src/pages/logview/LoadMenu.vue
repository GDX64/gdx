<template>
  <Dialog v-model:visible="visible" modal header="Files" class="w-[500px]">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col items-start gap-2">
        <FileUpload mode="basic" name="logUpload" @select="upload" />
        <div class="flex gap-2">
          <InputText v-model="fileName" placeholder="file name"></InputText>
          <Button @click="saveFile">Save</Button>
        </div>
      </div>
      <Listbox
        v-model="selectedFile"
        :options="options"
        optionLabel="name"
        option-value="value"
      >
      </Listbox>

      <div class="flex gap-2">
        <Button @click="loadSelected" :disabled="!selectedFile"> Load </Button>
        <Button @click="deleteSelected" :disabled="!selectedFile"> Delete </Button>
      </div>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { LogsDatabase } from './LogsDatabase';
import FileUpload, { FileUploadSelectEvent } from 'primevue/fileupload';
import { observableToRef } from '@gdx/utils';
import Dialog from 'primevue/dialog';
import Listbox from 'primevue/listbox';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
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

const fileName = ref<string>('');
const uploadedFile = ref<File | null>(null);

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

function deleteSelected() {
  if (!selectedFile.value) return;
  db.deleteFile(selectedFile.value);
}

function saveFile() {
  const file = uploadedFile.value;
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    db.saveLogFile(fileName.value, content);
  };
  reader.readAsText(file);
}

async function upload(event: FileUploadSelectEvent) {
  const file = [event.files].flat()[0];
  uploadedFile.value = file;
  fileName.value = file.name;
}
</script>
