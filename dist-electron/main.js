Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let electron = require("electron");
let windows_media_sessions = require("windows-media-sessions");
let node_child_process = require("node:child_process");
let loudness = require("loudness");
loudness = __toESM(loudness);
let node_path = require("node:path");
node_path = __toESM(node_path);
let node_url = require("node:url");
//#region electron/main.ts
var currentDir = node_path.default.dirname((0, node_url.fileURLToPath)(require("url").pathToFileURL(__filename).href));
process.env.APP_ROOT = node_path.default.join(currentDir, "..");
var VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
var MAIN_DIST = node_path.default.join(process.env.APP_ROOT, "dist-electron");
var RENDERER_DIST = node_path.default.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? node_path.default.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
var win;
var tray = null;
var isSnapped = false;
function createWindow() {
	const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize;
	const winWidth = Math.floor(width / 6);
	const winHeight = Math.floor(winWidth * 1.7);
	win = new electron.BrowserWindow({
		width: winWidth,
		height: winHeight,
		frame: false,
		transparent: true,
		alwaysOnTop: true,
		resizable: false,
		hasShadow: false,
		webPreferences: {
			preload: node_path.default.join(currentDir, "preload.js"),
			contextIsolation: true,
			nodeIntegration: false
		}
	});
	win.setAlwaysOnTop(true);
	win.on("moved", () => {
		if (!win) return;
		const bounds = win.getBounds();
		const display = electron.screen.getDisplayNearestPoint({
			x: bounds.x,
			y: bounds.y
		});
		const edgeThreshold = 20;
		let snappedX = bounds.x;
		let snapped = false;
		if (Math.abs(bounds.x + bounds.width - display.bounds.width) < edgeThreshold) {
			snappedX = display.bounds.width - bounds.width + bounds.width * .7;
			snapped = true;
		} else if (Math.abs(bounds.x) < edgeThreshold) {
			snappedX = -(bounds.width * .7);
			snapped = true;
		}
		if (snapped && !isSnapped) {
			isSnapped = true;
			win.setBounds({
				x: snappedX,
				y: bounds.y,
				width: bounds.width,
				height: bounds.height
			});
			win.setOpacity(.4);
		} else if (!snapped && isSnapped) {
			isSnapped = false;
			win.setOpacity(1);
		}
	});
	win.on("focus", () => {
		if (isSnapped && win) {
			win.setOpacity(1);
			const bounds = win.getBounds();
			const display = electron.screen.getDisplayNearestPoint({
				x: bounds.x,
				y: bounds.y
			});
			if (bounds.x < 0) win.setBounds({
				x: 0,
				y: bounds.y,
				width: bounds.width,
				height: bounds.height
			});
			else win.setBounds({
				x: display.bounds.width - bounds.width,
				y: bounds.y,
				width: bounds.width,
				height: bounds.height
			});
			isSnapped = false;
		}
	});
	win.on("blur", () => {
		if (!isSnapped && win) {
			const bounds = win.getBounds();
			const display = electron.screen.getDisplayNearestPoint({
				x: bounds.x,
				y: bounds.y
			});
			if (bounds.x <= 0) {
				win.setBounds({
					x: -(bounds.width * .7),
					y: bounds.y,
					width: bounds.width,
					height: bounds.height
				});
				win.setOpacity(.4);
				isSnapped = true;
			} else if (bounds.x + bounds.width >= display.bounds.width) {
				win.setBounds({
					x: display.bounds.width - bounds.width + bounds.width * .7,
					y: bounds.y,
					width: bounds.width,
					height: bounds.height
				});
				win.setOpacity(.4);
				isSnapped = true;
			}
		}
	});
	if (VITE_DEV_SERVER_URL) win.loadURL(VITE_DEV_SERVER_URL);
	else win.loadFile(node_path.default.join(RENDERER_DIST, "index.html"));
	win.on("closed", () => {
		win = null;
	});
	electron.ipcMain.handle("media:get", async () => {
		const sessions = await (0, windows_media_sessions.getActiveSessions)();
		return sessions.length > 0 ? sessions[0] : null;
	});
	electron.ipcMain.handle("media:control", (_event, action) => {
		const exePath = node_path.default.join(process.env.APP_ROOT, "media_keys.exe");
		(0, node_child_process.exec)(`"${exePath}" ${action}`);
	});
	electron.ipcMain.handle("app:set-always-on-top", (_event, value) => {
		if (win) win.setAlwaysOnTop(value);
	});
	electron.ipcMain.handle("app:quit", () => {
		electron.app.quit();
	});
	electron.ipcMain.handle("volume:set", async (_event, volume) => {
		await loudness.default.setVolume(volume);
	});
	electron.ipcMain.handle("volume:get", async () => {
		return await loudness.default.getVolume();
	});
	(0, windows_media_sessions.onSessionsChanged)((sessions) => {
		if (win) win.webContents.send("media:update", sessions.length > 0 ? sessions[0] : null);
	});
}
electron.app.whenReady().then(() => {
	createWindow();
	const icon = electron.nativeImage.createEmpty();
	tray = new electron.Tray(icon);
	const contextMenu = electron.Menu.buildFromTemplate([{
		label: "Show iPod",
		click: () => {
			if (win) {
				win.show();
				win.focus();
			}
		}
	}, {
		label: "Quit",
		click: () => {
			electron.app.quit();
		}
	}]);
	tray.setToolTip("iPod Audio Player");
	tray.setContextMenu(contextMenu);
	tray.on("click", () => {
		if (win) win.isVisible() ? win.hide() : win.show();
	});
});
electron.app.on("window-all-closed", () => {
	if (process.platform !== "darwin") electron.app.quit();
});
electron.app.on("activate", () => {
	if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
});
//#endregion
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
