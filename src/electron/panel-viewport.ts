import path from 'node:path';
import { WebContentsView, type BrowserWindow, type WebContents } from 'electron';
import type { Panel } from '../domain/panel';
import type { PanelBounds } from '../domain/equal-panel-layout';
import type { RefreshablePanelViewport } from '../domain/panel-refresh';

export class PanelViewport implements RefreshablePanelViewport {
  private panel?: Panel;
  private hasLoadedPanel = false;
  private readonly hostWindow: BrowserWindow;
  private readonly view: WebContentsView;

  constructor({ hostWindow, panel }: {
    hostWindow: BrowserWindow;
    panel: Panel;
  }) {
    this.hostWindow = hostWindow;
    this.view = new WebContentsView({
      webPreferences: {
        preload: path.join(__dirname, 'panel-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    this.view.setBackgroundColor('#ffffff');
    this.view.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    hostWindow.contentView.addChildView(this.view);
    this.show(panel);
  }

  show(panel: Panel): void {
    if (this.hasLoadedPanel && this.panel?.hasSameContent(panel)) {
      this.panel = panel;
      return;
    }
    this.panel = panel;
    this.hasLoadedPanel = true;
    void this.view.webContents.loadURL(panel.navigationTarget());
  }

  reloadConfiguredPage(panel: Panel): void {
    this.panel = panel;
    this.hasLoadedPanel = true;
    void this.view.webContents.loadURL(panel.navigationTarget());
  }

  placeWithin(bounds: PanelBounds): void {
    this.view.setBounds(bounds.toElectronBounds());
  }

  collapse(): void {
    this.view.setBounds({ x: 0, y: 0, width: 1, height: 1 });
  }

  bringToFront(): void {
    this.hostWindow.contentView.removeChildView(this.view);
    this.hostWindow.contentView.addChildView(this.view);
  }

  webContents(): WebContents {
    return this.view.webContents;
  }

  isDestroyed(): boolean {
    return this.view.webContents.isDestroyed();
  }

  dispose(): void {
    if (!this.view.webContents.isDestroyed()) {
      this.view.webContents.close();
    }
  }
}
