const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  getVersion: () => ipcRenderer.invoke("app:getVersion")
});

contextBridge.exposeInMainWorld('electronNotificationAPI', {
  showNotification: (title, body, taskId) =>
    ipcRenderer.invoke('show-notification', title, body, taskId),

  isNotificationsSupported: () =>
    ipcRenderer.invoke('notifications:supported'),

   setUnreadBadge: (count) =>
    ipcRenderer.invoke('set-unread-badge', count),

   getNotificationCheckpoint: () =>
    ipcRenderer.invoke('notifications:get-checkpoint'),

   setNotificationCheckpoint: (lastCheckAt) =>
    ipcRenderer.send('notifications:set-checkpoint', lastCheckAt),

   onNotificationClicked: (callback) => {
    const listener = (_event, taskId) => callback(taskId);
    ipcRenderer.on('notification-clicked', listener);
    return () => {
      ipcRenderer.removeListener('notification-clicked', listener);
    };
   }
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
  uploadImage: () => ipcRenderer.invoke("upload-image"),
  listImages: () => ipcRenderer.invoke("list-images"),
  deleteImage: (filename) => ipcRenderer.invoke("delete-image", filename),
});

contextBridge.exposeInMainWorld("electronSettings", {
  loadSettings: () => ipcRenderer.invoke("settings:load"),
  saveSettings: (settings) => ipcRenderer.send("settings:save", settings)
});

