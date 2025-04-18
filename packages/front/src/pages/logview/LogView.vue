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
        :search="searchRegex"
        @on-line-dbl-click="onLogDblClick"
        @on-line-click="onLogClick"
        :start-size="100"
      ></LogWindow>
      <div class="w-full flex gap-2 flex-wrap items-center">
        <AutoComplete
          class="rounded-md grow"
          ref="autocomplete"
          v-model="analysis.searches"
          :suggestions="suggestions"
          :loading="false"
          :typeahead="true"
          :delay="100"
          :show-empty-message="false"
          scroll-height="10rem"
          multiple
          @complete="search"
          @change="onSearchChange"
          @keyup="onSearchArrow"
          @value-change="onSearchChange"
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
        :search="searchRegex"
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
import { computed, ref, shallowRef, toRaw, watch } from 'vue';
import { LogAnalysis } from './LogsDatabase';
import LogTimeline from './LogTimeline.vue';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import { useComputedGenerator, useInterval } from '@gdx/utils';
import LoadMenu from './LoadMenu.vue';
import ToggleSwitch from 'primevue/toggleswitch';
import { LogEssentials } from './LogTypes';
import PluginsDrawer from './PluginsDrawer.vue';
import ColorRulesDialog from './ColorRulesDialog.vue';
import CodeEditor from './CodeEditor.vue';
import LogWindow from './LogWindow.vue';
import SearchDialog from './SearchDialog.vue';
import { switchMap } from 'rxjs';
import NewAnalysisMenu from './NewAnalysisMenu.vue';
import AutoComplete, {
  AutoCompleteChangeEvent,
  AutoCompleteCompleteEvent,
} from 'primevue/autocomplete';
import { useLogView } from './useLogView';

const {
  db,
  analysis,
  colorRules,
  preSearches,
  hightLightedLog,
  rawLogs,
  restartDateSelection,
  markedLogs,
} = useLogView();

const autocomplete = ref<any>();
const currentSearchText = ref('');

const searchRegex = computed(() => {
  const result = [...analysis.searches, currentSearchText.value]
    .filter((item) => item)
    .join('|');
  return result;
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

tryToLoadLastAnalysis();

useInterval(async () => {
  if (analysis.logFileID == null || analysis.id == null) return;
  await db.putAnalysis({
    name: analysis.name,
    endDate: analysis.endDate.original,
    startDate: analysis.startDate.original,
    hightLightedLogIndex: analysis.hightLightedLogIndex,
    searches: toRaw(analysis.searches),
    selectedLogs: toRaw(analysis.selectedLogs),
    showHistogram: analysis.showHistogram,
    showLocalTime: analysis.showLocalTime,
    showOnlySelected: analysis.showOnlySelected,
    timeOnly: analysis.timeOnly,
    logFileID: analysis.logFileID,
    id: analysis.id,
    updatedAt: new Date(),
  });
}, 1000);

const timeFilteredLogs = computed(() => {
  const start = analysis.startDate.original;
  const end = analysis.endDate.original;
  return rawLogs.value.filter((log) => {
    return log.date >= start && log.date <= end;
  });
});

const { comp: filteredLogs, progress } = useComputedGenerator(function* () {
  if (analysis.showOnlySelected) {
    const trackedValue = markedLogs()
      .sort((a, b) => {
        return a - b;
      })
      .map((index) => {
        return rawLogs.value[index];
      })
      .filter((log) => log);
    yield 1;
    return trackedValue;
  }
  if (!searchRegex.value) {
    const trackedValue = timeFilteredLogs.value;
    yield 1;
    return trackedValue;
  }
  const filtered: LogEssentials[] = [];
  const rgx = new RegExp(searchRegex.value, 'i');

  const length = timeFilteredLogs.value.length;
  const logsArr = timeFilteredLogs.value;
  //this is for performance
  const selectedLogs = new Set(analysis.selectedLogs.values());
  for (let i = 0; i < length; i++) {
    const log = logsArr[i];
    if (log.original.match(rgx) || selectedLogs.has(log.index)) {
      filtered.push(log);
    }
    if (i % 100_000 === 0) {
      yield i / length;
    }
  }
  yield 1;
  return filtered;
}, []);

const suggestions = ref(calcSearch());

watch(filteredLogs, () => {
  filteredLogsRef.value?.scrollTo(0);
  timeFilteredLogsRef.value?.scrollTo(0);
});

function onLogDblClick(log: LogEssentials) {
  const index = timeFilteredLogs.value.findIndex((l) => l.index === log.index);
  analysis.hightLightedLogIndex = log.index;
  if (index === -1) return;
  timeFilteredLogsRef.value?.scrollTo(index);
}

function onLogClick(log: LogEssentials) {
  analysis.hightLightedLogIndex = log.index;
}

function onLoadSeach(regex: string) {
  analysis.searches.push(regex);
}

function calcSearch() {
  const history = analysis.searchHistory;
  const colorSearches = colorRules.value.map((item) => item.regex);
  const savedSearches = preSearches.value.map((item) => item.regex);
  const regex = new RegExp(currentSearchText.value, 'i');
  const values = [...history, ...colorSearches, ...savedSearches];
  const head = <string[]>[];
  const tail = <string[]>[];
  values.forEach((item) => {
    const matches = item.match(regex) && !analysis.searches.includes(item);
    if (matches) {
      head.push(item);
    } else {
      tail.push(item);
    }
  });
  return [...head, ...tail];
}

function onSelect(selection: { startDate: Date; endDate: Date }) {
  analysis.startDate.original = selection.startDate;
  analysis.endDate.original = selection.endDate;
}

function onAnalysisLoaded(loaded: LogAnalysis) {
  if (loaded.endDate) {
    analysis.endDate.original = loaded.endDate;
  }
  if (loaded.startDate) {
    analysis.startDate.original = loaded.startDate;
  }
  analysis.hightLightedLogIndex = loaded.hightLightedLogIndex;
  analysis.searches = loaded.searches;
  analysis.selectedLogs = loaded.selectedLogs;
  analysis.showHistogram = loaded.showHistogram;
  analysis.showLocalTime = loaded.showLocalTime;
  analysis.showOnlySelected = loaded.showOnlySelected;
  analysis.timeOnly = loaded.timeOnly;
  analysis.logFileID = loaded.logFileID;
  analysis.id = loaded.id;
  analysis.name = loaded.name;
}

async function onDrop(event: DragEvent) {
  const file = event.dataTransfer?.files[0];
  if (file) {
    currentFile.value = file;
    isNewAnalysisVisible.value = true;
  }
}

async function tryToLoadLastAnalysis() {
  const lastAnalysis = await db.getLastLogAnalysis();
  if (lastAnalysis) {
    onAnalysisLoaded(lastAnalysis);
  } else {
    isLoadVisible.value = true;
  }
}

function search(event: AutoCompleteCompleteEvent) {
  currentSearchText.value = event.query;
  suggestions.value = calcSearch();
}

function onSearchChange(event: AutoCompleteChangeEvent) {}

function onSearchArrow(event: KeyboardEvent) {
  try {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      autocomplete.value.overlayVisible = true;
    }
    if (event.key === 'Enter') {
      const input = event.target as HTMLInputElement;
      const current = input.value;
      currentSearchText.value = current;
      if (!current) {
        return;
      }
      analysis.searches.push(current);
      if (!analysis.searchHistory.includes(current)) {
        analysis.searchHistory.push(current);
        analysis.searchHistory = analysis.searchHistory.slice(-10).filter((item) => item);
      }
      input.value = '';
    }
  } finally {
    suggestions.value = calcSearch();
  }
}
</script>
