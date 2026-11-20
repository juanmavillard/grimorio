import { applicationError } from "./errors.js";
import * as repository from "../core/active-store.js";
import * as E from "../core/engine.js";
import { validateGameForImport } from "../core/game-files.js";
import { applyCommand } from "./commands.js";
export function createApplicationService({
  confirmOutcome = () => true,
  published = () => {},
} = {}) {
  let queue = Promise.resolve(),
    pending = 0;
  function dispatch(command) {
    // Captura la revisión al pulsar, antes de esperar otras operaciones.
    const expected = command.revision ?? repository.currentRevision();
    pending++;
    const run = queue.then(async () => {
      if (repository.isStale() || expected !== repository.currentRevision())
        throw new Error(
          "La partida cambió en otra pestaña o acción. Recarga antes de continuar.",
        );
      const previous = repository.confirmedGame();
      const options = { expectedRevision: expected };
      let next;
      if (command.type === "game.create") {
        if (previous) throw new Error("Sustituye primero la partida activa.");
        const { names, roles, options: gameOptions } = command.input;
        next = E.createGame(names, roles, gameOptions);
        await repository.saveGame(next, options);
      } else if (command.type === "game.import")
        next = await repository.importGame(command.raw, options);
      else if (command.type === "game.clear") {
        await repository.clearGame(options);
        next = null;
      } else if (command.type === "game.undo")
        next = await repository.undo(previous, options);
      else if (command.type === "game.redo")
        next = await repository.redo(previous, options);
      else if (command.type === "game.restore") {
        next = await repository.restoreRecoveryPoint(
          previous?.id,
          command.pointId,
          options,
        );
        if (!next) throw new Error("Ese punto ya no está disponible.");
      } else {
        if (!previous) throw new Error("No hay una partida activa.");
        next = await repository.commit(
          previous,
          (draft) => {
            if (command.type === "setup.shuffle") E.shuffleAssignment(draft);
            else if (command.type === "setup.assign")
              E.assignCharacter(draft, command.playerId, command.role);
            else {
              const transition =
                command.type === "day.close" ? "night" : "next";
              if (
                !command.type.startsWith("effect.") &&
                ![
                  "player.notes",
                  "player.correct",
                  "night.index",
                  "night.preflight",
                  "setup.confirm",
                  "deal.next",
                  "deal.back",
                  "diagnostic.fix",
                ].includes(command.type)
              ) {
                const blocking = E.blockingPendingEffects(draft, transition);
                if (blocking.length)
                  throw new Error(
                    `Resuelve primero: ${blocking.map((e) => e.label).join(", ")}.`,
                  );
              }
              applyCommand(draft, command);
            }
            validateGameForImport(draft);
            if (
              !previous.outcome &&
              draft.outcome &&
              !confirmOutcome(draft.outcome)
            )
              throw new Error("Final cancelado; no se ha aplicado la acción.");
          },
          options,
        );
      }
      try {
        published(next, previous, command);
      } catch (error) {
        console.error(
          "Error de interfaz después de confirmar el guardado:",
          error,
        );
      }
      return next;
    });
    queue = run.catch(() => {});
    return run
      .catch((error) => {
        throw applicationError(error);
      })
      .finally(() => pending--);
  }
  return { dispatch, busy: () => pending > 0, state: repository.confirmedGame };
}
