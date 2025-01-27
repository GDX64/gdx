<template>
  <div>
    <Tree
      :value="treeNodes"
      class="!w-full md:w-[30rem] rounded-md !bg-transparent"
    ></Tree>
  </div>
</template>

<script lang="ts" setup>
import { LogEssentials } from './LogTypes';
import Tree from 'primevue/tree';
import { computed, ref } from 'vue';
import { observableToRef } from '../../../../utils/src/misc';
import { loadLogPlugins } from './LogPluginsLoad';
import { useToast } from 'primevue/usetoast';

const toast = useToast();

const props = defineProps<{
  rawLogs: LogEssentials[];
  hightLightedLog: LogEssentials | null;
}>();
const constructors = observableToRef(loadLogPlugins(), []);

function calcPluginStates(at: LogEssentials) {
  const raw = props.rawLogs;
  const plugins = constructors.value.map((c) => new c());
  plugins.forEach((plugin) => {
    try {
      for (const log of raw) {
        plugin.onLog(log);
        if (log.index === at.index) {
          break;
        }
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: `Error on Plugin: ${plugin.constructor.name}`,
        detail: (error as Error).message,
      });
    }
  });
  return plugins.map((p) => p.format());
}

const treeNodes = computed(() => {
  if (props.hightLightedLog) {
    return calcPluginStates(props.hightLightedLog);
  }
  return [];
});
</script>
