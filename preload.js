const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("windowControls", {
  minimize: () => ipcRenderer.send("window-minimize"),
  close: () => ipcRenderer.send("window-close")
});


contextBridge.exposeInMainWorld("electronAPI", {
  resizeWindow: (size) => ipcRenderer.send("resize-window", size)
});