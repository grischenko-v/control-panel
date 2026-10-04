import path from 'node:path';
import { app } from 'electron';
import { EqualPanelLayout } from './src/domain/equal-panel-layout';
import { DashboardApplication } from './src/electron/dashboard-application';
import { PanelConfigurationRepository } from './src/infrastructure/panel-configuration-repository';

const configuration = new PanelConfigurationRepository({
  filePath: path.join(app.getPath('userData'), 'config.json'),
  defaultFilePath: path.join(app.getAppPath(), 'config.json'),
  panelCount: 3,
});
const layout = new EqualPanelLayout({ panelCount: 3, gap: 2 });

new DashboardApplication({ app, configuration, layout }).start();
