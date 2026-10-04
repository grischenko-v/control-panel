import { BrowserWindow } from 'electron';
import type { EqualPanelLayout } from '../domain/equal-panel-layout';
import type { PanelCollection } from '../domain/panel-collection';
import { PanelViewport } from './panel-viewport';

export class DashboardWindow {
  private readonly layout: EqualPanelLayout;
  private window?: BrowserWindow;
  private viewports: PanelViewport[] = [];

  constructor({ layout }: { layout: EqualPanelLayout }) {
    this.layout = layout;
    this.relayout = this.relayout.bind(this);
  }

  isOpen(): boolean {
    return Boolean(this.window) && !this.window?.isDestroyed();
  }

  nativeWindow(): BrowserWindow | undefined {
    return this.isOpen() ? this.window : undefined;
  }

  open(panels: PanelCollection): void {
    if (this.isOpen()) {
      this.apply(panels);
      return;
    }

    this.window = new BrowserWindow({
      width: 1440,
      height: 900,
      minWidth: 600,
      minHeight: 300,
      title: 'Панель управления',
      backgroundColor: '#0b1323',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    this.window.setAutoHideMenuBar(true);
    this.viewports = [...panels].map(
      (panel) => new PanelViewport({ hostWindow: this.window as BrowserWindow, panel }),
    );
    this.window.on('resize', this.relayout);
    this.window.on('maximize', this.relayout);
    this.window.on('unmaximize', this.relayout);
    this.window.on('closed', () => this.release());
    this.window.maximize();
    this.relayout();
  }

  apply(panels: PanelCollection): void {
    panels.forEach((panel, position) => this.viewports[position]?.show(panel));
  }

  relayout(): void {
    if (!this.window || this.window.isDestroyed()) {
      return;
    }
    const bounds = this.layout.arrange(this.window.getContentBounds());
    this.viewports.forEach((viewport, position) => {
      const panelBounds = bounds[position];
      if (panelBounds) {
        viewport.placeWithin(panelBounds);
      }
    });
  }

  release(): void {
    this.viewports.splice(0).forEach((viewport) => viewport.dispose());
    this.window = undefined;
  }
}
