import path from 'node:path';
import { BrowserWindow, ipcMain, type IpcMainInvokeEvent } from 'electron';
import type { PanelCollection } from '../domain/panel-collection';
import type { PanelConfigurationRepository } from '../infrastructure/panel-configuration-repository';

export interface SettingsWindowOptions {
  configuration: PanelConfigurationRepository;
  parentProvider: () => BrowserWindow | undefined;
  onSaved: (panels: PanelCollection) => void;
}

export class SettingsWindow {
  private readonly configuration: PanelConfigurationRepository;
  private readonly parentProvider: () => BrowserWindow | undefined;
  private readonly onSaved: (panels: PanelCollection) => void;
  private window?: BrowserWindow;

  constructor({ configuration, parentProvider, onSaved }: SettingsWindowOptions) {
    this.configuration = configuration;
    this.parentProvider = parentProvider;
    this.onSaved = onSaved;
    this.registerHandlers();
  }

  private registerHandlers(): void {
    ipcMain.handle('settings:load', (event) => {
      if (!this.isTrusted(event)) {
        return { panels: [] };
      }
      return this.configuration.load().toConfiguration();
    });

    ipcMain.handle('settings:save', (event, addresses: unknown) => {
      if (!this.isTrusted(event)) {
        return { ok: false, error: 'Недоверенный источник запроса' };
      }
      try {
        if (!Array.isArray(addresses) || !addresses.every((item) => typeof item === 'string')) {
          throw new Error('Некорректный формат адресов');
        }
        const panels = this.configuration.load().configuredWith(addresses);
        this.configuration.save(panels);
        this.onSaved(panels);
        setImmediate(() => this.close());
        return { ok: true };
      } catch (error) {
        return {
          ok: false,
          error: error instanceof Error ? error.message : 'Не удалось сохранить настройки',
        };
      }
    });
  }

  private isTrusted(event: IpcMainInvokeEvent): boolean {
    const window = this.window;
    return Boolean(window) &&
      !window?.isDestroyed() &&
      event.sender === window?.webContents;
  }

  isOpen(): boolean {
    return Boolean(this.window) && !this.window?.isDestroyed();
  }

  open(): void {
    if (this.isOpen()) {
      this.window?.focus();
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
    void this.window.loadFile(path.join(__dirname, 'settings.html'));
    this.window.once('ready-to-show', () => this.window?.show());
    this.window.on('closed', () => {
      this.window = undefined;
    });
  }

  close(): void {
    if (this.isOpen()) {
      this.window?.close();
    }
  }

  dispose(): void {
    this.close();
    ipcMain.removeHandler('settings:load');
    ipcMain.removeHandler('settings:save');
  }
}
