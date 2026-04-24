const { app, BrowserWindow } = require("electron");
const path = require("node:path");
const fs = require("node:fs");

const isPackaged = app.isPackaged;
const rootDir = isPackaged
  ? path.join(process.resourcesPath, "app")
  : path.join(__dirname, "..");

function loadEnv() {
  const candidates = [
    path.join(rootDir, ".env"),
    path.join(app.getPath("home"), ".assistant-bot", ".env"),
    path.join(__dirname, "..", ".env"),
  ];

  for (const envPath of candidates) {
    try {
      const contents = fs.readFileSync(envPath, "utf8");
      for (const line of contents.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed.slice(eq + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
      console.log("Loaded env from:", envPath);
      return;
    } catch {}
  }
  console.warn("No .env file found, checked:", candidates);
}

loadEnv();

if (isPackaged) {
  process.env.ASSISTANT_BOT_DATA = path.join(app.getPath("userData"), "data");
}

async function main() {
  const { startServer } = await import("../server/index.js");
  const port = await startServer();

  const win = new BrowserWindow({
    width: 900,
    height: 720,
    minWidth: 480,
    minHeight: 400,
    backgroundColor: "#0a0a0b",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 14, y: 14 },
    icon: path.join(rootDir, "assets", "icon.png"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  win.loadURL(`http://127.0.0.1:${port}`);
}

app.whenReady().then(main);

app.on("window-all-closed", () => {
  app.quit();
});
