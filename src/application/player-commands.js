import {
  getPlayer,
  changeCharacter,
  killPlayer,
  closeDay,
  executionLeader,
  addHistory,
  applySnvPassiveEffects,
} from "../core/engine.js";
import { clone } from "../core/utils.js";
export function applyPlayerCommand(
  game,
  { type, playerId, values, reason = "", cause = "other", successorId = null },
) {
  const player = getPlayer(game, playerId);
  if (!player) throw new Error("El jugador no existe.");
  if (type === "player.notes") {
    player.notes = String(values.notes || "");
    addHistory(game, `Notas de ${player.name} actualizadas.`, "", {
      action: "player_notes",
      targetId: playerId,
    });
    return;
  }
  const before = clone(player);
  if (type === "player.correct") {
    if (!reason.trim())
      throw new Error("Escribe el motivo de la corrección avanzada.");
    const allowed = [
      "character",
      "perceivedCharacter",
      "alignment",
      "masterId",
      "alive",
      "poisoned",
      "protected",
      "redHerring",
      "abilityUsed",
      "ghostVote",
    ];
    for (const key of allowed) player[key] = values[key];
    addHistory(
      game,
      `Registro de ${player.name} corregido.`,
      `${reason}\nNo se han resuelto automáticamente habilidades; revisa protecciones, muertes, usos y efectos relacionados.`,
      {
        action: "manual_correction",
        targetId: playerId,
        before,
        after: clone(player),
      },
    );
    return;
  }
  if (type !== "player.resolve")
    throw new Error("Acción de jugador desconocida.");
  if (values.character !== player.character && values.alive !== player.alive)
    throw new Error(
      "Resuelve primero el cambio de personaje o la muerte; haz cada operación por separado.",
    );
  if (values.character !== player.character) {
    changeCharacter(game, playerId, values.character, {
      alignment: values.alignment,
      reason: reason || "Cambio de personaje confirmado por el Narrador.",
      rule: "Cambio de personaje",
    });
    applySnvPassiveEffects(game);
  } else if (player.alive && !values.alive) {
    if (cause === "execution") {
      if (game.phase !== "day" || executionLeader(game).nomineeId !== playerId)
        throw new Error(
          "Resuelve las ejecuciones desde el día y la picota actual.",
        );
      closeDay(game);
    } else killPlayer(game, playerId, cause, { successorId });
  } else if (!player.alive && values.alive) {
    if (!reason.trim())
      throw new Error(
        "Indica qué habilidad o decisión permite la resurrección.",
      );
    changeCharacter(game, playerId, player.character, {
      reason,
      resetUsage: true,
    });
    player.alive = true;
    player.ghostVote = false;
    player.diedThisNight = false;
    applySnvPassiveEffects(game);
    addHistory(
      game,
      `${player.name} resucita por decisión confirmada del Narrador.`,
      reason,
      {
        action: "narrator_resurrection",
        targetId: playerId,
        before,
        after: clone(player),
      },
    );
  } else
    throw new Error(
      "No hay una muerte, resurrección o cambio de personaje que resolver. Usa Notas o Corrección avanzada para otros ajustes.",
    );
}
