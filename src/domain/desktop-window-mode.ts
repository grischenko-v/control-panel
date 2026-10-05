import {
  combinedDesktopBounds,
  type DesktopBounds,
  type DesktopDisplay,
} from './desktop-bounds';

export interface DesktopWindow {
  getNormalBounds(): DesktopBounds;
  isMaximized(): boolean;
  maximize(): void;
  setBounds(bounds: DesktopBounds): void;
  unmaximize(): void;
}

interface WindowRestoreState {
  bounds: DesktopBounds;
  wasMaximized: boolean;
}

export class DesktopWindowMode {
  private restoreState?: WindowRestoreState;
  private readonly displaysProvider: () => DesktopDisplay[];

  constructor(displaysProvider: () => DesktopDisplay[]) {
    this.displaysProvider = displaysProvider;
  }

  isActive(): boolean {
    return Boolean(this.restoreState);
  }

  toggle(window: DesktopWindow): void {
    if (this.restoreState) {
      const { bounds, wasMaximized } = this.restoreState;
      this.restoreState = undefined;
      window.setBounds(bounds);
      if (wasMaximized) {
        window.maximize();
      }
      return;
    }

    this.restoreState = {
      bounds: window.getNormalBounds(),
      wasMaximized: window.isMaximized(),
    };
    this.fit(window);
  }

  fit(window: DesktopWindow): void {
    if (!this.restoreState) {
      return;
    }

    if (window.isMaximized()) {
      window.unmaximize();
    }
    window.setBounds(combinedDesktopBounds(this.displaysProvider()));
  }

  reset(): void {
    this.restoreState = undefined;
  }
}
