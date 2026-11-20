import test from "node:test";
import assert from "node:assert/strict";
import {
  addNomination,
  addReminder,
  applySnvPassiveEffects,
  beginDay,
  beginNight,
  chambermaidWakeCount,
  changeCharacter,
  chooseMoonchild,
  clockmakerNumber,
  closeDay,
  createGame,
  diagnoseGame,
  expectedComposition,
  flowergirlAnswer,
  handlersForScript,
  killPlayer,
  nightSteps,
  oracleNumber,
  queueEffect,
  randomRoleSet,
  recordJugglerGuesses,
  recordSavantVisit,
  resolveAssassin,
  resolveBarberSwap,
  resolveCourtier,
  resolveDevilsAdvocate,
  resolveEffect,
  resolveEvilTwinSetup,
  resolveExorcist,
  resolveGambler,
  resolveGoon,
  resolveGrandmotherSetup,
  resolveInnkeeper,
  resolveKlutzChoice,
  resolveMadnessExecution,
  resolveMoonchild,
  resolvePhilosopher,
  resolvePitHag,
  resolvePitHagArbitraryDeaths,
  resolvePo,
  resolveProfessor,
  resolvePukkaNight,
  resolveSailor,
  resolveShabaloth,
  resolveSnakeCharmer,
  resolveSnvDemonAttack,
  resolveSweetheartDrunk,
  resolveTinkerDeath,
  resolveVigormortisNeighbour,
  resolveWitch,
  resolveZombuulAttack,
  seamstressSameAlignment,
  townCrierAnswer,
  townSquareProjection,
  useArtistQuestion,
  validateSetup,
  validateSetupDecisions,
  vortoxForcesFalseInformation,
} from "../src/engine.js";
import {
  BAD_MOON_RISING_SCRIPT,
  SCRIPT_DEFINITIONS,
  SECTS_AND_VIOLETS_SCRIPT,
  validateScriptDefinition,
} from "../src/scripts.js";
import { migrateGame } from "../src/migrations.js";
import {
  blockingPendingEffects,
  nightDeathAnnouncements,
  outsiderDiedDuringPreviousDay,
  privateDealProjection,
  recordPitHagArbitraryChoice,
  resolveGodfather,
  resolveWitchNomination,
} from "../src/engine.js";

const names = ["A", "B", "C", "D", "E", "F", "G", "H"];
const bmrRoles = [
  "grandmother",
  "sailor",
  "chambermaid",
  "gambler",
  "lunatic",
  "tinker",
  "godfather",
  "pukka",
];
const snvRoles = [
  "clockmaker",
  "dreamer",
  "snake_charmer",
  "flowergirl",
  "savant",
  "mutant",
  "witch",
  "vortox",
];

test("Base 3 registra los tres guiones con sus 25 personajes y un contrato común", () => {
  assert.equal(Object.keys(SCRIPT_DEFINITIONS).length, 3);
  assert.equal(BAD_MOON_RISING_SCRIPT.characters.length, 25);
  assert.equal(SECTS_AND_VIOLETS_SCRIPT.characters.length, 25);
  assert.equal(validateScriptDefinition(BAD_MOON_RISING_SCRIPT).valid, true);
  assert.equal(validateScriptDefinition(SECTS_AND_VIOLETS_SCRIPT).valid, true);
  assert.equal(
    typeof handlersForScript("bad_moon_rising").night.steps,
    "function",
  );
  assert.equal(
    handlersForScript("sects_and_violets").character_change.guided,
    true,
  );
});

test("los tres guiones recorren preparación, primera noche, guardado y Plaza sin secretos", () => {
  for (const scriptId of Object.keys(SCRIPT_DEFINITIONS)) {
    const selected = randomRoleSet(8, () => 0.999, scriptId);
    const setupChoices =
      scriptId === "bad_moon_rising" && selected.includes("godfather")
        ? { godfatherOutsiders: 1 }
        : {};
    const game = createGame(names, selected, {
      scriptId,
      setupChoices,
      secretDeal: false,
      random: () => 0.999,
    });
    assert.equal(
      validateSetup(8, selected, scriptId, setupChoices).valid,
      true,
    );
    beginNight(game);
    assert.ok(nightSteps(game).length > 0);
    const restored = migrateGame(JSON.parse(JSON.stringify(game)));
    assert.equal(restored.scriptId, scriptId);
    const publicState = JSON.stringify(townSquareProjection(restored));
    assert.equal(
      /character|alignment|poisoned|protected|notes|target/i.test(publicState),
      false,
    );
  }
});

test("Padrino, Fang Gu y Vigormortis ajustan la composición oficial", () => {
  assert.deepEqual(
    expectedComposition(
      8,
      { selectedIds: ["godfather"], choices: { godfatherOutsiders: 1 } },
      "bad_moon_rising",
    ),
    { townsfolk: 4, outsider: 2, minion: 1, demon: 1 },
  );
  assert.deepEqual(
    expectedComposition(
      8,
      { selectedIds: ["godfather"], choices: { godfatherOutsiders: -1 } },
      "bad_moon_rising",
    ),
    { townsfolk: 6, outsider: 0, minion: 1, demon: 1 },
  );
  assert.deepEqual(expectedComposition(8, ["fang_gu"], "sects_and_violets"), {
    townsfolk: 4,
    outsider: 2,
    minion: 1,
    demon: 1,
  });
  assert.deepEqual(
    expectedComposition(8, ["vigormortis"], "sects_and_violets"),
    { townsfolk: 6, outsider: 0, minion: 1, demon: 1 },
  );
});

test("los dos guiones nuevos validan, crean partida y generan una noche guiada", () => {
  assert.equal(
    validateSetup(8, bmrRoles, "bad_moon_rising", { godfatherOutsiders: 1 })
      .valid,
    true,
  );
  const bmr = createGame(names, bmrRoles, {
    scriptId: "bad_moon_rising",
    setupChoices: { godfatherOutsiders: 1 },
    secretDeal: false,
    random: () => 0.999,
  });
  assert.equal(bmr.schemaVersion, 4);
  assert.equal(bmr.scriptId, "bad_moon_rising");
  assert.ok(nightSteps(bmr).some((step) => step.roleId === "pukka"));
  const bmrSteps = nightSteps(bmr).map((step) => step.roleId);
  assert.deepEqual(bmrSteps.slice(0, 3), [
    "minion_info",
    "lunatic",
    "demon_info",
  ]);
  assert.equal(validateSetup(8, snvRoles, "sects_and_violets").valid, true);
  const snv = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  assert.ok(nightSteps(snv).some((step) => step.roleId === "clockmaker"));
});

test("los recordatorios y las muertes estructuradas se conservan en formato 4", () => {
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  addReminder(game, {
    playerId: game.players[0].id,
    sourceRole: "no_dashii",
    type: "poison",
    label: "Envenenado",
    duration: "until_dusk",
  });
  const target = game.players.find((player) => player.character !== "vortox");
  killPlayer(game, target.id, "demon_attack");
  assert.equal(game.reminders.length, 1);
  assert.equal(game.deathLog.at(-1).playerId, target.id);
  assert.equal(game.deathLog.at(-1).died, true);
  assert.equal(game.reminders[0].source.roleId, "no_dashii");
  assert.deepEqual(game.reminders[0].targetIds, [game.players[0].id]);
});

test("los efectos pendientes y cambios comunes quedan explicados en el historial", () => {
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const effect = queueEffect(game, {
    type: "narrator_choice",
    label: "Decisión de prueba",
    targetIds: [game.players[0].id],
  });
  assert.equal(
    resolveEffect(game, effect.id, { note: "Confirmada." }).status,
    "resolved",
  );
  const player = changeCharacter(game, game.players[0].id, "dreamer", {
    reason: "Prueba de trazabilidad",
  });
  assert.equal(player.character, "dreamer");
  assert.equal(game.history[0].event.action, "character_changed");
});

test("las partidas de formato 2 se migran sin perder estados existentes", () => {
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.schemaVersion = 2;
  game.players[0].poisoned = true;
  delete game.reminders;
  delete game.deathLog;
  delete game.pendingEffects;
  const migrated = migrateGame(game);
  assert.equal(migrated.schemaVersion, 4);
  assert.equal(
    migrated.reminders.some((item) => item.type === "poison"),
    true,
  );
});

test("Mente Maestra concede solo un día adicional y pierde el equipo del siguiente ejecutado", () => {
  const roles = [
    "grandmother",
    "sailor",
    "chambermaid",
    "gambler",
    "gossip",
    "goon",
    "mastermind",
    "pukka",
  ];
  const game = createGame(names, roles, {
    scriptId: "bad_moon_rising",
    secretDeal: false,
    random: () => 0.999,
  });
  game.phase = "day";
  game.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
    stage: "conversation",
    pendingNomination: null,
  };
  const demon = game.players.find((player) => player.character === "pukka");
  killPlayer(game, demon.id, "execution");
  assert.equal(game.outcome, null);
  closeDay(game); // cierra el día en el que murió el Demonio
  beginDay(game);
  const good = game.players.find(
    (player) => player.alive && player.alignment === "good",
  );
  game.day.nominations = [
    {
      nomineeId: good.id,
      votes: game.players.filter((player) => player.alive).length,
      voterIds: [],
    },
  ];
  closeDay(game);
  assert.equal(game.outcome?.winner, "evil");
});

