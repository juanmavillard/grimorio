import test from "node:test";
import assert from "node:assert/strict";
import * as engine from "../src/engine.js";
import { createTroubleBrewingRules } from "../src/scripts/trouble-brewing/rules.js";
import { createBadMoonRisingRules } from "../src/scripts/bad-moon-rising/rules.js";
import { createSectsVioletsRules } from "../src/scripts/sects-and-violets/rules.js";
import { skipNightStep as tb } from "../src/scripts/trouble-brewing/night-policy.js";
import { skipNightStep as bmr } from "../src/scripts/bad-moon-rising/night-policy.js";
import { skipNightStep as snv } from "../src/scripts/sects-and-violets/night-policy.js";

test("los paquetes mantienen sus resoluciones y la fachada pública", () => {
  for (const [factory, names] of [
    [
      createTroubleBrewingRules,
      ["resolveImpAttack", "previewVirginNomination", "useSlayer"],
    ],
    [
      createBadMoonRisingRules,
      ["resolveSailor", "resolvePukkaNight", "resolveZombuulAttack"],
    ],
    [
      createSectsVioletsRules,
      ["resolvePhilosopher", "resolvePitHag", "resolveSnvDemonAttack"],
    ],
  ]) {
    const handlers = factory({});
    for (const name of names) {
      assert.equal(typeof handlers[name], "function");
      assert.equal(
        typeof engine[name],
        "function",
        `${name} sigue accesible desde la ruta histórica`,
      );
    }
  }
});

test("las excepciones nocturnas conservan los pasos ya completados cuando corresponde", () => {
  const common = {
    state: { day: {}, round: 2, scriptId: "bad_moon_rising" },
    actor: {},
    number: 2,
    alreadyCompleted: false,
    alivePlayers: () => [],
    outsiderDiedDuringPreviousDay: () => false,
    character: () => ({}),
    roleAbilityUsed: () => false,
  };
  assert.equal(tb({ ...common, roleId: "ravenkeeper" }), true);
  assert.equal(
    tb({ ...common, roleId: "ravenkeeper", alreadyCompleted: true }),
    false,
  );
  assert.equal(bmr({ ...common, roleId: "grandmother" }), true);
  assert.equal(
    bmr({ ...common, roleId: "grandmother", alreadyCompleted: true }),
    false,
  );
  assert.equal(
    bmr({ ...common, roleId: "courtier", actor: { abilityUsed: true } }),
    true,
  );
  assert.equal(snv({ ...common, roleId: "witch" }), true);
  assert.equal(
    snv({ ...common, roleId: "witch", alreadyCompleted: true }),
    false,
  );
});

test("los pasos nocturnos adicionales pertenecen a sus guiones y conservan su orden", async () => {
  const tbPolicy = await import(
    "../src/scripts/trouble-brewing/night-policy.js"
  );
  const svPolicy = await import(
    "../src/scripts/sects-and-violets/night-policy.js"
  );
  const imp = {
    id: "i",
    character: "imp",
    newDemonNeedsInfo: true,
    skipImpAttackNight: 2,
  };
  const state = {
    scriptId: "trouble_brewing",
    players: [imp],
    night: { completed: [] },
  };
  assert.equal(
    tbPolicy.extraSteps({ state, roleId: "imp", number: 2, position: "before" })
      .length,
    0,
  );
  assert.equal(
    tbPolicy.extraSteps({
      state,
      roleId: "imp",
      number: 2,
      position: "after",
    })[0].actorId,
    "i",
  );
  state.night.completed.push("new_demon_info-i-2");
  imp.newDemonNeedsInfo = false;
  assert.equal(
    tbPolicy.extraSteps({ state, roleId: "imp", number: 2, position: "after" })
      .length,
    1,
  );
  const philosopher = {
    id: "f",
    alive: true,
    character: "philosopher",
    philosopherRole: "clockmaker",
    philosopherChoiceNight: 2,
  };
  const steps = svPolicy.extraSteps({
    state: { scriptId: "sects_and_violets", players: [philosopher] },
    roleId: "philosopher",
    number: 2,
    position: "after",
    actualRoleForNight: engine.actualRoleForNight,
    character: engine.character,
  });
  assert.equal(steps[0].id, "clockmaker-f");
});

test("las políticas de preparación conservan las decisiones propias de cada guion", async () => {
  const tb = await import("../src/scripts/trouble-brewing/setup-policy.js");
  const bmr = await import("../src/scripts/bad-moon-rising/setup-policy.js");
  const sv = await import("../src/scripts/sects-and-violets/setup-policy.js");
  assert.equal(
    tb.validateDecisions({
      assignedIds: ["drunk"],
      decisions: {},
      character: engine.character,
      scriptId: "trouble_brewing",
    }).length,
    1,
  );
  assert.equal(
    bmr.validateComposition({
      selectedIds: ["godfather"],
      choices: { godfatherOutsiders: 0 },
    }).length,
    1,
  );
  assert.equal(
    sv.validateDecisions({ decisions: { drunkBelief: "chef" } }).length,
    1,
  );
  assert.deepEqual(
    bmr.dealIdentity({
      player: { character: "lunatic" },
      state: { lunaticSetup: { apparentDemonId: "pukka" } },
    }),
    { id: "pukka", alignment: "evil", mustBeDemon: true },
  );
});

test("las políticas de muerte mantienen la limpieza y los momentos de decisión", async () => {
  const tb = await import("../src/scripts/trouble-brewing/death-policy.js");
  const bmr = await import("../src/scripts/bad-moon-rising/death-policy.js");
  const snv = await import("../src/scripts/sects-and-violets/death-policy.js");
  const player = { character: "butler", masterId: "amo" };
  tb.endPersistentEffects({
    state: { players: [player] },
    player,
    actualRoleForNight: engine.actualRoleForNight,
  });
  assert.equal(player.masterId, null);
  assert.equal(
    bmr.canAttemptDead({ character: "zombuul", zombuulRegisteredDead: true }),
    true,
  );
  assert.equal(
    snv.blocksEffect({ type: "klutz_choice" }, { phase: "night" }, "next"),
    false,
  );
  assert.equal(
    snv.blocksEffect({ type: "klutz_choice" }, { phase: "day" }, "next"),
    true,
  );
  assert.equal(
    snv.blocksEffect({ type: "barber_swap" }, { phase: "day" }, "night"),
    true,
  );
});

test("la prevención de Bad Moon Rising conserva causa, opciones y decisión del Narrador", async () => {
  const { preventDeath } = await import(
    "../src/scripts/bad-moon-rising/death-policy.js"
  );
  const state = {},
    player = { id: "p" },
    options = { pacifistSaves: true };
  let received;
  const result = preventDeath({
    state,
    player,
    cause: "execution",
    options,
    bmrDeathPrevention: (...args) => {
      received = args;
      return "pacifist";
    },
    recordBmrPrevention: (s, p, cause, reason) => ({ s, p, cause, reason }),
  });
  assert.deepEqual(received, [state, player, "execution", options]);
  assert.equal(result.reason, "pacifist");
  assert.equal(
    preventDeath({
      state,
      player,
      cause: "execution",
      options,
      bmrDeathPrevention: () => null,
    }),
    null,
  );
});
