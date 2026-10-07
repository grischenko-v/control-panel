import path from 'node:path';
import { WebContentsView, type BrowserWindow, type WebContents } from 'electron';
import type { Panel } from '../domain/panel';
import type { PanelBounds } from '../domain/equal-panel-layout';

export class PanelViewport {
  private panel?: Panel;
  private readonly view: WebContentsView;

  constructor({ hostWindow, panel }: { hostWindow: BrowserWindow; panel: Panel }) {
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
    if (this.panel?.hasSameContent(panel)) {
      this.panel = panel;
      return;
    }
    this.panel = panel;
    void this.view.webContents.loadURL(panel.navigationTarget());
  }

  placeWithin(bounds: PanelBounds): void {
    this.view.setBounds(bounds.toElectronBounds());
  }

  webContents(): WebContents {
    return this.view.webContents;
  }

  dispose(): void {
    if (!this.view.webContents.isDestroyed()) {
      this.view.webContents.close();
    }
  }
}
