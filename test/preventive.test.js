import test from "node:test";
import assert from "node:assert/strict";
import { createGame, beginNight, addHistory } from "../src/core/engine.js";
import { validateGameForImport } from "../src/core/game-files.js";
import { publicCharacterSheet } from "../src/core/player-materials.js";
import { historyWindow } from "../src/core/read-models.js";
import { restoreSetupDraft } from "../src/ui/form-adapters.js";

const create = () =>
  createGame(
    ["A", "B", "C", "D", "E"],
    ["washerwoman", "chef", "empath", "poisoner", "imp"],
  );
test("PREV-05: v4 rechaza textos corruptos sin repararlos como eventos heredados", () => {
  for (const value of [false, 0, null, {}, []]) {
    const game = create();
    game.history[0].text = value;
    assert.throws(() => validateGameForImport(game));
    assert.equal(game.history[0].text, value);
  }
  const game = create();
  delete game.events;
  assert.ok(validateGameForImport(game).events.length);
});
test("PREV-01: el modelo recuperado de preparación contiene lo que se va a confirmar", () => {
  const setup = {},
    model = {
      count: 5,
      scriptId: "trouble_brewing",
      title: "Título recuperado",
      names: ["Ana", "B", "C", "D", "E"],
      roles: ["washerwoman", "chef", "empath", "poisoner", "imp"],
      secretDeal: true,
    };
  assert.equal(restoreSetupDraft(model, setup), true);
  assert.deepEqual(setup, model);
  assert.equal(
    restoreSetupDraft({ ...model, roles: ["inexistente"] }, setup),
    false,
  );
  assert.deepEqual(setup, model);
});
test("PREV-06: hojas públicas completas y separadas de las instrucciones privadas", () => {
  for (const [id, count] of [
    ["trouble_brewing", 22],
    ["bad_moon_rising", 25],
    ["sects_and_violets", 25],
  ]) {
    const sheet = publicCharacterSheet(id);
    assert.equal(sheet.characters.length, count);
    assert.equal(new Set(sheet.characters.map((r) => r.id)).size, count);
    for (const role of sheet.characters) {
      assert.deepEqual(Object.keys(role).sort(), [
        "ability",
        "clarification",
        "id",
        "moment",
        "name",
        "source",
        "team",
      ]);
      for (const value of Object.values(role))
        assert.equal(typeof value, "string");
      assert.match(role.source, /^https:\/\/wiki\.bloodontheclocktower\.com\//);
    }
  }
  const sv = publicCharacterSheet("sects_and_violets").characters;
  assert.match(sv.find((r) => r.id === "no_dashii").clarification, /muertos/);
  assert.match(
    sv.find((r) => r.id === "snake_charmer").ability,
    /antiguo Demonio/,
  );
  assert.match(sv.find((r) => r.id === "pit_hag").ability, /noche\*/);
});
test("PREV-08: el historial conserva todos los registros y presenta ventanas de 50", () => {
  const game = create();
  beginNight(game);
  for (let i = 0; i < 1000; i++) addHistory(game, `Registro ${i}`);
  const first = historyWindow(game, 0);
  assert.equal(first.records.length, 50);
  assert.match(first.records[0].text, /999/);
  assert.strictEqual(historyWindow(game, 0), first);
  assert.equal(historyWindow(game, 1).records[0].text, "Registro 949");
  assert.equal(historyWindow(game, 999).index, first.total - 1);
  assert.ok(game.history.length > 1000);
});