test("Mente Maestra devuelve la victoria al Bien si el día adicional termina sin ejecución", () => {
  const roles = [
    "grandmother",
    "sailor",
    "chambermaid",
    "gambler",
    "gossip",
    "goon",
    "mastermind",
    "pukka",
  ];
  const game = createGame(names, roles, {
    scriptId: "bad_moon_rising",
    secretDeal: false,
    random: () => 0.999,
  });
  game.phase = "day";
  game.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
    stage: "conversation",
    pendingNomination: null,
  };
  killPlayer(
    game,
    game.players.find((player) => player.character === "pukka").id,
    "execution",
  );
  closeDay(game);
  beginDay(game);
  closeDay(game);
  assert.equal(game.outcome?.winner, "good");
});

test("las listas auditadas no despiertan a la Abuela de nuevo y sí despiertan al Soñador", () => {
  const bmr = createGame(names, bmrRoles, {
    scriptId: "bad_moon_rising",
    setupChoices: { godfatherOutsiders: 1 },
    secretDeal: false,
    random: () => 0.999,
  });
  bmr.night.number = 2;
  assert.equal(
    nightSteps(bmr).some((step) => step.roleId === "grandmother"),
    false,
  );
  const snv = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  snv.night.number = 2;
  assert.equal(
    nightSteps(snv).some((step) => step.roleId === "dreamer"),
    true,
  );
});

test("la información inicial respeta el punto del orden oficial de cada guion", () => {
  const bmr = createGame(names, bmrRoles, {
    scriptId: "bad_moon_rising",
    setupChoices: { godfatherOutsiders: 1 },
    secretDeal: false,
    random: () => 0.999,
  });
  const bmrOrder = nightSteps(bmr).map((step) => step.roleId);
  assert.ok(bmrOrder.indexOf("lunatic") < bmrOrder.indexOf("demon_info"));
  const snv = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const snvOrder = nightSteps(snv).map((step) => step.roleId);
  assert.ok(
    snvOrder.indexOf("snake_charmer") < snvOrder.indexOf("minion_info"),
  );
  assert.ok(snvOrder.indexOf("minion_info") < snvOrder.indexOf("demon_info"));
});

test("Pukka, Zombuul, No Dashii, Vigormortis y Vortox conservan sus disparadores básicos", () => {
  const bmr = createGame(names, bmrRoles, {
    scriptId: "bad_moon_rising",
    setupChoices: { godfatherOutsiders: 1 },
    secretDeal: false,
    random: () => 0.999,
  });
  bmr.phase = "night";
  const pukka = bmr.players.find((player) => player.character === "pukka");
  const first = bmr.players.find((player) => player.id !== pukka.id);
  const second = bmr.players.find(
    (player) => player.id !== pukka.id && player.id !== first.id,
  );
  resolvePukkaNight(bmr, pukka.id, first.id);
  resolvePukkaNight(bmr, pukka.id, second.id);
  assert.equal(first.alive, false);
  assert.equal(first.poisoned, false);
  bmr.day = { deathOccurred: true };
  const zombuul = {
    ...pukka,
    id: "z",
    character: "zombuul",
    alive: true,
    poisoned: false,
  };
  bmr.players.push(zombuul);
  assert.equal(
    resolveZombuulAttack(bmr, zombuul.id, second.id).reason,
    "someone_died_today",
  );
  bmr.day.deathOccurred = false;
  assert.equal(
    killPlayer(bmr, zombuul.id, "execution").reason,
    "zombuul_registered_dead",
  );
  assert.equal(resolveZombuulAttack(bmr, zombuul.id, second.id).died, true);
  assert.equal(killPlayer(bmr, zombuul.id, "execution").died, true);
  assert.equal(bmr.outcome, null);
  killPlayer(bmr, pukka.id, "execution");
  assert.equal(bmr.outcome?.winner, "good");

  const svRoles = [
    "clockmaker",
    "dreamer",
    "mathematician",
    "flowergirl",
    "savant",
    "mutant",
    "witch",
    "no_dashii",
  ];
  const snv = createGame(names, svRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  snv.players.find((player) => player.character === "no_dashii");
  applySnvPassiveEffects(snv);
  assert.equal(
    snv.players.some((player) => player.noDashiiPoisoned),
    true,
  );
  snv.phase = "day";
  snv.day = {
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
    stage: "conversation",
    pendingNomination: null,
  };
  snv.players.find((player) => player.character === "no_dashii").character =
    "vortox";
  closeDay(snv);
  assert.equal(snv.outcome?.winner, "evil");
});

test("Vigormortis solo conserva el Esbirro que mató y el Narrador elige un único vecino Aldeano", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "snake_charmer",
    "flowergirl",
    "savant",
    "mathematician",
    "witch",
    "vigormortis",
  ];
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.players.forEach((player, index) => {
    player.character = roles[index];
    player.alignment = index < 6 ? "good" : "evil";
  });
  const vigormortis = game.players.find(
    (player) => player.character === "vigormortis",
  );
  const witch = game.players.find((player) => player.character === "witch");
  killPlayer(game, witch.id, "demon_attack", { sourceId: vigormortis.id });
  assert.equal(witch.vigormortisEnabled, true);
  assert.equal(
    game.players
      .filter((player) => !player.alive && player.character !== "witch")
      .every((player) => !player.vigormortisEnabled),
    true,
  );
  const pending = game.pendingEffects.find(
    (effect) =>
      effect.type === "vigormortis_neighbour" && effect.status === "pending",
  );
  const chosenId = pending ? pending.targetIds[0] : witch.vigormortisPoisonedId;
  assert.ok(chosenId);
  assert.equal(
    resolveVigormortisNeighbour(game, witch.id, chosenId).id,
    chosenId,
  );
  const poisoned = game.players.filter((player) => player.poisoned);
  assert.equal(poisoned.length, 1);
  assert.equal(poisoned[0].id, chosenId);
});

