import { Menu, type App, type MenuItemConstructorOptions } from 'electron';
import type { EqualPanelLayout } from '../domain/equal-panel-layout';
import type { PanelConfigurationRepository } from '../infrastructure/panel-configuration-repository';
import { DashboardWindow } from './dashboard-window';
import { SettingsWindow } from './settings-window';

export interface DashboardApplicationOptions {
  app: App;
  configuration: PanelConfigurationRepository;
  layout: EqualPanelLayout;
}

export class DashboardApplication {
  private readonly app: App;
  private readonly configuration: PanelConfigurationRepository;
  private readonly dashboard: DashboardWindow;
  private readonly settings: SettingsWindow;

  constructor({ app, configuration, layout }: DashboardApplicationOptions) {
    this.app = app;
    this.configuration = configuration;
    this.dashboard = new DashboardWindow({ layout });
    this.settings = new SettingsWindow({
      configuration,
      parentProvider: () => this.dashboard.nativeWindow(),
      onSaved: (panels) => this.dashboard.apply(panels),
    });
  }

  start(): void {
    void this.app.whenReady().then(() => {
      this.openDashboard();
      this.installApplicationMenu();
      this.configuration.watch((panels) => this.dashboard.apply(panels));
      this.app.on('activate', () => this.openDashboard());
    });

    this.app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.app.quit();
      }
    });
    this.app.on('before-quit', () => {
      this.configuration.stopWatching();
      this.settings.dispose();
    });
  }

  private openDashboard(): void {
    const panels = this.configuration.load();
    this.dashboard.open(panels);
    if (panels.needsConfiguration()) {
      this.settings.open();
    }
  }

  private openSettings(): void {
    this.settings.open();
  }

  private installApplicationMenu(): void {
    const settingsItem: MenuItemConstructorOptions = {
      label: 'Настройки панелей…',
      accelerator: 'CommandOrControl+,',
      click: () => this.openSettings(),
    };
    const template: MenuItemConstructorOptions[] = process.platform === 'darwin'
      ? [
          {
            label: this.app.name,
            submenu: [
              settingsItem,
              { type: 'separator' },
              { label: 'Выйти', accelerator: 'Command+Q', click: () => this.app.quit() },
            ],
          },
          {
            label: 'Правка',
            submenu: [
              { label: 'Отменить', role: 'undo' },
              { label: 'Повторить', role: 'redo' },
              { type: 'separator' },
              { label: 'Вырезать', role: 'cut' },
              { label: 'Копировать', role: 'copy' },
              { label: 'Вставить', role: 'paste' },
              { label: 'Выбрать всё', role: 'selectAll' },
            ],
          },
        ]
      : [
          {
            label: 'Настройки',
            submenu: [
              settingsItem,
              { type: 'separator' },
              { label: 'Выйти', accelerator: 'Alt+F4', click: () => this.app.quit() },
            ],
          },
        ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }
}
