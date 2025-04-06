<template>
  <div
    class="h-screen w-full flex py-2 px-4 gap-2 overflow-hidden"
    @drop.stop.prevent.capture="onDrop"
    @drag.stop.prevent.capture
    @dragover.stop.prevent.capture=""
  >
    <div class="flex flex-col items-start gap-1 flex-1 overflow-hidden h-full">
      <LoadMenu @load="onAnalysisLoaded" v-model:visible="isLoadVisible"></LoadMenu>
      <NewAnalysisMenu
        v-if="currentFile"
        :file="currentFile"
        @load="onAnalysisLoaded"
        v-model:visible="isNewAnalysisVisible"
      ></NewAnalysisMenu>
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
          <ToggleSwitch inputId="switch1" v-model="analysis.showLocalTime">
          </ToggleSwitch>
        </div>
        <div class="flex items-center gap-2">
          <label for="switch1">TimeOnly</label>
          <ToggleSwitch inputId="switch1" v-model="analysis.timeOnly"> </ToggleSwitch>
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
        :time-only="analysis.timeOnly"
        :logs="timeFilteredLogs"
        :showLocalTime="analysis.showLocalTime"
        :selectedLogs="analysis.selectedLogs"
        :hightLightedLog="hightLightedLog ?? undefined"
        :search="analysis.searchRegex"
        @on-line-dbl-click="onLogDblClick"
        @on-line-click="onLogClick"
      ></LogWindow>
      <div class="w-full flex gap-2 flex-wrap items-center">
        <InputText
          class="rounded-md grow min-w-[500px] bg-red-400"
          type="text"
          v-model="analysis.searchRegex"
        />
        <div class="">Results {{ filteredLogs.length }}</div>
        <DatePicker
          v-model="analysis.startDate.adjusted"
          fluid
          timeOnly
          showSeconds
          inputId="templatedisplay"
          class="w-[100px]"
        ></DatePicker>
        <DatePicker
          v-model="analysis.endDate.adjusted"
          fluid
          timeOnly
          showSeconds
          inputId="templatedisplay-2"
          class="w-[100px]"
        ></DatePicker>
        <Button @click="restartDateSelection"> Reset </Button>
        <div class="flex items-center gap-2">
          <label for="switch1">Only Selected</label>
          <ToggleSwitch inputId="switch1" v-model="analysis.showOnlySelected">
          </ToggleSwitch>
        </div>
        <div class="flex items-center gap-2">
          <label for="switch1">Histogram</label>
          <ToggleSwitch inputId="switch1" v-model="analysis.showHistogram">
          </ToggleSwitch>
        </div>
      </div>
      <LogWindow
        class="transition-opacity"
        :class="progress < 1 ? 'opacity-75' : ''"
        ref="filteredLogsRef"
        @on-line-dbl-click="onLogDblClick"
        @on-line-click="onLogClick"
        :logs="filteredLogs"
        :selected-logs="analysis.selectedLogs"
        :show-local-time="analysis.showLocalTime"
        :hightLightedLog="hightLightedLog ?? undefined"
        :time-only="analysis.timeOnly"
        :search="analysis.searchRegex"
        :resize="true"
      ></LogWindow>
      <div class="w-full h-32 relative" v-if="analysis.showHistogram">
        <LogTimeline
          v-if="filteredLogs.length && timeFilteredLogs.length"
          class="w-full h-full absolute top-0 left-0"
          :dates="filteredLogs"
          :startDate="timeFilteredLogs[0].date"
          :endDate="timeFilteredLogs[timeFilteredLogs.length - 1].date"
          :selectedLog="hightLightedLog?.date"
          :show-local-time="analysis.showLocalTime"
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
import { LogAnalysis, LogFile, LogsDatabase } from './LogsDatabase';
import LogTimeline from './LogTimeline.vue';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import {
  fnToObservable,
  observableToRef,
  useComputedGenerator,
  useUTCAdjustedDate,
} from '@gdx/utils';
import LoadMenu from './LoadMenu.vue';
import ToggleSwitch from 'primevue/toggleswitch';
import { LogEssentials } from './LogTypes';
import PluginsDrawer from './PluginsDrawer.vue';
import ColorRulesDialog from './ColorRulesDialog.vue';
import CodeEditor from './CodeEditor.vue';
import LogWindow from './LogWindow.vue';
import SearchDialog from './SearchDialog.vue';
import { EMPTY, switchMap } from 'rxjs';
import NewAnalysisMenu from './NewAnalysisMenu.vue';
import { is } from 'ramda';

