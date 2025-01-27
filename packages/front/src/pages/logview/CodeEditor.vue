<template>
  <Dialog
    :visible="visible"
    @update:visible="onVisibleChange"
    header="Plugin Editor"
    :block-scroll="true"
    maximizable
  >
    <div class="w-[800px] h-[500px] overflow-hidden flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex gap-2 items-center">
          <label>File Name</label>
          <InputText v-model="fileName"></InputText>
          <Button class="w-fit" @click="saveOnDB">Save</Button>
          <Button class="w-fit" @click="loadFromDB()">Load</Button>
        </div>
      </div>
      <Listbox
        v-model:model-value="selectedPlugin"
        :options="options"
        optionLabel="name"
        option-value="value"
        class="min-h-32 max-h-32"
        scroll-height="200px"
        @item-dblclick="loadFromDB($event.value.value)"
      >
      </Listbox>
      <div class="w-full grow pt-4 overflow-hidden" ref="editorContainer"></div>
    </div>
  </Dialog>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, watch } from 'vue';
import Dialog from 'primevue/dialog';
import { startEditor } from './EditorSetup';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Listbox from 'primevue/listbox';
import { LogsDatabase } from './LogsDatabase';
import * as monaco from 'monaco-editor';
import { observableToRef } from '../../../../utils/src/misc';

const db = new LogsDatabase();

const currentPlugins = observableToRef(db.pluginsObserver(), []);
const options = computed(() => {
  return currentPlugins.value.map((plugin) => {
    return { name: plugin.name, value: plugin.name };
  });
});
const selectedPlugin = ref<string>('');
const editorContainer = ref<HTMLElement | null>(null);

const visible = defineModel<boolean>('visible');
const fileName = ref('MyPlugin.js');
const editorRef = shallowRef<monaco.editor.IStandaloneCodeEditor>();
watch(editorContainer, (container) => {
  if (!container) {
    return;
  }
  const editor = startEditor(container);
  editor.setValue(sampleCode());
  editorRef.value = editor;
});

function sampleCode() {
  return `export default class LastOpenPlugin {
   lastOpen = new Date(0)
	
	/**
	 * @param {{ date: Date;
  	original: string;
  	level: string;
  	message: string;
  	index: number;
  	color: string | null}} log
	 */
  onLog(log) {
		if(log.level === 'ProductOpen'){
			this.lastOpen = log.date
		}
  }

  format() {
    
    return {
      key: 'opening',
      label: \`last open at \${this.lastOpen.toTimeString()}\`,
      children: [],
    };
  }
}
  `;
}

function saveOnDB() {
  if (!editorContainer.value) {
    return;
  }
  const code = editorRef.value?.getValue();
  if (!code) {
    return;
  }
  db.savePlugin({
    name: fileName.value,
    code,
    saveDate: Date.now(),
  });
}

function loadFromDB(selected = selectedPlugin.value) {
  console.log(selected);
  if (!selected) {
    return;
  }
  const plugin = currentPlugins.value.find((p) => p.name === selected);
  if (!plugin) {
    return;
  }
  fileName.value = plugin.name;
  editorRef.value?.setValue(plugin.code);
}

function onVisibleChange(value: boolean) {
  if (value) {
    visible.value = value;
  } else {
    const close = window.confirm('Are you sure you want to close?');
    if (close) {
      visible.value = value;
    }
  }
}
</script>
