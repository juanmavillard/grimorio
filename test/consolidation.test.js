import test from "node:test";
import assert from "node:assert/strict";
import { createGame, beginNight, activeReminders } from "../src/core/engine.js";
import {
  validateGameForImport,
  checkFileSize,
  GAME_FILE_LIMIT,
  RESCUE_FILE_LIMIT,
} from "../src/core/game-files.js";
import { applyCommand } from "../src/application/commands.js";
import { canNavigate } from "../src/ui/navigation.js";
const create = () =>
  createGame(
    ["A", "B", "C", "D", "E", "F", "G", "H"],
    [
      "washerwoman",
      "chef",
      "empath",
      "fortune_teller",
      "monk",
      "butler",
      "poisoner",
      "imp",
    ],
    { random: () => 0.99 },
  );
test("valida campos usados por pantallas y referencias internas antes de abrir archivos", () => {
  const valid = create();
  beginNight(valid);
  for (const corrupt of [
    (g) => delete g.selectedRoles,
    (g) => (g.history[0].text = 123),
    (g) => (g.day.stage = "imposible"),
    (g) =>
      g.pendingEffects.push(
        { id: "duplicado", type: "custom" },
        { id: "duplicado", type: "custom" },
      ),
    (g) => (g.players[0].masterId = "desconocido"),
    (g) =>
      g.pendingEffects.push({
        id: "efecto",
        type: "sage_info",
        status: "pending",
        data: { demonId: "desconocido" },
      }),
  ]) {
    const raw = structuredClone(valid);
    corrupt(raw);
    assert.throws(() => validateGameForImport(raw));
  }
  assert.throws(() => checkFileSize({ size: GAME_FILE_LIMIT + 1 }));
  assert.doesNotThrow(() =>
    checkFileSize({ size: RESCUE_FILE_LIMIT }, RESCUE_FILE_LIMIT),
  );
});
test("las rutas de revelación y fases se validan también sin depender de botones", () => {
  const game = create();
  beginNight(game);
  assert.equal(canNavigate("reveal", game), false);
  assert.equal(canNavigate("day", game), false);
  assert.equal(canNavigate("night", game), true);
  game.phase = "ended";
  game.outcome = { winner: "good" };
  assert.equal(canNavigate("reveal", game), true);
});
test("notas, resolución reglamentaria y corrección avanzada tienen efectos distintos", () => {
  const game = create();
  beginNight(game);
  const actor = game.players.find((p) => p.character === "chef");
  applyCommand(game, {
    type: "player.notes",
    playerId: actor.id,
    values: { notes: "Texto privado", alive: false },
  });
  assert.equal(actor.alive, true);
  assert.equal(actor.notes, "Texto privado");
  assert.throws(
    () =>
      applyCommand(game, {
        type: "player.correct",
        playerId: actor.id,
        values: { alive: false },
      }),
    /motivo/,
  );
  const values = { ...actor, alive: false };
  applyCommand(game, {
    type: "player.correct",
    playerId: actor.id,
    values,
    reason: "Corregir una marca anterior",
  });
  assert.equal(game.deathLog.length, 0);
  assert.equal(game.history[0].event.action, "manual_correction");
  actor.alive = true;
  applyCommand(game, {
    type: "player.resolve",
    playerId: actor.id,
    values: { ...actor, alive: false },
    cause: "other",
  });
  assert.equal(game.deathLog.at(-1).died, true);
  assert.equal(actor.diedThisNight, true);
});
test("los recordatorios derivados siguen los estados y no duplican marcadores migrados", () => {
  const game = create(),
    actor = game.players[0];
  actor.poisoned = true;
  game.reminders.push({
    id: "legacy",
    playerId: actor.id,
    type: "poison",
    data: { migrated: true },
  });
  assert.equal(
    activeReminders(game, actor.id).filter((r) => r.type === "poison").length,
    1,
  );
  actor.poisoned = false;
  assert.equal(
    activeReminders(game, actor.id).filter((r) => r.type === "poison").length,
    0,
  );
});
