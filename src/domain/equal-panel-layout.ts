export interface Size {
  width: number;
  height: number;
}

export interface ElectronBounds extends Size {
  x: number;
  y: number;
}

export class PanelBounds implements ElectronBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;

  constructor({ x, y, width, height }: ElectronBounds) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    Object.freeze(this);
  }

  toElectronBounds(): ElectronBounds {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

export class EqualPanelLayout {
  readonly panelCount: number;
  readonly gap: number;

  constructor({ panelCount, gap = 0 }: { panelCount: number; gap?: number }) {
    if (!Number.isInteger(panelCount) || panelCount < 1) {
      throw new Error('Количество панелей должно быть положительным целым числом');
    }
    this.panelCount = panelCount;
    this.gap = Math.max(0, Math.round(gap));
  }

  arrange({ width, height }: Size): PanelBounds[] {
    if (this.panelCount === 3) {
      const columnGap = this.gap;
      const rowGap = this.gap;
      const availableWidth = Math.max(3, width - columnGap);
      const mainWidth = Math.floor((availableWidth * 2) / 3);
      const sideWidth = availableWidth - mainWidth;
      const availableHeight = Math.max(2, height - rowGap);
      const topHeight = Math.floor(availableHeight / 2);
      const bottomHeight = availableHeight - topHeight;

      return [
        new PanelBounds({ x: 0, y: 0, width: mainWidth, height }),
        new PanelBounds({
          x: mainWidth + columnGap,
          y: 0,
          width: sideWidth,
          height: topHeight,
        }),
        new PanelBounds({
          x: mainWidth + columnGap,
          y: topHeight + rowGap,
          width: sideWidth,
          height: bottomHeight,
        }),
      ];
    }

    const availableWidth = Math.max(
      this.panelCount,
      width - this.gap * (this.panelCount - 1),
    );

    return Array.from({ length: this.panelCount }, (_value, position) => {
      const left = Math.floor((availableWidth * position) / this.panelCount);
      const right = Math.floor((availableWidth * (position + 1)) / this.panelCount);
      return new PanelBounds({
        x: left + this.gap * position,
        y: 0,
        width: right - left,
        height,
      });
    });
  }
}