test("el diagnóstico reconoce las fuentes de veneno propias de cada guion", () => {
  const bmr = createGame(names, bmrRoles, {
    scriptId: "bad_moon_rising",
    setupChoices: { godfatherOutsiders: 1 },
    secretDeal: false,
    random: () => 0.999,
  });
  const pukka = bmr.players.find((player) => player.character === "pukka");
  const target = bmr.players.find((player) => player.id !== pukka.id);
  resolvePukkaNight(bmr, pukka.id, target.id);
  assert.equal(
    diagnoseGame(bmr).some((issue) => issue.id === "stale-poison"),
    false,
  );

  const svRoles = [
    "clockmaker",
    "dreamer",
    "mathematician",
    "flowergirl",
    "savant",
    "mutant",
    "witch",
    "no_dashii",
  ];
  const snv = createGame(names, svRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  applySnvPassiveEffects(snv);
  assert.equal(
    diagnoseGame(snv).some((issue) => issue.id === "stale-poison"),
    false,
  );
});

function bmrWithRoles(roleIds) {
  const game = createGame(names, bmrRoles, {
    scriptId: "bad_moon_rising",
    setupChoices: { godfatherOutsiders: 1 },
    secretDeal: false,
    random: () => 0.999,
  });
  game.players.forEach((player, index) => {
    player.character = roleIds[index] || player.character;
    player.perceivedCharacter = player.character;
    player.alignment = [
      "godfather",
      "devils_advocate",
      "assassin",
      "mastermind",
      "pukka",
      "zombuul",
      "shabaloth",
      "po_bmr",
    ].includes(player.character)
      ? "evil"
      : "good";
  });
  game.phase = "night";
  game.round = 2;
  return game;
}

test("Bad Moon Rising aplica protecciones, supervivencias y la muerte reactiva de la Abuela", () => {
  const game = bmrWithRoles([
    "grandmother",
    "sailor",
    "tea_lady",
    "fool",
    "innkeeper",
    "pacifist",
    "devils_advocate",
    "pukka",
  ]);
  const [
    grandmother,
    sailor,
    teaLady,
    fool,
    innkeeper,
    pacifist,
    advocate,
    pukka,
  ] = game.players;
  resolveGrandmotherSetup(game, grandmother.id, sailor.id);
  assert.equal(
    killPlayer(game, sailor.id, "demon_attack", { sourceId: pukka.id }).reason,
    "sailor",
  );
  sailor.poisoned = true;
  teaLady.poisoned = true;
  assert.equal(
    killPlayer(game, sailor.id, "demon_attack", { sourceId: pukka.id }).died,
    true,
  );
  assert.equal(grandmother.alive, false);
  assert.equal(killPlayer(game, fool.id, "gossip").reason, "fool");
  assert.equal(killPlayer(game, fool.id, "gossip").died, true);
  resolveInnkeeper(game, innkeeper.id, [teaLady.id, pacifist.id], teaLady.id);
  assert.equal(killPlayer(game, pacifist.id, "gossip").reason, "innkeeper");
  resolveDevilsAdvocate(game, advocate.id, pukka.id);
  game.phase = "day";
  assert.equal(
    killPlayer(game, pukka.id, "execution").reason,
    "devils_advocate",
  );
});

test("una ejecución sobrevivida no se registra como muerte ni activa información posterior", () => {
  const game = bmrWithRoles([
    "grandmother",
    "sailor",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "devils_advocate",
    "pukka",
  ]);
  const advocate = game.players.find(
    (player) => player.character === "devils_advocate",
  );
  const target = game.players.find((player) => player.character === "gambler");
  const nominator = game.players.find(
    (player) => player.id !== target.id && player.id !== advocate.id,
  );
  game.round = 2;
  game.phase = "night";
  resolveDevilsAdvocate(game, advocate.id, target.id);
  beginDay(game);
  addNomination(
    game,
    nominator.id,
    target.id,
    4,
    game.players.slice(0, 4).map((player) => player.id),
  );
  closeDay(game);
  assert.equal(target.alive, true);
  assert.equal(game.day.executionCausedDeath, false);
  assert.equal(game.day.deathOccurred, false);
});

test("Dama del Té protege a sus vecinos buenos, no a sí misma", () => {
  const game = bmrWithRoles([
    "sailor",
    "tea_lady",
    "gambler",
    "fool",
    "innkeeper",
    "pacifist",
    "godfather",
    "pukka",
  ]);
  const [sailor, teaLady, gambler, , , , , pukka] = game.players;
  sailor.poisoned = true;
  assert.equal(
    killPlayer(game, sailor.id, "demon_attack", { sourceId: pukka.id }).reason,
    "tea_lady",
  );
  assert.equal(killPlayer(game, teaLady.id, "gossip").died, true);
  assert.equal(gambler.alive, true);
});

test("Bad Moon Rising resuelve apuestas, resurrección, Asesino, Exorcista, Shabaloth y Po", () => {
  const game = bmrWithRoles([
    "gambler",
    "professor",
    "assassin",
    "exorcist",
    "shabaloth",
    "po_bmr",
    "chambermaid",
    "tinker",
  ]);
  const [
    gambler,
    professor,
    assassin,
    exorcist,
    shabaloth,
    po,
    chambermaid,
    tinker,
  ] = game.players;
  assert.equal(
    resolveGambler(game, gambler.id, chambermaid.id, "tinker").correct,
    false,
  );
  assert.equal(gambler.alive, false);
  assert.equal(
    resolveProfessor(game, professor.id, gambler.id).resurrected,
    true,
  );
  chambermaid.innkeeperProtectedNight = game.round;
  assert.equal(resolveAssassin(game, assassin.id, chambermaid.id).died, true);
  game.phase = "night";
  assert.equal(resolveExorcist(game, exorcist.id, po.id).demon, true);
  assert.equal(
    nightSteps(game).some((step) => step.actorId === po.id),
    false,
  );
  const targets = [exorcist.id, tinker.id];
  assert.equal(
    resolveShabaloth(game, shabaloth.id, targets).deaths.filter(
      (result) => result.died,
    ).length,
    2,
  );
  po.exorcisedNight = null;
  assert.equal(resolvePo(game, po.id, []).charged, true);
  assert.equal(
    resolvePo(game, po.id, [professor.id, assassin.id, chambermaid.id]).deaths
      .length,
    3,
  );
});

test("Cortesano conserva y expira correctamente su borrachera de tres noches y tres días", () => {
  const game = bmrWithRoles([
    "courtier",
    "sailor",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const [courtier, sailor] = game.players;
  resolveCourtier(game, courtier.id, "sailor");
  assert.equal(sailor.poisoned, true);
  game.round = 3;
  beginNight(game);
  assert.equal(sailor.poisoned, true);
  game.round = 5;
  beginNight(game);
  assert.equal(sailor.poisoned, false);
});

test("Niño Lunar elige públicamente tras morir y resuelve al final de la noche", () => {
  const game = bmrWithRoles([
    "moonchild",
    "sailor",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const [moonchild, , , , goon, , , pukka] = game.players;
  killPlayer(game, moonchild.id, "demon_attack", { sourceId: pukka.id });
  assert.equal(moonchild.moonchildPending, true);
  game.phase = "day";
  chooseMoonchild(game, moonchild.id, goon.id);
  game.phase = "night";
  game.night.number = 2;
  assert.equal(
    nightSteps(game).some(
      (step) => step.actorId === moonchild.id && step.roleId === "moonchild",
    ),
    true,
  );
  assert.equal(resolveMoonchild(game, moonchild.id).died, true);
});

test("Matón, Camarera y Manitas tienen resolución guiada", () => {
  const game = bmrWithRoles([
    "chambermaid",
    "goon",
    "sailor",
    "gambler",
    "tinker",
    "courtier",
    "godfather",
    "pukka",
  ]);
  const [chambermaid, goon, sailor, , tinker] = game.players;
  assert.equal(resolveGoon(game, goon.id, sailor.id).applied, true);
  assert.equal(sailor.poisoned, true);
  assert.equal(goon.alignment, "good");
  game.night.completed = [`sailor-${sailor.id}`];
  assert.equal(chambermaidWakeCount(game, [sailor.id, tinker.id]), 1);
  assert.equal(resolveTinkerDeath(game, tinker.id).died, true);
  assert.equal(chambermaid.alive, true);
});

test("Lunático valida y conserva su ficción privada; Marinero conserva elección y borrachera", () => {
  const validLunatic = {
    apparentDemonId: "pukka",
    minionIds: ["a"],
    bluffIds: ["grandmother", "sailor", "chambermaid"],
  };
  const realBluffs = ["exorcist", "innkeeper", "gossip"];
  assert.equal(
    validateSetupDecisions(
      8,
      bmrRoles,
      {
        setupChoices: { godfatherOutsiders: 1 },
        lunatic: validLunatic,
        bluffs: realBluffs,
      },
      "bad_moon_rising",
    ).valid,
    true,
  );
  assert.equal(
    validateSetupDecisions(
      8,
      bmrRoles,
      {
        setupChoices: { godfatherOutsiders: 1 },
        lunatic: { ...validLunatic, bluffIds: ["grandmother"] },
        bluffs: realBluffs,
      },
      "bad_moon_rising",
    ).valid,
    false,
  );
  const game = bmrWithRoles([
    "sailor",
    "chambermaid",
    "gambler",
    "courtier",
    "lunatic",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const sailor = game.players.find((player) => player.character === "sailor");
  const chambermaid = game.players.find(
    (player) => player.character === "chambermaid",
  );
  const result = resolveSailor(game, sailor.id, chambermaid.id, sailor.id);
  assert.equal(result.chosenId, chambermaid.id);
  assert.equal(sailor.sailorLastChoiceId, chambermaid.id);
  assert.equal(sailor.poisoned, true);
  game.lunaticSetup = validLunatic;
  const lunatic = game.players.find((player) => player.character === "lunatic");
  assert.equal(
    nightSteps(game).some(
      (step) => step.actorId === lunatic.id && step.roleId === "lunatic",
    ),
    true,
  );
});

test("Bad Moon Rising omite despertares imposibles de Zombuul y Camarera", () => {
  const game = bmrWithRoles([
    "chambermaid",
    "sailor",
    "gambler",
    "courtier",
    "goon",
    "tinker",
    "godfather",
    "zombuul",
  ]);
  const zombuul = game.players.find((player) => player.character === "zombuul");
  game.day.deathOccurred = true;
  assert.equal(
    nightSteps(game).some(
      (step) => step.actorId === zombuul.id && step.roleId === "zombuul",
    ),
    false,
  );
  game.players
    .filter(
      (player) =>
        player.character !== "chambermaid" && player.character !== "sailor",
    )
    .forEach((player) => {
      player.alive = false;
    });
  assert.equal(
    nightSteps(game).some((step) => step.roleId === "chambermaid"),
    false,
  );
});

test("Abuela actúa en primera noche y las resurrecciones restauran su uso", () => {
  const game = bmrWithRoles([
    "grandmother",
    "professor",
    "chambermaid",
    "sailor",
    "goon",
    "tinker",
    "godfather",
    "shabaloth",
  ]);
  const grandmother = game.players.find(
    (player) => player.character === "grandmother",
  );
  const professor = game.players.find(
    (player) => player.character === "professor",
  );
  const shabaloth = game.players.find(
    (player) => player.character === "shabaloth",
  );
  assert.equal(
    nightSteps(game).some(
      (step) =>
        step.actorId === grandmother.id && step.roleId === "grandmother",
    ),
    true,
  );
  grandmother.alive = false;
  grandmother.abilityUsed = true;
  assert.equal(
    resolveProfessor(game, professor.id, grandmother.id).resurrected,
    true,
  );
  assert.equal(grandmother.abilityUsed, false);
  assert.equal(grandmother.grandmotherSetupPending, true);
  grandmother.alive = false;
  grandmother.abilityUsed = true;
  shabaloth.shabalothLastTargets = [grandmother.id];
  resolveShabaloth(
    game,
    shabaloth.id,
    [
      professor.id,
      game.players.find((player) => player.character === "sailor").id,
    ],
    grandmother.id,
  );
  assert.equal(grandmother.alive, true);
  assert.equal(grandmother.abilityUsed, false);
});

test("Zombuul registra la muerte diurna y cuenta secretamente para el final", () => {
  const game = bmrWithRoles([
    "chambermaid",
    "sailor",
    "gambler",
    "courtier",
    "goon",
    "tinker",
    "godfather",
    "zombuul",
  ]);
  const zombuul = game.players.find((player) => player.character === "zombuul");
  game.phase = "day";
  game.day = { deathOccurred: false };
  assert.equal(
    killPlayer(game, zombuul.id, "execution").reason,
    "zombuul_registered_dead",
  );
  assert.equal(game.day.deathOccurred, true);
  const others = game.players.filter((player) => player.id !== zombuul.id);
  const survivors = others.filter((player) =>
    ["chambermaid", "gambler", "courtier"].includes(player.character),
  );
  others.forEach((player) => {
    player.alive = survivors.includes(player);
  });
  const victim = survivors.find((player) => player.character === "courtier");
  game.phase = "night";
  killPlayer(game, victim.id, "gambler");
  assert.equal(game.outcome, null);
  killPlayer(
    game,
    survivors.find((player) => player.character === "gambler").id,
    "gambler",
  );
  assert.equal(game.outcome?.winner, "evil");
});

test("Pukka sin habilidad conserva el veneno anterior y la Abuela no activa al Matón", () => {
  const pukkaGame = bmrWithRoles([
    "sailor",
    "chambermaid",
    "gambler",
    "courtier",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const pukka = pukkaGame.players.find(
    (player) => player.character === "pukka",
  );
  const first = pukkaGame.players.find((player) => player.id !== pukka.id);
  const second = pukkaGame.players.find(
    (player) => player.id !== pukka.id && player.id !== first.id,
  );
  resolvePukkaNight(pukkaGame, pukka.id, first.id);
  pukka.poisoned = true;
  const blocked = resolvePukkaNight(pukkaGame, pukka.id, second.id);
  assert.equal(blocked.reason, "no_ability");
  assert.equal(first.alive, true);
  assert.equal(first.poisoned, true);
  assert.equal(pukkaGame.pukkaPoisonedId, first.id);

  const grandmotherGame = bmrWithRoles([
    "grandmother",
    "sailor",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const grandmother = grandmotherGame.players.find(
    (player) => player.character === "grandmother",
  );
  const goon = grandmotherGame.players.find(
    (player) => player.character === "goon",
  );
  resolveGrandmotherSetup(grandmotherGame, grandmother.id, goon.id);
  assert.equal(goon.alignment, "good");
  assert.equal(grandmother.poisoned, false);
});

test("Cortesano consume el uso sin habilidad y suspende su efecto mientras está incapacitado", () => {
  const noAbilityGame = bmrWithRoles([
    "courtier",
    "sailor",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const noAbilityCourtier = noAbilityGame.players.find(
    (player) => player.character === "courtier",
  );
  noAbilityCourtier.poisoned = true;
  assert.equal(
    resolveCourtier(noAbilityGame, noAbilityCourtier.id, "pukka").applied,
    false,
  );
  assert.equal(noAbilityGame.courtierEffects?.length || 0, 0);

  const game = bmrWithRoles([
    "courtier",
    "sailor",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const courtier = game.players.find(
    (player) => player.character === "courtier",
  );
  const pukka = game.players.find((player) => player.character === "pukka");
  resolveCourtier(game, courtier.id, "pukka");
  assert.equal(pukka.courtierDrunk, true);
  game.pukkaPoisonedId = courtier.id;
  beginNight(game);
  assert.equal(courtier.poisoned, true);
  assert.equal(pukka.courtierDrunk, false);
  game.pukkaPoisonedId = null;
  beginNight(game);
  assert.equal(courtier.poisoned, false);
  assert.equal(pukka.courtierDrunk, true);
});

test("Sects & Violets resuelve cambios, maldición, salto y decisiones pendientes", () => {
  const roles = [
    "snake_charmer",
    "clockmaker",
    "dreamer",
    "flowergirl",
    "mutant",
    "klutz",
    "witch",
    "fang_gu",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.phase = "night";
  const charmer = game.players.find(
    (player) => player.character === "snake_charmer",
  );
  const fang = game.players.find((player) => player.character === "fang_gu");
  assert.equal(resolveSnakeCharmer(game, charmer.id, fang.id).swapped, true);
  assert.equal(charmer.character, "fang_gu");
  assert.equal(fang.character, "snake_charmer");
  assert.equal(fang.poisoned, true);

  const jumpGame = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  jumpGame.phase = "night";
  const jumpingFang = jumpGame.players.find(
    (player) => player.character === "fang_gu",
  );
  const klutz = jumpGame.players.find((player) => player.character === "klutz");
  assert.equal(
    resolveSnvDemonAttack(jumpGame, jumpingFang.id, klutz.id).jumped,
    true,
  );
  assert.equal(jumpingFang.alive, false);
  assert.equal(klutz.character, "fang_gu");
  assert.equal(klutz.alignment, "evil");

  const protectedJump = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  protectedJump.phase = "night";
  const protectedFang = protectedJump.players.find(
    (player) => player.character === "fang_gu",
  );
  const protectedKlutz = protectedJump.players.find(
    (player) => player.character === "klutz",
  );
  protectedKlutz.protected = true;
  assert.equal(
    resolveSnvDemonAttack(protectedJump, protectedFang.id, protectedKlutz.id)
      .reason,
    "protected",
  );
  assert.equal(protectedFang.alive, true);
  assert.equal(protectedKlutz.character, "klutz");

  const witchGame = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const witch = witchGame.players.find(
    (player) => player.character === "witch",
  );
  const nominee = witchGame.players.find((player) => player.id !== witch.id);
  resolveWitch(witchGame, witch.id, nominee.id);
  beginDay(witchGame);
  addNomination(witchGame, nominee.id, witch.id, 0, []);
  assert.equal(nominee.alive, false);
  assert.equal(witchGame.day.nominations.length, 1);

  const pitGame = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  pitGame.players.find((player) => player.character === "witch").character =
    "pit_hag";
  const pit = pitGame.players.find((player) => player.character === "pit_hag");
  const target = pitGame.players.find(
    (player) => player.id !== pit.id && player.character !== "fang_gu",
  );
  assert.equal(
    resolvePitHag(pitGame, pit.id, target.id, "cerenovus").changed,
    true,
  );
  assert.equal(target.character, "cerenovus");
});

test("No Dashii y Vigormortis buscan Aldeanos cercanos aunque estén muertos", () => {
  const roles = [
    "no_dashii",
    "witch",
    "clockmaker",
    "mutant",
    "dreamer",
    "pit_hag",
    "flowergirl",
    "cerenovus",
  ];
  const noDashiiGame = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  noDashiiGame.players.forEach((player, index) => {
    player.character = roles[index];
    player.alignment = [
      "evil",
      "evil",
      "good",
      "good",
      "good",
      "evil",
      "good",
      "evil",
    ][index];
  });
  applySnvPassiveEffects(noDashiiGame);
  assert.equal(noDashiiGame.players[2].noDashiiPoisoned, true);
  assert.equal(noDashiiGame.players[6].noDashiiPoisoned, true);
  noDashiiGame.players[2].alive = false;
  beginNight(noDashiiGame);
  assert.equal(noDashiiGame.players[2].noDashiiPoisoned, true);
  assert.equal(noDashiiGame.players[4].noDashiiPoisoned, false);

  const vigorGame = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  vigorGame.players.forEach((player, index) => {
    player.character = [
      "witch",
      "mutant",
      "clockmaker",
      "vigormortis",
      "dreamer",
      "pit_hag",
      "flowergirl",
      "cerenovus",
    ][index];
    player.alignment =
      index === 1 || index === 2 || index === 4 || index === 6
        ? "good"
        : "evil";
  });
  vigorGame.players[0].alive = false;
  vigorGame.players[0].killedByVigormortis = true;
  applySnvPassiveEffects(vigorGame);
  const effect = vigorGame.pendingEffects.find(
    (item) =>
      item.type === "vigormortis_neighbour" && item.status === "pending",
  );
  assert.deepEqual(
    effect.targetIds.sort(),
    [vigorGame.players[2].id, vigorGame.players[6].id].sort(),
  );
});

test("Filósofo puede obtener cualquier habilidad buena y altera el turno nocturno", () => {
  const roles = [
    "philosopher",
    "dreamer",
    "clockmaker",
    "flowergirl",
    "sweetheart",
    "mutant",
    "witch",
    "fang_gu",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.phase = "night";
  const philosopher = game.players.find(
    (player) => player.character === "philosopher",
  );
  const mutant = game.players.find((player) => player.character === "mutant");
  assert.equal(
    resolvePhilosopher(game, philosopher.id, "mutant").applied,
    true,
  );
  assert.equal(philosopher.philosopherRole, "mutant");
  assert.equal(mutant.poisoned, true);
  assert.equal(
    nightSteps(game).some(
      (step) => step.actorId === philosopher.id && step.roleId === "mutant",
    ),
    false,
  );
  const dreamerGame = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  dreamerGame.phase = "night";
  const otherPhilosopher = dreamerGame.players.find(
    (player) => player.character === "philosopher",
  );
  assert.equal(
    resolvePhilosopher(dreamerGame, otherPhilosopher.id, "dreamer").applied,
    true,
  );
  assert.equal(
    nightSteps(dreamerGame).some(
      (step) =>
        step.actorId === otherPhilosopher.id && step.roleId === "dreamer",
    ),
    true,
  );
});

test("Sects & Violets no despierta efectos de muerte y limita los usos nocturnos", () => {
  const roles = [
    "seamstress",
    "juggler",
    "sage",
    "sweetheart",
    "barber",
    "mutant",
    "witch",
    "vortox",
  ];
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.players.forEach((player, index) => {
    player.character = roles[index];
    player.alignment = index < 6 ? "good" : "evil";
  });
  game.night.number = 3;
  const seamstress = game.players.find(
    (player) => player.character === "seamstress",
  );
  seamstress.abilityUsed = true;
  const roleIds = nightSteps(game).map((step) => step.roleId);
  assert.equal(
    roleIds.includes("sweetheart") ||
      roleIds.includes("barber") ||
      roleIds.includes("sage"),
    false,
  );
  assert.equal(roleIds.includes("seamstress"), false);
  assert.equal(roleIds.includes("juggler"), false);
  game.night.number = 2;
  assert.equal(
    nightSteps(game).some((step) => step.roleId === "juggler"),
    true,
  );
});

test("los efectos pendientes de Enamoradizo y Barbero se resuelven y persisten", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "flowergirl",
    "oracle",
    "sweetheart",
    "barber",
    "witch",
    "fang_gu",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.phase = "night";
  const sweetheart = game.players.find(
    (player) => player.character === "sweetheart",
  );
  const barber = game.players.find((player) => player.character === "barber");
  const witch = game.players.find((player) => player.character === "witch");
  const fang = game.players.find((player) => player.character === "fang_gu");
  const clockmaker = game.players.find(
    (player) => player.character === "clockmaker",
  );
  killPlayer(game, sweetheart.id, "other");
  const sweetheartEffect = game.pendingEffects.find(
    (effect) =>
      effect.type === "sweetheart_drunk" && effect.status === "pending",
  );
  resolveSweetheartDrunk(game, sweetheartEffect.id, clockmaker.id);
  beginNight(game);
  assert.equal(clockmaker.poisoned, true);
  killPlayer(game, barber.id, "other");
  const barberEffect = game.pendingEffects.find(
    (effect) => effect.type === "barber_swap" && effect.status === "pending",
  );
  const fangAlignment = fang.alignment,
    witchAlignment = witch.alignment;
  resolveBarberSwap(game, barberEffect.id, fang.id, fang.id, witch.id);
  assert.equal(fang.character, "witch");
  assert.equal(witch.character, "fang_gu");
  assert.equal(fang.alignment, fangAlignment);
  assert.equal(witch.alignment, witchAlignment);
  assert.equal(barberEffect.status, "resolved");
});

test("con varios Demonios de Pit-Hag el Bien solo gana al morir el último", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "pit_hag",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const pitHag = game.players.find((player) => player.character === "pit_hag");
  const firstDemon = game.players.find(
    (player) => player.character === "vortox",
  );
  const newDemon = game.players.find(
    (player) => player.character === "clockmaker",
  );
  resolvePitHag(game, pitHag.id, newDemon.id, "fang_gu");
  assert.equal(killPlayer(game, firstDemon.id, "other").died, true);
  assert.equal(game.outcome, null);
  killPlayer(game, newDemon.id, "other");
  assert.equal(game.outcome?.winner, "good");
});

test("Pit-Hag deja todas las muertes de esa noche en manos del Narrador", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "pit_hag",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.players.forEach((player, index) => {
    player.character = roles[index];
    player.alignment = ["pit_hag", "vortox"].includes(roles[index])
      ? "evil"
      : "good";
  });
  game.phase = "night";
  game.round = 2;
  game.night = {
    number: 2,
    stepIndex: 0,
    completed: [],
    preflightConfirmed: true,
  };
  const pitHag = game.players[6],
    target = game.players[0],
    victimA = game.players[1],
    victimB = game.players[2];
  target.abilityUsed = true;
  assert.equal(
    resolvePitHag(game, pitHag.id, target.id, "fang_gu").arbitraryDeaths,
    true,
  );
  assert.equal(target.abilityUsed, false);
  assert.ok(
    game.pendingEffects.some(
      (effect) =>
        effect.type === "character_change_notice" &&
        effect.targetIds.includes(target.id),
    ),
  );
  const results = resolvePitHagArbitraryDeaths(game, [victimA.id, victimB.id]);
  assert.equal(results.filter((result) => result.died).length, 2);
  assert.equal(game.snvArbitraryDeathsResolvedRound, 2);
});

test("S&V registra Sabio, Artista, Malabarista y ejecución por locura", () => {
  const roles = [
    "savant",
    "artist",
    "juggler",
    "clockmaker",
    "mutant",
    "sweetheart",
    "cerenovus",
    "fang_gu",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  beginDay(game);
  const savant = game.players.find((player) => player.character === "savant");
  const artist = game.players.find((player) => player.character === "artist");
  const juggler = game.players.find((player) => player.character === "juggler");
  assert.equal(
    recordSavantVisit(game, savant.id, "A es verdad; B es mentira."),
    true,
  );
  assert.equal(
    useArtistQuestion(game, artist.id, "¿Está vivo el Demonio?", "yes"),
    true,
  );
  assert.equal(
    recordJugglerGuesses(game, juggler.id, "A → Sabio; B → Fang Gu"),
    true,
  );
  assert.equal(artist.abilityUsed, true);
  assert.match(juggler.jugglerGuesses, /Fang Gu/);

  const madnessGame = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  beginDay(madnessGame);
  const mutant = madnessGame.players.find(
    (player) => player.character === "mutant",
  );
  resolveMadnessExecution(madnessGame, mutant.id, "mutant");
  assert.equal(madnessGame.day.executedId, mutant.id);
  assert.equal(madnessGame.phase, "night");
});

test("los muertos normales dejan de despertar, pero los vivos sin habilidad conservan la simulación", () => {
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  beginNight(game);
  const dreamer = game.players.find((player) => player.character === "dreamer");
  const witch = game.players.find((player) => player.character === "witch");
  dreamer.alive = false;
  witch.poisoned = true;
  const steps = nightSteps(game);
  assert.equal(
    steps.some((step) => step.actorId === dreamer.id),
    false,
  );
  assert.equal(
    steps.some((step) => step.actorId === witch.id),
    true,
  );
});

test("la maldición de Bruja termina si la Bruja pierde su habilidad", () => {
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const witch = game.players.find((player) => player.character === "witch");
  const target = game.players.find(
    (player) => player.id !== witch.id && player.character !== "vortox",
  );
  const nominee = game.players.find(
    (player) => player.id !== witch.id && player.id !== target.id,
  );
  game.phase = "night";
  resolveWitch(game, witch.id, target.id);
  witch.poisoned = true;
  beginDay(game);
  addNomination(game, target.id, nominee.id, 0, []);
  assert.equal(target.alive, true);
});

test("S&V calcula información inequívoca y conserva quién votó o nominó", () => {
  const roles = [
    "clockmaker",
    "flowergirl",
    "town_crier",
    "oracle",
    "seamstress",
    "mutant",
    "witch",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.players.forEach((player, index) => {
    player.character = roles[index];
    player.alignment = ["witch", "vortox"].includes(roles[index])
      ? "evil"
      : "good";
  });
  assert.equal(clockmakerNumber(game), 1);
  assert.equal(oracleNumber(game), 0);
  assert.equal(
    seamstressSameAlignment(game, game.players[0].id, game.players[1].id),
    true,
  );
  assert.equal(vortoxForcesFalseInformation(game), true);
  game.phase = "day";
  game.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  addNomination(game, game.players[6].id, game.players[0].id, 1, [
    game.players[7].id,
  ]);
  game.players[6].character = "mutant";
  game.players[7].character = "mutant";
  assert.equal(townCrierAnswer(game), true);
  assert.equal(flowergirlAnswer(game), true);
});

test("el Filósofo usa habilidades obtenidas y sus usos propios no se mezclan", () => {
  const roles = [
    "philosopher",
    "dreamer",
    "flowergirl",
    "oracle",
    "artist",
    "mutant",
    "witch",
    "vortox",
  ];
  const artistGame = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  artistGame.players.forEach((player, index) => {
    player.character = roles[index];
    player.alignment = ["witch", "vortox"].includes(roles[index])
      ? "evil"
      : "good";
  });
  const philosopher = artistGame.players[0];
  resolvePhilosopher(artistGame, philosopher.id, "artist");
  beginDay(artistGame);
  assert.equal(
    useArtistQuestion(artistGame, philosopher.id, "¿Hay un Vortox?", "no"),
    true,
  );
  assert.equal(philosopher.philosopherGainedAbilityUsed, true);

  const seamstressGame = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  seamstressGame.players.forEach((player, index) => {
    player.character = roles[index];
    player.alignment = ["witch", "vortox"].includes(roles[index])
      ? "evil"
      : "good";
  });
  beginNight(seamstressGame);
  const secondPhilosopher = seamstressGame.players[0];
  resolvePhilosopher(seamstressGame, secondPhilosopher.id, "seamstress");
  assert.equal(
    nightSteps(seamstressGame).some(
      (step) =>
        step.roleId === "seamstress" && step.actorId === secondPhilosopher.id,
    ),
    true,
  );

  const klutzGame = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  klutzGame.players.forEach((player, index) => {
    player.character = roles[index];
    player.alignment = ["witch", "vortox"].includes(roles[index])
      ? "evil"
      : "good";
  });
  const thirdPhilosopher = klutzGame.players[0];
  resolvePhilosopher(klutzGame, thirdPhilosopher.id, "klutz");
  killPlayer(klutzGame, thirdPhilosopher.id, "other");
  const effect = klutzGame.pendingEffects.find(
    (item) => item.type === "klutz_choice",
  );
  assert.ok(effect);
  const goodTarget = klutzGame.players.find(
    (player) => player.alive && player.alignment === "good",
  );
  assert.equal(
    resolveKlutzChoice(klutzGame, thirdPhilosopher.id, goodTarget.id).evil,
    false,
  );
});

test("Po conserva la carga elegida sin habilidad y debe elegir tres al actuar de nuevo", () => {
  const game = bmrWithRoles([
    "gambler",
    "professor",
    "assassin",
    "exorcist",
    "shabaloth",
    "po_bmr",
    "chambermaid",
    "tinker",
  ]);
  const po = game.players.find((player) => player.character === "po_bmr");
  po.poisoned = true;
  assert.equal(resolvePo(game, po.id, []).charged, true);
  po.poisoned = false;
  assert.throws(() => resolvePo(game, po.id, []), /exactamente 3/);
  const targets = game.players
    .filter((player) => player.id !== po.id)
    .slice(0, 3);
  assert.equal(
    resolvePo(
      game,
      po.id,
      targets.map((player) => player.id),
    ).deaths.length,
    3,
  );
  assert.equal(po.poLastChoiceNone, false);
});

test("la habilidad del Filósofo embriaga al personaje si entra más tarde", () => {
  const roles = [
    "philosopher",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "pit_hag",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.players.forEach((player, index) => {
    player.character = roles[index];
  });
  const philosopher = game.players[0],
    target = game.players[1];
  resolvePhilosopher(game, philosopher.id, "artist");
  assert.equal(philosopher.philosopherDrunkTargetId, null);
  changeCharacter(game, target.id, "artist");
  applySnvPassiveEffects(game);
  assert.equal(target.philosopherDrunk, true);
  changeCharacter(game, target.id, "dreamer");
  applySnvPassiveEffects(game);
  assert.equal(target.philosopherDrunk, false);
  assert.equal(target.poisoned, false);
});

test("No Dashii envenena al Filósofo antes de comprobar si embriaga al personaje copiado", () => {
  const roles = [
    "no_dashii",
    "philosopher",
    "dreamer",
    "clockmaker",
    "savant",
    "mutant",
    "witch",
    "flowergirl",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.players.forEach((player, index) => {
    player.character = roles[index];
  });
  const [demon, philosopher, dreamer] = game.players;
  philosopher.philosopherRole = "dreamer";
  applySnvPassiveEffects(game);
  assert.equal(philosopher.noDashiiPoisoned, true);
  assert.equal(dreamer.philosopherDrunk, false);
  demon.poisoned = true;
  applySnvPassiveEffects(game);
  assert.equal(philosopher.poisoned, false);
  assert.equal(dreamer.philosopherDrunk, true);
});

test("el aviso del Encantador copiado por Filósofo comunica el personaje real", () => {
  const roles = [
    "philosopher",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "witch",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.players.forEach((player, index) => {
    player.character = roles[index];
    player.alignment = index >= 6 ? "evil" : "good";
  });
  const philosopher = game.players[0],
    demon = game.players[7];
  resolvePhilosopher(game, philosopher.id, "snake_charmer");
  assert.equal(
    resolveSnakeCharmer(game, philosopher.id, demon.id).swapped,
    true,
  );
  assert.equal(demon.character, "philosopher");
  assert.match(
    game.pendingEffects.find(
      (effect) => effect.type === "character_change_notice",
    ).data.instruction,
    /Filósofo/,
  );
});

test("el amanecer incluye muertes nocturnas de cualquier causa y excluye supervivencias y resurrecciones", () => {
  const causes = [
    "assassin",
    "gossip",
    "godfather",
    "moonchild",
    "tinker",
    "gambler",
    "grandmother",
    "pit_hag_arbitrary",
  ];
  for (const cause of causes) {
    const game = bmrWithRoles([
      "grandmother",
      "sailor",
      "chambermaid",
      "gambler",
      "goon",
      "tinker",
      "godfather",
      "pukka",
    ]);
    game.round = 2;
    beginNight(game);
    const victim = game.players.find(
      (player) => player.character === "chambermaid",
    );
    assert.equal(killPlayer(game, victim.id, cause).died, true, cause);
    assert.equal(game.deathLog.at(-1).phase, "night");
    assert.equal(
      nightDeathAnnouncements(game).some((player) => player.id === victim.id),
      true,
      cause,
    );
    victim.alive = true;
    victim.diedThisNight = false;
    assert.equal(
      nightDeathAnnouncements(game).some((player) => player.id === victim.id),
      false,
      cause,
    );
  }
  const game = bmrWithRoles([
    "grandmother",
    "sailor",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "godfather",
    "zombuul",
  ]);
  game.round = 2;
  beginNight(game);
  const sailor = game.players.find((player) => player.character === "sailor");
  assert.equal(killPlayer(game, sailor.id, "assassin").died, false);
  assert.equal(nightDeathAnnouncements(game).includes(sailor), false);
  const zombuul = game.players.find((player) => player.character === "zombuul");
  assert.equal(
    killPlayer(game, zombuul.id, "demon_attack").reason,
    "zombuul_registered_dead",
  );
  assert.equal(nightDeathAnnouncements(game).includes(zombuul), true);
  assert.equal(game.deathLog.at(-1).resolution, "registered_dead");
});

test("los usos nocturnos gastados dejan de despertar y los no usados siguen disponibles", () => {
  const game = bmrWithRoles([
    "courtier",
    "professor",
    "sailor",
    "chambermaid",
    "gambler",
    "tinker",
    "assassin",
    "pukka",
  ]);
  game.round = 2;
  beginNight(game);
  for (const role of ["courtier", "professor", "assassin"]) {
    const actor = game.players.find((player) => player.character === role);
    assert.ok(
      nightSteps(game).some(
        (step) => step.actorId === actor.id && step.roleId === role,
      ),
    );
    actor.abilityUsed = true;
    assert.equal(
      nightSteps(game).some(
        (step) => step.actorId === actor.id && step.roleId === role,
      ),
      false,
    );
  }
});

test("las decisiones pendientes se bloquean según cuándo se conocen y deben resolverse", () => {
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  beginNight(game);
  const klutz = queueEffect(game, { type: "klutz_choice", label: "Patoso" });
  assert.equal(blockingPendingEffects(game).length, 0);
  const sweetheart = queueEffect(game, {
    type: "sweetheart_drunk",
    label: "Enamoradizo",
  });
  assert.deepEqual(
    blockingPendingEffects(game).map((effect) => effect.id),
    [sweetheart.id],
  );
  resolveEffect(game, sweetheart.id);
  beginDay(game);
  assert.deepEqual(
    blockingPendingEffects(game).map((effect) => effect.id),
    [klutz.id],
  );
  resolveEffect(game, klutz.id);
  const barber = queueEffect(game, { type: "barber_swap", label: "Barbero" });
  assert.equal(blockingPendingEffects(game).length, 0);
  assert.deepEqual(
    blockingPendingEffects(game, "night").map((effect) => effect.id),
    [barber.id],
  );
});

test("Pit-Hag no reinicia el mismo personaje y sí crea noche arbitraria al cambiar de Demonio", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "pit_hag",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.players.forEach((player, index) => {
    player.character = roles[index];
  });
  game.round = 2;
  beginNight(game);
  const pitHag = game.players[6],
    demon = game.players[7],
    target = game.players[0];
  target.abilityUsed = true;
  assert.equal(
    resolvePitHag(game, pitHag.id, target.id, target.character).changed,
    false,
  );
  assert.equal(target.abilityUsed, true);
  assert.equal(
    resolvePitHag(game, pitHag.id, demon.id, "no_dashii").arbitraryDeaths,
    true,
  );
  assert.equal(game.snvArbitraryDeathsRound, 2);
  assert.deepEqual(resolvePitHagArbitraryDeaths(game, []), []);
  assert.equal(game.snvArbitraryDeathsResolvedRound, 2);
  assert.equal(
    recordPitHagArbitraryChoice(game, target.id, false).reason,
    "narrator_spared",
  );
  assert.equal(target.alive, true);
  assert.equal(recordPitHagArbitraryChoice(game, target.id, true).died, true);
  assert.equal(game.deathLog.at(-1).sourceId, pitHag.id);
  assert.equal(nightDeathAnnouncements(game).includes(target), true);
});

test("el Padrino actúa por una muerte diurna del día anterior, conservando el equipo registrado", () => {
  const game = bmrWithRoles([
    "sailor",
    "chambermaid",
    "gambler",
    "courtier",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  game.round = 1;
  beginDay(game);
  const outsider = game.players[5],
    godfather = game.players[6],
    victim = game.players[1];
  killPlayer(game, outsider.id, "tinker");
  outsider.character = "sailor"; // El registro conserva lo que era al morir.
  closeDay(game);
  assert.equal(game.round, 2);
  assert.equal(outsiderDiedDuringPreviousDay(game), true);
  assert.ok(nightSteps(game).some((step) => step.roleId === "godfather"));
  assert.equal(resolveGodfather(game, godfather.id, victim.id).died, true);
});

test("el reparto secreto muestra al Lunático solo su Demonio aparente", () => {
  const game = bmrWithRoles([
    "sailor",
    "chambermaid",
    "gambler",
    "courtier",
    "lunatic",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const lunatic = game.players[4];
  game.lunaticSetup = { apparentDemonId: "po_bmr" };
  const view = privateDealProjection(game, lunatic.id);
  assert.equal(view.characterId, "po_bmr");
  assert.equal(view.team, "demon");
  assert.equal(view.alignment, "evil");
  assert.equal(JSON.stringify(view).includes("lunatic"), false);
  game.lunaticSetup = null;
  assert.throws(() => privateDealProjection(game, lunatic.id));
});

test("la maldición de la Bruja desaparece al quedar tres vivos", () => {
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const witch = game.players.find((p) => p.character === "witch");
  const target = game.players.find((p) => p.character === "dreamer");
  game.phase = "night";
  resolveWitch(game, witch.id, target.id);
  game.players
    .filter((p) => ![witch.id, target.id].includes(p.id))
    .slice(0, 4)
    .forEach((p) => {
      p.alive = false;
    });
  const fourth = game.players.find(
    (p) => p.alive && ![witch.id, target.id].includes(p.id),
  );
  killPlayer(game, fourth.id, "other");
  assert.equal(game.witchCurseId, null);
  assert.equal(
    nightSteps(game).some((step) => step.roleId === "witch"),
    false,
  );
});

test("los tres guiones exigen bluffs legales para el Demonio real", () => {
  for (const [scriptId, roles, choices] of [
    [
      "trouble_brewing",
      [
        "washerwoman",
        "librarian",
        "investigator",
        "chef",
        "empath",
        "drunk",
        "poisoner",
        "imp",
      ],
      { drunkBelief: "fortune_teller" },
    ],
    [
      "bad_moon_rising",
      bmrRoles,
      {
        setupChoices: { godfatherOutsiders: 1 },
        lunatic: {
          apparentDemonId: "pukka",
          minionIds: ["1"],
          bluffIds: ["exorcist", "innkeeper", "gossip"],
        },
      },
    ],
    ["sects_and_violets", snvRoles, {}],
  ]) {
    const game = createGame(names, roles, {
      scriptId,
      setupChoices: choices.setupChoices || {},
      secretDeal: false,
      random: () => 0.999,
      drunkBelief: choices.drunkBelief,
    });
    assert.equal(
      validateSetupDecisions(
        8,
        roles,
        { ...choices, bluffs: game.bluffs },
        scriptId,
      ).valid,
      true,
    );
    assert.equal(
      validateSetupDecisions(8, roles, { ...choices, bluffs: [] }, scriptId)
        .valid,
      false,
    );
    assert.equal(
      validateSetupDecisions(
        8,
        roles,
        { ...choices, bluffs: [roles[0], game.bluffs[1], game.bluffs[2]] },
        scriptId,
      ).valid,
      false,
    );
  }
});

test("el pase del Diablillo exige elección si hay varios Esbirros y rechazarlo no cambia la partida", () => {
  const roles = [
    "washerwoman",
    "librarian",
    "investigator",
    "chef",
    "empath",
    "drunk",
    "poisoner",
    "imp",
  ];
  const game = createGame(names, roles, {
    secretDeal: false,
    random: () => 0.999,
  });
  const demon = game.players.find((p) => p.character === "imp");
  const extra = game.players.find((p) => p.character === "chef");
  extra.character = "baron";
  extra.alignment = "evil";
  game.phase = "night";
  const before = JSON.stringify(game);
  assert.throws(() => killPlayer(game, demon.id, "imp_self"), /elegir/);
  assert.equal(JSON.stringify(game), before);
  const result = killPlayer(game, demon.id, "imp_self", {
    successorId: extra.id,
  });
  assert.equal(result.successorId, extra.id);
});

test("Pukka mata al Tonto mientras aún está envenenado y después lo cura", () => {
  const game = bmrWithRoles([
    "fool",
    "sailor",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const fool = game.players[0],
    pukka = game.players[7];
  resolvePukkaNight(game, pukka.id, fool.id);
  assert.equal(fool.poisoned, true);
  resolvePukkaNight(game, pukka.id, game.players[2].id);
  assert.equal(fool.alive, false);
  assert.equal(fool.foolAbilityUsed, undefined);
  assert.equal(fool.poisoned, false);
});

test("Niño Lunar comprueba su veneno al resolver y conserva la alineación al elegir", () => {
  const make = () =>
    bmrWithRoles([
      "moonchild",
      "sailor",
      "chambermaid",
      "gambler",
      "goon",
      "tinker",
      "godfather",
      "pukka",
    ]);
  const game = make();
  const [moonchild, , chambermaid, , goon] = game.players;
  moonchild.poisoned = true;
  killPlayer(game, moonchild.id, "other");
  assert.equal(moonchild.moonchildPending, true);
  game.phase = "day";
  chooseMoonchild(game, moonchild.id, goon.id);
  goon.alignment = "evil";
  moonchild.poisoned = false;
  game.phase = "night";
  assert.equal(resolveMoonchild(game, moonchild.id).died, true);
  assert.equal(chambermaid.alive, true);

  const game2 = make();
  killPlayer(game2, game2.players[0].id, "other");
  game2.phase = "day";
  chooseMoonchild(game2, game2.players[0].id, game2.players[2].id);
  game2.players[0].poisoned = true;
  game2.phase = "night";
  assert.equal(
    resolveMoonchild(game2, game2.players[0].id).reason,
    "no_ability",
  );
  assert.equal(game2.players[2].alive, true);
});

test("Pukka envenena el nuevo objetivo antes de matar al anterior, que sigue envenenado", () => {
  const game = bmrWithRoles([
    "chambermaid",
    "tea_lady",
    "gambler",
    "sailor",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const [victim, teaLady] = game.players,
    pukka = game.players[7];
  resolvePukkaNight(game, pukka.id, victim.id);
  assert.equal(teaLady.poisoned, false);
  resolvePukkaNight(game, pukka.id, teaLady.id);
  assert.equal(victim.alive, false);
  assert.equal(teaLady.poisoned, true);
});

test("el Exorcista impide una nueva elección de Pukka pero no su muerte diferida", () => {
  const game = bmrWithRoles([
    "fool",
    "exorcist",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const [victim, exorcist] = game.players,
    pukka = game.players[7];
  game.round = 1;
  game.night.number = 1;
  resolvePukkaNight(game, pukka.id, victim.id);
  game.round = 2;
  beginNight(game);
  resolveExorcist(game, exorcist.id, pukka.id);
  assert.equal(
    nightSteps(game).some((step) => step.roleId === "pukka"),
    true,
  );
  const result = resolvePukkaNight(game, pukka.id, null);
  assert.equal(result.reason, "exorcised");
  assert.equal(victim.alive, false);
  assert.equal(victim.poisoned, false);
  assert.equal(game.pukkaPoisonedId, null);
});

test("Shabaloth resuelve en orden: si el segundo elegido es el Matón, el primero ya murió", () => {
  const game = bmrWithRoles([
    "chambermaid",
    "gambler",
    "courtier",
    "exorcist",
    "goon",
    "tinker",
    "assassin",
    "shabaloth",
  ]);
  const [victim, , , , goon, , , shabaloth] = game.players;
  const result = resolveShabaloth(game, shabaloth.id, [victim.id, goon.id]);
  assert.equal(victim.alive, false);
  assert.equal(goon.alive, true);
  assert.equal(goon.alignment, "evil");
  assert.equal(shabaloth.poisoned, true);
  assert.equal(result.deaths[0].died, true);
  assert.equal(result.deaths[1].reason, "no_ability");
});

test("si Shabaloth elige primero al Matón, no mata al segundo objetivo", () => {
  const game = bmrWithRoles([
    "chambermaid",
    "gambler",
    "courtier",
    "exorcist",
    "goon",
    "tinker",
    "assassin",
    "shabaloth",
  ]);
  const [victim, , , , goon, , , shabaloth] = game.players;
  resolveShabaloth(game, shabaloth.id, [goon.id, victim.id]);
  assert.equal(victim.alive, true);
  assert.equal(goon.alive, true);
  assert.equal(goon.alignment, "evil");
});

test("el Asesino solo activa la excepción del Matón si este tenía habilidad", () => {
  const roles = [
    "chambermaid",
    "gambler",
    "courtier",
    "exorcist",
    "goon",
    "tinker",
    "assassin",
    "pukka",
  ];
  const game = bmrWithRoles(roles);
  const goon = game.players[4],
    assassin = game.players[6];
  goon.poisoned = true;
  assert.equal(resolveAssassin(game, assassin.id, goon.id).died, true);
  assert.equal(goon.alignment, "good");
  const game2 = bmrWithRoles(roles);
  const goon2 = game2.players[4],
    assassin2 = game2.players[6];
  assassin2.poisoned = true;
  assert.equal(resolveAssassin(game2, assassin2.id, goon2.id).died, false);
  assert.equal(goon2.alive, true);
  assert.equal(goon2.alignment, "evil");
});

test("la Camarera no cuenta al Manitas ni el paso diferido de Pukka exorcizado", () => {
  const game = bmrWithRoles([
    "fool",
    "exorcist",
    "chambermaid",
    "gambler",
    "goon",
    "tinker",
    "godfather",
    "pukka",
  ]);
  const [victim, exorcist, , , , tinker, , pukka] = game.players;
  game.round = 1;
  game.night.number = 1;
  resolvePukkaNight(game, pukka.id, victim.id);
  game.round = 2;
  beginNight(game);
  resolveExorcist(game, exorcist.id, pukka.id);
  assert.equal(chambermaidWakeCount(game, [tinker.id, pukka.id]), 0);
});

test("el Asesino mata realmente al Zombuul incluso en su primera muerte", () => {
  const game = bmrWithRoles([
    "chambermaid",
    "gambler",
    "courtier",
    "exorcist",
    "goon",
    "tinker",
    "assassin",
    "zombuul",
  ]);
  const assassin = game.players[6],
    zombuul = game.players[7];
  const result = resolveAssassin(game, assassin.id, zombuul.id);
  assert.equal(result.died, true);
  assert.equal(zombuul.alive, false);
  assert.notEqual(zombuul.zombuulRegisteredDead, true);
  assert.equal(game.outcome?.winner, "good");
});

test("Mente Maestra mantiene el día adicional aunque durante la noche queden dos vivos", () => {
  const game = bmrWithRoles([
    "chambermaid",
    "gambler",
    "courtier",
    "exorcist",
    "goon",
    "tinker",
    "mastermind",
    "pukka",
  ]);
  game.players.slice(0, 4).forEach((player) => {
    player.alive = false;
  });
  game.phase = "day";
  game.round = 1;
  game.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    deathOccurred: false,
    closed: false,
    stage: "conversation",
    pendingNomination: null,
  };
  killPlayer(game, game.players[7].id, "execution");
  assert.equal(game.outcome, null);
  closeDay(game);
  killPlayer(game, game.players[5].id, "other");
  assert.equal(game.players.filter((player) => player.alive).length, 2);
  assert.equal(game.outcome, null);
  beginDay(game);
  closeDay(game);
  assert.equal(game.outcome?.winner, "good");
});

test("Filósofo envenenado gasta su elección y solo simula la habilidad después de sanar", () => {
  const roles = [
    "philosopher",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "witch",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const philosopher = game.players.find((p) => p.character === "philosopher");
  philosopher.poisoned = true;
  assert.equal(
    resolvePhilosopher(game, philosopher.id, "artist").reason,
    "no_ability",
  );
  assert.equal(philosopher.abilityUsed, true);
  philosopher.poisoned = false;
  assert.equal(philosopher.philosopherRole == null, true);
  assert.equal(philosopher.philosopherSimulatedRole, "artist");
  beginDay(game);
  assert.equal(
    useArtistQuestion(game, philosopher.id, "¿Es rojo?", "yes"),
    true,
  );
  assert.match(game.history[0].detail, /simulada/);
  assert.throws(() => useArtistQuestion(game, philosopher.id, "¿Otra?", "no"));
});

test("Encantador no puede elegir muertos y comunica ambos cambios de forma privada", () => {
  const roles = [
    "snake_charmer",
    "clockmaker",
    "dreamer",
    "flowergirl",
    "savant",
    "mutant",
    "witch",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const actor = game.players.find((p) => p.character === "snake_charmer"),
    demon = game.players.find((p) => p.character === "vortox");
  demon.alive = false;
  const before = JSON.stringify(game);
  assert.throws(() => resolveSnakeCharmer(game, actor.id, demon.id), /vivo/);
  assert.equal(JSON.stringify(game), before);
  demon.alive = true;
  resolveSnakeCharmer(game, actor.id, demon.id);
  const notices = game.pendingEffects.filter(
    (e) => e.type === "character_change_notice",
  );
  assert.equal(notices.length, 2);
  assert.ok(notices.some((e) => e.targetIds.includes(actor.id)));
  assert.ok(notices.some((e) => e.targetIds.includes(demon.id)));
});

test("la Bruja mata al declarar la nominación y la votación usa la mayoría posterior", () => {
  const game = createGame(names, snvRoles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const witch = game.players.find((p) => p.character === "witch");
  const nominator = game.players.find((p) => p.character === "dreamer");
  const nominee = game.players.find((p) => p.character === "clockmaker");
  resolveWitch(game, witch.id, nominator.id);
  beginDay(game);
  game.day.pendingNomination = {
    nominatorId: nominator.id,
    nomineeId: nominee.id,
    stage: "accusation",
  };
  assert.equal(resolveWitchNomination(game, nominator.id).triggered, true);
  assert.equal(nominator.alive, false);
  const result = addNomination(game, nominator.id, nominee.id, 4, []);
  assert.equal(result.nomination.threshold, 4);
  assert.equal(game.day.nominations.length, 1);
});

test("el nuevo Fang Gu no vuelve a atacar en la noche del salto", () => {
  const roles = [
    "snake_charmer",
    "clockmaker",
    "dreamer",
    "flowergirl",
    "mutant",
    "klutz",
    "witch",
    "fang_gu",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.phase = "night";
  game.round = 2;
  game.night.number = 2;
  const fang = game.players.find((p) => p.character === "fang_gu"),
    outsider = game.players.find((p) => p.character === "mutant");
  assert.equal(resolveSnvDemonAttack(game, fang.id, outsider.id).jumped, true);
  assert.equal(
    nightSteps(game).some(
      (step) => step.roleId === "fang_gu" && step.actorId === outsider.id,
    ),
    false,
  );
  game.round = 3;
  beginNight(game);
  assert.equal(
    nightSteps(game).some(
      (step) => step.roleId === "fang_gu" && step.actorId === outsider.id,
    ),
    true,
  );
});

test("el Filósofo que elige Relojero en una noche posterior recibe la información esa noche", () => {
  const roles = [
    "philosopher",
    "clockmaker",
    "dreamer",
    "flowergirl",
    "savant",
    "mutant",
    "witch",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  game.round = 3;
  beginNight(game);
  const actor = game.players.find((p) => p.character === "philosopher");
  resolvePhilosopher(game, actor.id, "clockmaker");
  assert.equal(
    nightSteps(game).some(
      (step) => step.roleId === "clockmaker" && step.actorId === actor.id,
    ),
    true,
  );
  game.round = 4;
  beginNight(game);
  assert.equal(
    nightSteps(game).some(
      (step) => step.roleId === "clockmaker" && step.actorId === actor.id,
    ),
    false,
  );
});

test("el Artista puede recibir no lo sé y consume su pregunta privada", () => {
  const roles = [
    "artist",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "witch",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  beginDay(game);
  const artist = game.players.find((p) => p.character === "artist");
  assert.equal(
    useArtistQuestion(game, artist.id, "¿Vamos ganando?", "unknown"),
    true,
  );
  assert.equal(artist.artistAnswer, "unknown");
  assert.match(game.history[0].text, /privado/);
  assert.throws(() => useArtistQuestion(game, artist.id, "¿Otra?", "yes"));
});

test("Gemelo Malvado aplaza la victoria al morir el Demonio y el Bien gana si después muere el Gemelo", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "evil_twin",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const twin = game.players.find((p) => p.character === "evil_twin"),
    partner = game.players.find((p) => p.character === "dreamer"),
    demon = game.players.find((p) => p.character === "vortox");
  resolveEvilTwinSetup(game, twin.id, partner.id);
  killPlayer(game, demon.id, "execution");
  assert.equal(game.outcome, null);
  assert.equal(game.snvTwinVictoryPending, true);
  killPlayer(game, twin.id, "execution");
  assert.equal(game.outcome?.winner, "good");
});

test("si el personaje Gemelo Malvado es bueno y es ejecutado, gana el Mal", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "evil_twin",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const twin = game.players.find((p) => p.character === "evil_twin"),
    partner = game.players.find((p) => p.character === "vortox");
  twin.alignment = "good";
  resolveEvilTwinSetup(game, twin.id, partner.id);
  game.phase = "day";
  killPlayer(game, twin.id, "execution");
  assert.equal(game.outcome?.winner, "evil");
});

test("el Patoso malvado que elige a un malvado pierde con su equipo", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "klutz",
    "witch",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const klutz = game.players.find((p) => p.character === "klutz"),
    evil = game.players.find((p) => p.character === "witch");
  klutz.alignment = "evil";
  killPlayer(game, klutz.id, "other");
  resolveKlutzChoice(game, klutz.id, evil.id);
  assert.equal(game.outcome?.winner, "good");
  assert.throws(() => resolveKlutzChoice(game, klutz.id, evil.id), /pendiente/);
});

test("el Ermitaño envenenado muerto por el Demonio recibe información simulada", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "flowergirl",
    "oracle",
    "sage",
    "mutant",
    "witch",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const sage = game.players.find((p) => p.character === "sage"),
    demon = game.players.find((p) => p.character === "vortox");
  sage.poisoned = true;
  game.phase = "night";
  killPlayer(game, sage.id, "demon_attack", { sourceId: demon.id });
  const effect = game.pendingEffects.find((e) => e.type === "sage_info");
  assert.ok(effect);
  assert.equal(effect.data.unreliable, true);
});

test("la victoria aplazada se revisa si el Gemelo pierde su personaje", () => {
  const roles = [
    "clockmaker",
    "dreamer",
    "flowergirl",
    "oracle",
    "savant",
    "mutant",
    "evil_twin",
    "vortox",
  ];
  const game = createGame(names, roles, {
    scriptId: "sects_and_violets",
    secretDeal: false,
    random: () => 0.999,
  });
  const twin = game.players.find((p) => p.character === "evil_twin"),
    partner = game.players.find((p) => p.character === "dreamer"),
    demon = game.players.find((p) => p.character === "vortox");
  resolveEvilTwinSetup(game, twin.id, partner.id);
  killPlayer(game, demon.id, "execution");
  assert.equal(game.outcome, null);
  changeCharacter(game, twin.id, "pit_hag");
  applySnvPassiveEffects(game);
  assert.equal(game.outcome?.winner, "good");
});
