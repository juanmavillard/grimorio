const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld(
  "grimorioDesktop",
  Object.freeze({
    runtime: () => ipcRenderer.invoke("grimorio:runtime"),
    saveJson: (value) => ipcRenderer.invoke("grimorio:save-json", value),
    onLifecycle: (callback) => {
      const listener = (_event, request) => callback(request);
      ipcRenderer.on("grimorio:lifecycle", listener);
      ipcRenderer.send("grimorio:renderer-ready");
      return () => ipcRenderer.removeListener("grimorio:lifecycle", listener);
    },
    lifecycleResult: (value) =>
      ipcRenderer.send("grimorio:lifecycle-result", value),
  }),
);
