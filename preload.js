const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronTasks", {
  loadTasks: () => ipcRenderer.invoke("tasks:load"),
  saveTasks: (tasks) => ipcRenderer.send("tasks:save", tasks)
});

contextBridge.exposeInMainWorld("electronTags", {
  loadTags: () => ipcRenderer.invoke("tags:load"),
  saveTags: (tags) => ipcRenderer.send("tags:save", tags)
});

contextBridge.exposeInMainWorld("electronSettings", {
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings) => ipcRenderer.send("settings:save", settings)
});
