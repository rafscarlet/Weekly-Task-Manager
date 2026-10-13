process.on("uncaughtException", (error) => {
  console.error("Uncaught error:", error);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});

const {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  shell,
  protocol,
  Notification,
  Tray,
  Menu,
  nativeImage,
} = require("electron");
const { autoUpdater } = require("electron-updater");
const crypto = require("crypto");
const sharp = require("sharp");

const fs = require("fs");
const path = require("path");

let mainWindow = null;
let isQuitting = false;
let tray = null;

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
  const filePath = getTasksFilePath();

  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));

    return Array.isArray(payload) ? payload : (payload.tasks ?? []);
  } catch (error) {
    console.error("Failed to read tasks.json:", error);
    return [];
  }
}

function saveTasks(tasks = tasksCache) {
  tasksCache = tasks;
  fs.writeFileSync(
    getTasksFilePath(),
    JSON.stringify({ tasks: tasksCache }, null, 2),
  );
}

ipcMain.handle("app:getVersion", () => {
  return app.getVersion();
});

ipcMain.handle("tasks:load", () => {
  tasksCache = readTasks();
  return tasksCache;
});

// Notifications

ipcMain.handle("show-notification", (_, title, body) => {
  new Notification({
    title,
    body,
  }).show();
});

// Notification Badge
async function createBadgeIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="32" height="32" viewBox="0 0 32 32">
      <circle cx="15" cy="18" r="10" fill="#e53935"/>
    </svg>
  `;

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

  return nativeImage.createFromBuffer(pngBuffer);
}

ipcMain.handle("set-unread-badge", async (_, count) => {
  const badgeCount = Number.isFinite(count) ? Math.max(0, count) : 0;

  if (mainWindow && process.platform === "win32") {
    if (badgeCount > 0) {
      const badgeIcon = await createBadgeIcon();

      mainWindow.setOverlayIcon(badgeIcon, `${badgeCount} unread reminders`);
    } else {
      mainWindow.setOverlayIcon(null, "");
    }
  }

  if (process.platform === "darwin" || process.platform === "linux") {
    app.setBadgeCount(badgeCount);
  }

  if (tray) {
    tray.setToolTip(
      badgeCount > 0
        ? `Calendar Tasks App - ${badgeCount} pending tasks`
        : "Calendar Tasks App",
    );
  }

  return true;
});

ipcMain.on("tasks:save", (_event, tasks) => {
  saveTasks(Array.isArray(tasks) ? tasks : []);
});

// Tags
function getTagsFilePath() {
  return path.join(app.getPath("userData"), "tags.json");
}

function readTags() {
  const filePath = getTagsFilePath();

  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return Array.isArray(payload) ? payload : (payload.tags ?? []);
  } catch (error) {
    console.error("Failed to read tags.json:", error);
    return [];
  }
}

function saveTags(tags = tagsCache) {
  tagsCache = tags;
  fs.writeFileSync(
    getTagsFilePath(),
    JSON.stringify({ tags: tagsCache }, null, 2),
  );
}

ipcMain.handle("tags:load", () => {
  tagsCache = readTags();
  return tagsCache;
});

ipcMain.on("tags:save", (_event, tags) => {
  saveTags(Array.isArray(tags) ? tags : []);
});

// Icons

function getIconsFolderPath() {
  return path.join(app.getPath("userData"), "icons");
}

ipcMain.handle("upload-image", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "svg"],
      },
    ],
  });

  if (result.canceled) {
    return null;
  }

  const sourcePath = result.filePaths[0];

  const iconsFolder = getIconsFolderPath();

  if (!fs.existsSync(iconsFolder)) {
    fs.mkdirSync(iconsFolder, { recursive: true });
  }

  const extension = path.extname(sourcePath);
  const filename = `${crypto.randomUUID()}${extension}`;

  const destinationPath = path.join(iconsFolder, filename);

  fs.copyFileSync(sourcePath, destinationPath);

  return filename;
});

ipcMain.handle("list-images", () => {
  const iconsFolder = getIconsFolderPath();

  if (!fs.existsSync(iconsFolder)) {
    return [];
  }

  const files = fs.readdirSync(iconsFolder)
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".png", ".jpg", ".jpeg", ".svg"].includes(ext);
    });

  return files;
});

ipcMain.handle("delete-image", (_, filename) => {
  const iconsFolder = getIconsFolderPath();
  const filePath = path.join(iconsFolder, filename);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }

  return false;
});

// Settings
function getSettingsFilePath() {
  return path.join(app.getPath("userData"), "settings.json");
}

function readSettings() {
  const filePath = getSettingsFilePath();

  if (!fs.existsSync(filePath)) {
    return {};
  }

  try {
    const payload = JSON.parse(fs.readFileSync(filePath, "utf8"));

    return typeof payload === "object" && payload !== null ? payload : {};
  } catch (error) {
    console.error("Failed to read settings.json:", error);
    return {};
  }
}

function saveSettings(settings = settingsCache) {
  settingsCache = settings;
  fs.writeFileSync(
    getSettingsFilePath(),
    JSON.stringify(settingsCache, null, 2),
  );
}

ipcMain.handle("settings:load", () => {
  settingsCache = readSettings();
  return settingsCache;
});

ipcMain.on("settings:save", (_event, settings) => {
  saveSettings(
    typeof settings === "object" && settings !== null ? settings : {},
  );
});

// window

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 1000,
    minWidth: 800,
    minHeight: 700,
    show: false,
    icon: path.join(__dirname, "assets", "icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow = win;

  win.once("ready-to-show", () => {
    win.maximize();
    win.show();
  });

  win.on("close", (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    }
  });

  win.webContents.on("will-navigate", (event, url) => {
    if (url !== win.webContents.getURL()) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  const devServerUrl = process.env.ELECTRON_START_URL;

  if (devServerUrl) {
    win.loadURL(devServerUrl);
    return;
  }

  const candidatePaths = [
    path.join(__dirname, "dist", "calendar-tasks", "browser", "index.html"),
    path.join(__dirname, "dist", "calendar-tasks", "index.html"),
    path.join(__dirname, "index.html"),
  ];
  const appPath = candidatePaths.find((candidatePath) =>
    fs.existsSync(candidatePath),
  );

  if (appPath) {
    win.loadFile(appPath);
    return;
  }

  win.loadURL(
    "data:text/html,<h1>Angular build not found</h1><p>Run npm run build or npm run dev.</p>",
  );
}

function setupAutoUpdater() {
  if (!app.isPackaged) {
    console.log("Updater disabled in development");
    return;
  }
  autoUpdater.on("checking-for-update", () => {
    console.log("Checking for updates...");
  });

  autoUpdater.on("update-available", (info) => {
    console.log("Update available:", info.version);
  });

  autoUpdater.on("update-not-available", () => {
    console.log("No update available");
  });

  autoUpdater.on("update-downloaded", () => {
    console.log("UPDATE DOWNLOADED EVENT FIRED");

    dialog
      .showMessageBox({
        type: "info",
        title: "Update ready",
        message: "A new version has been downloaded.",
        detail: "The application will restart to install the update.",
      })
      .then(() => {
        autoUpdater.quitAndInstall();
      });
  });

  autoUpdater.on("error", (error) => {
    console.error("Update error:", error);
  });

  autoUpdater.checkForUpdates();
}

//// Tray ////

function createTray() {
  const iconPath = path.join(__dirname, "assets", "icon.ico");
  tray = new Tray(iconPath);

  tray.setToolTip("Calendar Tasks App");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Open",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    // {
    //   type: "separator"
    // },
    {
      label: "Quit",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on("double-click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

////////////// APP //////////////

protocol.registerSchemesAsPrivileged([
  {
    scheme: "app-icon",
    privileges: {
      secure: true,
      supportFetchAPI: true,
      bypassCSP: true,
    },
  },
]);

app.whenReady().then(() => {
  ensureUserDataFolder();

  protocol.handle("app-icon", (request) => {
    const filename = decodeURIComponent(request.url.replace("app-icon://", ""));

    const iconPath = path.join(app.getPath("userData"), "icons", filename);

    return require("electron").net.fetch(`file://${iconPath}`);
  });

  createWindow();
  createTray();

  setupAutoUpdater();
});
