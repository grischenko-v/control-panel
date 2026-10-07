export class PanelAuthFocus {
  private position?: number;

  activePosition(): number | undefined {
    return this.position;
  }

  handleNavigation(position: number, url: string): 'focused' | 'released' | 'unchanged' {
    if (isIdentityAuthUrl(url)) {
      if (this.position !== undefined) {
        return 'unchanged';
      }

      this.position = position;
      return 'focused';
    }

    if (this.position !== position) {
      return 'unchanged';
    }

    this.position = undefined;
    return 'released';
  }

  reset(): void {
    this.position = undefined;
  }
}

export function isIdentityAuthUrl(value: string): boolean {
  try {
    return new URL(value).port === '8040';
  } catch {
    return value.includes(':8040');
  }
}
