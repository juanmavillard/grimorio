import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTERS } from "../src/data.js";
import {
  CHARACTER_HELP,
  DOUBT_GUIDES,
  HELP_CHARACTER_COUNT,
  helpForSituation,
  searchHelp,
  validateHelpCatalog,
} from "../src/help.js";
import { createGame, narratorBrief, narratorRelations } from "../src/engine.js";
import { BAD_MOON_RISING_SCRIPT } from "../src/scripts.js";

test("cada personaje tiene ficha, fuente y estado explícito de auditoría", () => {
  assert.equal(CHARACTERS.length, 22);
  assert.equal(validateHelpCatalog().valid, true);
  assert.equal(HELP_CHARACTER_COUNT, 72);
  assert.equal(Object.keys(CHARACTER_HELP).length, 72);
  for (const role of CHARACTERS) {
    const help = CHARACTER_HELP[role.id];
    assert.ok(help.summary && help.guide && help.example && help.mistake);
    assert.equal(Array.isArray(help.interactions), true);
    assert.ok(help.interactions.length > 0);
    assert.equal(help.auditStatus, "stable");
  }
  const pending = Object.values(CHARACTER_HELP).filter(
    (help) => help.auditStatus === "audit",
  );
  assert.equal(pending.length, 0);
});

test("el buscador encuentra personajes y términos reglamentarios frecuentes", () => {
  assert.equal(
    searchHelp("Virgen").some((item) => item.id === "virgin"),
    true,
  );
  assert.equal(
    searchHelp("veneno").some((item) => item.id === "poison"),
    true,
  );
  assert.equal(
    searchHelp("empate").some((item) => item.id === "vote"),
    true,
  );
  assert.equal(
    searchHelp("Adivina").some((item) => item.id === "fortune_teller"),
    true,
  );
});

test("Bad Moon Rising y Sects & Violets tienen fichas estables completas", () => {
  assert.equal(BAD_MOON_RISING_SCRIPT.status, "stable");
  for (const role of BAD_MOON_RISING_SCRIPT.characters) {
    const help = CHARACTER_HELP[role.id];
    assert.equal(help.auditStatus, "stable");
    assert.equal(help.guide.includes("Ficha preliminar"), false);
    assert.ok(
      help.summary &&
        help.truth &&
        help.inactive &&
        help.example &&
        help.mistake,
    );
  }
  const snv = [
    "clockmaker",
    "dreamer",
    "snake_charmer",
    "mathematician",
    "flowergirl",
    "town_crier",
    "oracle",
    "savant",
    "seamstress",
    "philosopher",
    "artist",
    "juggler",
    "sage",
    "mutant",
    "sweetheart",
    "barber",
    "klutz",
    "evil_twin",
    "witch",
    "cerenovus",
    "pit_hag",
    "fang_gu",
    "vigormortis",
    "no_dashii",
    "vortox",
  ];
  for (const id of snv) {
    const help = CHARACTER_HELP[id];
    assert.equal(help.auditStatus, "stable");
    assert.equal(help.guide.includes("Ficha preliminar"), false);
    assert.ok(
      help.summary &&
        help.truth &&
        help.inactive &&
        help.example &&
        help.mistake,
    );
  }
});

test("las seis rutas de dudas tienen regla y siguiente acción", () => {
  assert.equal(DOUBT_GUIDES.length, 6);
  for (const guide of DOUBT_GUIDES) {
    assert.equal(helpForSituation(guide.id)?.next.length > 0, true);
    assert.equal(guide.ruleIds.length > 0, true);
  }
});

test("la situación privada explica noche, estados y relaciones sin modificar la partida", () => {
  const roles = [
    "chef",
    "empath",
    "fortune_teller",
    "monk",
    "mayor",
    "butler",
    "poisoner",
    "imp",
  ];
  const game = createGame(["A", "B", "C", "D", "E", "F", "G", "H"], roles, {
    secretDeal: false,
    random: () => 0.999,
  });
  game.phase = "night";
  game.night.preflightConfirmed = true;
  game.players.find((player) => player.character === "poisoner").poisoned =
    true;
  const brief = narratorBrief(game);
  assert.equal(brief.now.length > 0, true);
  assert.equal(
    brief.attention.some((item) => item.includes("veneno")),
    true,
  );
  const relations = narratorRelations(game);
  assert.equal(Object.keys(relations.labelsByPlayer).length, 8);
});
