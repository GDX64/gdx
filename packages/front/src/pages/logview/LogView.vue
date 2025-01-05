<template>
  <div class="flex flex-col items-start gap-4 h-screen py-2 px-4">
    <div class="flex">
      <input type="file" @change="openLogFile" />
      <div class="">loaded {{ rawLogs.length }} logs</div>
    </div>
    <div
      v-bind="containerProps"
      class="overflow-y-auto h-[300px] min-w-[1000px] max-w-[1000px] border border-prime-900 rounded-sm grow"
    >
      <div class="" v-bind="wrapperProps">
        <div class="flex gap-2 whitespace-nowrap h-[25px]" v-for="log of list">
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
    </div>
    <div
      v-bind="filterContainerProps"
      class="overflow-y-auto h-[150px] min-w-[1000px] max-w-[1000px] border border-prime-900 rounded-md"
    >
      <div class="" v-bind="filterWrapperProps">
        <div class="flex gap-2 whitespace-nowrap h-[25px]" v-for="log of filterList">
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
        v-if="filteredLogs.length"
        @select="onSelect"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef } from 'vue';
import { useVirtualList } from '@vueuse/core';
import { LogsDatabase } from './LogsDatabase';
import LogTimeline from './LogTimeline.vue';
import InputText from 'primevue/inputtext';
import DatePicker from 'primevue/datepicker';
import Button from 'primevue/button';
import { useUTCAdjustedDate } from '@gdx/utils';

type LogEssentials = {
  date: Date;
  original: string;
  level: string;
  message: string;
};

const db = new LogsDatabase();
const rawLogs = shallowRef<LogEssentials[]>([]);
const searchRegex = ref('');

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
  const rgx = new RegExp(searchRegex.value, 'i');
  return timeFilteredLogs.value.filter((log) => {
    return log.original.match(rgx);
  });
});

const { list, containerProps, wrapperProps } = useVirtualList(timeFilteredLogs, {
  itemHeight: 25,
});

const {
  list: filterList,
  containerProps: filterContainerProps,
  wrapperProps: filterWrapperProps,
} = useVirtualList(filteredLogs, {
  itemHeight: 25,
});

loadLogs();

function neloParser(file: string): LogEssentials[] {
  const lines = file.trim().split('\n');
  const logs = lines.map((line) => {
    const [date, level, message, val1, val2] = line.split(' | ');
    return {
      date: new Date(date),
      level,
      message: `${message} | ${val1} | ${val2}`,
      original: line,
    };
  });
  return logs;
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

async function loadLogs() {
  const firstDbLog = await db.lastFile();
  if (firstDbLog) {
    rawLogs.value = neloParser(firstDbLog.content);
  } else {
    rawLogs.value = [];
  }
  restartDateSelection();
}

async function openLogFile(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const content = e.target?.result as string;
    rawLogs.value = neloParser(content);
    restartDateSelection();
    db.saveLogFile(file.name, content);
  };
  reader.readAsText(file);
}
</script>
