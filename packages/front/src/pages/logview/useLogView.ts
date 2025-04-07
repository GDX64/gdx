import { computed, inject, provide, reactive, ref } from 'vue';
import { LogsDatabase } from './LogsDatabase';
import {
  fnToObservable,
  observableToRef,
  useObservable,
  useUTCAdjustedDate,
} from '../../../../utils/src/misc';
import { EMPTY, switchMap } from 'rxjs';
import { LogEssentials } from './LogTypes';

function createLogView() {
  const db = new LogsDatabase();

  const analysis = reactive({
    id: null as number | null,
    searchHistory: <string[]>[],
    name: 'New Analysis',
    searches: <string[]>[],
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

  const comments$ = fnToObservable(() => analysis.id).pipe(
    switchMap((id) => {
      if (id == null) return EMPTY;
      return db.commentsObserver(id);
    })
  );

  const file$ = fnToObservable(() => analysis.logFileID).pipe(
    switchMap(async (id) => {
      if (id == null) return '';
      const file = await db.getLogFile(id);
      if (file == null) return '';
      return file.content;
    })
  );

  const baseFile = ref('');
  useObservable(file$, (file) => {
    baseFile.value = file;
    restartDateSelection();
  });

  const colorRules = observableToRef(db.colorRulesObserver(), []);
  const preSearches = observableToRef(db.searchObservable(), []);

  const comments = observableToRef(comments$, []);

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

  const hightLightedLog = computed(() => {
    return (
      rawLogs.value.find((log) => {
        return log.index === analysis.hightLightedLogIndex;
      }) ?? null
    );
  });

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

  function markedLogs() {
    const commentIDs = comments.value.map((comment) => comment.logIndex);
    const selectedIDs = Array.from(analysis.selectedLogs);
    return [...new Set([...commentIDs, ...selectedIDs])];
  }

  return {
    hightLightedLog,
    colorRules,
    rawLogs,
    preSearches,
    analysis,
    db,
    comments,
    restartDateSelection,
    markedLogs,
  };
}

type LogViewStore = ReturnType<typeof createLogView>;

export function useLogView(): LogViewStore {
  const logView = inject('logView', createLogView, true);

  provide('logView', logView);
  return logView;
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
