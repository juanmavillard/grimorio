import { addHistory } from "./events.js";
import { clone, uid } from "./utils.js";
import { migrateGame } from "./migrations.js";
import { readLegacyActiveGame } from "./legacy-data.js";
import { validateGameForImport } from "./game-files.js";

const DB_NAME = "grimorio-base3-active";
const STORE = "state";
const KEY = "active";
const MAX_UNDO = 10;
const MAX_RECOVERY = 3;
const AUX_BUDGET = 2 * 1024 * 1024;
let database;
let queue = Promise.resolve();
let stale = false;
let corruptActive = false;
let corruptFingerprint = null;
let lastSaveMs = null;
let storageEstimate = null;
if (typeof navigator !== "undefined")
  navigator.storage
    ?.estimate?.()
    .then((value) => {
      storageEstimate = value;
    })
    .catch(() => {});
let revisionListener = () => {};
const channel =
  typeof window !== "undefined" && typeof BroadcastChannel !== "undefined"
    ? new BroadcastChannel("grimorio-revisions")
    : null;
if (channel)
  channel.onmessage = ({ data }) => {
    if (
      Number.isInteger(data?.revision) &&
      data.revision > (cached.revision || 0)
    ) {
      stale = true;
      revisionListener({ stale: true, revision: data.revision });
    }
  };
