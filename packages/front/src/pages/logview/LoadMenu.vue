<template>
  <Dialog v-model:visible="visible" modal header="Files" class="w-[500px]">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col items-start gap-2">
        <div class="flex gap-2">
          <Button @click="addNew">Save</Button>
        </div>
      </div>
      <Listbox
        v-model="selected"
        :options="options"
        optionLabel="name"
        option-value="value"
      >
      </Listbox>

      <div class="flex gap-2">
        <Button @click="loadSelected" :disabled="selected == null"> Load </Button>
        <Button @click="deleteSelected" :disabled="selected == null"> Delete </Button>
      </div>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { LogAnalysis, LogsDatabase } from './LogsDatabase';
import { observableToRef } from '@gdx/utils';
import Dialog from 'primevue/dialog';
import Listbox from 'primevue/listbox';
import Button from 'primevue/button';
import { computed, ref } from 'vue';
import { useToast } from 'primevue/usetoast';

type Option = {
  name: string;
  value: number;
};

const emit = defineEmits({
  load: (file: LogAnalysis) => true,
});

const selected = ref(null as null | number);
const toast = useToast();
const visible = defineModel('visible', { default: false });
const db = new LogsDatabase();
const analysis = observableToRef(db.analysisObserver(), []);

const options = computed(() =>
  analysis.value.map((file): Option => {
    return { name: file.name, value: file.id };
  })
);

async function loadSelected() {
  if (selected.value == null) return;
  console.log(selected.value);
  const analysis = await db.getAnalysis(selected.value);
  if (analysis == null) return;
  toast.add({
    summary: 'Loaded',
    detail: `Loaded ${analysis.name}`,
  });
  emit('load', analysis);
}

function deleteSelected() {
  if (selected.value != null) {
    db.deleteLogAnalysis(selected.value);
  }
}

function addNew() {
  db.addLogAnalysis({
    name: 'newOther',
    endDate: new Date(),
    startDate: new Date(0),
    hightLightedLogIndex: null,
    searchRegex: 'AppStart',
    selectedLogs: new Set(),
    showHistogram: false,
    showLocalTime: true,
    showOnlySelected: false,
    timeOnly: false,
    logFileID: 6,
  });
}
</script>
