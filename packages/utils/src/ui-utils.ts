import { finalize, fromEvent, map, Subject, switchMap, takeUntil } from "rxjs";
import { onUnmounted } from "vue";

export function useMakeYResizeHandler(params: {
  onStart: () => number;
  onMove: (y: number) => void;
  onEnd: () => void;
}): Subject<MouseEvent> {
  enum State {
    Idle,
    Resizing,
  }

  const onDown$ = new Subject<MouseEvent>();

  const sub = onDown$
    .pipe(
      switchMap((downEvent) => {
        const startY: number = params.onStart();
        return fromEvent<PointerEvent>(document, "pointermove").pipe(
          takeUntil(fromEvent(document, "pointerup")),
          map((moveEvent) => {
            return startY - moveEvent.clientY + downEvent.clientY;
          }),
          finalize(() => {
            params.onEnd();
          })
        );
      })
    )
    .subscribe((newPos) => {
      params.onMove(newPos);
    });

  onUnmounted(() => {
    sub.unsubscribe();
  });

  return onDown$;
}
