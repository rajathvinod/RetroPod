import { createRequire } from "node:module";
//#endregion
//#region electron/preload.ts
var { contextBridge, ipcRenderer } = (/* @__PURE__ */ (() => createRequire(import.meta.url))())("electron");
contextBridge.exposeInMainWorld("electronAPI", {
	getMediaSession: () => ipcRenderer.invoke("media:get"),
	controlMedia: (action) => ipcRenderer.invoke("media:control", action),
	setVolume: (volume) => ipcRenderer.invoke("volume:set", volume),
	getVolume: () => ipcRenderer.invoke("volume:get"),
	onMediaUpdate: (callback) => {
		ipcRenderer.removeAllListeners("media:update");
		ipcRenderer.on("media:update", (_event, value) => callback(value));
	}
});
//#endregion
export {};
