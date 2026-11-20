import {
  readRescueSnapshot,
  cleanupRecoveryData,
} from "../core/recovery-store.js";
import { downloadJson } from "./game-actions.js";
import { initializePlatform } from "./platform.js";
import { installDesktopLifecycle } from "./desktop-lifecycle.js";
await initializePlatform();
import {
  checkFileSize,
  GAME_FILE_LIMIT,
  RESCUE_FILE_LIMIT,
  validateGameForImport,
} from "../core/game-files.js";
const output = document.querySelector("#result");
const status = document.querySelector("#status");
const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const gameKeys = [
  "grimorio.indexeddb.active",
  "grimorio.base3.game.v1",
  "grimorio.tb.game.v1",
  "grimorio.base3.games.v1",
  "grimorio.tb.games.v1",
  "grimorio.base3.recovery.v1",
  "grimorio.tb.recovery.v1",
  "grimorio.base3.migration-backups.v1",
  "grimorio.tb.migration-backups.v1",
];
const localData = {};
let displayed = [];
async function download(data, name) {
  try {
    const limit = name.startsWith("grimorio-partida-")
      ? GAME_FILE_LIMIT
      : RESCUE_FILE_LIMIT;
    const result = await downloadJson(data, name, limit);
    status.textContent =
      result.status === "cancelled"
        ? "Guardado cancelado; los datos se conservan."
        : result.status === "saved"
          ? "Copia guardada."
          : "Se ha solicitado la descarga de la copia.";
  } catch (error) {
    status.textContent = error.message;
  }
}
function inspect(data, source) {
  displayed = [];
  const issues = [];
  for (const key of gameKeys) {
    if (typeof data[key] !== "string") continue;
    let value;
    try {
      value = JSON.parse(data[key]);
    } catch {
      issues.push(key);
      continue;
    }
    if (!value) continue;
    const entries =
      key === "grimorio.indexeddb.active"
        ? [
            value.game,
            ...(Array.isArray(value.recovery) ? value.recovery : []),
            ...(Array.isArray(value.damaged) ? value.damaged : []).map(
              (item) => item.raw,
            ),
          ]
        : Array.isArray(value)
          ? value
          : key.includes("recovery")
            ? Object.values(value).flat()
            : [value];
    for (const [entryIndex, entry] of entries.entries()) {
      const game = entry?.snapshot || entry?.game || entry;
      if (!game || !Array.isArray(game.players)) continue;
      const label =
        key === "grimorio.indexeddb.active"
          ? entryIndex === 0
            ? "Partida activa"
            : "Punto de recuperación"
          : key.includes("recovery")
            ? "Punto de recuperación antiguo"
            : key.includes("migration-backups")
              ? "Copia anterior a una migración"
              : key.includes("games")
                ? "Partida de la biblioteca antigua"
                : "Partida activa del almacenamiento anterior";
      let warning = "";
      try {
        validateGameForImport(game);
      } catch (error) {
        warning = error.message;
      }
      displayed.push({
        game,
        key,
        label,
        warning,
        at: entry.at || game.updatedAt || game.createdAt || "",
        size: new Blob([JSON.stringify(game)]).size,
      });
    }
  }
  output.innerHTML = `<div class="rescue-results-heading"><div><p class="eyebrow">Versiones disponibles</p><h2>${escape(source)}</h2></div><span class="rescue-count">${displayed.length} versiones</span></div><p class="rescue-explanation">La misma partida puede aparecer varias veces con estados diferentes. Revisa la fecha y la fase para distinguirlas.</p>${issues.length ? `<p class="rescue-error" role="alert">No se pueden leer: ${issues.map(escape).join(", ")}. La copia completa los conserva.</p>` : ""}${displayed.length ? `<div class="rescue-list">${displayed.map((item, index) => `<article class="rescue-item"><div><span class="rescue-type">${escape(item.label)}</span><h3>${escape(item.game.title || "Partida sin nombre")}</h3><p>${escape(item.at || "sin fecha")} · ${escape(item.game.phase || "fase desconocida")} · ronda ${escape(item.game.round ?? "?")} · ${(item.size / 1024).toFixed(1)} KB</p><small>Identificador: ${escape(item.game.id || "desconocido")}</small>${item.warning ? `<p class="rescue-error">${escape(item.warning)} Se conserva la versión original para rescate.</p>` : ""}</div><button class="secondary" data-index="${index}">Descargar esta versión</button></article>`).join("")}</div>` : `<p class="rescue-empty">No hay partidas ni versiones guardadas en este origen.</p>`}`;
}
let operations = 0;
async function operation(action) {
  operations++;
  try {
    await action();
  } catch (error) {
    status.textContent = error.message || "No se pudo completar la operación.";
  } finally {
    operations--;
  }
}
async function refresh() {
  const rescue = await readRescueSnapshot();
  for (const key of Object.keys(localData)) delete localData[key];
  Object.assign(localData, rescue.data);
  inspect(localData, "Datos actuales de este dispositivo");
  if (rescue.warnings.length) status.textContent = rescue.warnings.join(" ");
  return rescue;
}
await refresh();
document.querySelector("#backup").addEventListener("click", () =>
  operation(async () => {
    const rescue = await refresh();
    await download(
      rescue,
      `grimorio-rescate-${new Date().toISOString().slice(0, 10)}.json`,
    );
  }),
);
document.querySelector("#cleanup").addEventListener("click", () =>
  operation(async () => {
    const rescue = await refresh();
    const active = JSON.parse(
      rescue.data["grimorio.indexeddb.active"] || "null",
    );
    if (Object.hasOwn(rescue.data, "grimorio.indexeddb.active") && !active) {
      status.textContent =
        "No hay datos activos que limpiar. Los originales se conservan.";
      return;
    }
    if (
      !confirm(
        `${active?.game?.id ? `Se conservará la partida activa «${active.game.title || "Sin nombre"}».` : "No hay una partida activa."} Se borrarán las copias de recuperación y originales dañados anteriores. No hace falta descargarlos antes. ¿Continuar?`,
      )
    )
      return;
    await cleanupRecoveryData({ expectedRevision: active?.revision ?? 0 });
    await refresh();
    status.textContent = active?.game
      ? "Datos antiguos borrados. Se conserva la partida activa."
      : "Datos antiguos borrados. No hay ninguna partida activa.";
  }),
);
output.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-index]");
  if (button && displayed[Number(button.dataset.index)])
    void operation(() =>
      download(
        displayed[Number(button.dataset.index)].game,
        `grimorio-partida-${Number(button.dataset.index) + 1}.json`,
      ),
    );
});
document.querySelector("#import").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  operations++;
  try {
    checkFileSize(file, RESCUE_FILE_LIMIT);
    const parsed = JSON.parse(await file.text());
    if (
      parsed?.format !== "grimorio-rescate" ||
      !parsed.data ||
      typeof parsed.data !== "object" ||
      Array.isArray(parsed.data)
    )
      throw new Error("El archivo no es una copia de rescate válida.");
    inspect(parsed.data, `Archivo: ${file.name}`);
    status.textContent =
      "Archivo abierto sin modificar los datos del navegador.";
  } catch (error) {
    status.textContent = `No se pudo abrir el archivo: ${error.message}`;
  }
  operations--;
  event.target.value = "";
});

installDesktopLifecycle({
  busy: () => operations > 0,
  rescue: () => readRescueSnapshot(),
});
