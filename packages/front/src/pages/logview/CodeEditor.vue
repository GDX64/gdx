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
          <Button class="w-fit" @click="saveOnDB" :disabled="!hasContentChanged()"
            >Save</Button
          >
          <Button class="w-fit" @click="newPlugin()">New</Button>
          <Button class="w-fit" @click="loadFromDB()">Load</Button>
          <Button class="w-fit" @click="deletePlugin()">Delete</Button>
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
import { useToast } from 'primevue/usetoast';

const db = new LogsDatabase();
const toast = useToast();

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
const currentContent = ref('');
watch(editorContainer, (container, _, clear) => {
  if (!container) {
    return;
  }
  const editor = startEditor(container);
  const removeEvent = editor.onDidChangeModelContent((e) => {
    currentContent.value = editor.getValue();
  });
  editor.setValue(sampleCode());
  editorRef.value = editor;
  clear(() => {
    removeEvent.dispose();
  });
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

async function saveOnDB() {
  if (!editorContainer.value) {
    return;
  }
  await db.savePlugin({
    name: fileName.value,
    code: currentContent.value,
    saveDate: Date.now(),
  });

  toast.add({
    severity: 'success',
    summary: 'Plugin Saved',
  });
}

function loadFromDB(selected = selectedPlugin.value) {
  selectedPlugin.value = selected;
  if (!selected) {
    return;
  }
  const plugin = currentSelectedStored(selected);
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
    let close;
    if (hasContentChanged()) {
      close = window.confirm('Are you sure you want to close?');
    } else {
      close = true;
    }
    if (close) {
      visible.value = value;
    }
  }
}

function currentSelectedStored(name: string = selectedPlugin.value) {
  return currentPlugins.value.find((p) => p.name === selectedPlugin.value);
}

function hasContentChanged() {
  const stored = currentSelectedStored();
  if (!stored) {
    return false;
  }
  return stored.code !== currentContent.value;
}

async function deletePlugin() {
  if (!selectedPlugin.value) {
    return;
  }
  await db.deletePlugin(selectedPlugin.value);
  toast.add({
    severity: 'success',
    summary: 'Plugin Deleted',
  });
}

function newPlugin() {
  fileName.value = 'MyPlugin.js';
  editorRef.value?.setValue(sampleCode());
}
</script>
