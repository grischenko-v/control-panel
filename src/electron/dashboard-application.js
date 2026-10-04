const { DashboardWindow } = require('./dashboard-window');
const { SettingsWindow } = require('./settings-window');
const { Menu } = require('electron');

class DashboardApplication {
  constructor({ app, configuration, layout }) {
    this.app = app;
    this.configuration = configuration;
    this.dashboard = new DashboardWindow({ layout });
    this.settings = new SettingsWindow({
      configuration,
      parentProvider: () => this.dashboard.nativeWindow(),
      onSaved: (panels) => this.dashboard.apply(panels),
    });
  }

  start() {
    this.app.whenReady().then(() => {
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

  openDashboard() {
    const panels = this.configuration.load();
    this.dashboard.open(panels);
    if (panels.needsConfiguration()) {
      this.settings.open();
    }
  }

  openSettings() {
    this.settings.open();
  }

  installApplicationMenu() {
    const settingsItem = {
      label: 'Настройки панелей…',
      accelerator: 'CommandOrControl+,',
      click: () => this.openSettings(),
    };
    const template = process.platform === 'darwin'
      ? [
          {
            label: this.app.name,
            submenu: [settingsItem, { type: 'separator' }, { role: 'quit' }],
          },
          {
            label: 'Правка',
            submenu: [
              { role: 'undo' },
              { role: 'redo' },
              { type: 'separator' },
              { role: 'cut' },
              { role: 'copy' },
              { role: 'paste' },
              { role: 'selectAll' },
            ],
          },
        ]
      : [
          {
            label: 'Настройки',
            submenu: [settingsItem, { type: 'separator' }, { role: 'quit' }],
          },
        ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
  }
}

module.exports = { DashboardApplication };
