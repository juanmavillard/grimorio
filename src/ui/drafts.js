import { draftAccess } from "../core/active-store.js";
import { downloadJson } from "./game-actions.js";
import { uid } from "../core/utils.js";
import { formKind } from "./form-adapters.js";
const LIMIT = 256 * 1024;
export async function createDraftManager({
  root,
  context,
  notify,
  openDialog,
  captureModel = () => null,
  restoreModel = () => false,
}) {
  let tabId;
  try {
    tabId = sessionStorage.getItem("grimorio.tab") || uid();
    sessionStorage.setItem("grimorio.tab", tabId);
  } catch {
    tabId = uid();
  }
  let damaged = [],
    records = {},
    dirty = false,
    mounted = null,
    pending = null,
    storageFailed = false,
    suppressCapture = false;
  try {
    const loaded = await draftAccess("readonly", (store) => store.get(tabId));
    damaged = Array.isArray(loaded?.damaged) ? loaded.damaged : [];
    const source = loaded?.records;
    if (source && typeof source === "object" && !Array.isArray(source))
      for (const [key, record] of Object.entries(source)) {
        if (
          record &&
          Number.isInteger(record.revision) &&
          typeof record.view === "string" &&
          Array.isArray(record.fields) &&
          record.fields.every(
            (field) =>
              field &&
              typeof field.key === "string" &&
              typeof field.value === "string" &&
              typeof field.label === "string",
          )
        )
          records[key] = record;
        else damaged.push({ key, raw: record });
      }
  } catch {
    notify(
      "No se pudieron leer los borradores de esta pestaña. Las entradas nuevas se conservarán en memoria si falla su guardado.",
      "error",
    );
  }
  const controls = () =>
    [
      ...root.querySelectorAll('input:not([type="file"]),select,textarea'),
    ].filter((el) => !el.classList.contains("assignment-role"));
  const key = (el, index) =>
    el.id ||
    `${el.tagName}:${el.type}:${el.className}:${el.dataset.id || el.dataset.voter || el.dataset.role || el.dataset.index || ""}:${index}`;
  const scope = (c) => `${c.gameId || "setup"}:${c.view}`;
  let writeQueue = Promise.resolve();
  function persist() {
    const value = { records, damaged };
    if (new TextEncoder().encode(JSON.stringify(value)).length > LIMIT) {
      storageFailed = true;
      notify(
        "El borrador es demasiado grande para guardarlo; permanece en esta pestaña.",
        "error",
      );
      return;
    }
    const snapshot = structuredClone(value);
    writeQueue = writeQueue
      .catch(() => {})
      .then(() =>
        draftAccess("readwrite", (store) => store.put(snapshot, tabId)),
      )
      .then(() => {
        storageFailed = false;
      })
      .catch(() => {
        if (!storageFailed)
          notify(
            "No se pudo guardar el borrador; se conserva en memoria.",
            "error",
          );
        storageFailed = true;
      });
  }
  function capture() {
    if (!dirty || !mounted || document.body.dataset.privateOverlay) return;
    const fields = controls().map((el, index) => ({
      key: key(el, index),
      value: el.value,
      checked: el.checked,
      label: el.closest("label")?.innerText || el.id || "Campo",
    }));
    const dialogId =
      root.querySelector("dialog[open]")?.dataset.playerId || null;
    records[scope(mounted)] = {
      ...mounted,
      fields,
      dialogId,
      kind: formKind(mounted.view, dialogId),
      model: captureModel(mounted.view),
      at: Date.now(),
    };
    persist();
  }
  function restore(record) {
    if (record.dialogId) openDialog(record.dialogId);
    const saved = new Map(record.fields.map((field) => [field.key, field]));
    controls().forEach((el, index) => {
      const value = saved.get(key(el, index));
      if (value) {
        el.value = value.value;
        if (typeof value.checked === "boolean") el.checked = value.checked;
      }
    });
  }
  root.addEventListener(
    "input",
    () => {
      dirty = true;
      capture();
    },
    true,
  );
  root.addEventListener(
    "change",
    (event) => {
      if (event.target.type !== "file") {
        dirty = true;
        capture();
      }
    },
    true,
  );
  root.addEventListener("click", (event) => {
    if (event.target.closest('button[value="cancel"]')) clearCurrent();
  });
  let focus;
  function beforeRender() {
    if (!suppressCapture) {
      if (root.querySelector("dialog[open]")) dirty = true;
      capture();
    }
    suppressCapture = false;
    const el = document.activeElement;
    focus =
      el && root.contains(el)
        ? {
            key: key(el, controls().indexOf(el)),
            start: el.selectionStart,
            end: el.selectionEnd,
          }
        : null;
  }
  function afterRender() {
    mounted = context();
    dirty = false;
    pending = null;
    if (document.body.dataset.privateOverlay) return;
    const record = records[scope(mounted)];
    if (!record) return;
    if (record.revision === mounted.revision) {
      restore(record);
      dirty = true;
    } else {
      pending = record;
      const banner = document.createElement("div");
      banner.className = "info-callout";
      banner.setAttribute("role", "status");
      banner.innerHTML =
        '<p>Hay un borrador de una revisión anterior. Revísalo antes de recuperarlo.</p><button data-action="review-draft">Revisar borrador</button> <button data-action="discard-draft">Descartar borrador</button>';
      root.prepend(banner);
    }
    if (focus) {
      const el = controls().find((el, index) => key(el, index) === focus.key);
      if (el) {
        el.focus();
        try {
          if (focus.start != null) el.setSelectionRange(focus.start, focus.end);
        } catch {}
      }
    }
  }
  function clearCurrent() {
    if (mounted) delete records[scope(mounted)];
    dirty = false;
    suppressCapture = true;
    persist();
  }
  function clearAll() {
    damaged = [];
    records = {};
    dirty = false;
    suppressCapture = true;
    persist();
  }
  async function handle(action) {
    if (action === "export-drafts") {
      await downloadJson(exportData(), "grimorio-borradores-privados.json");
      return true;
    }
    if (action === "discard-all-drafts") {
      if (
        confirm(
          "¿Descartar todos los borradores de esta pestaña? La partida confirmada se conserva.",
        )
      )
        clearAll();
      return true;
    }
    if (action === "discard-draft") {
      clearCurrent();
      return true;
    }
    if (action !== "review-draft" || !pending) return false;
    const description = pending.fields
      .map(
        (f) =>
          `${f.label.trim()}: ${f.checked === undefined ? f.value : ["checkbox", "radio"].some((type) => f.key.includes(type)) ? f.checked : f.value}`,
      )
      .join("\n");
    if (
      confirm(
        `Borrador privado de otra revisión:\n\n${description}\n\n¿Recuperarlo para revisarlo? Todavía no se aplicará a la partida.`,
      )
    ) {
      pending.revision = mounted.revision;
      restoreModel(pending.model, pending.view);
      restore(pending);
      dirty = true;
      capture();
    }
    return true;
  }
  const exportData = () => ({
    format: "grimorio-drafts",
    records: structuredClone(records),
    damaged: structuredClone(damaged),
  });
  const prepareRender = () => {
    const current = context(),
      record = records[scope(current)];
    if (record?.revision === current.revision)
      restoreModel(record.model, current.view);
  };
  return {
    dialogOpened: () => {
      suppressCapture = false;
    },
    beforeRender,
    prepareRender,
    afterRender,
    clearCurrent,
    clearAll,
    handle,
    exportData,
    flush: () => writeQueue,
    prepareClose: async () => {
      capture();
      await writeQueue;
      if (storageFailed)
        throw new Error(
          "Hay borradores sin guardar. Exporta un rescate o cancela el cierre.",
        );
    },
    hasChanges: () => dirty || Object.keys(records).length > 0,
  };
}
