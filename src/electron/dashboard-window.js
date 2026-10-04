const { BrowserWindow } = require('electron');
const { PanelViewport } = require('./panel-viewport');

class DashboardWindow {
  constructor({ layout }) {
    this.layout = layout;
    this.window = undefined;
    this.viewports = [];
    this.relayout = this.relayout.bind(this);
  }

  isOpen() {
    return Boolean(this.window) && !this.window.isDestroyed();
  }

  nativeWindow() {
    return this.isOpen() ? this.window : undefined;
  }

  open(panels) {
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
      (panel) => new PanelViewport({ hostWindow: this.window, panel }),
    );
    this.window.on('resize', this.relayout);
    this.window.on('maximize', this.relayout);
    this.window.on('unmaximize', this.relayout);
    this.window.on('closed', () => this.release());
    this.window.maximize();
    this.relayout();
  }

  apply(panels) {
    panels.forEach((panel, position) => this.viewports[position]?.show(panel));
  }

  relayout() {
    if (!this.isOpen()) {
      return;
    }
    const bounds = this.layout.arrange(this.window.getContentBounds());
    this.viewports.forEach((viewport, position) => viewport.placeWithin(bounds[position]));
  }

  release() {
    this.viewports.splice(0).forEach((viewport) => viewport.dispose());
    this.window = undefined;
  }
}

module.exports = { DashboardWindow };
