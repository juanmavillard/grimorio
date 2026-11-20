import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  beginDay,
  addNomination,
  closeDay,
  killPlayer,
} from "../src/engine.js";
import { migrateGame } from "../src/migrations.js";
const names = Array.from({ length: 8 }, (_, i) => `Persona ${i + 1}`);
const find = (game, role) => game.players.find((p) => p.character === role);
const make = (scriptId, roles) =>
  createGame(names, roles, { scriptId, random: () => 0.99 });

test("el Alcalde solo gana sin ejecución si conserva la habilidad al cerrar el día", () => {
  for (const poisoned of [false, true]) {
    const game = make("trouble_brewing", [
      "washerwoman",
      "chef",
      "empath",
      "monk",
      "mayor",
      "butler",
      "poisoner",
      "imp",
    ]);
    const mayor = find(game, "mayor");
    const living = new Set([
      mayor.id,
      find(game, "imp").id,
      find(game, "chef").id,
    ]);
    game.players.forEach((p) => {
      p.alive = living.has(p.id);
    });
    mayor.poisoned = poisoned;
    beginDay(game);
    closeDay(game);
    assert.equal(game.outcome?.winner || null, poisoned ? null : "good");
  }
});

test("Vortox considera ejecución aunque se ejecute a un jugador ya muerto", () => {
  const game = make("sects_and_violets", [
    "clockmaker",
    "dreamer",
    "snake_charmer",
    "flowergirl",
    "savant",
    "mutant",
    "witch",
    "vortox",
  ]);
  beginDay(game);
  const target = find(game, "dreamer");
  target.alive = false;
  target.ghostVote = true;
  const voters = game.players
    .filter((p) => p.alive)
    .slice(0, 4)
    .map((p) => p.id);
  addNomination(game, voters[0], target.id, 4, voters);
  closeDay(game);
  assert.equal(game.day.executedId, target.id);
  assert.equal(game.day.executionCausedDeath, false);
  assert.equal(game.outcome, null);
  assert.equal(game.phase, "night");
});

test("el cierre del día adicional de Mente Maestra conserva su prioridad tras importar", () => {
  let game = make("bad_moon_rising", [
    "grandmother",
    "sailor",
    "chambermaid",
    "gambler",
    "gossip",
    "goon",
    "mastermind",
    "pukka",
  ]);
  beginDay(game);
  killPlayer(game, find(game, "pukka").id, "execution");
  closeDay(game);
  game = migrateGame(JSON.parse(JSON.stringify(game)));
  beginDay(game);
  const evil = find(game, "mastermind");
  const voters = game.players
    .filter((p) => p.alive)
    .slice(0, 4)
    .map((p) => p.id);
  addNomination(game, voters[0], evil.id, 4, voters);
  closeDay(game);
  assert.equal(game.outcome.winner, "good");
  assert.match(game.outcome.reason, /Mente Maestra/);
  const historyLength = game.history.length;
  closeDay(game);
  assert.equal(
    game.history.length,
    historyLength,
    "Cerrar dos veces no duplica efectos",
  );
});
