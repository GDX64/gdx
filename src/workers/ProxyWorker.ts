import {
  defer,
  endWith,
  filter,
  finalize,
  map,
  mergeMap,
  Observable,
  Subject,
  takeUntil,
  takeWhile,
  tap,
} from 'rxjs';
import { FinishStream, GenericGet, GenericRequest, WorkerLike } from './interfaces';

type WorkerObservableFn = (
  x: any
) => Observable<{ data: any; transfer?: Transferable[] }>;

type ExtractData<T> = T extends (x: any) => Observable<{ data: infer A }>
  ? Observable<A>
  : never;
type TransformRecord<T extends Record<string, WorkerObservableFn>> = {
  [Key in keyof T]: (...args: Parameters<T[Key]>) => ExtractData<T[Key]>;
};

export function makeProxy<T extends Record<string, WorkerObservableFn>>(
  worker: WorkerLike
): TransformRecord<T> {
  const get$ = new Subject<GenericGet>();
  worker.addEventListener('message', (message) => {
    if (message.data.type === 'get') {
      get$.next(message.data);
    }
  });
  return new Proxy({} as TransformRecord<T>, {
    get(target, prop: string) {
      return (arg: any, transfer: any) => {
        return defer(() => {
          const id = Math.random();
          const genericRequest: GenericRequest = { type: 'func', prop, arg, id };
          queueMicrotask(() => worker.postMessage(genericRequest, transfer));
          return get$.pipe(
            finalize(() => worker.postMessage({ type: 'finish', id })),
            filter((resp) => id === resp.id),
            takeWhile((resp) => !resp.last),
            map((resp) => resp.response)
          );
        });
      };
    },
  });
}

type WorkerMethodsRecord = Record<string, WorkerObservableFn>;

export function expose(methods: WorkerMethodsRecord, ctx: WorkerLike) {
  const func$ = new Subject<GenericRequest>();
  const finish$ = new Subject<number>();
  ctx.addEventListener('message', (message) => {
    const data = message.data as GenericRequest | FinishStream;
    if (data.type === 'func') {
      func$.next(data);
    } else if (data.type === 'finish') {
      finish$.next(data.id);
    }
  });
  func$
    .pipe(mergeMap((data) => makeGenericRequest(data, finish$, methods)))
    .subscribe((data) => ctx.postMessage(data, data.transfer ?? []));
}

function makeGenericRequest(
  data: GenericRequest,
  finish$: Observable<number>,
  methods: WorkerMethodsRecord
) {
  const endMessage: GenericGet = {
    id: data.id,
    last: true,
    response: null,
    type: 'get',
  };

  return methods[data.prop](data.arg).pipe(
    takeUntil(finish$.pipe(filter((id) => id === data.id))),
    map((answer): GenericGet => {
      return {
        id: data.id,
        last: false,
        response: answer.data,
        type: 'get',
        transfer: answer.transfer,
      };
    }),
    endWith(endMessage)
  );
}
