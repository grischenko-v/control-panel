import fs from 'node:fs';
import path from 'node:path';
import { PanelCollection, type PanelsConfiguration } from '../domain/panel-collection';

export interface PanelConfigurationRepositoryOptions {
  filePath: string;
  defaultFilePath: string;
  panelCount: number;
  watchInterval?: number;
}

export class PanelConfigurationRepository {
  readonly filePath: string;
  readonly defaultFilePath: string;
  readonly panelCount: number;
  readonly watchInterval: number;
  private listener?: (current: fs.Stats, previous: fs.Stats) => void;

  constructor({
    filePath,
    defaultFilePath,
    panelCount,
    watchInterval = 500,
  }: PanelConfigurationRepositoryOptions) {
    this.filePath = filePath;
    this.defaultFilePath = defaultFilePath;
    this.panelCount = panelCount;
    this.watchInterval = watchInterval;
  }

  load(): PanelCollection {
    try {
      this.ensureConfigurationExists();
      const configuration = JSON.parse(
        fs.readFileSync(this.filePath, 'utf8'),
      ) as Partial<PanelsConfiguration>;
      return PanelCollection.fromConfiguration(configuration, this.panelCount);
    } catch {
      return PanelCollection.empty(this.panelCount);
    }
  }

  save(panels: PanelCollection): void {
    this.ensureConfigurationExists();
    fs.writeFileSync(
      this.filePath,
      `${JSON.stringify(panels.toConfiguration(), null, 2)}\n`,
      'utf8',
    );
  }

  ensureConfigurationExists(): void {
    if (fs.existsSync(this.filePath)) {
      return;
    }
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    fs.copyFileSync(this.defaultFilePath, this.filePath);
  }

  watch(listener: (panels: PanelCollection) => void): void {
    this.stopWatching();
    this.ensureConfigurationExists();
    this.listener = () => listener(this.load());
    fs.watchFile(this.filePath, { interval: this.watchInterval }, this.listener);
  }

  stopWatching(): void {
    if (this.listener) {
      fs.unwatchFile(this.filePath, this.listener);
      this.listener = undefined;
    }
  }
}
