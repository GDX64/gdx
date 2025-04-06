<template>
  <Dialog v-model:visible="visible" modal header="New Analysis" class="w-[500px]">
    <div class="flex flex-col gap-4">
      <div class="flex flex-col items-start gap-2">
        <FloatLabel>
          <InputText v-model="analysisName" id="new-analysis-name"></InputText>
          <label for="new-analysis-name">Analysis Name</label>
        </FloatLabel>
      </div>
      <div class="flex gap-2">
        <Button @click="save"> Save </Button>
        <Button @click="cancel"> Cancel </Button>
      </div>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { LogAnalysis, LogsDatabase } from './LogsDatabase';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import FloatLabel from 'primevue/floatlabel';
import Button from 'primevue/button';
import { ref } from 'vue';
import { useToast } from 'primevue/usetoast';

const props = defineProps<{
  file: File;
}>();

const emit = defineEmits({
  load: (file: LogAnalysis) => true,
});

const toast = useToast();
const visible = defineModel('visible', { default: false });
const db = new LogsDatabase();
const analysisName = ref('New Analysis');

async function save() {
  try {
    const fileID = await db.saveRawFile(props.file);
    const analysisID = await db.addLogAnalysis({
      name: analysisName.value,
      endDate: new Date(),
      startDate: new Date(0),
      hightLightedLogIndex: null,
      searchRegex: 'AppStart',
      selectedLogs: new Set(),
      showHistogram: true,
      showLocalTime: true,
      showOnlySelected: false,
      timeOnly: false,
      logFileID: fileID,
      updatedAt: new Date(),
    });

    const finalAnalysis = await db.getAnalysis(analysisID);
    if (finalAnalysis == null) throw new Error('Failed to load analysis after saving it');
    emit('load', finalAnalysis);
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Analysis saved successfully',
      life: 3000,
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to save analysis',
      life: 3000,
    });
  }
}

function cancel() {
  visible.value = false;
}
</script>
