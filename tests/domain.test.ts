import { describe, expect, test } from 'bun:test';
import { combinedDesktopBounds } from '../src/domain/desktop-bounds';
import { DesktopWindowMode, type DesktopWindow } from '../src/domain/desktop-window-mode';
import { EqualPanelLayout } from '../src/domain/equal-panel-layout';
import { isIdentityAuthUrl, PanelAuthFocus } from '../src/domain/panel-auth-focus';
import { PanelAddress } from '../src/domain/panel-address';
import { PanelCollection } from '../src/domain/panel-collection';
import { reloadConfiguredPanels, type RefreshablePanelViewport } from '../src/domain/panel-refresh';

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
  alwaysOnTop = false;
  maximized = true;
  menuBarVisible = true;
  unmaximizeCalls = 0;
  maximizeCalls = 0;
  setAlwaysOnTopCalls: Array<{ flag: boolean; level?: Parameters<DesktopWindow['setAlwaysOnTop']>[1] }> = [];
  setMenuBarVisibilityCalls: boolean[] = [];
  setBoundsCalls: ReturnType<DesktopWindow['getNormalBounds']>[] = [];

  getNormalBounds(): ReturnType<DesktopWindow['getNormalBounds']> {
    return this.bounds;
  }

  isAlwaysOnTop(): boolean {
    return this.alwaysOnTop;
  }

  isMaximized(): boolean {
    return this.maximized;
  }

  isMenuBarVisible(): boolean {
    return this.menuBarVisible;
  }

  maximize(): void {
    this.maximized = true;
    this.maximizeCalls += 1;
  }

  setAlwaysOnTop(flag: boolean, level?: Parameters<DesktopWindow['setAlwaysOnTop']>[1]): void {
    this.alwaysOnTop = flag;
    this.setAlwaysOnTopCalls.push({ flag, level });
  }

  setBounds(bounds: ReturnType<DesktopWindow['getNormalBounds']>): void {
    this.bounds = bounds;
    this.setBoundsCalls.push(bounds);
  }

  setMenuBarVisibility(visible: boolean): void {
    this.menuBarVisible = visible;
    this.setMenuBarVisibilityCalls.push(visible);
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
    expect(window.setMenuBarVisibilityCalls).toEqual([false]);
    expect(window.setAlwaysOnTopCalls).toEqual([{ flag: true, level: 'screen-saver' }]);
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
    expect(window.setMenuBarVisibilityCalls).toEqual([false, true]);
    expect(window.setAlwaysOnTopCalls).toEqual([
      { flag: true, level: 'screen-saver' },
      { flag: false, level: undefined },
    ]);
    expect(window.maximizeCalls).toBe(1);
  });
});

class TestRefreshablePanelViewport implements RefreshablePanelViewport {
  readonly loadedTargets: string[] = [];

  constructor(private readonly destroyed = false) {}

  isDestroyed(): boolean {
    return this.destroyed;
  }

  reloadConfiguredPage(panel: Parameters<RefreshablePanelViewport['reloadConfiguredPage']>[0]): void {
    this.loadedTargets.push(panel.navigationTarget());
  }
}

describe('обновление панелей', () => {
  test('F5 заново открывает страницы из конфига', () => {
    const panels = PanelCollection.fromConfiguration({
      panels: [
        { title: 'Первая', url: 'https://example.com/home' },
        { title: 'Вторая', url: 'https://example.org/dashboard' },
        { title: 'Третья', url: 'https://example.net/status' },
      ],
    }, 3);
    const viewports = [
      new TestRefreshablePanelViewport(),
      new TestRefreshablePanelViewport(),
      new TestRefreshablePanelViewport(),
    ];

    reloadConfiguredPanels(panels, viewports);

    expect(viewports.map((viewport) => viewport.loadedTargets)).toEqual([
      ['https://example.com/home'],
      ['https://example.org/dashboard'],
      ['https://example.net/status'],
    ]);
  });

  test('F5 не трогает уже закрытую панель', () => {
    const panels = PanelCollection.fromConfiguration({
      panels: [
        { title: 'Первая', url: 'https://example.com/home' },
        { title: 'Вторая', url: 'https://example.org/dashboard' },
      ],
    }, 2);
    const viewports = [
      new TestRefreshablePanelViewport(),
      new TestRefreshablePanelViewport(true),
    ];

    reloadConfiguredPanels(panels, viewports);

    expect(viewports.map((viewport) => viewport.loadedTargets)).toEqual([
      ['https://example.com/home'],
      [],
    ]);
  });
});

describe('авторизация в одной панели', () => {
  test('распознает страницу авторизации по порту 8040', () => {
    expect(isIdentityAuthUrl('http://localhost:8040/login')).toBe(true);
    expect(isIdentityAuthUrl('https://identity.example.com:8040/auth')).toBe(true);
    expect(isIdentityAuthUrl('https://identity.example.com/auth')).toBe(false);
  });

  test('фиксирует первую панель с портом 8040 и отпускает ее после ухода с этого порта', () => {
    const focus = new PanelAuthFocus();

    expect(focus.handleNavigation(1, 'http://localhost:8040/login')).toBe('focused');
    expect(focus.activePosition()).toBe(1);
    expect(focus.handleNavigation(2, 'http://localhost:8040/login')).toBe('unchanged');
    expect(focus.handleNavigation(1, 'http://localhost:8040/login/callback')).toBe('unchanged');
    expect(focus.handleNavigation(1, 'https://example.com/dashboard')).toBe('released');
    expect(focus.activePosition()).toBeUndefined();
  });
});
