<template>
  <div class="h-screen w-full flex py-2 px-4 gap-2 overflow-hidden">
    <div class="flex flex-col items-start gap-4 flex-1 overflow-hidden h-full">
      <LoadMenu @load="onFileLoad" v-model:visible="isLoadVisible"></LoadMenu>
      <ColorRulesDialog v-model:visible="isColorRulesVisible"></ColorRulesDialog>
      <CodeEditor v-model:visible="isCodeEditorVisible"></CodeEditor>
      <div class="flex gap-4 items-center justify-start w-full">
        <Button @click="isLoadVisible = true">Load</Button>
        <Button @click="isDrawerVisible = !isDrawerVisible">OpenState</Button>
        <Button @click="isColorRulesVisible = true">Color Rules</Button>
        <Button @click="isCodeEditorVisible = true">Code Editor</Button>
        <div class="flex items-center gap-2">
          <label for="switch1">LocalTime</label>
          <ToggleSwitch inputId="switch1" v-model="showLocalTime"> </ToggleSwitch>
        </div>
        <div class="flex items-center gap-2">
          <label for="switch1">TimeOnly</label>
          <ToggleSwitch inputId="switch1" v-model="timeOnly"> </ToggleSwitch>
        </div>
        <span> ({{ rawLogs.length }} logs) </span>
        <div class="grow bg-prime-400"></div>
        <i
          class="ml-auto pi pi-cog !text-xl cursor-pointer hover:scale-125 transition-all hover:text-prime-600 mr-1"
        ></i>
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
            :style="{ color: log.data.color ?? 'unset' }"
          >
            <div
              @click="onLogSelect(log.data, $event)"
              class="min-w-4 h-4 border border-prime-500 rounded-full cursor-pointer"
              :class="isLogSelected(log.data) ? 'bg-prime-500' : ''"
            ></div>
            <div>{{ formatDate(log.data.date) }}</div>
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
        <div class="flex items-center gap-2">
          <label for="switch1">Histogram</label>
          <ToggleSwitch inputId="switch1" v-model="showHistogram"> </ToggleSwitch>
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
            :style="{ color: log.data.color ?? 'unset' }"
          >
            <div
              @click="onLogSelect(log.data, $event)"
              class="min-w-4 h-4 border border-prime-500 rounded-full cursor-pointer"
              :class="isLogSelected(log.data) ? 'bg-prime-500' : ''"
            ></div>
            <div>{{ formatDate(log.data.date) }}</div>
            <div>{{ log.data.level }}</div>
            <div>{{ log.data.message }}</div>
          </div>
        </div>
      </div>
      <div class="w-full h-32 relative" v-if="showHistogram">
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
    <PluginsDrawer
      v-if="isDrawerVisible"
      class="w-72 h-screen overflow-x-hidden overflow-y-auto border-l border-bg-500"
      :hightLightedLog="hightLightedLog"
      :rawLogs="rawLogs"
    ></PluginsDrawer>
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
import { observableToRef, useUTCAdjustedDate } from '@gdx/utils';
import LoadMenu from './LoadMenu.vue';
import ToggleSwitch from 'primevue/toggleswitch';
import { LogEssentials } from './LogTypes';
import PluginsDrawer from './PluginsDrawer.vue';
import ColorRulesDialog from './ColorRulesDialog.vue';
import CodeEditor from './CodeEditor.vue';

const db = new LogsDatabase();
const searchRegex = ref('');
const isLoadVisible = ref(false);
const isDrawerVisible = ref(false);
const isColorRulesVisible = ref(false);
const isCodeEditorVisible = ref(false);
const selectedLogs = reactive(new Set<number>());
const showOnlySelected = ref(false);
const showHistogram = ref(true);
const showLocalTime = ref(false);
const timeOnly = ref(false);

const hightLightedLog = ref<LogEssentials | null>(null);

const colorRules = observableToRef(db.colorRulesObserver(), []);
const baseFile = ref<string>('');

const startDate = useUTCAdjustedDate(new Date(0));
const endDate = useUTCAdjustedDate(new Date());

const rawLogs = computed<LogEssentials[]>(() => {
  const logs = neloParser(baseFile.value);
  const regexes = colorRules.value.map((rule) => {
    return {
      regex: new RegExp(rule.regex, 'i'),
      color: rule.color,
    };
  });
  logs.forEach((log) => {
    log.color =
      regexes.find((rule) => {
        return rule.regex.test(log.original);
      })?.color ?? null;
  });
  return logs;
});

const timeFilteredLogs = computed(() => {
  const start = startDate.original;
  const end = endDate.original;
  return rawLogs.value.filter((log) => {
    return log.date >= start && log.date <= end;
  });
});

const filteredLogs = computed(() => {
  if (showOnlySelected.value) {
    return [...selectedLogs.values()]
      .sort((a, b) => {
        return a - b;
      })
      .map((index) => {
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

const dateFormatter = computed(() => {
  if (showLocalTime.value) {
    if (timeOnly.value) {
      const intl = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        fractionalSecondDigits: 3,
        hour12: false,
      });
      return (date: Date) => intl.format(date);
    } else {
      const intl = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        fractionalSecondDigits: 3,
        hour12: false,
      });
      return (date: Date) => intl.format(date);
    }
  } else {
    if (timeOnly.value) {
      const intl = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZone: 'UTC',
        fractionalSecondDigits: 3,
      });
      return (date: Date) => intl.format(date);
    } else {
      const intl = new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        fractionalSecondDigits: 3,
        hour12: false,
        timeZone: 'UTC',
      });
      return (date: Date) => intl.format(date);
    }
  }
});

watch(filteredLogs, () => {
  scrollToFiltered(0);
  scrollTo(0);
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
      color: null,
    };
  });
  return logs;
}

function onFileLoad(file: string) {
  baseFile.value = file;
  restartDateSelection();
}

function formatDate(date: Date) {
  return dateFormatter.value(date);
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
    baseFile.value = firstDbLog.content;
  } else {
    baseFile.value = '';
  }
  restartDateSelection();
}
</script>
