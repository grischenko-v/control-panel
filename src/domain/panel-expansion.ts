export class PanelExpansion {
  private position?: number;

  activePosition(): number | undefined {
    return this.position;
  }

  toggle(position: number): void {
    this.position = this.position === position ? undefined : position;
  }

  reset(): void {
    this.position = undefined;
  }
}
