const path = require('node:path');
const { BrowserWindow, ipcMain } = require('electron');

class SettingsWindow {
  constructor({ configuration, parentProvider, onSaved }) {
    this.configuration = configuration;
    this.parentProvider = parentProvider;
    this.onSaved = onSaved;
    this.window = undefined;
    this.registerHandlers();
  }

  registerHandlers() {
    ipcMain.handle('settings:load', (event) => {
      if (!this.isTrusted(event)) {
        return { panels: [] };
      }
      return this.configuration.load().toConfiguration();
    });

    ipcMain.handle('settings:save', (event, addresses) => {
      if (!this.isTrusted(event)) {
        return { ok: false, error: 'Недоверенный источник запроса' };
      }
      try {
        const panels = this.configuration.load().configuredWith(addresses);
        this.configuration.save(panels);
        this.onSaved(panels);
        setImmediate(() => this.close());
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error.message };
      }
    });
  }

  isTrusted(event) {
    return this.window && !this.window.isDestroyed() && event.sender === this.window.webContents;
  }

  isOpen() {
    return Boolean(this.window) && !this.window.isDestroyed();
  }

  open() {
    if (this.isOpen()) {
      this.window.focus();
      return;
    }

    const parent = this.parentProvider();
    this.window = new BrowserWindow({
      width: 560,
      height: 520,
      minWidth: 480,
      minHeight: 460,
      parent,
      modal: Boolean(parent),
      title: 'Настройка панелей',
      backgroundColor: '#0b1323',
      show: false,
      webPreferences: {
        preload: path.join(__dirname, 'settings-preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
      },
    });
    this.window.setMenuBarVisibility(false);
    this.window.loadFile(path.join(__dirname, 'settings.html'));
    this.window.once('ready-to-show', () => this.window?.show());
    this.window.on('closed', () => {
      this.window = undefined;
    });
  }

  close() {
    if (this.isOpen()) {
      this.window.close();
    }
  }

  dispose() {
    this.close();
    ipcMain.removeHandler('settings:load');
    ipcMain.removeHandler('settings:save');
  }
}

module.exports = { SettingsWindow };
