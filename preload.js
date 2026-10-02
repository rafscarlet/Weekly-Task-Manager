const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getVersion: () => ipcRenderer.invoke("app:getVersion")
});

contextBridge.exposeInMainWorld('electronNotificationAPI', {
  showNotification: (title, body) =>
    ipcRenderer.invoke('show-notification', title, body)
});

contextBridge.exposeInMainWorld("electronTasks", {
  loadTasks: () => ipcRenderer.invoke("tasks:load"),
  saveTasks: (tasks) => ipcRenderer.send("tasks:save", tasks)
});

contextBridge.exposeInMainWorld("electronTags", {
  loadTags: () => ipcRenderer.invoke("tags:load"),
  saveTags: (tags) => ipcRenderer.send("tags:save", tags)
});

contextBridge.exposeInMainWorld("electronAssets", {
  selectImage: () => ipcRenderer.invoke("select-image"),
});

contextBridge.exposeInMainWorld("electronSettings", {
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings) => ipcRenderer.send("settings:save", settings)
});

