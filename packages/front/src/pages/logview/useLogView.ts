import { inject, provide, reactive } from 'vue';
import { LogsDatabase } from './LogsDatabase';
import {
  fnToObservable,
  observableToRef,
  useUTCAdjustedDate,
} from '../../../../utils/src/misc';
import { EMPTY, switchMap } from 'rxjs';

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

  const comments = observableToRef(comments$, []);

  return {
    analysis,
    db,
    comments,
  };
}

type LogViewStore = ReturnType<typeof createLogView>;

export function useLogView(): LogViewStore {
  const logView = inject('logView', createLogView, true);

  provide('logView', logView);
  return logView;
}
