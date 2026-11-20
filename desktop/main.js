import {
  app,
  BrowserWindow,
  protocol,
  session,
  ipcMain,
  dialog,
  shell,
  Menu,
} from "electron";
import { readFile } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { RELEASE } from "../src/release.js";
import {
  APP_ORIGIN,
  APP_ID,
  PROFILE_NAME,
  CSP,
  isAppUrl,
  externalUrl,
  resourcePath,
} from "./security.js";
import { saveExport } from "./files.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const testProfile = process.env.GRIMORIO_DESKTOP_TEST_PROFILE;
app.setName("Grimorio Base 3");
app.setPath(
  "userData",
  testProfile || join(app.getPath("appData"), PROFILE_NAME),
);
app.setAppUserModelId(APP_ID);
protocol.registerSchemesAsPrivileged([
  {
    scheme: "grimorio",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
]);
const lock = app.requestSingleInstanceLock();
if (!lock) app.quit();
let window,
  allowedClose = false,
  transition = false,
  exportCount = 0,
  rendererReady = false,
  startupTimer;
const requests = new Map();
const trusted = (event) =>
  event.sender === window?.webContents &&
  event.senderFrame === window.webContents.mainFrame &&
  isAppUrl(event.senderFrame.url);
function lifecycle(kind) {
  if (!window || window.webContents.isDestroyed())
    return Promise.resolve({
      ready: false,
      error:
        "La interfaz no responde. Puedes abrir Recuperación desde el menú.",
    });
  return new Promise((resolve) => {
    const token = randomUUID(),
      timer = setTimeout(() => {
        requests.delete(token);
        resolve({
          ready: false,
          error: "No se ha podido confirmar que los datos estén guardados.",
        });
      }, 25000);
    requests.set(token, { resolve, timer });
    window.webContents.send("grimorio:lifecycle", { token, kind });
  });
}
async function leave(destination) {
  if (transition || exportCount) return;
  transition = true;
  try {
    for (;;) {
      const result = await lifecycle("prepare");
      if (result.ready) break;
      const { response } = await dialog.showMessageBox(window, {
        type: "warning",
        title: "Datos pendientes",
        message: "No se ha confirmado el guardado.",
        detail: result.error || "Revisa la partida antes de salir.",
        buttons: ["Reintentar", "Exportar rescate", "Cancelar"],
        defaultId: 2,
        cancelId: 2,
      });
      if (response === 2) return;
      if (response === 1) {
        await lifecycle("export");
        return;
      }
    }
    if (destination) await window.loadURL(`${APP_ORIGIN}/${destination}`);
    else {
      allowedClose = true;
      window.close();
    }
  } finally {
    transition = false;
  }
}
function recoveryMenu() {
  return leave("recuperar.html");
}
function configureWindow() {
  window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 760,
    minHeight: 560,
    show: false,
    title: "Grimorio privado · Base 3",
    backgroundColor: "#181614",
    webPreferences: {
      preload: join(root, "desktop/preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      webviewTag: false,
    },
  });
  window.once("ready-to-show", () => window.show());
  window.on("close", (event) => {
    if (!allowedClose) {
      event.preventDefault();
      void leave();
    }
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    const safe = externalUrl(url);
    if (safe) void shell.openExternal(safe);
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    event.preventDefault();
    if (isAppUrl(url)) {
      const parsed = new URL(url);
      void leave(parsed.pathname.slice(1) || "index.html");
    } else {
      const safe = externalUrl(url);
      if (safe) void shell.openExternal(safe);
    }
  });
  window.webContents.on("will-attach-webview", (event) =>
    event.preventDefault(),
  );
  window.webContents.on(
    "did-start-navigation",
    (_event, _url, _inPlace, isMain) => {
      if (isMain) {
        rendererReady = false;
        clearTimeout(startupTimer);
      }
    },
  );
  window.webContents.on("did-finish-load", () => {
    if (!rendererReady) {
      startupTimer = setTimeout(() => {
        if (!rendererReady && window && !window.isDestroyed())
          void window.loadURL(`${APP_ORIGIN}/desktop/error.html`);
      }, 12000);
      startupTimer.unref();
    }
  });
  window.webContents.on(
    "did-fail-load",
    (_event, code, _description, url, main) => {
      if (main && code !== -3 && url !== `${APP_ORIGIN}/recuperar.html`)
        void window.loadURL(`${APP_ORIGIN}/recuperar.html`);
    },
  );
  window.webContents.on("render-process-gone", async () => {
    const { response } = await dialog.showMessageBox(window, {
      type: "error",
      message: "La ventana del Grimorio se ha interrumpido.",
      detail:
        "Los datos confirmados se conservan. Puedes abrir Recuperación sin borrarlos.",
      buttons: ["Abrir recuperación", "Salir"],
      defaultId: 0,
    });
    if (response === 0) void window.loadURL(`${APP_ORIGIN}/recuperar.html`);
    else {
      allowedClose = true;
      window.close();
    }
  });
  void window.loadURL(`${APP_ORIGIN}/`);
}
if (lock) {
  app.on("second-instance", () => {
    if (window) {
      if (window.isMinimized()) window.restore();
      window.show();
      window.focus();
    }
  });
  app.on("before-quit", (event) => {
    if (window && !allowedClose) {
      event.preventDefault();
      void leave();
    }
  });
  app.on("window-all-closed", () => app.quit());
  app
    .whenReady()
    .then(async () => {
      const allowed = new Set([...RELEASE.assets, "desktop/error.html"]);
      protocol.handle("grimorio", async (request) => {
        const file = resourcePath(root, request.url, allowed);
        if (!file || !["GET", "HEAD"].includes(request.method))
          return new Response("Recurso no disponible", { status: 404 });
        try {
          const body = await readFile(file);
          const headers = new Headers();
          headers.set("Content-Security-Policy", CSP);
          headers.set("X-Content-Type-Options", "nosniff");
          headers.set("Cache-Control", "no-store");
          const types = {
            ".js": "text/javascript",
            ".html": "text/html",
            ".css": "text/css",
            ".svg": "image/svg+xml",
            ".webmanifest": "application/manifest+json",
          };
          if (types[extname(file)])
            headers.set("Content-Type", types[extname(file)]);
          return new Response(request.method === "HEAD" ? null : body, {
            status: 200,
            headers,
          });
        } catch {
          return new Response("Recurso no disponible", { status: 404 });
        }
      });
      session.defaultSession.setPermissionRequestHandler(
        (_contents, _permission, callback) => callback(false),
      );
      session.defaultSession.setPermissionCheckHandler(() => false);
      session.defaultSession.webRequest.onBeforeRequest((details, callback) =>
        callback({
          cancel:
            !isAppUrl(details.url) &&
            !details.url.startsWith("blob:grimorio://app/") &&
            !details.url.startsWith("data:"),
        }),
      );
      session.defaultSession.on("will-download", (_event, item) => {
        item.cancel();
        void dialog.showMessageBox(window, {
          type: "info",
          message: "Utiliza Guardar como desde la aplicación.",
        });
      });
      ipcMain.handle("grimorio:runtime", (event) => {
        if (!trusted(event)) throw Error("Origen no permitido");
        return {
          kind: "desktop",
          version: app.getVersion(),
          resources: RELEASE.version,
          platform: process.platform,
          arch: process.arch,
          profile: app.getPath("userData"),
        };
      });
      ipcMain.handle("grimorio:save-json", async (event, value) => {
        if (!trusted(event)) throw Error("Origen no permitido");
        exportCount++;
        try {
          return await saveExport(value, async (filename) => {
            const result = await dialog.showSaveDialog(window, {
              title: "Guardar copia privada",
              defaultPath: join(app.getPath("documents"), filename),
              filters: [
                { name: "Archivo JSON del Grimorio", extensions: ["json"] },
              ],
            });
            return result.canceled ? null : result.filePath;
          });
        } catch {
          return {
            status: "error",
            message: "La solicitud de exportación no es válida.",
          };
        } finally {
          exportCount--;
        }
      });
      ipcMain.on("grimorio:lifecycle-result", (event, value) => {
        if (!trusted(event) || typeof value?.token !== "string") return;
        const pending = requests.get(value.token);
        if (!pending) return;
        clearTimeout(pending.timer);
        requests.delete(value.token);
        pending.resolve({
          ready: value.ready === true,
          error: typeof value.error === "string" ? value.error : null,
        });
      });
      ipcMain.on("grimorio:renderer-ready", (event) => {
        if (trusted(event)) {
          rendererReady = true;
          clearTimeout(startupTimer);
        }
      });
      Menu.setApplicationMenu(
        Menu.buildFromTemplate([
          {
            label: "Grimorio",
            submenu: [
              {
                label: "Abrir Grimorio",
                click: () => void leave("index.html"),
              },
              { label: "Recuperar partidas", click: () => void recoveryMenu() },
              { type: "separator" },
              {
                label: "Acerca del Grimorio",
                click: () =>
                  void dialog.showMessageBox(window, {
                    message: "Grimorio privado · Base 3",
                    detail: `Aplicación ${app.getVersion()}\nRecursos ${RELEASE.version}\nFormato de partida 4\nUso personal · Sin cuentas ni telemetría`,
                  }),
              },
              { type: "separator" },
              {
                label: "Salir",
                accelerator: process.platform === "darwin" ? "Cmd+Q" : "Alt+F4",
                click: () => void leave(),
              },
            ],
          },
          {
            label: "Edición",
            submenu: [
              { role: "undo" },
              { role: "redo" },
              { type: "separator" },
              { role: "cut" },
              { role: "copy" },
              { role: "paste" },
              { role: "selectAll" },
            ],
          },
          {
            label: "Vista",
            submenu: [
              { role: "resetZoom" },
              { role: "zoomIn" },
              { role: "zoomOut" },
              { role: "togglefullscreen" },
            ],
          },
        ]),
      );
      configureWindow();
    })
    .catch((error) => {
      dialog.showErrorBox(
        "No se pudo abrir el Grimorio",
        `Los datos no se han borrado.\n${error.message}`,
      );
      allowedClose = true;
      app.quit();
    });
}
