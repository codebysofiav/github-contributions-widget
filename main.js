const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

function createWindow() {
  const mainWindow = new BrowserWindow({
    title: "GitHub Widget",
    width: 780,
    height: 400,
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
  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

ipcMain.on("window-minimize", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.minimize();
});

ipcMain.on("window-close", (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
