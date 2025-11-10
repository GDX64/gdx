import {
  computed,
  EffectScope,
  effectScope,
  onScopeDispose,
  reactive,
  watchEffect,
} from 'vue';

const channel = new MessageChannel();

const mainPort = channel.port1;
const threadPort = channel.port2;
mainPort.start();
threadPort.start();

type MainFn = () => { actions: StateType; state: ActionsType };
type StateType = Record<string, any>;
type ActionsType = Record<string, Function>;
type ScopeData = { effectScope: EffectScope; state: StateType; actions: ActionsType };
const mainFnsMap = new Map<string, MainFn>();
const scopeMap = new Map<number, ScopeData>();

let currentScopeID = 0;

enum ToMainMessageKind {
  START,
  RUN_ACTION,
}

type ToMainMessage =
  | {
      kind: ToMainMessageKind.START;
      identifier: string;
      execID: number;
    }
  | {
      kind: ToMainMessageKind.RUN_ACTION;
      scopeID: number;
      actionName: string;
      arg: any;
      execID: number;
    };

enum MessageToThreadKind {
  ACTION_RESULT,
  SCOPE_STARTED,
  STATE_UPDATE,
}

type MessageToThreadRecord = {
  actionResult: {
    kind: MessageToThreadKind.ACTION_RESULT;
    execID: number;
    result: any;
  };
  scopeStarted: {
    kind: MessageToThreadKind.SCOPE_STARTED;
    scopeID: number;
    execID: number;
  };
  stateUpdate: {
    kind: MessageToThreadKind.STATE_UPDATE;
    scopeID: number;
    state: string;
  };
};

type MessageToThread = MessageToThreadRecord[keyof MessageToThreadRecord];

function postMessageToThread(message: MessageToThread) {
  mainPort.postMessage(message);
}

mainPort.addEventListener('message', async (event) => {
  const data: ToMainMessage = event.data;

  if (data.kind === ToMainMessageKind.START) {
    const scopeID = currentScopeID++;
    const mainFn = mainFnsMap.get(data.identifier);
    const scope = effectScope();
    const scopeData = scope.run(() => {
      const { actions, state } = mainFn!();
      watchEffect(() => {
        const serializedState = JSON.stringify(state);
        postMessageToThread({
          kind: MessageToThreadKind.STATE_UPDATE,
          scopeID,
          state: serializedState,
        });
      });
      return { effectScope: scope, actions, state };
    });
    scopeMap.set(scopeID, scopeData!);
    postMessageToThread({
      kind: MessageToThreadKind.SCOPE_STARTED,
      scopeID,
      execID: data.execID,
    });
  } else if (data.kind === ToMainMessageKind.RUN_ACTION) {
    const scopeData = scopeMap.get(data.scopeID)!;
    const result = await scopeData.actions[data.actionName](data.arg);
    postMessageToThread({
      kind: MessageToThreadKind.ACTION_RESULT,
      execID: data.execID,
      result,
    });
  }
});

let threadExecID = 0;

export function createUseMain<State extends StateType, Actions extends ActionsType>(
  main: () => {
    state: State;
    actions: Actions;
  },
  identifier: string
) {
  mainFnsMap.set(identifier, main);

  function useOnThread(initial: State) {
    const state = reactive(initial);
    const { actionsProxy, scopePromise } = createActionsProxy<Actions>(identifier);

    startStateListener();

    async function startStateListener() {
      const { scopeID } = await scopePromise;
      while (true) {
        const stateMessage = await waitForMessageFromMain<
          MessageToThreadRecord['stateUpdate']
        >((data) => {
          return (
            data.kind === MessageToThreadKind.STATE_UPDATE && data.scopeID === scopeID
          );
        });
        const newState = JSON.parse(stateMessage.state);
        for (const key in newState) {
          state[key] = newState[key];
        }
      }
    }

    return {
      state,
      actions: actionsProxy,
    };
  }

  return {
    useOnThread,
  };
}

function createActionsProxy<Actions>(identifier: string) {
  const startScopeID = threadExecID++;
  postMessageToMain({
    kind: ToMainMessageKind.START,
    identifier,
    execID: startScopeID,
  });
  const scopePromise = waitForMessageFromMain<MessageToThreadRecord['scopeStarted']>(
    (data) => {
      return (
        data.kind === MessageToThreadKind.SCOPE_STARTED && data.execID === startScopeID
      );
    }
  );
  let currentExecID = 0;
  const actionsProxy = new Proxy(
    {},
    {
      get(_, prop: string) {
        return async (args: any) => {
          const startResult = await scopePromise;
          const execID = currentExecID++;
          postMessageToMain({
            kind: ToMainMessageKind.RUN_ACTION,
            scopeID: startResult.scopeID,
            actionName: prop,
            arg: args,
            execID,
          });
        };
      },
    }
  ) as Actions;
  return { actionsProxy, scopePromise };
}

async function postMessageToMain(message: ToMainMessage) {
  await new Promise((resolve) => setTimeout(resolve, 0));
  threadPort.postMessage(message);
}

function waitForMessageFromMain<T extends MessageToThread>(
  fn: (data: MessageToThread) => boolean
): Promise<T> {
  const promise = Promise.withResolvers<T>();
  const handler = (event: MessageEvent) => {
    const data: MessageToThread = event.data;
    console.log('received message from main', data);
    if (fn(data)) {
      promise.resolve(data as T);
    }
  };
  threadPort.addEventListener('message', handler);
  promise.promise.finally(() => {
    console.log('removing listener');
    threadPort.removeEventListener('message', handler);
  });
  return promise.promise;
}
