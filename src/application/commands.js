import { validateNightResolution } from "./night-validation.js";
import * as E from "../core/engine.js";
import { applyPlayerCommand } from "./player-commands.js";
import { applyNightResolution } from "./night-resolution.js";
export function applyCommand(game, command) {
  const { type } = command;
  if (typeof type !== "string") throw new Error("Comando no válido.");
  if (type.startsWith("day.") && type !== "day.begin" && game.phase !== "day")
    throw new Error("No hay un día abierto.");
  if (type.startsWith("night.") && game.phase !== "night")
    throw new Error("La partida no está en la noche.");
  if (type.startsWith("ability.") && game.phase === "ended")
    throw new Error(
      "La partida ya ha terminado. Usa Deshacer o una corrección avanzada.",
    );
  if (type.startsWith("player.")) return applyPlayerCommand(game, command);
  if (type === "night.record") {
    if (game.phase !== "night")
      throw new Error("La partida no está en la noche.");
    validateNightResolution(game, command.input);
    return applyNightResolution(game, command.input);
  }
  if (type === "night.preflight") {
    game.night.preflightConfirmed = true;
    E.addHistory(
      game,
      "Lista nocturna confirmada.",
      "El Narrador revisó los despertares aplicables.",
    );
    return;
  }
  if (type === "night.index") {
    const steps = E.nightSteps(game),
      first = steps.findIndex((s) => !game.night.completed.includes(s.id));
    if (
      !Number.isInteger(command.index) ||
      command.index < 0 ||
      command.index > steps.length ||
      (first >= 0 && command.index > first)
    )
      throw new Error("Revisa primero los pasos anteriores.");
    game.night.stepIndex = command.index;
    return;
  }
  if (type === "day.begin") {
    if (
      game.phase !== "night" ||
      E.nightSteps(game).some((step) => !game.night.completed.includes(step.id))
    )
      throw new Error(
        "Revisa todos los pasos nocturnos antes de comenzar el día.",
      );
    E.beginDay(game);
    return;
  }
  if (type === "day.open") {
    if (game.phase !== "day") throw new Error("No hay un día abierto.");
    game.day.stage = "nomination";
    E.addHistory(game, "Se abren las nominaciones.");
    return;
  }
  if (type === "day.nominate") {
    const { nominatorId, nomineeId, spyRegistersTownsfolk } = command;
    const preview = E.previewVirginNomination(game, nominatorId, nomineeId, {
      spyRegistersTownsfolk,
    });
    if (preview.virginTriggers)
      return E.addNomination(game, nominatorId, nomineeId, 0, [], {
        spyRegistersTownsfolk,
      });
    game.day.pendingNomination = {
      nominatorId,
      nomineeId,
      stage: "accusation",
      spyRegistersTownsfolk: Boolean(spyRegistersTownsfolk),
      virginTriggered: false,
    };
    E.addHistory(
      game,
      `${preview.nominator.name} nomina a ${preview.nominee.name}.`,
      "Comienza la acusación.",
    );
    E.resolveWitchNomination(game, nominatorId);
    return;
  }
  if (type === "day.cancel") {
    game.day.pendingNomination = null;
    game.day.stage = "nomination";
    E.addHistory(game, "Nominación cancelada antes del voto.");
    return;
  }
  if (type === "day.advance") {
    const pending = game.day.pendingNomination;
    if (
      !pending ||
      !["defense", "vote"].includes(command.stage) ||
      !(
        (pending.stage === "accusation" && command.stage === "defense") ||
        (pending.stage === "defense" && command.stage === "vote")
      )
    )
      throw new Error("Etapa de nominación inválida.");
    pending.stage = command.stage;
    return;
  }
  if (type === "day.vote") {
    const pending = game.day.pendingNomination;
    if (!pending || pending.stage !== "vote")
      throw new Error("No hay una votación pendiente.");
    return E.addNomination(
      game,
      pending.nominatorId,
      pending.nomineeId,
      command.voterIds.length,
      command.voterIds,
      { spyRegistersTownsfolk: pending.spyRegistersTownsfolk },
    );
  }
  if (type === "day.directVote")
    return E.addNomination(
      game,
      command.nominatorId,
      command.nomineeId,
      command.voterIds.length,
      command.voterIds,
      { spyRegistersTownsfolk: command.spyRegistersTownsfolk },
    );
  if (type === "day.close") {
    if (game.phase !== "day") throw new Error("No hay un día abierto.");
    return E.closeDay(game, { pacifistSaves: command.pacifistSaves });
  }
  if (type === "setup.confirm") return E.confirmAssignment(game, command);
  if (type === "deal.next" || type === "deal.back") {
    if (game.phase !== "deal") throw new Error("No hay un reparto activo.");
    if (type === "deal.back") game.dealIndex = Math.max(0, game.dealIndex - 1);
    else if (game.dealIndex < game.players.length - 1) game.dealIndex++;
    else {
      game.dealIndex = 0;
      E.addHistory(game, "Reparto secreto completado.");
      E.beginNight(game);
    }
    return;
  }
  if (type === "diagnostic.fix") {
    if (!E.diagnoseGame(game).some((issue) => issue.fixId === command.fixId))
      throw new Error("La corrección ya no está disponible.");
    return E.applyDiagnosticFix(game, command.fixId);
  }
  if (type === "effect.skip") {
    if (
      !game.pendingEffects.some(
        (e) => e.id === command.effectId && e.status === "pending",
      )
    )
      throw new Error("La decisión pendiente ya no está disponible.");
    return E.resolveEffect(game, command.effectId, {
      skipped: true,
      note: "El Narrador decidió no aplicar la opción.",
    });
  }
  if (type === "effect.resolve") {
    const effect = game.pendingEffects.find(
      (e) => e.id === command.effectId && e.status === "pending",
    );
    if (!effect)
      throw new Error("La decisión pendiente ya no está disponible.");
    const { values } = command;
    if (effect.type === "sweetheart_drunk")
      return E.resolveSweetheartDrunk(game, effect.id, values.target);
    if (effect.type === "klutz_choice")
      return E.resolveKlutzChoice(game, effect.source?.playerId, values.target);
    if (effect.type === "vigormortis_neighbour")
      return E.resolveVigormortisNeighbour(
        game,
        effect.source?.playerId,
        values.target,
      );
    if (effect.type === "barber_swap")
      return E.resolveBarberSwap(
        game,
        effect.id,
        values.actor,
        values.a,
        values.b,
      );
    if (effect.type === "sage_info") {
      const selected = [values.a, values.b];
      if (
        !selected[0] ||
        !selected[1] ||
        selected[0] === selected[1] ||
        selected.some((id) => !E.getPlayer(game, id))
      )
        throw new Error("Muestra dos jugadores distintos al Sabio Ermitaño.");
      const falseInfo = E.vortoxForcesFalseInformation(game);
      if (
        !effect.data?.unreliable &&
        !falseInfo &&
        !selected.includes(effect.data?.demonId)
      )
        throw new Error(
          "Uno de los dos debe ser el Demonio que mató al Sabio Ermitaño.",
        );
      if (
        !effect.data?.unreliable &&
        falseInfo &&
        selected.some(
          (id) =>
            E.character(E.getPlayer(game, id).character, game.scriptId)
              ?.team === "demon",
        )
      )
        throw new Error(
          "Con Vortox, muestra dos jugadores que no sean Demonios.",
        );
      return E.resolveEffect(game, effect.id, {
        targetIds: selected,
        note: `Se muestran ${selected.map((id) => E.getPlayer(game, id).name).join(" y ")}.`,
      });
    }
    throw new Error("Este efecto requiere una resolución manual registrada.");
  }
  const operations = {
    "ability.slayer": "useSlayer",
    "ability.moonchild": "chooseMoonchild",
    "ability.tinker": "resolveTinkerDeath",
    "ability.savant": "recordSavantVisit",
    "ability.artist": "useArtistQuestion",
    "ability.juggler": "recordJugglerGuesses",
    "ability.madness": "resolveMadnessExecution",
    "ability.pitHag": "recordPitHagArbitraryChoice",
  };
  const method = operations[type];
  if (method) return E[method](game, ...command.args);
  throw new Error("Comando desconocido.");
}
