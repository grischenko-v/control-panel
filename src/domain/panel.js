const { PanelAddress } = require('./panel-address');

class Panel {
  constructor({ position, title, address }) {
    this.position = position;
    this.title = String(title || `Панель ${position + 1}`);
    this.address = address instanceof PanelAddress ? address : new PanelAddress(address);
  }

  static emptyAt(position) {
    return new Panel({
      position,
      title: `Панель ${position + 1}`,
      address: PanelAddress.empty(),
    });
  }

  static fromConfiguration(value, position) {
    return new Panel({
      position,
      title: value?.title,
      address: new PanelAddress(value?.url),
    });
  }

  isConfigured() {
    return this.address.isConfigured();
  }

  navigationTarget() {
    return this.address.navigationTarget();
  }

  hasSameContent(other) {
    return other instanceof Panel && this.address.equals(other.address);
  }

  withAddress(value) {
    if (!PanelAddress.isSupported(value)) {
      throw new Error(`Укажите корректный HTTP или HTTPS адрес для «${this.title}»`);
    }
    return new Panel({
      position: this.position,
      title: this.title,
      address: new PanelAddress(value),
    });
  }

  toConfiguration() {
    return { title: this.title, url: this.address.toString() };
  }
}

module.exports = { Panel };
