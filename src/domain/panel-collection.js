const { Panel } = require('./panel');

class PanelCollection {
  constructor(panels) {
    this.panels = Object.freeze([...panels]);
  }

  static empty(count) {
    return new PanelCollection(
      Array.from({ length: count }, (_value, position) => Panel.emptyAt(position)),
    );
  }

  static fromConfiguration(configuration, count) {
    const configuredPanels = configuration?.panels ?? configuration?.windows ?? [];
    return new PanelCollection(
      Array.from({ length: count }, (_value, position) =>
        Panel.fromConfiguration(configuredPanels[position], position)),
    );
  }

  get size() {
    return this.panels.length;
  }

  at(position) {
    return this.panels[position];
  }

  forEach(callback) {
    this.panels.forEach(callback);
  }

  needsConfiguration() {
    return this.panels.some((panel) => !panel.isConfigured());
  }

  configuredWith(addresses) {
    if (!Array.isArray(addresses) || addresses.length !== this.size) {
      throw new Error(`Необходимо указать ${this.size} адреса`);
    }
    return new PanelCollection(
      this.panels.map((panel, position) => panel.withAddress(addresses[position])),
    );
  }

  toConfiguration() {
    return { panels: this.panels.map((panel) => panel.toConfiguration()) };
  }

  [Symbol.iterator]() {
    return this.panels[Symbol.iterator]();
  }
}

module.exports = { PanelCollection };
