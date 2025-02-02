<template>
  <Dialog v-model:visible="visible" modal header="Files" class="w-[500px]">
    <div class="flex flex-col gap-4">
      <label>New Search:</label>
      <div class="grid grid-cols-[min-content_1fr] items-center gap-2">
        <label>Name:</label>
        <InputText v-model="currentSearch.name" placeholder="Rule Name"></InputText>
        <label>Regex:</label>
        <InputText v-model="currentSearch.regex" placeholder="Rule Regex"></InputText>
      </div>
      <label>Searches:</label>
      <Listbox
        @update:model-value="onRuleClick"
        @item-dblclick="onRuleDblClick($event.value.value)"
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
import { LogsDatabase, LogSearchRegex } from './LogsDatabase';
import Dialog from 'primevue/dialog';
import Listbox from 'primevue/listbox';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { computed, ref } from 'vue';
import { observableToRef } from '@gdx/utils';

const emit = defineEmits({
  load: (regex: string) => true,
});

const visible = defineModel('visible', { default: false });
const db = new LogsDatabase();

const currentSearch = ref<LogSearchRegex>({
  name: 'hello',
  regex: '.*',
});

const selectedRule = ref<string>();

const rules = observableToRef(db.searchObservable(), []);
const options = computed(() => {
  return rules.value.map((rule) => {
    return { name: rule.name, value: rule.name };
  });
});

function onRuleClick(rule: string) {
  const ruleObj = rules.value.find((r) => r.name === rule);
  if (ruleObj) {
    currentSearch.value = {
      name: ruleObj.name,
      regex: ruleObj.regex,
    };
  }
}

function onRuleDblClick(ruleName: string) {
  const rule = rules.value.find((r) => r.name === ruleName);
  if (rule) {
    emit('load', rule.regex);
  }
}

function saveRule() {
  db.saveSearch({ ...currentSearch.value });
}

function deleteRule() {
  if (selectedRule.value) {
    db.deleteSearch(selectedRule.value);
  }
}
</script>
