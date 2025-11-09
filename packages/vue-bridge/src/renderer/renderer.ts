import { createRenderer, Component, inject, onUnmounted, reactive } from 'vue';

function appRenderer(context: DomLikeContext) {
  const { createApp } = createRenderer<DOMLikeElement, DOMLikeElement>({
    createComment(text) {
      const el = new DOMLikeElement('comment', context);
      el.setText(text);
      return el;
    },
    createElement(type, namespace, isCustomizedBuiltIn, vnodeProps) {
      return new DOMLikeElement(type, context);
    },
    createText(text) {
      const el = new DOMLikeElement('text', context);
      el.setText(text);
      return el;
    },
    insert(el, parent, anchor) {
      const index = parent.children.findIndex((item) => item === anchor);
      if (index === -1) {
        parent.addChildAt(el, parent.children.length);
      } else {
        parent.addChildAt(el, index + 1);
      }
    },
    nextSibling(node) {
      const index = node.parent?.parent?.children.findIndex((item) => item === node);
      if (index === -1 || index == null) return null;
      return node.parent?.children[index + 1] ?? null;
    },
    parentNode(node) {
      return node.parent ?? null;
    },
    patchProp(el, key, prevValue, nextValue) {
      el.patch(key, prevValue, nextValue);
    },
    remove(el) {
      el.parent?.removeChild(el);
      el.destroy();
    },
    setElementText(node, text) {
      node.setText(text);
    },
    setText(node, text) {
      node.setText(text);
    },
  });
  return { createApp };
}

export async function createRoot(comp: Component, rootElement: HTMLElement) {
  const channel = new MessageChannel();
  createTreeHandler(channel.port2, rootElement);
  const ctx = new DomLikeContext(channel.port1);
  const rootEl = new DOMLikeElement('div', ctx);
  rootEl.setAsRoot();
  const app = appRenderer(ctx).createApp(comp);
  app.mount(rootEl);
  return {};
}

class DOMLikeElement {
  children: DOMLikeElement[] = [];
  parent: DOMLikeElement | null = null;
  textContent: string = '';
  private attrs: Record<string, any> = {};
  private eventListeners: Record<string, Function> = {};
  readonly id: number;
  constructor(
    public tag: string,
    private context: DomLikeContext
  ) {
    this.id = context.nextID();
    this.context.registerElement(this);
  }

  setAsRoot() {
    this.context.notifyAction({
      kind: ActionKind.SET_ROOT,
      id: this.id,
    });
  }

  addChildAt(child: DOMLikeElement, index: number) {
    child.parent = this;
    this.children.splice(index, 0, child);
    this.context.notifyAction({
      kind: ActionKind.INSERT_ELEMENT,
      parentID: this.id,
      childID: child.id,
      index,
    });
  }

  addEventListener(event: string, handler: Function) {
    this.patch(`on${event}`, undefined, handler);
  }

  removeChild(child: DOMLikeElement) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
    this.context.notifyAction({
      kind: ActionKind.REMOVE_ELEMENT,
      id: child.id,
    });
  }
  patch(key: string, prevValue: any, nextValue: any) {
    if (key.startsWith('on')) {
      this.eventListeners[key] = nextValue;
      this.context.addEventListener(this.id, key, nextValue);
    } else {
      this.attrs[key] = nextValue;
      this.context.notifyAction({
        kind: ActionKind.SET_ATTRIBUTE,
        id: this.id,
        key,
        value: nextValue,
      });
    }
  }

  setText(text: string) {
    this.textContent = text;
    this.context.notifyAction({
      kind: ActionKind.SET_TEXT,
      id: this.id,
      text,
    });
  }

  destroy() {}
}

class DomLikeContext {
  private currentID = 1;
  private eventHandlers: Map<number, Function> = new Map();
  private elements: Map<number, DOMLikeElement> = new Map();
  constructor(private port: MessagePort) {
    this.port.onmessage = (event) => {
      this.handleEvent(event.data);
    };
  }

  registerElement(element: DOMLikeElement) {
    this.elements.set(element.id, element);
    this.notifyAction({
      kind: ActionKind.CREATE_ELEMENT,
      id: element.id,
      tag: element.tag,
    });
  }

  handleEvent(data: RenderSideEvent) {
    switch (data.kind) {
      case RenderSideEventKind.EVENT_FIRED:
        this.onEventFired(data);
        break;
    }
  }

  nextID() {
    this.currentID += 1;
    return this.currentID;
  }

  notifyAction(action: Action) {
    this.port.postMessage(action);
  }

  addEventListener(elementID: number, event: string, handler: Function) {
    const eventID = this.nextID();
    this.eventHandlers.set(eventID, handler);
    this.port.postMessage({
      kind: ActionKind.ADD_EVENT_LISTENER,
      id: elementID,
      event,
      eventID,
    });
  }

  onEventFired(data: RenderSideEvent) {
    const handler = this.eventHandlers.get(data.eventID);
    const target = this.elements.get(data.elementID);
    if (handler && target) {
      const event = mapEvent(data, target);
      handler(event);
    }
  }
}

