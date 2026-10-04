export class PanelAddress {
  readonly value: string;

  constructor(value = '') {
    this.value = PanelAddress.normalize(value);
  }

  static empty(): PanelAddress {
    return new PanelAddress();
  }

  static normalize(value: unknown): string {
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

  static isSupported(value: unknown): boolean {
    const candidate = String(value ?? '').trim();
    return candidate.length > 0 && PanelAddress.normalize(candidate).length > 0;
  }

  isConfigured(): boolean {
    return this.value.length > 0;
  }

  navigationTarget(): string {
    return this.isConfigured() ? this.value : 'about:blank';
  }

  equals(other: PanelAddress): boolean {
    return other.value === this.value;
  }

  toString(): string {
    return this.value;
  }
}
