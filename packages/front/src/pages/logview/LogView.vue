<template>
  <div class="flex flex-col items-start gap-4 h-screen py-2 px-4 w-full">
    <PluginsDrawer
      v-model:visible="isDrawerVisible"
      :hightLightedLog="hightLightedLog"
      :rawLogs="rawLogs"
    ></PluginsDrawer>
    <LoadMenu @load="onFileLoad" v-model:visible="isLoadVisible"></LoadMenu>
    <div class="flex gap-4 items-center">
      <Button @click="isLoadVisible = true">Load</Button>
      <Button @click="isDrawerVisible = true">OpenState</Button>
      ({{ rawLogs.length }} logs)
    </div>
    <div
      v-bind="containerProps"
      class="overflow-y-auto h-[300px] w-full border border-prime-600 grow"
    >
      <div class="" v-bind="wrapperProps">
        <div
          class="flex gap-2 whitespace-nowrap h-[25px] items-center px-1"
          v-for="log of list"
          :class="isLogSelected(log.data) ? 'bg-prime-200' : ''"
        >
          <div
            @click="onLogSelect(log.data, $event)"
            class="min-w-4 h-4 border border-prime-500 rounded-full cursor-pointer"
            :class="isLogSelected(log.data) ? 'bg-prime-500' : ''"
          ></div>
          <div>{{ log.data.date.toISOString() }}</div>
          <div>{{ log.data.level }}</div>
          <div>{{ log.data.message }}</div>
        </div>
      </div>
    </div>
    <div class="w-full flex gap-2 flex-wrap items-center">
      <InputText
        class="rounded-md grow min-w-[500px] bg-red-400"
        type="text"
        v-model="searchRegex"
      />
      <div class="">Results {{ filteredLogs.length }}</div>
      <DatePicker
        v-model="startDate.adjusted"
        fluid
        timeOnly
        showSeconds
        inputId="templatedisplay"
        class="w-[100px]"
      ></DatePicker>
      <DatePicker
        v-model="endDate.adjusted"
        fluid
        timeOnly
        showSeconds
        inputId="templatedisplay-2"
        class="w-[100px]"
      ></DatePicker>
      <Button @click="restartDateSelection"> Reset </Button>
      <div class="flex items-center gap-2">
        <label for="switch1">Only Selected</label>
        <ToggleSwitch inputId="switch1" v-model="showOnlySelected"> </ToggleSwitch>
      </div>
    </div>
    <div
      v-bind="filterContainerProps"
      class="overflow-y-auto h-[300px] w-full border border-prime-600"
    >
      <div class="" v-bind="filterWrapperProps">
        <div
          class="flex gap-2 whitespace-nowrap h-[25px] items-center px-1"
          @dblclick="onLogDblClick(log.data)"
          v-for="log of filterList"
        >
          <div
            @click="onLogSelect(log.data, $event)"
            class="min-w-4 h-4 border border-prime-500 rounded-full cursor-pointer"
            :class="isLogSelected(log.data) ? 'bg-prime-500' : ''"
          ></div>
          <div>{{ log.data.date.toISOString() }}</div>
          <div>{{ log.data.level }}</div>
          <div>{{ log.data.message }}</div>
        </div>
      </div>
    </div>
    <div class="w-full h-32 relative">
      <LogTimeline
        class="w-full h-full absolute top-0 left-0"
        :dates="filteredLogs"
        :startDate="timeFilteredLogs[0].date"
        :endDate="timeFilteredLogs[timeFilteredLogs.length - 1].date"
        :selectedLog="hightLightedLog?.date"
        v-if="filteredLogs.length"
        @select="onSelect"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, reactive, ref, shallowRef, watch } from 'vue';
import { useVirtualList } from '@vueuse/core';
import { LogsDatabase } from './LogsDatabase';
import LogTimeline from './LogTimeline.vue';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import { useUTCAdjustedDate } from '@gdx/utils';
import LoadMenu from './LoadMenu.vue';
import ToggleSwitch from 'primevue/toggleswitch';
import { LogEssentials, LogStatePlugin } from './LogTypes';
import { ConnectionStatePlugin } from './LogStatePlugins';
import PluginsDrawer from './PluginsDrawer.vue';

const db = new LogsDatabase();
const rawLogs = shallowRef<LogEssentials[]>([]);
const searchRegex = ref('');
const isLoadVisible = ref(false);
const isDrawerVisible = ref(false);
const selectedLogs = reactive(new Set<number>());
const showOnlySelected = ref(false);
const hightLightedLog = ref<LogEssentials | null>(null);

const startDate = useUTCAdjustedDate(new Date(0));
const endDate = useUTCAdjustedDate(new Date());

const timeFilteredLogs = computed(() => {
  const start = startDate.original;
  const end = endDate.original;
  return rawLogs.value.filter((log) => {
    return log.date >= start && log.date <= end;
  });
});

const filteredLogs = computed(() => {
  if (showOnlySelected.value) {
    return [...selectedLogs.values()].map((index) => {
      return rawLogs.value[index];
    });
  }
  const rgx = new RegExp(searchRegex.value, 'i');
  return timeFilteredLogs.value.filter((log) => {
    return log.original.match(rgx);
  });
});

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
  timeFilteredLogs,
  {
    itemHeight: 25,
  }
);

const {
  list: filterList,
  containerProps: filterContainerProps,
  wrapperProps: filterWrapperProps,
  scrollTo: scrollToFiltered,
} = useVirtualList(filteredLogs, {
  itemHeight: 25,
});

watch(filteredLogs, () => {
  scrollToFiltered(0);
});

loadLogs();

function neloParser(file: string): LogEssentials[] {
  const lines = file.trim().split('\n');
  const logs = lines.map((line, index) => {
    const [date, level, message, val1, val2] = line.split(' | ');
    return {
      date: new Date(date),
      level,
      message: `${message} | ${val1} | ${val2}`,
      original: line,
      index,
    };
  });
  return logs;
}

function onFileLoad(file: string) {
  rawLogs.value = neloParser(file);
  restartDateSelection();
}

function onLogSelect(log: LogEssentials, event: MouseEvent) {
  if (selectedLogs.has(log.index)) {
    selectedLogs.delete(log.index);
  } else {
    selectedLogs.add(log.index);
  }
}

function onLogDblClick(log: LogEssentials) {
  const index = timeFilteredLogs.value.findIndex((l) => l.index === log.index);
  hightLightedLog.value = log;
  if (index === -1) return;
  scrollTo(index);
}

function restartDateSelection() {
  const { minDate, maxDate } = minMaxDates();
  startDate.original = minDate;
  endDate.original = maxDate;
}

function minMaxDates() {
  const minDate = rawLogs.value.reduce((acc, log) => {
    return log.date < acc ? log.date : acc;
  }, new Date());
  const maxDate = rawLogs.value.reduce((acc, log) => {
    return log.date > acc ? log.date : acc;
  }, new Date(0));
  return { minDate, maxDate };
}

function onSelect(selection: { startDate: Date; endDate: Date }) {
  startDate.original = selection.startDate;
  endDate.original = selection.endDate;
}

function isLogSelected(log: LogEssentials) {
  return selectedLogs.has(log.index);
}

async function loadLogs() {
  const firstDbLog = await db.lastFile();
  if (firstDbLog) {
    rawLogs.value = neloParser(firstDbLog.content);
  } else {
    rawLogs.value = [];
  }
  restartDateSelection();
}
</script>
