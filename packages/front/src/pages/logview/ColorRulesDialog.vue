<template>
  <Dialog v-model:visible="visible" modal header="Files" class="w-[500px]">
    <div class="flex flex-col gap-4">
      <label>New Rule:</label>
      <div class="flex flex-col items-start gap-2">
        <InputText v-model="currentRule.name" placeholder="Rule Name"></InputText>
        <InputText v-model="currentRule.regex" placeholder="Rule Regex"></InputText>
        <InputText v-model="currentRule.color" placeholder="Rule Color"></InputText>
      </div>
      <label>Rules:</label>
      <Listbox
        v-model="selectedRule"
        :options="options"
        optionLabel="name"
        option-value="value"
        class="min-h-52 max-h-52"
        scroll-height="200px"
      >
      </Listbox>
      <div class="flex gap-2 justify-end">
        <Button @click="deleteRule">Delete</Button>
        <Button @click="saveRule">Save</Button>
      </div>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { ColorRule, LogsDatabase } from './LogsDatabase';
import Dialog from 'primevue/dialog';
import Listbox from 'primevue/listbox';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { computed, ref, toRaw } from 'vue';
import { observableToRef } from '@gdx/utils';

const emit = defineEmits({
  load: (file: string) => true,
});

const visible = defineModel('visible', { default: false });
const db = new LogsDatabase();

const currentRule = ref<ColorRule>({
  color: '#ff0000',
  name: 'hello',
  regex: '/hello/',
});

const selectedRule = ref<string>();

const rules = observableToRef(db.colorRulesObserver(), []);
const options = computed(() => {
  return rules.value.map((rule) => {
    return { name: rule.name, value: rule.name };
  });
});

function saveRule() {
  db.saveColorRule({ ...currentRule.value });
}

function deleteRule() {
  if (selectedRule.value) {
    db.deleteColorRule(selectedRule.value);
  }
}
</script>
