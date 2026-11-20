import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  randomRoleSet,
  beginDay,
  townSquareProjection,
} from "../src/core/engine.js";
import { applyCommand } from "../src/application/commands.js";
import { validateGameForImport } from "../src/core/game-files.js";
function randomSource(seed) {
  let value = seed;
  return () => {
    value = (1664525 * value + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
test("PREV-09: secuencias legales ejercitan votos, cierre y transiciones sin acumular rechazos", () => {
  for (const scriptId of [
    "trouble_brewing",
    "bad_moon_rising",
    "sects_and_violets",
  ])
    for (let seed = 1; seed <= 30; seed++) {
      const random = randomSource(seed),
        roles = randomRoleSet(8, random, scriptId);
      let game = createGame(
        Array.from({ length: 8 }, (_, i) => `Persona ${i + 1}`),
        roles,
        { scriptId, random },
      );
      beginDay(game);
      const ids = game.players.map((p) => p.id);
      let successes = 0,
        votes = 0,
        transitions = 0;
      for (let turn = 0; turn < 20; turn++) {
        const actor = game.players[Math.floor(random() * 8)];
        let command = {
          type: "player.notes",
          playerId: actor.id,
          values: { notes: `Nota ${turn}` },
        };
        if (game.phase === "day" && turn < 16 && turn % 3 === 1) {
          const nominators = game.players.filter(
            (p) =>
              p.alive &&
              !game.day.nominations.some((n) => n.nominatorId === p.id),
          );
          const nominees = game.players.filter(
            (p) =>
              p.character !== "virgin" &&
              !game.day.nominations.some((n) => n.nomineeId === p.id),
          );
          if (nominators.length && nominees.length) {
            const a = nominators[Math.floor(random() * nominators.length)],
              b = nominees[Math.floor(random() * nominees.length)];
            command = {
              type: "day.directVote",
              nominatorId: a.id,
              nomineeId: b.id,
              voterIds: game.players
                .filter((p) => (p.alive || p.ghostVote) && random() > 0.4)
                .map((p) => p.id),
            };
          }
        } else if (turn === 16 && game.phase === "day")
          command = { type: "day.close" };
        else if (turn === 17 && game.phase === "night")
          command = { type: "night.preflight" };
        const draft = structuredClone(game);
        applyCommand(draft, command);
        game = validateGameForImport(draft);
        successes++;
        if (command.type === "day.directVote") votes++;
        if (command.type === "day.close") transitions++;
        assert.deepEqual(
          game.players.map((p) => p.id),
          ids,
        );
        assert.equal(new Set(game.players.map((p) => p.seat)).size, 8);
        assert.equal(game.schemaVersion, 4);
        if (game.outcome) assert.equal(game.phase, "ended");
        assert.ok(
          game.players.every(
            (p) =>
              typeof p.alive === "boolean" && typeof p.ghostVote === "boolean",
          ),
        );
        assert.ok(
          game.day.nominations.every(
            (n) => new Set(n.voterIds).size === n.voterIds.length,
          ),
        );
        assert.doesNotMatch(
          JSON.stringify(townSquareProjection(game)),
          /character|alignment|poisoned|protected|notes|targetIds/,
        );
      }
      assert.equal(successes, 20);
      assert.ok(votes >= 4);
      assert.equal(transitions, 1);
    }
});