enum ActionKind {
  CREATE_ELEMENT,
  SET_ATTRIBUTE,
  REMOVE_ELEMENT,
  INSERT_ELEMENT,
  REMOVE_ATTRIBUTE,
  SET_ROOT,
  SET_TEXT,
  ADD_EVENT_LISTENER,
}

enum RenderSideEventKind {
  EVENT_FIRED,
}

type RenderSideEvent = {
  kind: RenderSideEventKind.EVENT_FIRED;
  eventID: number;
  eventType: string;
  data: any;
  elementID: number;
};

type Action =
  | {
      kind: ActionKind.CREATE_ELEMENT;
      id: number;
      tag: string;
    }
  | {
      kind: ActionKind.SET_ROOT;
      id: number;
    }
  | {
      kind: ActionKind.SET_ATTRIBUTE;
      id: number;
      key: string;
      value: any;
    }
  | {
      kind: ActionKind.REMOVE_ELEMENT;
      id: number;
    }
  | {
      kind: ActionKind.INSERT_ELEMENT;
      parentID: number;
      childID: number;
      index: number;
    }
  | {
      kind: ActionKind.SET_TEXT;
      id: number;
      text: string;
    }
  | {
      kind: ActionKind.ADD_EVENT_LISTENER;
      id: number;
      event: string;
      eventID: number;
    };

function createTreeHandler(port: MessagePort, rootElement: HTMLElement) {
  const treeHandler = new TreeHandler(rootElement, port);
  port.onmessage = (event) => {
    treeHandler.handleAction(event.data);
  };
  return { treeHandler };
}

class TreeHandler {
  private elementMap: Map<number, HTMLElement> = new Map();

  constructor(
    private rootElement: HTMLElement,
    private port: MessagePort
  ) {}

  handleAction(action: Action) {
    switch (action.kind) {
      case ActionKind.CREATE_ELEMENT:
        this.createElement(action.id, action.tag);
        break;
      case ActionKind.SET_ATTRIBUTE:
        this.updateElementAttribute(action.id, action.key, action.value);
        break;
      case ActionKind.REMOVE_ELEMENT:
        this.removeElement(action.id);
        break;
      case ActionKind.INSERT_ELEMENT:
        this.insertElement(action.parentID, action.childID, action.index);
        break;
      case ActionKind.SET_ROOT:
        this.setAsRoot(action.id);
        break;
      case ActionKind.SET_TEXT:
        this.setText(action.id, action.text);
        break;
      case ActionKind.ADD_EVENT_LISTENER:
        this.addEventListener(action.id, action.event, action.eventID);
        break;
    }
  }

  createElement(id: number, tag: string) {
    const el = document.createElement(tag);
    this.elementMap.set(id, el);
  }

  getElement(id: number): HTMLElement | null {
    return this.elementMap.get(id) ?? null;
  }

  removeElement(id: number) {
    const el = this.elementMap.get(id);
    el?.remove();
    this.elementMap.delete(id);
  }

  updateElementAttribute(id: number, key: string, value: any) {
    const el = this.elementMap.get(id);
    if (el) {
      if (key === 'class') {
        el.className = value;
      }
      (el as any)[key] = value;
    }
  }

  setText(id: number, text: string) {
    const el = this.elementMap.get(id);
    if (el) {
      el.textContent = text;
    }
  }

  insertElement(parentID: number, childID: number, index: number) {
    const parent = this.elementMap.get(parentID);
    const child = this.elementMap.get(childID);
    if (parent && child) {
      const referenceNode = parent.children.item(index) || null;
      parent.insertBefore(child, referenceNode);
    }
  }

  setAsRoot(id: number) {
    const el = this.elementMap.get(id);
    if (el) {
      this.rootElement.appendChild(el);
    }
  }

  addEventListener(id: number, event: string, eventID: number) {
    const el = this.elementMap.get(id);
    if (!el) {
      return;
    }
    const noOnLowerEvent = event.slice(2).toLowerCase();
    el.addEventListener(noOnLowerEvent, (e) => {
      console.log('event triggered', id, e);
      const { data, eventType } = getEventData(e);
      this.postMessage({
        kind: RenderSideEventKind.EVENT_FIRED,
        eventID,
        data,
        eventType,
        elementID: id,
      });
    });
  }

  postMessage(message: RenderSideEvent) {
    this.port.postMessage(message);
  }
}

function getEventData(event: Event) {
  if (event instanceof PointerEvent) {
    const data = {
      x: event.y,
      y: event.x,
      button: event.button,
    };
    return { data, eventType: 'PointerEvent' };
  }
  if (event instanceof InputEvent) {
    const data: InputEvent = {
      composed: event.composed,
      data: event.data,
    };
    return { data, eventType: 'InputEvent' };
  }
  return { eventType: 'Event', data: {} };
}

function mapEvent(eventData: RenderSideEvent, target: DOMLikeElement) {
  eventData.data.target = target;
  switch (eventData.eventType) {
    case 'PointerEvent':
      return new PointerEvent('pointerevent', eventData.data);
    case 'InputEvent':
      return new InputEvent('inputevent', eventData.data);
    default:
      return new Event('event');
  }
}
