const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

let tasksCache = [];

function getTasksFilePath() {
  return path.join(app.getPath("userData"), "tasks.json");
}

function readTasks() {
  const userDataFilePath = getTasksFilePath();

  if (fs.existsSync(userDataFilePath)) {
    const payload = JSON.parse(fs.readFileSync(userDataFilePath, "utf8"));
    return Array.isArray(payload) ? payload : payload.tasks ?? [];
  }
    return [];
  }

function saveTasks(tasks = tasksCache) {
  tasksCache = tasks;
  fs.writeFileSync(getTasksFilePath(), JSON.stringify({ tasks: tasksCache }, null, 2));
}

ipcMain.handle("tasks:load", () => {
  tasksCache = readTasks();
  return tasksCache;
});

ipcMain.on("tasks:save", (_event, tasks) => {
  saveTasks(Array.isArray(tasks) ? tasks : []);
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  app.on("before-quit", () => saveTasks());

  app.on("window-all-closed", () => {
    saveTasks();
    app.quit();
  });

  const devServerUrl = process.env.ELECTRON_START_URL;

  if (devServerUrl) {
    win.loadURL(devServerUrl);
    return;
  }

  const candidatePaths = [
    path.join(__dirname, "dist", "calendar-tasks", "browser", "index.html"),
    path.join(__dirname, "dist", "calendar-tasks", "index.html"),
    path.join(__dirname, "index.html")
  ];
  const appPath = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));

  if (appPath) {
    win.loadFile(appPath);
    return;
  }

  win.loadURL("data:text/html,<h1>Angular build not found</h1><p>Run npm run build or npm run dev.</p>");
}

app.whenReady().then(createWindow);
