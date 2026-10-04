import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

class TestElement {
  readonly children: TestElement[] = [];
  textContent = '';
  value = '';
  type = '';
  name = '';
  placeholder = '';
  disabled = false;
  focused = false;
  private readonly listeners = new Map<string, (event: TestEvent) => void>();

  constructor(readonly tagName: string) {}

  append(...elements: TestElement[]): void {
    this.children.push(...elements);
  }

  setAttribute(): void {}

  focus(): void {
    this.focused = true;
  }

  addEventListener(type: string, listener: (event: TestEvent) => void): void {
    this.listeners.set(type, listener);
  }

  querySelector(selector: string): TestElement | null {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  querySelectorAll(selector: string): TestElement[] {
    const expectedTag = selector.toUpperCase();
    return this.children.flatMap((child) => [
      ...(child.tagName === expectedTag ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
}

class TestEvent {
  defaultPrevented = false;

  preventDefault(): void {
    this.defaultPrevented = true;
  }
}

class TestDocument {
  readonly form = new TestElement('FORM');
  readonly fields = new TestElement('DIV');
  readonly error = new TestElement('P');
  readonly button = new TestElement('BUTTON');

  createElement(tagName: string): TestElement {
    return new TestElement(tagName.toUpperCase());
  }

  querySelector(selector: string): TestElement | null {
    return {
      '#settings-form': this.form,
      '#panel-fields': this.fields,
      '#form-error': this.error,
      '#settings-form button': this.button,
    }[selector] ?? null;
  }
}

const rendererPath = path.join(import.meta.dir, '../build/src/electron/settings.js');

describe('окно настройки', () => {
  test('собранный скрипт работает без Node.js globals и показывает три поля', async () => {
    const document = new TestDocument();
    const script = readFileSync(rendererPath, 'utf8');
    const panels = Array.from({ length: 3 }, (_value, position) => ({
      title: `Панель ${position + 1}`,
      url: '',
    }));

    vm.runInNewContext(script, {
      document,
      URL,
      window: {
        settingsAPI: {
          load: () => Promise.resolve({ panels }),
          save: () => Promise.resolve({ ok: true }),
        },
      },
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    const inputs = document.fields.querySelectorAll('input');
    expect(inputs).toHaveLength(3);
    expect(inputs.map((input) => input.placeholder)).toEqual([
      'https://адрес-сайта.рф',
      'https://адрес-сайта.рф',
      'https://адрес-сайта.рф',
    ]);
    expect(inputs[0]?.focused).toBe(true);
  });
});
