import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

class TestKeyboardEvent {
  defaultPrevented = false;
  readonly key = 'Backspace';
  readonly repeat = false;
  readonly altKey = false;
  readonly ctrlKey = false;
  readonly metaKey = false;
  readonly shiftKey = false;

  preventDefault(): void {
    this.defaultPrevented = true;
  }

  stopPropagation(): void {}
}

class TestElement {
  readonly style: Record<string, string> = {};
  readonly children: TestElement[] = [];
  clicked = 0;
  textContent = '';
  title = '';
  type = '';
  parent?: TestElement;
  private readonly listeners = new Map<string, Array<(event: TestKeyboardEvent) => void>>();

  constructor(
    readonly tagName: string,
    private readonly editable = false,
    readonly className = '',
  ) {}

  append(element: TestElement): void {
    element.parent = this;
    this.children.push(element);
  }

  setAttribute(): void {}

  addEventListener(type: string, listener: (event: TestKeyboardEvent) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  dispatch(type: string, event = new TestKeyboardEvent()): TestKeyboardEvent {
    this.listeners.get(type)?.forEach((listener) => listener(event));
    return event;
  }

  click(): void {
    this.clicked += 1;
  }

  closest(selector: string): TestElement | null {
    if (
      selector.includes('button') &&
      (this.tagName === 'BUTTON' || this.parent?.tagName === 'BUTTON')
    ) {
      return this.tagName === 'BUTTON' ? this : this.parent ?? null;
    }
    if (selector.includes('contenteditable') && this.editable) {
      return this;
    }
    if (selector.includes('role="textbox"') && this.editable) {
      return this;
    }
    return null;
  }
}

class TestDocument {
  readonly body = new TestElement('BODY');
  readonly documentElement = new TestElement('HTML');

  constructor(
    readonly activeElement: TestElement | null,
    private readonly pageControls: TestElement[],
  ) {}

  createElement(tagName: string): TestElement {
    return new TestElement(tagName.toUpperCase());
  }

  querySelector(selector: string): TestElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string): TestElement[] {
    if (selector === '.header-hide-all-button__icon') {
      return this.pageControls.filter((element) =>
        element.className.split(/\s+/).includes('header-hide-all-button__icon'));
    }

    return [];
  }
}

class TestWindow {
  private readonly listeners = new Map<string, Array<(event: TestKeyboardEvent) => void>>();

  addEventListener(
    type: string,
    listener: (event: TestKeyboardEvent) => void,
  ): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  dispatch(type: string, event = new TestKeyboardEvent()): TestKeyboardEvent {
    this.listeners.get(type)?.forEach((listener) => listener(event));
    return event;
  }
}

class TestMutationObserver {
  constructor(readonly callback: () => void) {}

  observe(): void {}
}

function loadPanelPreload({
  activeElement,
  pageControls = [],
}: {
  activeElement: TestElement | null;
  pageControls?: TestElement[];
}): {
  document: TestDocument;
  ipcListeners: Map<string, Array<(_event: unknown, expanded: boolean) => void>>;
  window: TestWindow;
  sentChannels: string[];
} {
  const script = readFileSync(
    path.join(import.meta.dir, '../build/src/electron/panel-preload.js'),
    'utf8',
  );
  const document = new TestDocument(activeElement, pageControls);
  const testWindow = new TestWindow();
  const ipcListeners = new Map<string, Array<(_event: unknown, expanded: boolean) => void>>();
  const sentChannels: string[] = [];

  vm.runInNewContext(script, {
    document,
    exports: {},
    HTMLElement: TestElement,
    MutationObserver: TestMutationObserver,
    require: (moduleName: string) => {
      if (moduleName !== 'electron') {
        throw new Error(`Unexpected module: ${moduleName}`);
      }
      return {
        ipcRenderer: {
          on: (
            channel: string,
            listener: (_event: unknown, expanded: boolean) => void,
          ) => {
            ipcListeners.set(channel, [...(ipcListeners.get(channel) ?? []), listener]);
          },
          send: (channel: string) => sentChannels.push(channel),
        },
      };
    },
    window: testWindow,
  });

  return { document, ipcListeners, window: testWindow, sentChannels };
}

describe('панельный preload', () => {
  test('Backspace отправляет команду назад, если фокус не в поле ввода', () => {
    const { window, sentChannels } = loadPanelPreload({
      activeElement: new TestElement('BODY'),
    });
    const event = window.dispatch('keydown');

    expect(event.defaultPrevented).toBe(true);
    expect(sentChannels).toEqual(['panel:navigate-back']);
  });

  test('Backspace не перехватывается в поле ввода', () => {
    const { window, sentChannels } = loadPanelPreload({
      activeElement: new TestElement('INPUT'),
    });
    const event = window.dispatch('keydown');

    expect(event.defaultPrevented).toBe(false);
    expect(sentChannels).toEqual([]);
  });

  test('Backspace не перехватывается в редактируемой области', () => {
    const { window, sentChannels } = loadPanelPreload({
      activeElement: new TestElement('DIV', true),
    });
    const event = window.dispatch('keydown');

    expect(event.defaultPrevented).toBe(false);
    expect(sentChannels).toEqual([]);
  });

  test('кнопка разворота отправляет команду и меняет подпись состояния', () => {
    const { document, ipcListeners, window, sentChannels } = loadPanelPreload({
      activeElement: new TestElement('BODY'),
    });

    window.dispatch('DOMContentLoaded');
    const button = document.body.children[0];
    button?.dispatch('click');
    ipcListeners.get('panel:expanded-state')?.forEach((listener) => listener({}, true));

    expect(sentChannels).toEqual(['panel:toggle-expanded']);
    expect(button?.textContent).toBe('↙');
    expect(button?.title).toBe('Вернуть панель на место');
  });

  test('нажимает кнопку скрытия header в обычном режиме', () => {
    const headerButton = new TestElement('BUTTON');
    const headerIcon = new TestElement('SPAN', false, 'header-hide-all-button__icon');
    headerButton.append(headerIcon);
    const { window } = loadPanelPreload({
      activeElement: new TestElement('BODY'),
      pageControls: [headerButton, headerIcon],
    });

    window.dispatch('DOMContentLoaded');

    expect(headerButton.clicked).toBe(1);
    expect(headerIcon.clicked).toBe(0);
  });

  test('не нажимает кнопку скрытия header в развернутом режиме', () => {
    const headerButton = new TestElement('BUTTON');
    const headerIcon = new TestElement('SPAN', false, 'header-hide-all-button__icon');
    headerButton.append(headerIcon);
    const { ipcListeners, window } = loadPanelPreload({
      activeElement: new TestElement('BODY'),
      pageControls: [headerButton, headerIcon],
    });

    ipcListeners.get('panel:expanded-state')?.forEach((listener) => listener({}, true));
    window.dispatch('DOMContentLoaded');

    expect(headerButton.clicked).toBe(0);
  });

  test('нажимает кнопку скрытия header после выхода из развернутого режима', () => {
    const headerButton = new TestElement('BUTTON');
    const headerIcon = new TestElement('SPAN', false, 'header-hide-all-button__icon');
    headerButton.append(headerIcon);
    const { ipcListeners, window } = loadPanelPreload({
      activeElement: new TestElement('BODY'),
      pageControls: [headerButton, headerIcon],
    });

    ipcListeners.get('panel:expanded-state')?.forEach((listener) => listener({}, true));
    window.dispatch('DOMContentLoaded');
    ipcListeners.get('panel:expanded-state')?.forEach((listener) => listener({}, false));

    expect(headerButton.clicked).toBe(1);
  });
});
