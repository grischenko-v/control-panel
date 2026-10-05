import {
  combinedDesktopBounds,
  type DesktopBounds,
  type DesktopDisplay,
} from './desktop-bounds';

export interface DesktopWindow {
  getNormalBounds(): DesktopBounds;
  isAlwaysOnTop(): boolean;
  isMaximized(): boolean;
  isMenuBarVisible(): boolean;
  maximize(): void;
  setAlwaysOnTop(
    flag: boolean,
    level?: 'normal' | 'floating' | 'torn-off-menu' | 'modal-panel' | 'main-menu' | 'status' | 'pop-up-menu' | 'screen-saver' | 'dock',
  ): void;
  setBounds(bounds: DesktopBounds): void;
  setMenuBarVisibility(visible: boolean): void;
  unmaximize(): void;
}

interface WindowRestoreState {
  bounds: DesktopBounds;
  wasAlwaysOnTop: boolean;
  wasMaximized: boolean;
  wasMenuBarVisible: boolean;
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
      const { bounds, wasAlwaysOnTop, wasMaximized, wasMenuBarVisible } = this.restoreState;
      this.restoreState = undefined;
      window.setAlwaysOnTop(wasAlwaysOnTop);
      window.setMenuBarVisibility(wasMenuBarVisible);
      window.setBounds(bounds);
      if (wasMaximized) {
        window.maximize();
      }
      return;
    }

    this.restoreState = {
      bounds: window.getNormalBounds(),
      wasAlwaysOnTop: window.isAlwaysOnTop(),
      wasMaximized: window.isMaximized(),
      wasMenuBarVisible: window.isMenuBarVisible(),
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
    window.setMenuBarVisibility(false);
    window.setAlwaysOnTop(true, 'screen-saver');
    window.setBounds(combinedDesktopBounds(this.displaysProvider()));
  }

  reset(): void {
    this.restoreState = undefined;
  }
}
