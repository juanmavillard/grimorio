import { checkFileSize, GAME_FILE_LIMIT } from "../core/game-files.js";
import { saveJson, isDesktop } from "./platform.js";
import { chooseDialog } from "./dialogs.js";
// Gestión de la partida activa. Los cambios visibles se publican tras el guardado.
export async function downloadJson(payload, filename, limit = GAME_FILE_LIMIT) {
  if (new Blob([JSON.stringify(payload, null, 2)]).size > limit)
    alert(
      `Esta copia supera ${limit / 1024 / 1024} MiB y no podrá cargarse con el importador actual. Se guardará completa.`,
    );
  return saveJson(payload, filename);
}

async function confirmReplacement(game, notify) {
  if (!game) return true;
  const { choice } = await chooseDialog({
    title: "Sustituir la partida activa",
    message:
      "Puedes guardar una copia antes de sustituirla. La partida actual se conserva hasta confirmar la operación.",
    choices: [
      { value: "cancel", label: "Cancelar" },
      { value: "download", label: "Guardar copia" },
      { value: "replace", label: "Continuar sin guardar", primary: true },
    ],
  });
  if (choice === "download") {
    const result = await downloadJson(
      game,
      `grimorio-${new Date().toISOString().slice(0, 10)}.json`,
    );
    if (result.status !== "cancelled")
      notify(
        "Comprueba la copia y vuelve a intentarlo cuando quieras sustituir la partida.",
      );
    return false;
  }
  return choice === "replace";
}

export async function handleGameAction(action, target, context) {
  const { game, notify, render, dispatch } = context;
  if (action === "export") {
    const result = await downloadJson(
      game,
      `grimorio-${new Date().toISOString().slice(0, 10)}.json`,
    );
    if (isDesktop() && result.status === "saved") notify("Copia guardada");
    return;
  }
  if (action === "new-game") {
    if (!(await confirmReplacement(game, notify))) return;
    await dispatch({ type: "game.clear" });
    context.view = "setup";
    render();
    return;
  }
  if (action === "restore-checkpoint") {
    if (
      !confirm(
        "¿Restaurar este punto de recuperación? La partida actual se conservará también como punto de recuperación.",
      )
    )
      return;
    const restored = await dispatch({
      type: "game.restore",
      pointId: target.dataset.point,
    });
    if (!restored) return notify("Ese punto ya no está disponible.", "error");
    context.view = restored.phase === "ended" ? "grimoire" : restored.phase;
    render();
    notify("Punto restaurado");
    return;
  }
  if (action === "undo" || action === "redo") {
    const restored = await dispatch({
      type: action === "undo" ? "game.undo" : "game.redo",
    });
    context.view = restored.phase === "ended" ? "grimoire" : restored.phase;
    render();
    notify(action === "undo" ? "Cambio deshecho" : "Cambio rehecho");
  }
}

export async function handleGameImport(input, context) {
  const file = input.files[0];
  if (!file) return;
  const { parseGameFile, dispatch, notify, render } = context;
  try {
    checkFileSize(file);
    const { raw: parsed } = parseGameFile(await file.text());
    if (
      !confirm(
        `Abrir «${parsed.title || "Partida sin nombre"}»\nGuion: ${parsed.scriptId || "trouble_brewing"}\nFecha: ${parsed.updatedAt || parsed.createdAt || "desconocida"}`,
      )
    )
      return;
    if (!(await confirmReplacement(context.game, notify))) return;
    const imported = await dispatch({ type: "game.import", raw: parsed });
    context.view = imported.phase === "ended" ? "grimoire" : imported.phase;
    render();
    notify(
      `Partida importada (${parsed.schemaVersion < imported.schemaVersion ? `migrada a versión ${imported.schemaVersion}` : "versión actual"})`,
    );
  } catch (error) {
    notify(error.message || "No se pudo importar.", "error");
  } finally {
    input.value = "";
  }
}
