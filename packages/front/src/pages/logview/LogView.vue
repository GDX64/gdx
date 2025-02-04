<template>
  <div
    class="h-screen w-full flex py-2 px-4 gap-2 overflow-hidden"
    @drop.stop.prevent.capture="onDrop"
    @drag.stop.prevent.capture
    @dragover.stop.prevent.capture=""
  >
    <div class="flex flex-col items-start gap-1 flex-1 overflow-hidden h-full">
      <LoadMenu @load="onFileLoad" v-model:visible="isLoadVisible"></LoadMenu>
      <ColorRulesDialog v-model:visible="isColorRulesVisible"></ColorRulesDialog>
      <CodeEditor v-model:visible="isCodeEditorVisible"></CodeEditor>
      <SearchDialog
        v-model:visible="isSearchEditorVisible"
        @load="onLoadSeach"
      ></SearchDialog>
      <div class="flex gap-4 items-center justify-start w-full">
        <Button @click="isLoadVisible = true">Load</Button>
        <Button @click="isDrawerVisible = !isDrawerVisible">Plugins</Button>
        <Button @click="isColorRulesVisible = true">Color Rules</Button>
        <Button @click="isSearchEditorVisible = true">Searches</Button>
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
      <LogWindow
        ref="timeFilteredLogsRef"
        class="grow"
        :time-only="timeOnly"
        :logs="timeFilteredLogs"
        :showLocalTime="showLocalTime"
        :selectedLogs="selectedLogs"
        :search="searchRegex"
      ></LogWindow>
      <div
        class="h-1 bg-prime-400 transition-all rounded-md"
        :style="{ width: progress * 100 + '%' }"
      ></div>
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
      <LogWindow
        ref="filteredLogsRef"
        @on-line-dbl-click="onLogDblClick"
        :logs="filteredLogs"
        :selected-logs="selectedLogs"
        :show-local-time="showLocalTime"
        :time-only="timeOnly"
        :search="searchRegex"
        :resize="true"
      ></LogWindow>
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
import { LogsDatabase } from './LogsDatabase';
import LogTimeline from './LogTimeline.vue';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import { observableToRef, useComputedGenerator, useUTCAdjustedDate } from '@gdx/utils';
import LoadMenu from './LoadMenu.vue';
import ToggleSwitch from 'primevue/toggleswitch';
import { LogEssentials } from './LogTypes';
import PluginsDrawer from './PluginsDrawer.vue';
import ColorRulesDialog from './ColorRulesDialog.vue';
import CodeEditor from './CodeEditor.vue';
import LogWindow from './LogWindow.vue';
import SearchDialog from './SearchDialog.vue';

const db = new LogsDatabase();
const searchRegex = ref('');
const isLoadVisible = ref(false);
const isDrawerVisible = ref(false);
const isSearchEditorVisible = ref(false);
const isColorRulesVisible = ref(false);
const isCodeEditorVisible = ref(false);
const selectedLogs = reactive(new Set<number>());
const showOnlySelected = ref(false);
const showHistogram = ref(true);
const showLocalTime = ref(true);
const timeOnly = ref(true);

const timeFilteredLogsRef = shallowRef<InstanceType<typeof LogWindow>>();
const filteredLogsRef = shallowRef<InstanceType<typeof LogWindow>>();

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

const { comp: filteredLogs, progress } = useComputedGenerator(function* () {
  if (showOnlySelected.value) {
    yield 1;
    return [...selectedLogs.values()]
      .sort((a, b) => {
        return a - b;
      })
      .map((index) => {
        return rawLogs.value[index];
      });
  }
  if (!searchRegex.value) {
    yield 1;
    return timeFilteredLogs.value;
  }
  const filtered: LogEssentials[] = [];
  const rgx = new RegExp(searchRegex.value, 'i');

  const length = timeFilteredLogs.value.length;
  const logsArr = timeFilteredLogs.value;
  for (let i = 0; i < length; i++) {
    const log = logsArr[i];
    if (log.original.match(rgx)) {
      filtered.push(log);
    }
    if (i % 30_000 === 0) {
      yield i / length;
    }
  }
  yield 1;
  return filtered;
}, []);

function onLogDblClick(log: LogEssentials) {
  const index = timeFilteredLogs.value.findIndex((l) => l.index === log.index);
  hightLightedLog.value = log;
  if (index === -1) return;
  timeFilteredLogsRef.value?.scrollTo(index);
}

watch(filteredLogs, () => {
  filteredLogsRef.value?.scrollTo(0);
  timeFilteredLogsRef.value?.scrollTo(0);
});

loadLogs();

function onLoadSeach(regex: string) {
  console.log('loading', regex);
  searchRegex.value = regex;
}

function neloParser(file: string): LogEssentials[] {
  const lines = file.trim().split('\n');
  const logs = lines.map((line, index) => {
    const firsPipeIndex = line.indexOf('|');
    const secondPipeIndex = line.indexOf('|', firsPipeIndex + 1);
    const date = line.slice(0, firsPipeIndex).trim();
    const level = line.slice(firsPipeIndex + 1, secondPipeIndex).trim();
    const message = line.slice(secondPipeIndex + 1).trim();
    return {
      date: new Date(date),
      level,
      message,
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

async function loadLogs(name?: string) {
  let logFile;
  if (name) {
    logFile = await db.loadLogFile(name);
  } else {
    logFile = await db.lastFile();
  }
  if (logFile) {
    baseFile.value = logFile.content;
  } else {
    baseFile.value = '';
  }
  restartDateSelection();
}

async function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file) {
    await db.saveRawFile(file);
    loadLogs(file.name);
  }
}
</script>
