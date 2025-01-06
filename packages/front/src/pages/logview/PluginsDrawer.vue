<template>
  <Drawer v-model:visible="visible" header="States" class="!w-[600px]">
    <Tree :value="treeNodes" class="w-full md:w-[30rem]"></Tree>
  </Drawer>
</template>

<script lang="ts" setup>
import Drawer from 'primevue/drawer';
import { LogEssentials, LogStatePlugin } from './LogTypes';
import { ConnectionStatePlugin } from './LogStatePlugins';
import Tree from 'primevue/tree';
import { shallowRef, watch } from 'vue';
import { TreeNode } from 'primevue/treenode';

const props = defineProps<{
  rawLogs: LogEssentials[];
  hightLightedLog: LogEssentials | null;
}>();
const visible = defineModel('visible', { default: false });
const treeNodes = shallowRef<TreeNode[]>([]);

function calcPluginStates(at: LogEssentials) {
  const raw = props.rawLogs;
  const plugins: LogStatePlugin[] = [new ConnectionStatePlugin()];
  for (const log of raw) {
    plugins.forEach((plugin) => {
      plugin.onLog(log);
    });
    if (log.index === at.index) {
      break;
    }
  }
  treeNodes.value = plugins.map((p) => p.format());
}

watch(
  () => props.hightLightedLog,
  (log) => {
    if (log) {
      calcPluginStates(log);
    }
  }
);
</script>
