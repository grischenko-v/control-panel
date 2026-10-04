class PanelBounds {
  constructor({ x, y, width, height }) {
    this.x = Math.round(x);
    this.y = Math.round(y);
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    Object.freeze(this);
  }

  toElectronBounds() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }
}

class EqualPanelLayout {
  constructor({ panelCount, gap = 0 }) {
    if (!Number.isInteger(panelCount) || panelCount < 1) {
      throw new Error('Количество панелей должно быть положительным целым числом');
    }
    this.panelCount = panelCount;
    this.gap = Math.max(0, Math.round(gap));
  }

  arrange({ width, height }) {
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

module.exports = { EqualPanelLayout, PanelBounds };
