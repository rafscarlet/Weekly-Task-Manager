process.on("uncaughtException", (error) => {
  console.error("Uncaught error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");

let tasksCache = [];
let tagsCache = [];
let settingsCache = {};

function ensureUserDataFolder() {
  const dir = app.getPath("userData");

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Tasks 
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


// Tags
function getTagsFilePath() {
  return path.join(app.getPath("userData"), "tags.json");
}

function readTags() {
  const userDataFilePath = getTagsFilePath();

  if (fs.existsSync(userDataFilePath)) {
    const payload = JSON.parse(fs.readFileSync(userDataFilePath, "utf8"));
    return Array.isArray(payload) ? payload : payload.tags ?? [];
  }
    return [];
  }

function saveTags(tags = tagsCache) {
  tagsCache = tags;
  fs.writeFileSync(getTagsFilePath(), JSON.stringify({ tags: tagsCache }, null, 2));
}

ipcMain.handle("tags:load", () => {
  tagsCache = readTags();
  return tagsCache;
});

ipcMain.on("tags:save", (_event, tags) => {
  saveTags(Array.isArray(tags) ? tags : []);
});

// Settings
function getSettingsFilePath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function readSettings() {
  const userDataFilePath = getSettingsFilePath();

  if (fs.existsSync(userDataFilePath)) {
    const payload = JSON.parse(fs.readFileSync(userDataFilePath, "utf8"));
    return typeof payload === "object" && payload !== null ? payload : {};
  }
    return {};
  }

function saveSettings(settings = settingsCache) {
  settingsCache = settings;
  fs.writeFileSync(getSettingsFilePath(), JSON.stringify(settingsCache, null, 2));
}

ipcMain.handle("settings:load", () => {
  settingsCache = readSettings();
  return settingsCache;
});

ipcMain.on("settings:save", (_event, settings) => {
  saveSettings(typeof settings === "object" && settings !== null ? settings : {});
});

///////

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    show: false,
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.once("ready-to-show", () => {
    win.maximize();
    win.show();
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

app.on("before-quit", () => {
  saveTasks()
  saveTags();
  saveSettings();
});

aapp.on("window-all-closed", () => {
  saveTasks();
  saveTags();
  saveSettings();

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.whenReady().then(() => {
  ensureUserDataFolder();
  createWindow();
});
