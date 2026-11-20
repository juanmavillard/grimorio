import test from "node:test";
import assert from "node:assert/strict";
import { createGame, handlersForScript } from "../src/engine.js";
import { CURRENT_SCHEMA_VERSION, migrateGame } from "../src/migrations.js";
import {
  TROUBLE_BREWING_SCRIPT,
  validateScriptDefinition,
} from "../src/scripts.js";

const roles = [
  "washerwoman",
  "chef",
  "empath",
  "fortune_teller",
  "monk",
  "butler",
  "poisoner",
  "imp",
];
const names = ["Ana", "Berto", "Cris", "Dani", "Eva", "Fran", "Gala", "Hugo"];

test("la definición de Trouble Brewing cumple el contrato de guion", () => {
  assert.equal(validateScriptDefinition(TROUBLE_BREWING_SCRIPT).valid, true);
  assert.equal(
    TROUBLE_BREWING_SCRIPT.handlerIds.includes("character_change"),
    true,
  );
  assert.equal(
    TROUBLE_BREWING_SCRIPT.nightOrder.first.includes("poisoner"),
    true,
  );
  const handlers = handlersForScript("trouble_brewing");
  assert.equal(typeof handlers.night.steps, "function");
  assert.equal(typeof handlers.nomination.add, "function");
  assert.equal(handlersForScript("guion_desconocido"), null);
});

test("una partida nueva nace en esquema 4 con edición, guion y eventos", () => {
  const game = createGame(names, roles, { random: () => 0.999 });
  assert.equal(game.schemaVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(game.editionId, "base3");
  assert.equal(game.scriptId, "trouble_brewing");
  assert.equal(game.events.length, 1);
  assert.equal(game.events[0].event.action, "game_created");
});

test("la migración de v1 conserva reparto, historial y añade datos v4", () => {
  const legacy = createGame(names, roles, { random: () => 0.999 });
  legacy.schemaVersion = 1;
  delete legacy.editionId;
  delete legacy.scriptId;
  delete legacy.events;
  delete legacy.night.preflightConfirmed;
  delete legacy.day.stage;
  delete legacy.day.pendingNomination;
  legacy.history[0] = {
    id: legacy.history[0].id,
    at: legacy.history[0].at,
    phase: "setup",
    text: "Partida creada.",
  };

  const migrated = migrateGame(legacy);
  assert.equal(migrated.schemaVersion, 4);
  assert.equal(migrated.scriptId, "trouble_brewing");
  assert.deepEqual(
    migrated.players.map((player) => player.character),
    legacy.players.map((player) => player.character),
  );
  assert.equal(migrated.history[0].event.action, "legacy_note");
  assert.equal(migrated.events.length, migrated.history.length);
  assert.equal(migrated.night.preflightConfirmed, false);
  assert.equal(migrated.day.pendingNomination, null);
  assert.equal(
    migrated.reminders.some((reminder) => reminder.type === "red_herring"),
    true,
  );
  assert.deepEqual(migrated.deathLog, []);
});

test("una partida de una versión futura o guion desconocido se rechaza sin reinterpretarla", () => {
  const future = createGame(names, roles, { random: () => 0.999 });
  future.schemaVersion = 99;
  assert.throws(() => migrateGame(future), /más reciente/);
  const unknownScript = createGame(names, roles, { random: () => 0.999 });
  unknownScript.scriptId = "guion_desconocido";
  assert.throws(() => migrateGame(unknownScript), /no están disponibles/);
});
