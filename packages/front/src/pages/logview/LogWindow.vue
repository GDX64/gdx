<template>
  <div
    v-bind="filterContainerProps"
    class="overflow-y-auto w-full min-h-[100px] max-h-[70%] border border-prime-600"
    :style="{ height: downLogViewSize + 'px' }"
  >
    <div
      v-if="resize"
      class="resize-handler w-full cursor-ns-resize top-0 sticky h-2"
      @pointerdown.stop.prevent="resizeStart$.next($event)"
    ></div>
    <div class="" v-bind="filterWrapperProps">
      <div
        class="flex gap-2 whitespace-nowrap h-[25px] items-center px-1"
        @dblclick="emit('onLineDblClick', log.data)"
        v-for="log of filterList"
        :style="{ color: log.data.color ?? 'unset' }"
      >
        <div
          @click="onLogSelect(log.data, $event)"
          class="min-w-4 h-4 border border-prime-500 rounded-full cursor-pointer"
          :class="isLogSelected(log.data) ? 'bg-prime-500' : ''"
        ></div>
        <div>{{ formatDate(log.data.date) }}</div>
        <div class="font-bold">{{ log.data.level }}</div>
        <div>{{ log.data.message }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useVirtualList } from '@vueuse/core';
import { computed, ref, toRef } from 'vue';
import { LogEssentials } from './LogTypes';
import { useMakeYResizeHandler } from '@gdx/utils';

const props = defineProps<{
  logs: LogEssentials[];
  showLocalTime: boolean;
  timeOnly: boolean;
  selectedLogs: Set<number>;
  resize?: boolean;
}>();

const emit = defineEmits({
  onLineDblClick: (log: LogEssentials) => true,
});

const {
  list: filterList,
  containerProps: filterContainerProps,
  wrapperProps: filterWrapperProps,
  scrollTo,
} = useVirtualList(toRef(props, 'logs'), {
  itemHeight: 25,
});

const downLogViewSize = ref(300);

const resizeStart$ = useMakeYResizeHandler({
  onEnd() {},
  onMove(y) {
    downLogViewSize.value = y;
  },
  onStart() {
    return downLogViewSize.value;
  },
});

const dateFormatter = computed(() => {
  if (props.showLocalTime) {
    if (props.timeOnly) {
      const intl = new Intl.DateTimeFormat('pt-BR', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        fractionalSecondDigits: 3,
        hour12: false,
      });
      return (date: Date) => intl.format(date);
    } else {
      const intl = new Intl.DateTimeFormat('pt-BR', {
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
    if (props.timeOnly) {
      const intl = new Intl.DateTimeFormat('pt-BR', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZone: 'UTC',
        fractionalSecondDigits: 3,
      });
      return (date: Date) => intl.format(date);
    } else {
      const intl = new Intl.DateTimeFormat('pt-BR', {
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

function formatDate(date: Date) {
  return dateFormatter.value(date);
}

function isLogSelected(log: LogEssentials) {
  return props.selectedLogs?.has(log.index);
}

function onLogSelect(log: LogEssentials, event: MouseEvent) {
  if (props.selectedLogs?.has(log.index)) {
    props.selectedLogs.delete(log.index);
  } else {
    props.selectedLogs?.add(log.index);
  }
}

defineExpose({
  scrollTo,
});
</script>
