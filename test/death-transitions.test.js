import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  beginDay,
  beginNight,
  killPlayer,
  hasAbility,
  changeCharacter,
  blockingPendingEffects,
  resolveEvilTwinSetup,
} from "../src/engine.js";
import { migrateGame } from "../src/migrations.js";
const names = Array.from({ length: 8 }, (_, i) => `Persona ${i + 1}`);
const restored = (game) => migrateGame(JSON.parse(JSON.stringify(game)));
const player = (game, role) => game.players.find((p) => p.character === role);

test("el día adicional de Mente Maestra sobrevive a una restauración y bloquea el final por dos vivos", () => {
  let game = createGame(
    names,
    [
      "grandmother",
      "sailor",
      "chambermaid",
      "gambler",
      "fool",
      "tinker",
      "mastermind",
      "pukka",
    ],
    { scriptId: "bad_moon_rising", random: () => 0.99 },
  );
  beginDay(game);
  killPlayer(game, player(game, "pukka").id, "execution");
  assert.equal(game.outcome, null);
  assert.equal(
    game.pendingEffects.filter((e) => e.type === "mastermind_extra_day").length,
    1,
  );
  game = restored(game);
  for (const target of game.players.filter(
    (p) => p.alive && !["mastermind", "sailor"].includes(p.character),
  ))
    killPlayer(game, target.id, "manual", { ignoreProtection: true });
  assert.equal(game.players.filter((p) => p.alive).length, 2);
  assert.equal(game.outcome, null);
});

test("la victoria aplazada por Gemelos se resuelve tras restaurar y morir el Gemelo malvado", () => {
  let game = createGame(
    names,
    [
      "clockmaker",
      "dreamer",
      "snake_charmer",
      "flowergirl",
      "savant",
      "mutant",
      "evil_twin",
      "vortox",
    ],
    { scriptId: "sects_and_violets", random: () => 0.99 },
  );
  resolveEvilTwinSetup(
    game,
    player(game, "evil_twin").id,
    player(game, "dreamer").id,
  );
  beginNight(game);
  killPlayer(game, player(game, "vortox").id, "manual");
  assert.equal(game.outcome, null);
  assert.equal(game.snvTwinVictoryPending, true);
  game = restored(game);
  killPlayer(game, player(game, "evil_twin").id, "execution");
  assert.equal(game.outcome.winner, "good");
  assert.equal(game.snvTwinVictoryPending, false);
});

test("transformar al Filósofo limpia su habilidad adquirida y los efectos pendientes conservan su momento", () => {
  const game = createGame(
    names,
    [
      "clockmaker",
      "dreamer",
      "philosopher",
      "flowergirl",
      "savant",
      "mutant",
      "witch",
      "vortox",
    ],
    { scriptId: "sects_and_violets", random: () => 0.99 },
  );
  const actor = player(game, "philosopher");
  actor.philosopherRole = "artist";
  actor.philosopherGainedAbilityUsed = true;
  changeCharacter(game, actor.id, "oracle");
  assert.equal(actor.philosopherRole, null);
  assert.equal(actor.philosopherGainedAbilityUsed, false);
  assert.equal(hasAbility(actor, game), true);
  game.pendingEffects.push({
    id: "choice",
    type: "klutz_choice",
    status: "pending",
  });
  beginNight(game);
  assert.equal(blockingPendingEffects(game).length, 0);
  beginDay(game);
  assert.equal(blockingPendingEffects(game).length, 1);
});
