const fs = require('node:fs');
const path = require('node:path');
const { PanelCollection } = require('../domain/panel-collection');

class PanelConfigurationRepository {
  constructor({ filePath, defaultFilePath, panelCount, watchInterval = 500 }) {
    this.filePath = filePath;
    this.defaultFilePath = defaultFilePath;
    this.panelCount = panelCount;
    this.watchInterval = watchInterval;
    this.listener = undefined;
  }

  load() {
    try {
      this.ensureConfigurationExists();
      const configuration = JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
      return PanelCollection.fromConfiguration(configuration, this.panelCount);
    } catch {
      return PanelCollection.empty(this.panelCount);
    }
  }

  save(panels) {
    this.ensureConfigurationExists();
    fs.writeFileSync(
      this.filePath,
      `${JSON.stringify(panels.toConfiguration(), null, 2)}\n`,
      'utf8',
    );
  }

  ensureConfigurationExists() {
    if (fs.existsSync(this.filePath)) {
      return;
    }
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.copyFileSync(this.defaultFilePath, this.filePath);
  }

  watch(listener) {
    this.stopWatching();
    this.ensureConfigurationExists();
    this.listener = () => listener(this.load());
    fs.watchFile(this.filePath, { interval: this.watchInterval }, this.listener);
  }

  stopWatching() {
    if (this.listener) {
      fs.unwatchFile(this.filePath, this.listener);
      this.listener = undefined;
    }
  }
}

module.exports = { PanelConfigurationRepository };
