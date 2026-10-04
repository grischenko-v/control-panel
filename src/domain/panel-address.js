class PanelAddress {
  constructor(value = '') {
    this.value = PanelAddress.normalize(value);
  }

  static empty() {
    return new PanelAddress();
  }

  static normalize(value) {
    const candidate = String(value ?? '').trim();
    if (!candidate) {
      return '';
    }

    try {
      const url = new URL(candidate);
      return ['http:', 'https:'].includes(url.protocol) ? url.toString() : '';
    } catch {
      return '';
    }
  }

  static isSupported(value) {
    const candidate = String(value ?? '').trim();
    return candidate.length > 0 && PanelAddress.normalize(candidate).length > 0;
  }

  isConfigured() {
    return this.value.length > 0;
  }

  navigationTarget() {
    return this.isConfigured() ? this.value : 'about:blank';
  }

  equals(other) {
    return other instanceof PanelAddress && other.value === this.value;
  }

  toString() {
    return this.value;
  }
}

module.exports = { PanelAddress };
