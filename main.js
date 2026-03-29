const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

const WINDOW_STATE_PATH = path.join(app.getPath("userData"), "window-state.json");
const DEFAULT_WINDOW_STATE = {
  width: 780,
  height: 400
};

function readWindowState() {
  try {
    const rawState = fs.readFileSync(WINDOW_STATE_PATH, "utf8");
    const parsedState = JSON.parse(rawState);

    return {
      ...DEFAULT_WINDOW_STATE,
      ...parsedState
    };
  } catch {
    return { ...DEFAULT_WINDOW_STATE };
  }
}

function saveWindowState(window) {
  if (!window || window.isDestroyed()) {
    return;
  }

  const bounds = window.getBounds();
  fs.writeFileSync(WINDOW_STATE_PATH, JSON.stringify(bounds, null, 2));
}

function createWindow() {
  const windowState = readWindowState();
  const mainWindow = new BrowserWindow({
    title: "GitHub Widget",
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 620,
    minHeight: 300,
    backgroundColor: "#00000000",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "assets", "icono.ico"),
    frame: false,
    transparent: true,
    hasShadow: true,
    resizable: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on("move", () => {
    saveWindowState(mainWindow);
  });

  mainWindow.on("resize", () => {
    saveWindowState(mainWindow);
  });

  mainWindow.on("close", () => {
    saveWindowState(mainWindow);
  });

  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

ipcMain.on("window-minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.on("window-close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

app.whenReady().then(() => {
  if (app.isPackaged) {
    app.setLoginItemSettings({
      openAtLogin: true
    });
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});


ipcMain.on("resize-window", (event, size) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  if (!win || !size || typeof size.width !== "number" || typeof size.height !== "number") {
    return;
  }

  win.setContentSize(Math.ceil(size.width), Math.ceil(size.height));
  saveWindowState(win);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
