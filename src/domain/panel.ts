import { PanelAddress } from './panel-address';

export interface PanelConfiguration {
  title: string;
  url: string;
}

export class Panel {
  readonly position: number;
  readonly title: string;
  readonly address: PanelAddress;

  constructor({ position, title, address }: {
    position: number;
    title?: string;
    address: PanelAddress | string;
  }) {
    this.position = position;
    this.title = String(title || `Панель ${position + 1}`);
    this.address = address instanceof PanelAddress ? address : new PanelAddress(address);
  }

  static emptyAt(position: number): Panel {
    return new Panel({
      position,
      title: `Панель ${position + 1}`,
      address: PanelAddress.empty(),
    });
  }

  static fromConfiguration(value: Partial<PanelConfiguration> | undefined, position: number): Panel {
    return new Panel({
      position,
      title: value?.title,
      address: new PanelAddress(value?.url),
    });
  }

  isConfigured(): boolean {
    return this.address.isConfigured();
  }

  navigationTarget(): string {
    return this.address.navigationTarget();
  }

  hasSameContent(other: Panel): boolean {
    return this.address.equals(other.address);
  }

  withAddress(value: string): Panel {
    if (!PanelAddress.isSupported(value)) {
      throw new Error(`Укажите корректный HTTP или HTTPS адрес для «${this.title}»`);
    }
    return new Panel({
      position: this.position,
      title: this.title,
      address: new PanelAddress(value),
    });
  }

  toConfiguration(): PanelConfiguration {
    return { title: this.title, url: this.address.toString() };
  }
}
