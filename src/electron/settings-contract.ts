export interface SettingsPanelData {
  title: string;
  url: string;
}

export interface SettingsData {
  panels: SettingsPanelData[];
}

export type SaveSettingsResult =
  | { ok: true }
  | { ok: false; error: string };

export interface SettingsApi {
  load(): Promise<SettingsData>;
  save(addresses: string[]): Promise<SaveSettingsResult>;
}

declare global {
  interface Window {
    settingsAPI: SettingsApi;
  }
}
