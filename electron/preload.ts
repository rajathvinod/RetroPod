import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getMediaSession: () => ipcRenderer.invoke('media:get'),
  controlMedia: (action: string) => ipcRenderer.invoke('media:control', action),
  setVolume: (volume: number) => ipcRenderer.invoke('volume:set', volume),
  getVolume: () => ipcRenderer.invoke('volume:get'),
  setAlwaysOnTop: (isAlwaysOnTop: boolean) => ipcRenderer.invoke('app:set-always-on-top', isAlwaysOnTop),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  onMediaUpdate: (callback: (data: any) => void) => {
    ipcRenderer.removeAllListeners('media:update');
    ipcRenderer.on('media:update', (_event, value) => callback(value));
  }
});
