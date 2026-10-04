import { describe, expect, test } from 'bun:test';
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
