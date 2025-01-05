import {
  animationFrames,
  firstValueFrom,
  fromEvent,
  last,
  map,
  Observable,
  scan,
  skip,
  Subject,
  switchMap,
  take,
  takeUntil,
  takeWhile,
  tap,
} from "rxjs";
import {
  computed,
  onMounted,
  onUnmounted,
  reactive,
  Ref,
  ref,
  shallowRef,
  watch,
  watchEffect,
  watchSyncEffect,
} from "vue";

export function useDrag(start: Observable<any>): {
  pos: Ref<[number, number]>;
  isDragging: Ref<boolean>;
} {
  const pos = ref([0, 0] as [number, number]);
  const isDragging = ref(false);
  const sub = start
    .pipe(
      switchMap(() => {
        return fromEvent<PointerEvent>(window, "pointermove").pipe(
          tap({
            subscribe() {
              isDragging.value = true;
            },
            finalize() {
              isDragging.value = false;
            },
          }),
          scan(
            (acc, value) =>
              [acc[0] + value.movementX, acc[1] + value.movementY] as [
                number,
                number
              ],
            pos.value
          ),
          takeUntil(fromEvent(window, "pointerup"))
        );
      })
    )
    .subscribe((value) => {
      pos.value = value;
    });
  onUnmounted(() => sub.unsubscribe());
  return { pos, isDragging };
}

export function useAnimationFrames(
  fn: (args: { elapsed: number; delta: number; count: number }) => void
): void {
  let last = 0;
  let count = 0;
  const sub = animationFrames().subscribe(({ elapsed }) => {
    const delta = elapsed - last;
    last = elapsed;
    count++;
    fn({ elapsed, delta, count });
  });
  onUnmounted(() => sub.unsubscribe());
}

export function useInterval(fn: () => void, time: number): void {
  const timer = setInterval(fn, time);
  onUnmounted(() => clearInterval(timer));
}

export function storageRef(name: string, initial = ""): Ref<string> {
  const value = ref("");
  value.value = localStorage.getItem(name) ?? initial;
  watchEffect(() => {
    localStorage.setItem(name, value.value);
  });
  return value;
}

export function useVisibility(container: Ref<HTMLElement | null | undefined>): {
  isVisible: Ref<boolean>;
} {
  const isVisible = ref(false);
  const observer = new IntersectionObserver((entries) => {
    isVisible.value = entries.at(-1)?.isIntersecting ?? false;
  });

  watch(
    container,
    (el, _, clear) => {
      if (el) {
        observer.observe(el);
        clear(() => {
          observer.unobserve(el);
        });
      }
    },
    {
      immediate: true,
    }
  );

  return { isVisible };
}

export function useSize(
  container: Ref<HTMLElement | null | undefined> = ref(null)
): {
  size: { width: number; height: number };
  container: Ref<HTMLElement | null | undefined>;
} {
  const size = reactive({ width: 0, height: 0 });
  const obs = new ResizeObserver((entries) => {
    updateSize();
  });
  function updateSize() {
    const el = container.value;
    size.width = el?.offsetWidth ?? 0;
    size.height = el?.offsetHeight ?? 0;
  }
  onMounted(() => {
    updateSize();
  });
  watchEffect((clear) => {
    const el = container.value;
    if (el) {
      obs.observe(el);
      clear(() => obs.unobserve(el));
    }
  });
  onUnmounted(() => obs.disconnect());
  return { size, container };
}

export function useAsyncComputed<T>(fn: () => Promise<T>, initial: T): Ref<T> {
  const value = shallowRef(initial);
  watchEffect(async () => {
    const promise = fn();
    value.value = await promise;
  });
  return value;
}

export function awaitTime(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * Result in Hz
 */
export async function estimateRefreshRate(samples = 10): Promise<number> {
  const lastValue = await firstValueFrom(
    animationFrames().pipe(take(samples), last())
  );
  const avg = lastValue.elapsed / samples;
  return 1000 / avg;
}

type CanvasDPIResult = {
  canvas: Ref<HTMLCanvasElement | undefined>;
  canvasPromise: Promise<HTMLCanvasElement>;
  size: { width: number; height: number };
  pixelSize: Ref<{ width: number; height: number }>;
};

export function useCanvasDPI(fixed?: {
  width: number;
  height: number;
}): CanvasDPIResult {
  const canvas = ref<HTMLCanvasElement>();
  const { size } = useSize(canvas);
  function updateValues() {
    if (canvas.value) {
      if (!fixed) {
        const dpr = self.devicePixelRatio || 1;
        const { width, height } = size;
        canvas.value.width = Math.floor(width * dpr);
        canvas.value.height = Math.floor(height * dpr);
      } else {
        canvas.value.width = fixed.width;
        canvas.value.height = fixed.height;
      }
    }
  }
  const canvasPromise = new Promise<HTMLCanvasElement>((resolve) => {
    const effect = watchEffect(() => {
      if (canvas.value) {
        resolve(canvas.value);
        effect.stop();
      }
    });
  });
  watchSyncEffect(() => {
    updateValues();
  });
  return {
    canvas,
    canvasPromise,
    size,
    pixelSize: computed(() => {
      if (fixed) {
        return fixed;
      }
      return {
        width: Math.floor(size.width * (self.devicePixelRatio || 1)),
        height: Math.floor(size.height * (self.devicePixelRatio || 1)),
      };
    }),
  };
}

export function animationProgress(duration: number): Observable<number> {
  return animationFrames().pipe(
    map(({ elapsed }) => Math.min(elapsed / duration, 1)),
    takeWhile((v) => v <= 1, true)
  );
}

export function lerpTime(a: number, b: number, t: number): number {
  return a * (1 - t) + b * t;
}

export function useInterpolation<T>(
  r: () => T,
  duration: number,
  interpolator: (initial: T, final: T, t: number) => T
): Ref<T> {
  const subject = new Subject<T>();
  watchEffect(() => {
    subject.next(r());
  });
  const sRef = shallowRef(r());
  const sub = subject
    .pipe(
      skip(1),
      switchMap((v) => {
        return animationProgress(duration).pipe(
          map((t) => interpolator(sRef.value, v, t))
        );
      })
    )
    .subscribe((final) => {
      sRef.value = final;
    });
  onUnmounted(() => sub.unsubscribe());
  return sRef;
}

export function useUTCAdjustedDate(start: Date): {
  adjusted: Date;
  original: Date;
} {
  const date = ref(start);
  return {
    get adjusted() {
      const offset = date.value.getTimezoneOffset();
      return new Date(date.value.getTime() + offset * 60 * 1000);
    },
    set adjusted(value: Date) {
      const offset = value.getTimezoneOffset();
      date.value = new Date(value.getTime() - offset * 60 * 1000);
    },
    get original() {
      return date.value;
    },
    set original(value: Date) {
      date.value = value;
    },
  };
}
