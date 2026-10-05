export interface DesktopDisplay {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface DesktopBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function combinedDesktopBounds(displays: DesktopDisplay[]): DesktopBounds {
  if (displays.length === 0) {
    return { x: 0, y: 0, width: 1, height: 1 };
  }

  const left = Math.min(...displays.map((display) => display.bounds.x));
  const top = Math.min(...displays.map((display) => display.bounds.y));
  const right = Math.max(
    ...displays.map((display) => display.bounds.x + display.bounds.width),
  );
  const bottom = Math.max(
    ...displays.map((display) => display.bounds.y + display.bounds.height),
  );

  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top),
  };
}
