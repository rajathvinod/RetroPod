let electron = require("electron");
//#region electron/preload.ts
electron.contextBridge.exposeInMainWorld("electronAPI", {
	getMediaSession: () => electron.ipcRenderer.invoke("media:get"),
	controlMedia: (action) => electron.ipcRenderer.invoke("media:control", action),
	setVolume: (volume) => electron.ipcRenderer.invoke("volume:set", volume),
	getVolume: () => electron.ipcRenderer.invoke("volume:get"),
	setAlwaysOnTop: (isAlwaysOnTop) => electron.ipcRenderer.invoke("app:set-always-on-top", isAlwaysOnTop),
	quitApp: () => electron.ipcRenderer.invoke("app:quit"),
	onMediaUpdate: (callback) => {
		electron.ipcRenderer.removeAllListeners("media:update");
		electron.ipcRenderer.on("media:update", (_event, value) => callback(value));
	}
});
//#endregion
