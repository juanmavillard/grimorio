import { OFFICIAL_PRESETS } from "../src/presets.js";
import test from "node:test";
import assert from "node:assert/strict";
import { createGame, randomRoleSet } from "../src/engine.js";
import { readLegacyActiveGame } from "../src/core/legacy-data.js";
import {
  loadFavoriteSetups,
  saveFavoriteSetup,
  deleteFavoriteSetup,
} from "../src/core/preferences.js";
import { parseGameFile } from "../src/core/game-files.js";
const memory = new Map();
globalThis.localStorage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, String(value)),
  removeItem: (key) => memory.delete(key),
};
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
test("el lector heredado recupera la partida sin modificar ninguna clave", () => {
  memory.clear();
  const game = createGame(names, roles, { random: () => 0.99 });
  localStorage.setItem("grimorio.tb.game.v1", JSON.stringify(game));
  const before = [...memory];
  assert.equal(readLegacyActiveGame().id, game.id);
  assert.deepEqual([...memory], before);
  localStorage.setItem("grimorio.base3.game.v1", "{");
  assert.throws(() => readLegacyActiveGame());
});
test("las formaciones antiguas se leen y los cambios no afectan a la partida", () => {
  memory.clear();
  const old = { ...OFFICIAL_PRESETS[0], count: 8, id: "antigua" },
    next = { ...old, id: "nueva" };
  localStorage.setItem(
    "grimorio.tb.formations.v1",
    JSON.stringify([old, { id: "dañada" }]),
  );
  localStorage.setItem("grimorio.base3.game.v1", "partida protegida");
  assert.equal(loadFavoriteSetups()[0].id, "antigua");
  saveFavoriteSetup(next);
  deleteFavoriteSetup("antigua");
  assert.deepEqual(loadFavoriteSetups(), [next]);
  assert.equal(
    localStorage.getItem("grimorio.base3.game.v1"),
    "partida protegida",
  );
});
test("los archivos de partida se validan sin escribir datos", () => {
  memory.clear();
  const game = createGame(names, roles, { random: () => 0.99 });
  const before = [...memory];
  assert.equal(parseGameFile(JSON.stringify(game)).game.id, game.id);
  assert.throws(() => parseGameFile("{"), /JSON/);
  assert.throws(() => parseGameFile("{}"), /no reconocido/);
  assert.throws(
    () => parseGameFile(JSON.stringify({ ...game, schemaVersion: 999 })),
    /más reciente/,
  );
  assert.deepEqual([...memory], before);
});

test("rechaza partidas incompletas o con jugadores y fases inválidos", () => {
  const valid = createGame(names, roles, { random: () => 0.99 });
  const invalid = [
    { ...valid, id: "" },
    { ...valid, players: [] },
    { ...valid, night: null },
    { ...valid, day: null },
    { ...valid, phase: "inventada" },
    {
      ...valid,
      players: valid.players.map((p, i) =>
        i === 1 ? { ...p, id: valid.players[0].id } : p,
      ),
    },
    {
      ...valid,
      players: valid.players.map((p, i) => (i === 1 ? { ...p, seat: 0 } : p)),
    },
    {
      ...valid,
      players: valid.players.map((p, i) =>
        i === 1 ? { ...p, character: "desconocido" } : p,
      ),
    },
  ];
  for (const value of invalid)
    assert.throws(
      () => parseGameFile(JSON.stringify(value)),
      /inválid|incomplet|ausente|desconocido/,
    );
});

test("rechaza datos incompletos que romperían la pantalla o contienen identificadores inseguros", () => {
  const valid = createGame(names, roles, { random: () => 0.99 });
  const cases = [
    (g) => {
      delete g.bluffs;
    },
    (g) => {
      g.bluffs = ["toString"];
    },
    (g) => {
      g.players[0].character = "constructor";
    },
    (g) => {
      g.players[0].id = 'x" onfocus="alert(1)';
    },
    (g) => {
      g.night.completed = [null];
    },
    (g) => {
      g.pendingEffects = [null];
    },
    (g) => {
      g.pendingEffects = [
        { id: "valid", type: '" onclick="x', status: "pending" },
      ];
    },
    (g) => {
      g.phase = "assign";
      g.selectedRoles[0] = "toString";
    },
    (g) => {
      delete g.day.number;
    },
    (g) => {
      g.day.executedId = "persona-desconocida";
    },
    (g) => {
      g.lunaticSetup = { apparentDemonId: "chef" };
    },
  ];
  for (const corrupt of cases) {
    const game = structuredClone(valid);
    corrupt(game);
    assert.throws(() => parseGameFile(JSON.stringify(game)));
  }
});

test("el diagnóstico anónimo no incluye nombres, notas ni objetos o textos internos", async () => {
  const { diagnosticPayload } = await import(
    "../src/core/diagnostic-export.js"
  );
  const game = createGame(names, roles, { random: () => 0.99 });
  const secret = "SECRETO-PRIVADO-789";
  game.title = secret;
  game.players[0].name = secret;
  game.players[0].notes = secret;
  game.outcome = { winner: "evil", reason: secret };
  game.history.push({
    phase: "night",
    round: 1,
    text: secret,
    detail: secret,
    event: {
      action: secret,
      automatic: true,
      before: { name: secret },
      after: { notes: secret },
    },
  });
  const issues = [
    { id: secret, severity: "warning", title: secret, detail: secret },
  ];
  const output = diagnosticPayload(game, issues, false);
  assert.deepEqual(diagnosticPayload(game, issues), output);
  assert.equal(JSON.stringify(output).includes(secret), false);
  assert.equal(output.game.winner, "evil");
  assert.equal(output.diagnostics[0].severity, "warning");
  assert.equal(
    JSON.stringify(diagnosticPayload(game, issues, true)).includes(secret),
    true,
  );
});

test("acepta partidas exportadas compatibles de los tres guiones y versiones antiguas", () => {
  for (const scriptId of [
    "trouble_brewing",
    "bad_moon_rising",
    "sects_and_violets",
  ]) {
    const selected = randomRoleSet(8, () => 0.99, scriptId);
    for (const version of scriptId === "trouble_brewing"
      ? [1, 2, 3, 4]
      : [2, 3, 4]) {
      const game = createGame(names, selected, {
        scriptId,
        random: () => 0.99,
      });
      game.schemaVersion = version;
      if (version === 1) {
        delete game.scriptId;
        delete game.editionId;
      }
      assert.equal(parseGameFile(JSON.stringify(game)).game.scriptId, scriptId);
    }
  }
});
