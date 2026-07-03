const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronTasks", {
  loadTasks: () => ipcRenderer.invoke("tasks:load"),
  saveTasks: (tasks) => ipcRenderer.send("tasks:save", tasks)
});
