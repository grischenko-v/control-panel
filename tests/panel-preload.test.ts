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
  private keydownListener?: (event: TestKeyboardEvent) => void;

  addEventListener(
    type: string,
    listener: (event: TestKeyboardEvent) => void,
  ): void {
    if (type === 'keydown') {
      this.keydownListener = listener;
    }
  }

  dispatch(event: TestKeyboardEvent): void {
    this.keydownListener?.(event);
  }
}

function loadPanelPreload(activeElement: TestElement | null): {
  event: TestKeyboardEvent;
  sentChannels: string[];
} {
  const script = readFileSync(
    path.join(import.meta.dir, '../build/src/electron/panel-preload.js'),
    'utf8',
  );
  const testWindow = new TestWindow();
  const sentChannels: string[] = [];

  vm.runInNewContext(script, {
    document: { activeElement },
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

  const event = new TestKeyboardEvent();
  testWindow.dispatch(event);
  return { event, sentChannels };
}

describe('панельный preload', () => {
  test('Backspace отправляет команду назад, если фокус не в поле ввода', () => {
    const { event, sentChannels } = loadPanelPreload(new TestElement('BODY'));

    expect(event.defaultPrevented).toBe(true);
    expect(sentChannels).toEqual(['panel:navigate-back']);
  });

  test('Backspace не перехватывается в поле ввода', () => {
    const { event, sentChannels } = loadPanelPreload(new TestElement('INPUT'));

    expect(event.defaultPrevented).toBe(false);
    expect(sentChannels).toEqual([]);
  });

  test('Backspace не перехватывается в редактируемой области', () => {
    const { event, sentChannels } = loadPanelPreload(new TestElement('DIV', true));

    expect(event.defaultPrevented).toBe(false);
    expect(sentChannels).toEqual([]);
  });
});
