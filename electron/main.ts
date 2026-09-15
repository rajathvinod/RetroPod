import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, screen } from 'electron';
import { getActiveSessions, onSessionsChanged } from 'windows-media-sessions';
import { exec } from 'node:child_process';
import loudness from 'loudness';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

process.env.APP_ROOT = path.join(currentDir, '..');

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;
let tray: Tray | null = null;
let isSnapped = false;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  const winWidth = Math.floor(width / 6);
  // Maintain the iPod's tall aspect ratio (approx 1:1.7)
  const winHeight = Math.floor(winWidth * 1.7);

  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(currentDir, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true);

  // Edge Snapping Logic
  win.on('moved', () => {
    if (!win) return;
    const bounds = win.getBounds();
    const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
    const edgeThreshold = 20;
    
    let snappedX = bounds.x;
    let snapped = false;

    // Snap Right
    if (Math.abs(bounds.x + bounds.width - display.bounds.width) < edgeThreshold) {
      snappedX = display.bounds.width - bounds.width + (bounds.width * 0.7); // Slide 70% off screen
      snapped = true;
    }
    // Snap Left
    else if (Math.abs(bounds.x) < edgeThreshold) {
      snappedX = -(bounds.width * 0.7);
      snapped = true;
    }

    if (snapped && !isSnapped) {
      isSnapped = true;
      win.setBounds({ x: snappedX, y: bounds.y, width: bounds.width, height: bounds.height });
      win.setOpacity(0.4);
    } else if (!snapped && isSnapped) {
      isSnapped = false;
      win.setOpacity(1.0);
    }
  });

  win.on('focus', () => {
    if (isSnapped && win) {
      win.setOpacity(1.0);
      const bounds = win.getBounds();
      const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
      if (bounds.x < 0) {
        win.setBounds({ x: 0, y: bounds.y, width: bounds.width, height: bounds.height });
      } else {
        win.setBounds({ x: display.bounds.width - bounds.width, y: bounds.y, width: bounds.width, height: bounds.height });
      }
      isSnapped = false;
    }
  });

  win.on('blur', () => {
     if (!isSnapped && win) {
        const bounds = win.getBounds();
        const display = screen.getDisplayNearestPoint({ x: bounds.x, y: bounds.y });
        // Auto-snap if it was left near the edge
        if (bounds.x <= 0) {
           win.setBounds({ x: -(bounds.width * 0.7), y: bounds.y, width: bounds.width, height: bounds.height });
           win.setOpacity(0.4);
           isSnapped = true;
        } else if (bounds.x + bounds.width >= display.bounds.width) {
           win.setBounds({ x: display.bounds.width - bounds.width + (bounds.width * 0.7), y: bounds.y, width: bounds.width, height: bounds.height });
           win.setOpacity(0.4);
           isSnapped = true;
        }
     }
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }

  win.on('closed', () => {
    win = null;
  });

  // Media API handlers
  ipcMain.handle('media:get', async () => {
    const sessions = await getActiveSessions();
    return sessions.length > 0 ? sessions[0] : null;
  });

  ipcMain.handle('media:control', (_event, action) => {
    // action is 'playpause', 'next', or 'prev'
    const exePath = path.join(process.env.APP_ROOT!, 'media_keys.exe');
    exec(`"${exePath}" ${action}`);
  });

  ipcMain.handle('app:set-always-on-top', (_event, value) => {
    if (win) win.setAlwaysOnTop(value);
  });

  ipcMain.handle('app:quit', () => {
    app.quit();
  });

  ipcMain.handle('volume:set', async (_event, volume) => {
    await loudness.setVolume(volume);
  });

  ipcMain.handle('volume:get', async () => {
    return await loudness.getVolume();
  });

  onSessionsChanged((sessions) => {
    if (win) {
      win.webContents.send('media:update', sessions.length > 0 ? sessions[0] : null);
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  // Create System Tray
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show iPod', click: () => { if (win) { win.show(); win.focus(); } } },
    { label: 'Quit', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('iPod Audio Player');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (win) {
      win.isVisible() ? win.hide() : win.show();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
