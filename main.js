const path = require('node:path');
const { app } = require('electron');
const { EqualPanelLayout } = require('./src/domain/equal-panel-layout');
const { PanelConfigurationRepository } = require('./src/infrastructure/panel-configuration-repository');
const { DashboardApplication } = require('./src/electron/dashboard-application');

const configuration = new PanelConfigurationRepository({
  filePath: path.join(app.getPath('userData'), 'config.json'),
  defaultFilePath: path.join(__dirname, 'config.json'),
  panelCount: 3,
});
const layout = new EqualPanelLayout({ panelCount: 3, gap: 2 });

new DashboardApplication({ app, configuration, layout }).start();
