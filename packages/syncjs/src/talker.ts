export type Message<Data = any, Response = void> = {
  data: Data;
  response: Response;
};

interface ListenerPoster {
  postMessage(message: any): void;
  addEventListener(event: "message", cb: (data: any) => void): void;
}

type Messages = Record<string, Message<any, any>>;

type MessagesWithKind<M extends Messages> = {
  [K in keyof M]: M[K] & { kind: K; id: KeyFor<M[K]["response"]> };
};

export type KeyFor<T> = number & { __keyFor: T };
export type SharedKey = {
  __arr__: SharedArrayBuffer;
  __key__: string;
};
export type MessageDataOf<M extends Messages> = MessagesWithKind<M>[keyof M];

const responseKind = "__response__";
export class Talker<M extends Messages> {
  private eventsMap: Map<KeyFor<any>, Set<Function>> = new Map();
  constructor(
    public readonly channel: ListenerPoster,
    private receive: (data: MessageDataOf<M>) => void
  ) {
    this.channel.addEventListener("message", (message) => {
      if (message.data.kind === responseKind) {
        this.notifyMessage(message.data.id, message.data.data);
      } else {
        this.receive(message.data);
      }
    });
  }

  private notifyMessage<T>(key: KeyFor<T>, data: T) {
    const callbacks = this.eventsMap.get(key);
    if (!callbacks) return;
    for (const callback of callbacks) {
      callback(data);
    }
  }

  send<K extends keyof M>(
    kind: K,
    data: M[K]["data"]
  ): KeyFor<M[K]["response"]>;
  send<K extends keyof M>(
    kind: M[K]["data"] extends void ? K : never
  ): KeyFor<M[K]["response"]>;
  send(kind: any, data?: any): any {
    const id = (Math.random() * 1000_000) as any;
    this.channel.postMessage({ kind, data, id });
    return id;
  }

  on<T>(key: KeyFor<T>, cb: (data: T) => void): () => void {
    const callbacks = this.eventsMap.get(key) || new Set();
    callbacks.add(cb);
    this.eventsMap.set(key, callbacks);
    return () => this.eventsMap.get(key)?.delete(cb);
  }

  awaitResponse<T>(key: KeyFor<T>): Promise<T> {
    return new Promise((resolve) => {
      const remove = this.on(key, (data) => {
        resolve(data);
        remove();
      });
    });
  }

  response<T>(key: KeyFor<T>, data: T): void {
    this.channel.postMessage({ kind: responseKind, data, id: key });
  }

  static sharedKey(size: number): SharedKey {
    const arr = new SharedArrayBuffer(size);
    return {
      __arr__: arr,
      __key__: `sharedBuffer_${Math.random().toString().slice(2)}`,
    };
  }

  static async lockOnShared<T>(
    { __arr__, __key__: key }: SharedKey,
    cb: (view: Uint8Array) => T
  ): Promise<any> {
    return navigator.locks.request(key, async () => {
      return cb(new Uint8Array(__arr__));
    });
  }
}
