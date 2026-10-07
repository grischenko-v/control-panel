import type { Panel } from './panel';
import type { PanelCollection } from './panel-collection';

export interface RefreshablePanelViewport {
  isDestroyed(): boolean;
  reloadConfiguredPage(panel: Panel): void;
}

export function reloadConfiguredPanels(
  panels: PanelCollection | undefined,
  viewports: RefreshablePanelViewport[],
): void {
  panels?.forEach((panel, position) => {
    const viewport = viewports[position];
    if (viewport && !viewport.isDestroyed()) {
      viewport.reloadConfiguredPage(panel);
    }
  });
}
