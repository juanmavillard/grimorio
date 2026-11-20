import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  randomRoleSet,
  beginNight,
  addHistory,
  addReminder,
  queueEffect,
} from "../src/engine.js";
import { CURRENT_SCHEMA_VERSION, migrateGame } from "../src/migrations.js";
import { parseGameFile } from "../src/core/game-files.js";

test("las fachadas históricas conservan las mismas exportaciones que sus módulos reales", async () => {
  for (const [facade, module] of [
    ["engine", "core/engine"],
    ["migrations", "core/migrations"],
    ["store", "core/store"],
    ["scripts", "core/scripts"],
    ["help", "ui/help"],
    ["data", "scripts/trouble-brewing/data"],
    ["presets", "scripts/trouble-brewing/presets"],
  ]) {
    const [old, current] = await Promise.all([
      import(`../src/${facade}.js`),
      import(`../src/${module}.js`),
    ]);
    assert.deepEqual(Object.keys(old), Object.keys(current), facade);
    for (const key of Object.keys(current))
      assert.equal(old[key], current[key], `${facade}.${key}`);
  }
  const other = await import("../src/other-scripts.js");
  const bmr = await import("../src/scripts/bad-moon-rising/data.js");
  const sv = await import("../src/scripts/sects-and-violets/data.js");
  assert.equal(other.BMR_CHARACTERS, bmr.BMR_CHARACTERS);
  assert.equal(other.BMR_NIGHT, bmr.BMR_NIGHT);
  assert.equal(other.SV_CHARACTERS, sv.SV_CHARACTERS);
  assert.equal(other.SV_NIGHT, sv.SV_NIGHT);
});

test("los tres guiones conservan formato 4 y sus datos privados al exportar y cargar", () => {
  assert.equal(CURRENT_SCHEMA_VERSION, 4);
  for (const scriptId of [
    "trouble_brewing",
    "bad_moon_rising",
    "sects_and_violets",
  ]) {
    const roles = randomRoleSet(8, () => 0.99, scriptId);
    const game = migrateGame(
      createGame(
        Array.from({ length: 8 }, (_, i) => `Persona ${i + 1}`),
        roles,
        { scriptId, random: () => 0.99 },
      ),
    );
    beginNight(game);
    game.players[0].notes = "Nota privada de cierre";
    addHistory(game, "Decisión de prueba", "Detalle privado");
    addReminder(game, {
      type: "custom",
      label: "Recordatorio privado",
      playerId: game.players[0].id,
      duration: "permanent",
    });
    queueEffect(game, {
      type: "custom",
      label: "Decisión pendiente",
      targetIds: [game.players[1].id],
      data: { instruction: "Revisar en privado" },
    });
    const before = JSON.parse(JSON.stringify(game));
    const loaded = parseGameFile(JSON.stringify(game)).game;
    assert.equal(loaded.schemaVersion, 4);
    assert.equal(loaded.scriptId, scriptId);
    for (const field of [
      "players",
      "history",
      "events",
      "night",
      "day",
      "reminders",
      "pendingEffects",
      "bluffs",
      "deathLog",
    ])
      assert.deepEqual(loaded[field], before[field], `${scriptId}: ${field}`);
    assert.deepEqual(
      JSON.parse(JSON.stringify(game)),
      before,
      "Importar no modifica el original",
    );
  }
});
