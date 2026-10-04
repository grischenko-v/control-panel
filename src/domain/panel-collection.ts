import { Panel, type PanelConfiguration } from './panel';

export interface PanelsConfiguration {
  panels: PanelConfiguration[];
  windows?: PanelConfiguration[];
}

export class PanelCollection implements Iterable<Panel> {
  private readonly panels: readonly Panel[];

  constructor(panels: Panel[]) {
    this.panels = Object.freeze([...panels]);
  }

  static empty(count: number): PanelCollection {
    return new PanelCollection(
      Array.from({ length: count }, (_value, position) => Panel.emptyAt(position)),
    );
  }

  static fromConfiguration(
    configuration: Partial<PanelsConfiguration> | undefined,
    count: number,
  ): PanelCollection {
    const configuredPanels = configuration?.panels ?? configuration?.windows ?? [];
    return new PanelCollection(
      Array.from({ length: count }, (_value, position) =>
        Panel.fromConfiguration(configuredPanels[position], position)),
    );
  }

  get size(): number {
    return this.panels.length;
  }

  at(position: number): Panel | undefined {
    return this.panels[position];
  }

  forEach(callback: (panel: Panel, position: number) => void): void {
    this.panels.forEach(callback);
  }

  needsConfiguration(): boolean {
    return this.panels.some((panel) => !panel.isConfigured());
  }

  configuredWith(addresses: string[]): PanelCollection {
    if (addresses.length !== this.size) {
      throw new Error(`Необходимо указать ${this.size} адреса`);
    }
    return new PanelCollection(
      this.panels.map((panel, position) => panel.withAddress(addresses[position] ?? '')),
    );
  }

  toConfiguration(): PanelsConfiguration {
    return { panels: this.panels.map((panel) => panel.toConfiguration()) };
  }

  [Symbol.iterator](): Iterator<Panel> {
    return this.panels[Symbol.iterator]();
  }
}
