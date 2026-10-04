const { WebContentsView } = require('electron');

class PanelViewport {
  constructor({ hostWindow, panel }) {
    this.panel = undefined;
    this.view = new WebContentsView({
      webPreferences: {
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

  show(panel) {
    if (this.panel?.hasSameContent(panel)) {
      this.panel = panel;
      return;
    }
    this.panel = panel;
    this.view.webContents.loadURL(panel.navigationTarget());
  }

  placeWithin(bounds) {
    this.view.setBounds(bounds.toElectronBounds());
  }

  dispose() {
    if (!this.view.webContents.isDestroyed()) {
      this.view.webContents.close();
    }
  }
}

module.exports = { PanelViewport };