export function onRevisionChange(listener) {
  revisionListener = listener;
}
export const currentRevision = () => cached.revision || 0;
export const isStale = () => stale;
export const confirmedGame = () => hydrate(cached.game);
export const repositoryWarnings = () => clone(cached.damaged || []);
export function storageMetrics() {
  return {
    revision: currentRevision(),
    activeBytes: cached.game ? bytes(cached.game) : 0,
    auxiliaryBytes: bytes([cached.undo, cached.redo, cached.recovery]),
    undo: cached.undo.length,
    redo: cached.redo.length,
    recovery: cached.recovery.length,
    auxiliaryBudget: AUX_BUDGET,
    lastSaveMs,
    usage: storageEstimate?.usage ?? null,
    quota: storageEstimate?.quota ?? null,
    damaged: (cached.damaged || []).length,
  };
}
function serial(action) {
  const result = queue.then(action);
  queue = result.catch(() => {});
  return result;
}
export const repositoryBusy = () => pendingWrites > 0;
let pendingWrites = 0;
function write(action, options = {}) {
  pendingWrites++;
  return serial(() => {
    if (
      options.expectedRevision != null &&
      options.expectedRevision !== currentRevision()
    )
      throw new Error(
        "La partida cambió en otra pestaña o acción. Recarga antes de continuar.",
      );
    return action();
  }).finally(() => {
    pendingWrites--;
  });
}
let cached = { game: null, undo: [], redo: [], recovery: [] };
let saveListener = () => {};
export function onSaveStatus(listener) {
  saveListener = listener;
}
const bytes = (value) => new TextEncoder().encode(JSON.stringify(value)).length;
const compact = (game) => {
  const result = clone(game);
  if (JSON.stringify(result.events) === JSON.stringify(result.history))
    delete result.events;
  return result;
};
const hydrate = (game) => (game === null ? null : validateGameForImport(game));
function trim(bundle) {
  bundle.undo = bundle.undo.slice(-MAX_UNDO);
  bundle.redo = bundle.redo.slice(-MAX_UNDO);
  bundle.recovery = bundle.recovery.slice(0, MAX_RECOVERY);
  while (
    bytes([bundle.undo, bundle.redo, bundle.recovery]) > AUX_BUDGET &&
    (bundle.undo.length || bundle.redo.length || bundle.recovery.length)
  ) {
    if (bundle.undo.length) bundle.undo.shift();
    else if (bundle.redo.length) bundle.redo.shift();
    else bundle.recovery.pop();
  }
  return bundle;
}
export async function openActiveStore() {
  stale = true;
  if (database) database.close();
  database = await new Promise((resolve, reject) => {
    let blocked = false;
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE))
        request.result.createObjectStore(STORE);
      if (!request.result.objectStoreNames.contains("drafts"))
        request.result.createObjectStore("drafts");
    };
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else resolve(request.result);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(
        new Error(
          "Cierra las otras pestañas del Grimorio para abrir el almacenamiento.",
        ),
      );
    };
  });
  database.onversionchange = () => {
    database.close();
    stale = true;
    revisionListener({ stale: true, versionChanged: true });
  };
  const loaded = await new Promise((resolve, reject) => {
    const tx = database.transaction(STORE, "readwrite"),
      store = tx.objectStore(STORE),
      request = store.get(KEY);
    let result, failure;
    request.onsuccess = () => {
      try {
        result = request.result;
        if (result === undefined) {
          const legacy = readLegacyActiveGame();
          const game = legacy ? migrateGame(legacy) : null;
          result = {
            game: game ? compact(game) : null,
            undo: [],
            redo: [],
            recovery: [],
            revision: 0,
          };
          store.put(result, KEY);
        }
      } catch (error) {
        failure = error;
        tx.abort();
      }
    };
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () =>
      reject(failure || tx.error || new Error("No se pudo abrir la partida."));
  });
  function preserveCorrupt(reason) {
    cached = {
      game: null,
      undo: [],
      redo: [],
      recovery: [],
      revision: Number.isInteger(loaded?.revision) ? loaded.revision : 0,
      damaged: [{ kind: "active_bundle", raw: clone(loaded), reason }],
    };
    corruptFingerprint = JSON.stringify(loaded);
    corruptActive = true;
    stale = false;
    throw new Error(
      `Partida activa dañada: ${reason}. Descarga el rescate o importa una copia válida; el original se conservará.`,
    );
  }
  if (
    !loaded ||
    typeof loaded !== "object" ||
    !Array.isArray(loaded.undo) ||
    !Array.isArray(loaded.redo) ||
    !Array.isArray(loaded.recovery) ||
    (loaded.revision != null &&
      (!Number.isInteger(loaded.revision) || loaded.revision < 0)) ||
    (loaded.damaged != null && !Array.isArray(loaded.damaged))
  )
    preserveCorrupt("Envoltura del almacén inválida");
  let game;
  try {
    game = hydrate(loaded.game);
  } catch (error) {
    preserveCorrupt(error.message);
  }
  const next = clone(loaded);
  next.damaged ||= [];
  for (const key of ["undo", "redo", "recovery"])
    next[key] = loaded[key].filter((item) => {
      try {
        const restored = hydrate(key === "recovery" ? item.snapshot : item);
        if (!restored || restored.id !== game?.id)
          throw new Error("Copia de otra partida");
        return true;
      } catch (error) {
        next.damaged.push({ kind: key, raw: item, reason: error.message });
        return false;
      }
    });
  cached = next;
  stale = false;
  corruptActive = false;
  corruptFingerprint = null;
  return game;
}
async function persist(next, recovering = false) {
  const started = performance.now();
  saveListener("saving");
  try {
    if (stale)
      throw new Error(
        "La partida cambió en otra pestaña. Recarga esta página antes de continuar.",
      );
    if (corruptActive && !recovering)
      throw new Error(
        "La partida activa está dañada. Usa Recuperación o importa una copia válida.",
      );
    hydrate(next.game);
    trim(next);
    const rescueFingerprint =
      recovering && corruptActive ? corruptFingerprint : null;
    const expected = cached.revision || 0;
    next.revision = expected + 1;
    await new Promise((resolve, reject) => {
      const tx = database.transaction(STORE, "readwrite");
      const store = tx.objectStore(STORE);
      let conflict = false,
        writeError = null;
      const request = store.get(KEY);
      request.onsuccess = () => {
        if (
          rescueFingerprint !== null
            ? JSON.stringify(request.result) !== rescueFingerprint
            : (request.result?.revision || 0) !== expected
        ) {
          conflict = true;
          tx.abort();
          return;
        }
        try {
          store.put(next, KEY);
        } catch (error) {
          writeError = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error || new Error("No se pudo completar el guardado."));
      tx.onabort = () =>
        reject(
          conflict
            ? new Error(
                "La partida cambió en otra pestaña. Recarga esta página antes de continuar.",
              )
            : writeError || tx.error || new Error("Se canceló el guardado."),
        );
    });
    cached = next;
    corruptActive = false;
    corruptFingerprint = null;
    lastSaveMs = performance.now() - started;
    if (typeof navigator !== "undefined")
      navigator.storage
        ?.estimate?.()
        .then((value) => {
          storageEstimate = value;
        })
        .catch(() => {});
    saveListener("saved");
    channel?.postMessage({
      gameId: next.game?.id || null,
      revision: next.revision,
    });
  } catch (error) {
    saveListener("error", error);
    throw error;
  }
}
export const canUndo = () => cached.undo.length > 0;
export const canRedo = () => cached.redo.length > 0;
export const loadRecoveryPoints = (id) =>
  cached.recovery
    .filter((p) => p.snapshot?.id === id)
    .map((p) => ({ ...p, snapshot: hydrate(p.snapshot) }));
function checkpoint(bundle, game) {
  if (game)
    bundle.recovery.unshift({
      id: uid(),
      at: new Date().toISOString(),
      phase: game.phase,
      round: game.round,
      snapshot: compact(game),
    });
}
async function performSaveGame(game) {
  const next = clone(cached);
  if (next.game?.id !== game.id) {
    next.undo = [];
    next.redo = [];
    next.recovery = [];
  }
  next.game = compact(game);
  await persist(next);
  return game;
}
async function performCommit(current, mutate) {
  const base = cached.game ? hydrate(cached.game) : current;
  if (base?.id !== current?.id)
    throw new Error(
      "La partida activa ha cambiado. Recarga antes de continuar.",
    );
  const game = clone(base);
  mutate(game);
  const next = clone(cached);
  next.undo.push(compact(base));
  next.redo = [];
  checkpoint(next, base);
  next.game = compact(game);
  await persist(next);
  return game;
}
async function performUndo(current) {
  if (!cached.undo.length) return current;
  const next = clone(cached),
    game = hydrate(next.undo.pop());
  next.redo.push(clone(cached.game));
  next.game = compact(game);
  await persist(next);
  return game;
}
async function performRedo(current) {
  if (!cached.redo.length) return current;
  const next = clone(cached),
    game = hydrate(next.redo.pop());
  next.undo.push(clone(cached.game));
  next.game = compact(game);
  await persist(next);
  return game;
}
async function performClearGame() {
  const next = { game: null, undo: [], redo: [], recovery: [] };
  await persist(next);
}
async function performImportGame(raw) {
  const game = validateGameForImport(raw);
  await persist(
    {
      game: compact(game),
      undo: [],
      redo: [],
      recovery: cached.game?.id === game.id ? clone(cached.recovery) : [],
      damaged: clone(cached.damaged || []),
    },
    true,
  );
  return game;
}
async function performRestoreRecoveryPoint(gameId, pointId) {
  const point = cached.recovery.find(
    (item) => item.id === pointId && item.snapshot?.id === gameId,
  );
  if (!point) return null;
  const restored = hydrate(point.snapshot),
    next = clone(cached);
  addHistory(
    restored,
    "Punto de recuperación restaurado.",
    "El Narrador restauró una copia automática local.",
    {
      action: "recovery_restore",
      automatic: false,
      rule: "Recuperación local",
    },
  );
  if (next.game) {
    const previous = hydrate(next.game);
    checkpoint(next, previous);
    next.undo.push(compact(previous));
  }
  next.redo = [];
  next.game = compact(restored);
  await persist(next);
  return restored;
}

export const saveGame = (game, options) =>
  write(() => performSaveGame(game), options);

export const commit = (current, mutate, options) =>
  write(() => performCommit(current, mutate), options);

export const undo = (current, options) =>
  write(() => performUndo(current), options);

export const redo = (current, options) =>
  write(() => performRedo(current), options);

export const clearGame = (options) => write(() => performClearGame(), options);

export const importGame = (raw, options) =>
  write(() => performImportGame(raw), options);

export const restoreRecoveryPoint = (gameId, pointId, options) =>
  write(() => performRestoreRecoveryPoint(gameId, pointId), options);

export function draftAccess(mode, action) {
  return new Promise((resolve, reject) => {
    if (!database) return reject(new Error("Almacén no disponible"));
    const tx = database.transaction("drafts", mode);
    let result;
    try {
      const req = action(tx.objectStore("drafts"));
      if (req)
        req.onsuccess = () => {
          result = req.result;
        };
    } catch (error) {
      try {
        tx.abort();
      } catch {}
      reject(error);
    }
    tx.oncomplete = () => resolve(result);
    tx.onabort = tx.onerror = () =>
      reject(tx.error || new Error("No se pudo guardar el borrador"));
  });
}
