<template>
  <Dialog v-model:visible="visible" modal header="Files" class="w-[500px]">
    <div class="flex flex-col gap-4">
      <label>New Rule:</label>
      <div class="grid grid-cols-[min-content_1fr] items-center gap-2">
        <label>Name:</label>
        <InputText v-model="currentRule.name" placeholder="Rule Name"></InputText>
        <label>Regex:</label>
        <InputText v-model="currentRule.regex" placeholder="Rule Regex"></InputText>
        <label for="">Color:</label>
        <Colorpicker
          :model-value="currentRule.color"
          @update:model-value="onColorChange"
          placeholder="Rule Color"
          format="hex"
        />
      </div>
      <label>Rules:</label>
      <Listbox
        @update:model-value="onRuleClick"
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
import Colorpicker from 'primevue/colorpicker';
import { computed, ref } from 'vue';
import { observableToRef } from '@gdx/utils';

const emit = defineEmits({
  load: (file: string) => true,
});

const visible = defineModel('visible', { default: false });
const db = new LogsDatabase();

const currentRule = ref<ColorRule>({
  color: '#f34343',
  name: 'hello',
  regex: '.*',
});

const selectedRule = ref<string>();

const rules = observableToRef(db.colorRulesObserver(), []);
const options = computed(() => {
  return rules.value.map((rule) => {
    return { name: rule.name, value: rule.name };
  });
});

function onRuleClick(rule: string) {
  const ruleObj = rules.value.find((r) => r.name === rule);
  if (ruleObj) {
    currentRule.value = {
      color: ruleObj.color,
      name: ruleObj.name,
      regex: ruleObj.regex,
    };
  }
}

function onColorChange(color: string) {
  currentRule.value.color = `#${color}`;
}

function saveRule() {
  db.saveColorRule(currentRule.value);
}

function deleteRule() {
  if (selectedRule.value) {
    db.deleteColorRule(selectedRule.value);
  }
}
</script>
