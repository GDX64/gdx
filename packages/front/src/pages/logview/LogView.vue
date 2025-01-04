<template>
  <div class="flex flex-col items-start gap-4 h-screen py-2">
    <div class="flex">
      <input type="file" @change="openLogFile" />
      <div class="">loaded {{ logs.length }} logs</div>
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
    <div class="w-full">
      <input
        type="text"
        v-model="searchRegex"
        class="border border-prime-950 rounded-md w-full"
      />
    </div>
    <div
      v-bind="filterVirtualScroll.containerProps"
      class="overflow-y-auto h-[150px] min-w-[1000px] max-w-[1000px] border border-prime-900 rounded-sm"
    >
      <div class="" v-bind="filterVirtualScroll.wrapperProps">
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
        :startDate="logs[0].date"
        :endDate="logs[logs.length - 1].date"
        v-if="filteredLogs.length"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useVirtualList } from '@vueuse/core';
import { LogsDatabase } from './LogsDatabase';
import LogTimeline from './LogTimeline.vue';

type LogEssentials = {
  date: Date;
  original: string;
  level: string;
  message: string;
};

const db = new LogsDatabase();
const logs = ref<LogEssentials[]>([]);
const searchRegex = ref('');
const filteredLogs = computed(() => {
  const rgx = new RegExp(searchRegex.value, 'i');
  if (!searchRegex.value) return [];
  return logs.value.filter((log) => {
    return log.original.match(rgx);
  });
});

const { list, containerProps, wrapperProps } = useVirtualList(logs, {
  itemHeight: 25,
});

const filterVirtualScroll = useVirtualList(filteredLogs, {
  itemHeight: 25,
});
const filterList = filterVirtualScroll.list;

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

async function loadLogs() {
  const firstDbLog = await db.firstLog();
  if (firstDbLog) {
    logs.value = neloParser(firstDbLog.content);
  } else {
    logs.value = [];
  }
}

async function openLogFile(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files?.length) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = (e) => {
    const content = e.target?.result as string;
    logs.value = neloParser(content);
    db.saveLogFile(file.name, content);
  };
  reader.readAsText(file);
}
</script>
