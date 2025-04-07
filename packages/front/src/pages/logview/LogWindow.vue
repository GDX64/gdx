<template>
  <div
    v-bind="filterContainerProps"
    class="overflow-y-auto w-full min-h-[100px] max-h-[70%] border border-prime-600"
    :style="{ height: downLogViewSize + 'px' }"
  >
    <Popover ref="op" @hide="onPopoverHide">
      <Textarea v-if="currentComment" v-model="currentComment.comment"> </Textarea>
    </Popover>
    <div
      v-if="resize"
      class="resize-handler w-full cursor-ns-resize top-0 sticky h-2"
      @pointerdown.stop.prevent="resizeStart$.next($event)"
    ></div>
    <div class="" v-bind="filterWrapperProps">
      <div
        class="flex gap-2 whitespace-nowrap h-[25px] items-center px-1 group"
        @dblclick="emit('onLineDblClick', log.data)"
        v-for="log of filterList"
        :style="{ color: log.data.color ?? 'unset' }"
        :class="hightLightedLog?.index === log.data.index ? 'bg-prime-100' : ''"
      >
        <div
          @click="onLogSelect(log.data, $event)"
          class="min-w-4 h-4 border border-prime-500 rounded-full cursor-pointer"
          :class="isLogSelected(log.data) ? 'bg-prime-300' : ''"
        ></div>
        <div>{{ formatDate(log.data.date) }}</div>
        <HighlitableText
          class="font-bold"
          :value="log.data.level"
          :search="search"
          @click="emit('onLineClick', log.data)"
        ></HighlitableText>
        <HighlitableText
          :value="log.data.message"
          :search="search"
          @click="emit('onLineClick', log.data)"
        ></HighlitableText>
        <div
          class="hover:scale-110 transition-all scale-0 group-hover:scale-100 bg-bg-50 cursor-pointer sticky right-0 p-1 h-full aspect-square rounded-md"
          :class="
            commentOfLog(log.data)
              ? 'text-prime-500 !scale-100'
              : 'delay-500 text-text-prime'
          "
          @click="onCommentClick($event, log.data)"
        >
          <i class="h-full w-full pi pi-comment"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useVirtualList } from '@vueuse/core';
import { computed, ref, toRef, watchEffect } from 'vue';
import { LogEssentials } from './LogTypes';
import { useMakeYResizeHandler } from '@gdx/utils';
import HighlitableText from './HighlitableText.vue';
import { LogComment } from './LogsDatabase';
import Popover from 'primevue/popover';
import Textarea from 'primevue/textarea';
import { useLogView } from './useLogView';

const props = defineProps<{
  logs: LogEssentials[];
  showLocalTime: boolean;
  timeOnly: boolean;
  selectedLogs: Set<number>;
  resize?: boolean;
  search?: string;
  hightLightedLog?: LogEssentials;
  startSize?: number;
}>();

const emit = defineEmits({
  onLineDblClick: (log: LogEssentials) => true,
  onLineClick: (log: LogEssentials) => true,
});

const {
  list: filterList,
  containerProps: filterContainerProps,
  wrapperProps: filterWrapperProps,
  scrollTo,
} = useVirtualList(toRef(props, 'logs'), {
  itemHeight: 25,
});

const { db, analysis, comments } = useLogView();
const downLogViewSize = ref(props.startSize ?? 500);
const op = ref<InstanceType<typeof Popover> | null>(null);
const currentComment = ref<LogComment | null>(null);

const resizeStart$ = useMakeYResizeHandler({
  onEnd() {},
  onMove(y) {
    downLogViewSize.value = y;
  },
  onStart() {
    return downLogViewSize.value;
  },
});

function commentOfLog(log: LogEssentials) {
  return comments.value.find((comment) => comment.logIndex === log.index);
}

function onPopoverHide() {
  if (currentComment.value?.comment) {
    db.saveComment({ ...currentComment.value });
  } else if (currentComment.value?.id) {
    db.deleteComment(currentComment.value.id);
  }
}

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

function onCommentClick(event: Event, log: LogEssentials) {
  if (analysis.id == null) return;

  currentComment.value = commentOfLog(log) ?? {
    analysisID: analysis.id,
    comment: '',
    logIndex: log.index,
    updatedAt: new Date(),
  };
  op.value?.show(event);
}

defineExpose({
  scrollTo,
});
</script>
