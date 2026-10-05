import { describe, expect, test } from 'bun:test';
import { combinedDesktopBounds } from '../src/domain/desktop-bounds';
import { DesktopWindowMode, type DesktopWindow } from '../src/domain/desktop-window-mode';
import { EqualPanelLayout } from '../src/domain/equal-panel-layout';
import { PanelAddress } from '../src/domain/panel-address';
import { PanelCollection } from '../src/domain/panel-collection';

describe('адрес панели', () => {
  test('принимает только HTTP и HTTPS', () => {
    expect(PanelAddress.isSupported('https://example.com')).toBe(true);
    expect(PanelAddress.isSupported('http://localhost:8080')).toBe(true);
    expect(PanelAddress.isSupported('file:///tmp/page.html')).toBe(false);
    expect(PanelAddress.isSupported('не адрес')).toBe(false);
  });

  test('пустая панель открывает безопасную пустую страницу', () => {
    expect(PanelAddress.empty().navigationTarget()).toBe('about:blank');
  });
});

describe('набор панелей', () => {
  test('всегда восстанавливает требуемое количество панелей', () => {
    const panels = PanelCollection.fromConfiguration({ panels: [] }, 3);

    expect(panels.size).toBe(3);
    expect(panels.needsConfiguration()).toBe(true);
    expect(panels.toConfiguration().panels.map((panel) => panel.title)).toEqual([
      'Панель 1',
      'Панель 2',
      'Панель 3',
    ]);
  });
});

describe('раскладка панелей', () => {
  test('делит доступную ширину на три части без пересечений', () => {
    const bounds = new EqualPanelLayout({ panelCount: 3, gap: 2 })
      .arrange({ width: 1000, height: 600 })
      .map((item) => item.toElectronBounds());

    expect(bounds).toEqual([
      { x: 0, y: 0, width: 332, height: 600 },
      { x: 334, y: 0, width: 332, height: 600 },
      { x: 668, y: 0, width: 332, height: 600 },
    ]);
  });
});

describe('границы рабочего стола', () => {
  test('объединяет несколько дисплеев в один общий прямоугольник', () => {
    expect(combinedDesktopBounds([
      { bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      { bounds: { x: 1920, y: 0, width: 2560, height: 1440 } },
      { bounds: { x: -1280, y: 100, width: 1280, height: 1024 } },
    ])).toEqual({
      x: -1280,
      y: 0,
      width: 5760,
      height: 1440,
    });
  });
});

class TestDesktopWindow implements DesktopWindow {
  bounds = { x: 100, y: 100, width: 1200, height: 800 };
  maximized = true;
  unmaximizeCalls = 0;
  maximizeCalls = 0;
  setBoundsCalls: ReturnType<DesktopWindow['getNormalBounds']>[] = [];

  getNormalBounds(): ReturnType<DesktopWindow['getNormalBounds']> {
    return this.bounds;
  }

  isMaximized(): boolean {
    return this.maximized;
  }

  maximize(): void {
    this.maximized = true;
    this.maximizeCalls += 1;
  }

  setBounds(bounds: ReturnType<DesktopWindow['getNormalBounds']>): void {
    this.bounds = bounds;
    this.setBoundsCalls.push(bounds);
  }

  unmaximize(): void {
    this.maximized = false;
    this.unmaximizeCalls += 1;
  }
}

describe('широкий режим окна', () => {
  test('F11 разворачивает окно на весь рабочий стол и повторным нажатием возвращает назад', () => {
    const window = new TestDesktopWindow();
    const mode = new DesktopWindowMode(() => [
      { bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      { bounds: { x: 1920, y: 0, width: 2560, height: 1440 } },
      { bounds: { x: -1280, y: 100, width: 1280, height: 1024 } },
    ]);

    mode.toggle(window);

    expect(window.unmaximizeCalls).toBe(1);
    expect(window.setBoundsCalls.at(-1)).toEqual({
      x: -1280,
      y: 0,
      width: 5760,
      height: 1440,
    });

    mode.toggle(window);

    expect(window.setBoundsCalls.at(-1)).toEqual({
      x: 100,
      y: 100,
      width: 1200,
      height: 800,
    });
    expect(window.maximizeCalls).toBe(1);
  });
});
