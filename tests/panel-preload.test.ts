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
}

class TestElement {
  constructor(readonly tagName: string, private readonly editable = false) {}

  closest(selector: string): TestElement | null {
    if (selector.includes('contenteditable') && this.editable) {
      return this;
    }
    if (selector.includes('role="textbox"') && this.editable) {
      return this;
    }
    return null;
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

function loadPanelPreload({
  activeElement,
}: {
  activeElement: TestElement | null;
}): {
  window: TestWindow;
  sentChannels: string[];
} {
  const script = readFileSync(
    path.join(import.meta.dir, '../build/src/electron/panel-preload.js'),
    'utf8',
  );
  const testWindow = new TestWindow();
  const sentChannels: string[] = [];

  vm.runInNewContext(script, {
    document: {
      activeElement,
    },
    exports: {},
    require: (moduleName: string) => {
      if (moduleName !== 'electron') {
        throw new Error(`Unexpected module: ${moduleName}`);
      }
      return {
        ipcRenderer: {
          send: (channel: string) => sentChannels.push(channel),
        },
      };
    },
    window: testWindow,
  });

  return { window: testWindow, sentChannels };
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
});
