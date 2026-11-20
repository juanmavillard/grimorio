// Acceso de rescate independiente: no importa motor, migraciones ni interfaz.
const DB_NAME = "grimorio-base3-active";
const legacySuffixes = [
  "game",
  "undo",
  "redo",
  "games",
  "recovery",
  "migration-backups",
];
export const legacyKeys = ["grimorio.base3", "grimorio.tb"].flatMap((prefix) =>
  legacySuffixes.map((suffix) => `${prefix}.${suffix}.v1`),
);

async function openRecoveryDatabase(create = false) {
  const databases = await indexedDB.databases?.();
  if (!create && databases && !databases.some((db) => db.name === DB_NAME))
    return null;
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("state");
      request.result.createObjectStore("drafts");
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error("Cierra las otras ventanas para acceder al rescate."));
  });
}

export async function readRescueSnapshot({ memoryDrafts } = {}) {
  const data = {},
    warnings = [];
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index);
      if (key?.startsWith("grimorio.")) data[key] = localStorage.getItem(key);
    }
  } catch {
    warnings.push(
      "No se pudieron leer las preferencias o los datos heredados.",
    );
  }
  let db;
  try {
    db = await openRecoveryDatabase();
    if (db && db.objectStoreNames.contains("state")) {
      const stores = [
        "state",
        ...(db.objectStoreNames.contains("drafts") ? ["drafts"] : []),
      ];
      const snapshot = await new Promise((resolve, reject) => {
        const tx = db.transaction(stores, "readonly"),
          result = {};
        const state = tx.objectStore("state").get("active");
        state.onsuccess = () => {
          result.active = state.result;
        };
        if (stores.includes("drafts")) {
          const values = tx.objectStore("drafts").getAll(),
            keys = tx.objectStore("drafts").getAllKeys();
          values.onsuccess = () => {
            result.values = values.result;
          };
          keys.onsuccess = () => {
            result.keys = keys.result;
          };
        }
        tx.oncomplete = () => resolve(result);
        tx.onerror = tx.onabort = () =>
          reject(tx.error || Error("No se pudo leer el rescate."));
      });
      if (snapshot.active !== undefined)
        data["grimorio.indexeddb.active"] = JSON.stringify(snapshot.active);
      if (snapshot.values)
        data["grimorio.indexeddb.drafts"] = JSON.stringify(
          snapshot.values.map((value, index) => ({
            tabId: snapshot.keys[index],
            value,
          })),
        );
    }
  } catch (error) {
    warnings.push(error.message || "No se pudo leer IndexedDB.");
  } finally {
    db?.close();
  }
  if (memoryDrafts)
    data["grimorio.memory.drafts"] = JSON.stringify(memoryDrafts);
  return {
    format: "grimorio-rescate",
    exportedAt: new Date().toISOString(),
    data,
    warnings,
  };
}

export async function cleanupRecoveryData({ expectedRevision }) {
  if (!Number.isInteger(expectedRevision) || expectedRevision < 0)
    throw new Error("Lee primero los datos actuales antes de limpiar.");
  const db = await openRecoveryDatabase(true);
  if (!db) return null;
  let updated;
  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction("state", "readwrite"),
        store = tx.objectStore("state"),
        request = store.get("active");
      let failure;
      request.onsuccess = () => {
        const current =
          request.result === undefined && expectedRevision === 0
            ? { game: null, undo: [], redo: [], recovery: [], revision: 0 }
            : request.result;
        if (
          !current ||
          typeof current !== "object" ||
          (current.revision ?? 0) !== expectedRevision ||
          !Array.isArray(current.undo) ||
          !Array.isArray(current.redo)
        ) {
          failure = new Error(
            "Los datos cambiaron o están dañados. Vuelve a leer el rescate antes de limpiar.",
          );
          tx.abort();
          return;
        }
        updated = {
          ...current,
          recovery: [],
          damaged: [],
          revision: expectedRevision + 1,
        };
        store.put(updated, "active");
      };
      tx.oncomplete = resolve;
      tx.onerror = tx.onabort = () =>
        reject(
          failure || tx.error || Error("No se pudo limpiar el almacenamiento."),
        );
    });
  } finally {
    db.close();
  }
  // IndexedDB ya está confirmado; las claves heredadas se retiran por separado.
  for (const key of legacyKeys) localStorage.removeItem(key);
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel("grimorio-revisions");
    channel.postMessage({
      gameId: updated.game?.id || null,
      revision: updated.revision,
    });
    channel.close();
  }
  return updated;
}