const db = new LogsDatabase();

const analysis = reactive({
  searchRegex: '',
  selectedLogs: new Set<number>(),
  showOnlySelected: false,
  showHistogram: true,
  showLocalTime: true,
  timeOnly: true,
  logFileID: null as number | null,
  hightLightedLogIndex: null as number | null,
  startDate: useUTCAdjustedDate(new Date(0)),
  endDate: useUTCAdjustedDate(new Date()),
});

const isDrawerVisible = ref(false);
const isSearchEditorVisible = ref(false);
const isColorRulesVisible = ref(false);
const isCodeEditorVisible = ref(false);
const isLoadVisible = ref(false);
const isNewAnalysisVisible = ref(false);
const timeFilteredLogsRef = shallowRef<InstanceType<typeof LogWindow>>();
const filteredLogsRef = shallowRef<InstanceType<typeof LogWindow>>();
const currentFile = shallowRef<File | null>(null);

const colorRules = observableToRef(db.colorRulesObserver(), []);
const file$ = fnToObservable(() => analysis.logFileID).pipe(
  switchMap(async (id) => {
    if (id == null) return '';
    const file = await db.getLogFile(id);
    if (file == null) return '';
    return file.content;
  })
);
const baseFile = observableToRef(file$, '');

const hightLightedLog = computed(() => {
  return (
    rawLogs.value.find((log) => {
      return log.index === analysis.hightLightedLogIndex;
    }) ?? null
  );
});

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
  const start = analysis.startDate.original;
  const end = analysis.endDate.original;
  return rawLogs.value.filter((log) => {
    return log.date >= start && log.date <= end;
  });
});

const { comp: filteredLogs, progress } = useComputedGenerator(function* () {
  if (analysis.showOnlySelected) {
    const trackedValue = [...analysis.selectedLogs.values()]
      .sort((a, b) => {
        return a - b;
      })
      .map((index) => {
        return rawLogs.value[index];
      });
    yield 1;
    return trackedValue;
  }
  if (!analysis.searchRegex) {
    const trackedValue = timeFilteredLogs.value;
    yield 1;
    return trackedValue;
  }
  const filtered: LogEssentials[] = [];
  const rgx = new RegExp(analysis.searchRegex, 'i');

  const length = timeFilteredLogs.value.length;
  const logsArr = timeFilteredLogs.value;
  for (let i = 0; i < length; i++) {
    const log = logsArr[i];
    if (log.original.match(rgx) || analysis.selectedLogs.has(log.index)) {
      filtered.push(log);
    }
    if (i % 100_000 === 0) {
      yield i / length;
    }
  }
  yield 1;
  return filtered;
}, []);

function onLogDblClick(log: LogEssentials) {
  const index = timeFilteredLogs.value.findIndex((l) => l.index === log.index);
  analysis.hightLightedLogIndex = log.index;
  if (index === -1) return;
  timeFilteredLogsRef.value?.scrollTo(index);
}

function onLogClick(log: LogEssentials) {
  analysis.hightLightedLogIndex = log.index;
}

watch(filteredLogs, () => {
  filteredLogsRef.value?.scrollTo(0);
  timeFilteredLogsRef.value?.scrollTo(0);
});

function onLoadSeach(regex: string) {
  analysis.searchRegex = regex;
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

function restartDateSelection() {
  const { minDate, maxDate } = minMaxDates();
  analysis.startDate.original = minDate;
  analysis.endDate.original = maxDate;
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
  analysis.startDate.original = selection.startDate;
  analysis.endDate.original = selection.endDate;
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

function onAnalysisLoaded(loaded: LogAnalysis) {
  analysis.endDate.original = loaded.endDate;
  analysis.startDate.original = loaded.startDate;
  analysis.hightLightedLogIndex = loaded.hightLightedLogIndex;
  analysis.searchRegex = loaded.searchRegex;
  analysis.selectedLogs = loaded.selectedLogs;
  analysis.showHistogram = loaded.showHistogram;
  analysis.showLocalTime = loaded.showLocalTime;
  analysis.showOnlySelected = loaded.showOnlySelected;
  analysis.timeOnly = loaded.timeOnly;
  analysis.logFileID = loaded.logFileID;
  console.log(loaded);
}

async function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file) {
    currentFile.value = file;
    isNewAnalysisVisible.value = true;
  }
}
</script>
