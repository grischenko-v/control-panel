import { BrowserWindow, ipcMain, screen, type Event, type Input, type IpcMainEvent } from 'electron';
import { DesktopWindowMode } from '../domain/desktop-window-mode';
import type { EqualPanelLayout } from '../domain/equal-panel-layout';
import type { PanelCollection } from '../domain/panel-collection';
import { reloadConfiguredPanels } from '../domain/panel-refresh';
import { PanelViewport } from './panel-viewport';

export class DashboardWindow {
  private readonly layout: EqualPanelLayout;
  private readonly desktopMode: DesktopWindowMode;
  private window?: BrowserWindow;
  private panels?: PanelCollection;
  private viewports: PanelViewport[] = [];

  constructor({ layout }: { layout: EqualPanelLayout }) {
    this.layout = layout;
    this.desktopMode = new DesktopWindowMode(() => screen.getAllDisplays());
    this.relayout = this.relayout.bind(this);
    this.fitToDesktop = this.fitToDesktop.bind(this);
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
    this.panels = panels;
    this.configureMenuVisibility();
    this.viewports = [...panels].map(
      (panel) => new PanelViewport({ hostWindow: this.window as BrowserWindow, panel }),
    );
    this.installKeyboardShortcuts();
    this.window.on('resize', this.relayout);
    this.window.on('maximize', this.relayout);
    this.window.on('unmaximize', this.relayout);
    this.window.on('closed', () => this.release());
    ipcMain.on('panel:navigate-back', this.navigatePanelBack);
    screen.on('display-added', this.fitToDesktop);
    screen.on('display-removed', this.fitToDesktop);
    screen.on('display-metrics-changed', this.fitToDesktop);
    this.window.maximize();
    this.relayout();
  }

  private configureMenuVisibility(): void {
    if (!this.window) {
      return;
    }

    const shouldKeepSettingsMenuVisible = process.platform === 'win32';
    this.window.setAutoHideMenuBar(!shouldKeepSettingsMenuVisible);
    if (shouldKeepSettingsMenuVisible) {
      this.window.setMenuBarVisibility(true);
    }
  }

  apply(panels: PanelCollection): void {
    this.panels = panels;
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

  private installKeyboardShortcuts(): void {
    const window = this.window;
    if (!window) {
      return;
    }

    const handleInput = (event: Event, input: Input) => {
      if (input.type !== 'keyDown' || input.isAutoRepeat) {
        return;
      }

      if (input.key === 'F11') {
        event.preventDefault();
        this.toggleDesktopWidth();
        return;
      }

      if (input.key === 'F5') {
        event.preventDefault();
        this.reloadPanels();
      }
    };

    window.webContents.on('before-input-event', handleInput);
    this.viewports.forEach((viewport) => {
      viewport.webContents().on('before-input-event', handleInput);
    });
  }

  private toggleDesktopWidth(): void {
    const window = this.nativeWindow();
    if (!window) {
      return;
    }

    this.desktopMode.toggle(window);
  }

  private fitToDesktop(): void {
    const window = this.nativeWindow();
    if (!window || !this.desktopMode.isActive()) {
      return;
    }
    this.desktopMode.fit(window);
  }

  private reloadPanels(): void {
    reloadConfiguredPanels(this.panels, this.viewports);
  }

  private readonly navigatePanelBack = (event: IpcMainEvent): void => {
    const viewport = this.viewports.find((item) => item.webContents() === event.sender);
    const webContents = viewport?.webContents();
    if (!webContents || webContents.isDestroyed() || !webContents.canGoBack()) {
      return;
    }
    webContents.goBack();
  };

  release(): void {
    ipcMain.off('panel:navigate-back', this.navigatePanelBack);
    screen.off('display-added', this.fitToDesktop);
    screen.off('display-removed', this.fitToDesktop);
    screen.off('display-metrics-changed', this.fitToDesktop);
    this.viewports.splice(0).forEach((viewport) => viewport.dispose());
    this.panels = undefined;
    this.window = undefined;
    this.desktopMode.reset();
  }
}
