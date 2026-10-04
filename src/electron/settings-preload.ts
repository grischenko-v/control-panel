import { contextBridge, ipcRenderer } from 'electron';
import type { SettingsApi } from './settings-contract';

const settingsApi: SettingsApi = {
  load: () => ipcRenderer.invoke('settings:load') as Promise<ReturnType<SettingsApi['load']> extends Promise<infer T> ? T : never>,
  save: (addresses) => ipcRenderer.invoke('settings:save', addresses) as ReturnType<SettingsApi['save']>,
};

contextBridge.exposeInMainWorld('settingsAPI', settingsApi);
