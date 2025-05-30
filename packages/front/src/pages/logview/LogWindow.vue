<template>
  <div
    v-bind="filterContainerProps"
    class="overflow-y-auto w-full min-h-[100px] max-h-[70%] border border-prime-600"
    :style="{ height: downLogViewSize + 'px' }"
  >
    <Popover ref="op" @hide="onPopoverHide">
      <Textarea v-if="currentComment" v-model="currentComment.comment" class="min-w-96">
      </Textarea>
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
          v-if="hightLightedLog?.index === log.data.index || commentOfLog(log.data)"
          class="bg-bg-50 cursor-pointer sticky right-0 p-1 h-full aspect-square rounded-md flex gap-2"
          :class="
            commentOfLog(log.data) ? 'text-prime-500 !scale-100' : ' text-text-prime'
          "
        >
          <i
            class="h-full w-full pi pi-comment"
            @click="onCommentClick($event, log.data)"
          ></i>
          <i class="h-full w-full pi pi-clipboard" @click="copyLog(log.data)"></i>
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
import { useToast } from 'primevue/usetoast';

const props = defineProps<{
  logs: LogEssentials[];
  resize?: boolean;
  search?: string;
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

const { db, analysis, comments, hightLightedLog } = useLogView();
const downLogViewSize = ref(props.startSize ?? 500);
const op = ref<InstanceType<typeof Popover> | null>(null);
const currentComment = ref<LogComment | null>(null);
const toast = useToast();

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
  if (analysis.showLocalTime) {
    if (analysis.timeOnly) {
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
    if (analysis.timeOnly) {
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
  return analysis.selectedLogs?.has(log.index);
}

function onLogSelect(log: LogEssentials, event: MouseEvent) {
  if (analysis.selectedLogs?.has(log.index)) {
    analysis.selectedLogs.delete(log.index);
  } else {
    analysis.selectedLogs?.add(log.index);
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

async function copyLog(log: LogEssentials) {
  await navigator.clipboard.writeText(log.original);
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Log copied to clipboard',
    life: 3000,
  });
}

defineExpose({
  scrollTo,
});
</script>
