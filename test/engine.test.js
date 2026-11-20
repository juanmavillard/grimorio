import test from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_BY_ID } from "../src/data.js";
import {
  addNomination,
  aliveNeighbours,
  beginDay,
  beginNight,
  canRegisterAs,
  chefPairs,
  closeDay,
  createGame,
  empathNumber,
  executionLeader,
  expectedComposition,
  fortuneAnswer,
  killPlayer,
  nightSteps,
  possibleChefNumbers,
  possibleEmpathNumbers,
  possibleFortuneAnswers,
  resolveImpAttack,
  startingInfoIsLegal,
  useSlayer,
  validateSetup,
  validateSetupDecisions,
  previewVirginNomination,
  diagnoseGame,
  applyDiagnosticFix,
  townSquareProjection,
} from "../src/engine.js";

const roles8 = [
  "washerwoman",
  "chef",
  "empath",
  "fortune_teller",
  "monk",
  "butler",
  "poisoner",
  "imp",
];
const names8 = ["Ana", "Berto", "Cris", "Dani", "Eva", "Fran", "Gala", "Hugo"];
const deterministic = { random: () => 0.999 };

function game8() {
  return createGame(names8, roles8, { ...deterministic, secretDeal: false });
}

function setRoles(game, ids) {
  game.players.forEach((p, i) => {
    p.character = ids[i];
    p.perceivedCharacter = ids[i];
    p.alignment = ["minion", "demon"].includes(
      {
        poisoner: "minion",
        spy: "minion",
        scarlet_woman: "minion",
        baron: "minion",
        imp: "demon",
      }[ids[i]],
    )
      ? "evil"
      : "good";
  });
  return game;
}

test("composición oficial de 5 a 15 jugadores", () => {
  assert.deepEqual(expectedComposition(5), {
    townsfolk: 3,
    outsider: 0,
    minion: 1,
    demon: 1,
  });
  assert.deepEqual(expectedComposition(10), {
    townsfolk: 7,
    outsider: 0,
    minion: 2,
    demon: 1,
  });
  assert.deepEqual(expectedComposition(15), {
    townsfolk: 9,
    outsider: 2,
    minion: 3,
    demon: 1,
  });
});

test("el catálogo de Trouble Brewing conserva exactamente los 22 personajes y equipos oficiales", () => {
  const roster = Object.entries(CHARACTER_BY_ID)
    .map(([id, role]) => `${id}:${role.team}`)
    .sort();
  assert.deepEqual(
    roster,
    [
      "baron:minion",
      "butler:outsider",
      "chef:townsfolk",
      "drunk:outsider",
      "empath:townsfolk",
      "fortune_teller:townsfolk",
      "imp:demon",
      "investigator:townsfolk",
      "librarian:townsfolk",
      "mayor:townsfolk",
      "monk:townsfolk",
      "poisoner:minion",
      "ravenkeeper:townsfolk",
      "recluse:outsider",
      "saint:outsider",
      "scarlet_woman:minion",
      "slayer:townsfolk",
      "soldier:townsfolk",
      "spy:minion",
      "undertaker:townsfolk",
      "virgin:townsfolk",
      "washerwoman:townsfolk",
    ].sort(),
  );
});

test("el Barón sustituye exactamente 2 Aldeanos por 2 Forasteros", () => {
  assert.deepEqual(expectedComposition(10, true), {
    townsfolk: 5,
    outsider: 2,
    minion: 2,
    demon: 1,
  });
  const valid = [
    "washerwoman",
    "chef",
    "empath",
    "monk",
    "mayor",
    "butler",
    "saint",
    "baron",
    "poisoner",
    "imp",
  ];
  assert.equal(validateSetup(10, valid).valid, true);
  assert.equal(validateSetup(10, roles8).valid, false);
});

test("el diagnóstico detecta y corrige estados temporales imposibles sin tocar decisiones narrativas", () => {
  const g = game8();
  g.phase = "day";
  g.players[0].protected = true;
  g.players[1].ghostVote = true;
  const issues = diagnoseGame(g);
  assert.equal(
    issues.some((item) => item.fixId === "clear-protection"),
    true,
  );
  assert.equal(
    issues.some((item) => item.fixId === "clear-living-ghost-votes"),
    true,
  );
  applyDiagnosticFix(g, "clear-protection");
  applyDiagnosticFix(g, "clear-living-ghost-votes");
  assert.equal(
    g.players.some((player) => player.protected),
    false,
  );
  assert.equal(
    g.players.some((player) => player.alive && player.ghostVote),
    false,
  );
  assert.equal(g.history[0].event.action, "diagnostic_fix");
});

test("el diagnóstico advierte un señuelo rojo inválido y conserva a lo sumo uno al corregir", () => {
  const g = game8();
  g.players[0].redHerring = true;
  g.players[1].redHerring = true;
  const issues = diagnoseGame(g);
  assert.equal(
    issues.some((item) => item.id === "red-herring-many"),
    true,
  );
  applyDiagnosticFix(g, "clear-extra-red-herrings");
  assert.equal(g.players.filter((player) => player.redHerring).length, 1);
});

test("la proyección de Plaza pública no contiene personajes ni estados secretos", () => {
  const g = game8();
  g.phase = "day";
  g.players[0].poisoned = true;
  g.players[1].protected = true;
  g.players[2].notes = "Información secreta";
  const town = townSquareProjection(g);
  assert.deepEqual(Object.keys(town.players[0]).sort(), [
    "alive",
    "ghostVote",
    "id",
    "name",
    "seat",
  ]);
  const serialized = JSON.stringify(town);
  assert.equal(serialized.includes("poisoned"), false);
  assert.equal(serialized.includes("protected"), false);
  assert.equal(serialized.includes("notes"), false);
  assert.equal(serialized.includes(g.players[0].character), false);
});

test("el diagnóstico detecta veneno persistente, amo inválido, bluffs y alineamiento incoherente", () => {
  const g = game8();
  g.players
    .filter((player) => player.character === "poisoner")
    .forEach((player) => {
      player.character = "chef";
      player.alignment = "good";
    });
  g.players[0].character = "imp";
  g.players[0].alignment = "good";
  g.players[1].poisoned = true;
  g.players[2].masterId = g.players[2].id;
  g.bluffs = ["chef"];
  const issues = diagnoseGame(g);
  assert.equal(
    issues.some((item) => item.fixId === "clear-poison"),
    true,
  );
  assert.equal(
    issues.some((item) => item.fixId === "clear-invalid-masters"),
    true,
  );
  assert.equal(
    issues.some((item) => item.id === "invalid-bluffs"),
    true,
  );
  assert.equal(
    issues.some((item) => item.id === "alignment-mismatch"),
    true,
  );
  applyDiagnosticFix(g, "clear-poison");
  applyDiagnosticFix(g, "clear-invalid-masters");
  assert.equal(g.players[1].poisoned, false);
  assert.equal(g.players[2].masterId, null);
});

test("el Borracho recibe un Aldeano no jugado como personaje aparente", () => {
  const roles = ["washerwoman", "chef", "empath", "drunk", "poisoner", "imp"];
  const g = createGame(names8.slice(0, 6), roles, {
    ...deterministic,
    secretDeal: false,
    drunkBelief: "investigator",
    preset: { id: "test-preset", title: "Prueba", source: "curated" },
  });
  const drunk = g.players.find((p) => p.character === "drunk");
  assert.equal(drunk.perceivedCharacter, "investigator");
  assert.equal(g.selectedRoles.includes(drunk.perceivedCharacter), false);
  assert.deepEqual(g.setupPreset, {
    id: "test-preset",
    title: "Prueba",
    source: "curated",
    customized: false,
  });
});

test("las decisiones finales validan Borracho, señuelo y bluffs conjuntamente", () => {
  const roles = [
    "chef",
    "empath",
    "fortune_teller",
    "undertaker",
    "virgin",
    "drunk",
    "scarlet_woman",
    "imp",
  ];
  const valid = validateSetupDecisions(8, roles, {
    drunkBelief: "investigator",
    redHerringIsGood: true,
    bluffs: ["washerwoman", "librarian", "butler"],
  });
  assert.equal(valid.valid, true);
  assert.equal(
    validateSetupDecisions(8, roles, {
      drunkBelief: "chef",
      redHerringIsGood: false,
      bluffs: ["chef", "chef", "poisoner"],
    }).valid,
    false,
  );
  assert.equal(
    validateSetupDecisions(
      6,
      ["chef", "empath", "monk", "butler", "poisoner", "imp"],
      {
        bluffs: ["washerwoman"],
      },
    ).valid,
    false,
  );
});

test("vecinos vivos y Empática saltan jugadores muertos", () => {
  const g = game8();
  setRoles(g, [
    "empath",
    "chef",
    "poisoner",
    "monk",
    "imp",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  g.players[1].alive = false;
  const neighbours = aliveNeighbours(g, g.players[0].id);
  assert.deepEqual(
    neighbours.map((p) => p.name),
    ["Hugo", "Cris"],
  );
  assert.equal(empathNumber(g, g.players[0].id), 1);
});

test("Chef cuenta bordes malvados y permite registro distinto del Recluso", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "poisoner",
    "chef",
    "monk",
    "spy",
    "butler",
    "washerwoman",
    "recluse",
  ]);
  assert.equal(chefPairs(g), 1);
  assert.equal(chefPairs(g, { [g.players[7].id]: true }), 2);
});

test("Adivina detecta Demonio, señuelo y muertos", () => {
  const g = game8();
  const imp = g.players.find((p) => p.character === "imp");
  const good = g.players.find((p) => p.alignment === "good");
  good.redHerring = true;
  imp.alive = false;
  assert.equal(fortuneAnswer(g, [imp.id]), true);
  assert.equal(fortuneAnswer(g, [good.id]), true);
});

test("Soldado sano y protección del Monje impiden la muerte; envenenado muere", () => {
  const g = game8();
  const imp = g.players.find((p) => p.character === "imp");
  const target = g.players.find((p) => p.character === "washerwoman");
  target.character = "soldier";
  target.perceivedCharacter = "soldier";
  assert.equal(resolveImpAttack(g, imp.id, target.id).reason, "soldier");
  target.poisoned = true;
  assert.equal(resolveImpAttack(g, imp.id, target.id).died, true);
  const g2 = game8(),
    imp2 = g2.players.find((p) => p.character === "imp"),
    t2 = g2.players[0];
  t2.protected = true;
  assert.equal(resolveImpAttack(g2, imp2.id, t2.id).reason, "protected");
});

test("Diablillo envenenado no mata", () => {
  const g = game8(),
    imp = g.players.find((p) => p.character === "imp");
  imp.poisoned = true;
  const target = g.players.find((p) => p.id !== imp.id);
  assert.equal(resolveImpAttack(g, imp.id, target.id).reason, "demon_poisoned");
  assert.equal(target.alive, true);
});

test("Mujer Escarlata toma el relevo con 5+ vivos", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "scarlet_woman",
    "chef",
    "empath",
    "monk",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  const result = killPlayer(g, g.players[0].id, "execution");
  assert.equal(result.winner, null);
  assert.equal(g.players[1].character, "imp");
  assert.equal(g.outcome, null);
});

test("Mujer Escarlata no funciona envenenada", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "scarlet_woman",
    "chef",
    "empath",
    "monk",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  g.players[1].poisoned = true;
  killPlayer(g, g.players[0].id, "execution");
  assert.equal(g.outcome.winner, "good");
});

test("starpass elige un Esbirro vivo y no gana el Bien", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "poisoner",
    "chef",
    "empath",
    "monk",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  const result = resolveImpAttack(g, g.players[0].id, g.players[0].id, {
    successorId: g.players[1].id,
  });
  assert.equal(result.successorId, g.players[1].id);
  assert.equal(g.players[1].character, "imp");
  assert.equal(g.outcome, null);
});

test("Santo ejecutado sano da victoria al Mal; envenenado no", () => {
  const g = game8();
  g.players[0].character = "saint";
  g.players[0].perceivedCharacter = "saint";
  killPlayer(g, g.players[0].id, "execution");
  assert.equal(g.outcome.winner, "evil");
  const g2 = game8();
  g2.players[0].character = "saint";
  g2.players[0].poisoned = true;
  killPlayer(g2, g2.players[0].id, "execution");
  assert.equal(g2.outcome, null);
});

test("votación exige mayoría estricta sobre otros candidatos y empate ejecuta a nadie", () => {
  const g = game8();
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  addNomination(g, g.players[0].id, g.players[1].id, 4, []);
  addNomination(g, g.players[2].id, g.players[3].id, 4, []);
  assert.deepEqual(executionLeader(g), {
    nomineeId: null,
    votes: 4,
    tied: true,
    threshold: 4,
  });
  closeDay(g);
  assert.equal(g.players[1].alive, true);
  assert.equal(g.players[3].alive, true);
});

test("un voto de muerto se consume al registrarlo", () => {
  const g = game8();
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  g.players[7].alive = false;
  g.players[7].ghostVote = true;
  addNomination(g, g.players[0].id, g.players[1].id, 1, [g.players[7].id]);
  assert.equal(g.players[7].ghostVote, false);
});

test("Virgen: Aldeano sano se ejecuta; envenenada solo gasta habilidad", () => {
  const g = game8();
  setRoles(g, [
    "chef",
    "virgin",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  const result = addNomination(g, g.players[0].id, g.players[1].id, 0, []);
  assert.equal(result.virginTriggered, true);
  assert.equal(g.players[0].alive, false);
  const g2 = game8();
  setRoles(g2, [
    "chef",
    "virgin",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g2.players[1].poisoned = true;
  g2.phase = "day";
  g2.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  assert.equal(
    addNomination(g2, g2.players[0].id, g2.players[1].id, 0, [])
      .virginTriggered,
    false,
  );
  assert.equal(g2.players[1].abilityUsed, true);
  assert.equal(g2.players[0].alive, true);
});

test("Exterminador puede matar al Recluso sin terminar la partida", () => {
  const g = game8();
  setRoles(g, [
    "slayer",
    "recluse",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.phase = "day";
  g.day.closed = false;
  const result = useSlayer(g, g.players[0].id, g.players[1].id, true);
  assert.equal(result.died, true);
  assert.equal(g.outcome, null);
  assert.equal(g.players[1].alive, false);
});

test("pasos nocturnos ya completados se mantienen estables si el actor muere", () => {
  const g = game8();
  g.night = { number: 2, stepIndex: 0, completed: [] };
  const imp = g.players.find((p) => p.character === "imp");
  const id = `imp-${imp.id}`;
  g.night.completed.push(id);
  imp.alive = false;
  assert.ok(nightSteps(g).some((s) => s.id === id));
});

test("todas las composiciones 5–15 suman el total y contienen un Demonio", () => {
  for (let n = 5; n <= 15; n++) {
    const comp = expectedComposition(n);
    assert.equal(
      Object.values(comp).reduce((a, b) => a + b, 0),
      n,
    );
    assert.equal(comp.demon, 1);
  }
});

test("los bluffs son 3 buenos distintos fuera de juego a partir de 7", () => {
  const g = game8();
  assert.equal(g.bluffs.length, 3);
  assert.equal(new Set(g.bluffs).size, 3);
  assert.ok(
    g.bluffs.every(
      (id) =>
        !g.selectedRoles.includes(id) &&
        ["townsfolk", "outsider"].includes(CHARACTER_BY_ID[id].team),
    ),
  );
});

test("en partidas de 5–6 no hay bluffs ni información inicial del Mal", () => {
  const roles = ["washerwoman", "chef", "empath", "poisoner", "imp"];
  const g = createGame(names8.slice(0, 5), roles, {
    ...deterministic,
    secretDeal: false,
  });
  g.phase = "night";
  assert.deepEqual(g.bluffs, []);
  assert.equal(
    nightSteps(g).some((s) => ["minion_info", "demon_info"].includes(s.roleId)),
    false,
  );
});

test("con 7+ la primera noche abre información de Esbirros y Demonio primero", () => {
  const g = game8();
  g.phase = "night";
  assert.deepEqual(
    nightSteps(g)
      .slice(0, 2)
      .map((s) => s.roleId),
    ["minion_info", "demon_info"],
  );
});

test("Chef: cero, tres consecutivos y pareja que cruza el cierre del círculo", () => {
  const g = game8();
  g.players.forEach((p) => {
    p.alignment = "good";
  });
  assert.equal(chefPairs(g), 0);
  g.players[1].alignment =
    g.players[2].alignment =
    g.players[3].alignment =
      "evil";
  assert.equal(chefPairs(g), 2);
  g.players.forEach((p) => {
    p.alignment = "good";
  });
  g.players[0].alignment = g.players[7].alignment = "evil";
  assert.equal(chefPairs(g), 1);
});

test("Empática puede obtener 0 o 2 con los mismos vecinos vivos", () => {
  const g = game8();
  g.players.forEach((p) => {
    p.alignment = "good";
  });
  assert.equal(empathNumber(g, g.players[0].id), 0);
  g.players[1].alignment = g.players[7].alignment = "evil";
  assert.equal(empathNumber(g, g.players[0].id), 2);
});

test("Adivina responde NO sin Demonio ni señuelo, y permite override de Recluso", () => {
  const g = game8();
  const a = g.players[0],
    b = g.players[1];
  g.players.forEach((p) => {
    p.redHerring = false;
  });
  assert.equal(fortuneAnswer(g, [a.id, b.id]), false);
  assert.equal(fortuneAnswer(g, [a.id], { [a.id]: true }), true);
});

test("Enterrador solo aparece si una ejecución causó muerte", () => {
  const g = game8();
  const undertaker = g.players[0];
  undertaker.character = "undertaker";
  undertaker.perceivedCharacter = "undertaker";
  g.night = { number: 2, stepIndex: 0, completed: [] };
  g.day.executionCausedDeath = false;
  assert.equal(
    nightSteps(g).some((s) => s.roleId === "undertaker"),
    false,
  );
  g.day.executionCausedDeath = true;
  assert.equal(
    nightSteps(g).some((s) => s.roleId === "undertaker"),
    true,
  );
});

test("Diablillo puede atacar a un muerto y no hay nueva muerte", () => {
  const g = game8(),
    imp = g.players.find((p) => p.character === "imp"),
    target = g.players[0];
  target.alive = false;
  target.ghostVote = true;
  assert.equal(resolveImpAttack(g, imp.id, target.id).reason, "already_dead");
  assert.equal(g.players.filter((p) => p.alive).length, 7);
});

test("redirección de Alcalde a muerto, Soldado o protegido puede dejar cero muertes", () => {
  for (const mode of ["dead", "soldier", "protected"]) {
    const g = game8(),
      imp = g.players.find((p) => p.character === "imp"),
      mayor = g.players[0],
      redirect = g.players[1];
    mayor.character = "mayor";
    mayor.perceivedCharacter = "mayor";
    if (mode === "dead") redirect.alive = false;
    if (mode === "soldier") {
      redirect.character = "soldier";
      redirect.perceivedCharacter = "soldier";
    }
    if (mode === "protected") redirect.protected = true;
    assert.equal(
      resolveImpAttack(g, imp.id, mayor.id, { redirectId: redirect.id }).died,
      false,
    );
    assert.equal(mayor.alive, true);
  }
});

test("muerte nocturna del Guardián crea su paso; ejecución no", () => {
  const g = game8();
  const keeper = g.players[0];
  keeper.character = "ravenkeeper";
  keeper.perceivedCharacter = "ravenkeeper";
  g.phase = "night";
  g.night = { number: 2, stepIndex: 0, completed: [] };
  killPlayer(g, keeper.id, "demon_attack");
  assert.equal(
    nightSteps(g).some((s) => s.roleId === "ravenkeeper"),
    true,
  );
  const g2 = game8();
  const keeper2 = g2.players[0];
  keeper2.character = "ravenkeeper";
  keeper2.perceivedCharacter = "ravenkeeper";
  g2.night = { number: 2, stepIndex: 0, completed: [] };
  killPlayer(g2, keeper2.id, "execution");
  assert.equal(
    nightSteps(g2).some((s) => s.roleId === "ravenkeeper"),
    false,
  );
});

test("Virgen no activa con Forastero o Esbirro", () => {
  for (const nominatorRole of ["butler", "poisoner"]) {
    const g = game8();
    setRoles(g, [
      nominatorRole,
      "virgin",
      "chef",
      "empath",
      "monk",
      "fortune_teller",
      "washerwoman",
      "imp",
    ]);
    g.phase = "day";
    g.day = {
      number: 1,
      nominations: [],
      executedId: null,
      executionCausedDeath: false,
      closed: false,
    };
    assert.equal(
      addNomination(g, g.players[0].id, g.players[1].id, 0, []).virginTriggered,
      false,
    );
    assert.equal(g.players[0].alive, true);
    assert.equal(g.players[1].abilityUsed, true);
  }
});

test("Espía puede registrar como Aldeano al nominar a la Virgen", () => {
  const g = game8();
  setRoles(g, [
    "spy",
    "virgin",
    "chef",
    "empath",
    "monk",
    "fortune_teller",
    "washerwoman",
    "imp",
  ]);
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  assert.equal(
    addNomination(g, g.players[0].id, g.players[1].id, 0, [], {
      spyRegistersTownsfolk: true,
    }).virginTriggered,
    true,
  );
  assert.equal(g.players[0].alive, false);
});

test("Borracho que cree ser Virgen no tiene habilidad", () => {
  const g = game8();
  setRoles(g, [
    "chef",
    "drunk",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.players[1].perceivedCharacter = "virgin";
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  assert.equal(
    addNomination(g, g.players[0].id, g.players[1].id, 0, []).virginTriggered,
    false,
  );
  assert.equal(g.players[0].alive, true);
  assert.equal(g.players[1].abilityUsed, true);
});

test("Exterminador mata al Demonio y falla contra no Demonio", () => {
  const g = game8();
  setRoles(g, [
    "slayer",
    "chef",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.phase = "day";
  g.day.closed = false;
  useSlayer(g, g.players[0].id, g.players[7].id);
  assert.equal(g.outcome.winner, "good");
  const g2 = game8();
  setRoles(g2, [
    "slayer",
    "chef",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g2.phase = "day";
  g2.day.closed = false;
  assert.equal(useSlayer(g2, g2.players[0].id, g2.players[1].id).died, false);
  assert.equal(g2.players[0].abilityUsed, true);
});

test("Exterminador envenenado falla y no puede intentarlo de nuevo", () => {
  const g = game8();
  setRoles(g, [
    "slayer",
    "chef",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.phase = "day";
  g.day.closed = false;
  g.players[0].poisoned = true;
  assert.equal(useSlayer(g, g.players[0].id, g.players[7].id).died, false);
  assert.throws(
    () => useSlayer(g, g.players[0].id, g.players[7].id),
    /ya se usó/,
  );
});

test("Santo muerto de noche no termina la partida", () => {
  const g = game8();
  g.players[0].character = "saint";
  g.players[0].perceivedCharacter = "saint";
  killPlayer(g, g.players[0].id, "demon_attack");
  assert.equal(g.outcome, null);
});

test("Mujer Escarlata no transforma por debajo de cinco vivos", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "scarlet_woman",
    "chef",
    "empath",
    "monk",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  [2, 3, 4, 5].forEach((i) => {
    g.players[i].alive = false;
    g.players[i].ghostVote = true;
  });
  killPlayer(g, g.players[0].id, "execution");
  assert.equal(g.outcome.winner, "good");
  assert.equal(g.players[1].character, "scarlet_woman");
});

test("Mujer Escarlata tiene prioridad en starpass", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "scarlet_woman",
    "poisoner",
    "chef",
    "empath",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  const result = resolveImpAttack(g, g.players[0].id, g.players[0].id, {
    successorId: g.players[2].id,
  });
  assert.equal(result.successorId, g.players[1].id);
  assert.equal(g.players[1].character, "imp");
});

test("candidato con más votos reemplaza al anterior", () => {
  const g = game8();
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  addNomination(g, g.players[0].id, g.players[1].id, 4, []);
  addNomination(g, g.players[2].id, g.players[3].id, 5, []);
  assert.equal(executionLeader(g).nomineeId, g.players[3].id);
});

test("impide doble nominación por nominador y doble nominación del objetivo", () => {
  const g = game8();
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  addNomination(g, g.players[0].id, g.players[1].id, 0, []);
  assert.throws(
    () => addNomination(g, g.players[0].id, g.players[2].id, 0, []),
    /ya ha nominado/,
  );
  assert.throws(
    () => addNomination(g, g.players[2].id, g.players[1].id, 0, []),
    /ya ha sido nominado/,
  );
});

test("un muerto no puede nominar", () => {
  const g = game8();
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  g.players[0].alive = false;
  assert.throws(
    () => addNomination(g, g.players[0].id, g.players[1].id, 0, []),
    /Solo un jugador vivo/,
  );
});

test("Alcalde gana con exactamente tres vivos y ninguna ejecución", () => {
  const g = game8();
  g.players[0].character = "mayor";
  g.players[0].perceivedCharacter = "mayor";
  g.players.slice(3).forEach((p) => {
    p.alive = false;
    p.ghostVote = true;
  });
  g.phase = "day";
  g.day = {
    number: 3,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  closeDay(g);
  assert.equal(g.outcome.winner, "good");
});

test("dos vivos dan victoria al Mal tras una muerte no demoníaca", () => {
  const g = game8();
  g.players.slice(3).forEach((p) => {
    p.alive = false;
    p.ghostVote = true;
  });
  const victim = g.players.find((p) => p.alive && p.character !== "imp");
  killPlayer(g, victim.id, "demon_attack");
  assert.equal(g.outcome.winner, "evil");
});

test("al morir el Envenenador termina su veneno persistente", () => {
  const g = game8();
  const poisoner = g.players.find((p) => p.character === "poisoner");
  g.players[0].poisoned = true;
  killPlayer(g, poisoner.id, "execution");
  assert.equal(
    g.players.some((p) => p.poisoned),
    false,
  );
});

test("al comenzar una nueva noche expiran veneno y protección", () => {
  const g = game8();
  g.round = 2;
  g.players[0].poisoned = true;
  g.players[1].protected = true;
  beginNight(g);
  assert.equal(g.players[0].poisoned, false);
  assert.equal(g.players[1].protected, false);
});

test("la protección del Monje termina al amanecer, mientras el veneno continúa durante el día", () => {
  const g = game8();
  g.players[0].poisoned = true;
  g.players[1].protected = true;
  beginDay(g);
  assert.equal(g.players[0].poisoned, true);
  assert.equal(g.players[1].protected, false);
});

test("un Diablillo protegido no puede matarse ni hacer starpass", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "poisoner",
    "chef",
    "empath",
    "monk",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  g.players[0].protected = true;
  const result = resolveImpAttack(g, g.players[0].id, g.players[0].id, {
    successorId: g.players[1].id,
  });
  assert.equal(result.reason, "protected");
  assert.equal(g.players[0].alive, true);
  assert.equal(g.players[1].character, "poisoner");
});

test("el nuevo Diablillo recibe su personaje pero no vuelve a atacar esa noche", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "poisoner",
    "chef",
    "empath",
    "monk",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  g.phase = "night";
  g.night = { number: 2, stepIndex: 0, completed: [] };
  const oldImpStep = `imp-${g.players[0].id}`;
  g.night.completed.push(oldImpStep);
  resolveImpAttack(g, g.players[0].id, g.players[0].id, {
    successorId: g.players[1].id,
  });
  const steps = nightSteps(g);
  assert.equal(
    steps.some((s) => s.roleId === "imp" && s.actorId === g.players[1].id),
    false,
  );
  assert.equal(
    steps.some(
      (s) => s.roleId === "new_demon_info" && s.actorId === g.players[1].id,
    ),
    true,
  );
});

test("un Esbirro envenenado que se convierte en Diablillo sigue envenenado", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "scarlet_woman",
    "poisoner",
    "chef",
    "empath",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  g.players[1].poisoned = true;
  resolveImpAttack(g, g.players[0].id, g.players[0].id, {
    successorId: g.players[1].id,
  });
  assert.equal(g.players[1].character, "imp");
  assert.equal(g.players[1].poisoned, true);
});

test("si el Envenenador se convierte en Diablillo, su veneno termina inmediatamente", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "poisoner",
    "chef",
    "empath",
    "monk",
    "butler",
    "washerwoman",
    "fortune_teller",
  ]);
  g.players[4].poisoned = true;
  resolveImpAttack(g, g.players[0].id, g.players[0].id, {
    successorId: g.players[1].id,
  });
  assert.equal(g.players[1].character, "imp");
  assert.equal(
    g.players.some((p) => p.poisoned),
    false,
  );
});

test("el Guardián muerto de noche distingue habilidad real de simulación por veneno", () => {
  const g = game8();
  const keeper = g.players[0];
  keeper.character = "ravenkeeper";
  keeper.perceivedCharacter = "ravenkeeper";
  g.phase = "night";
  g.night = { number: 2, stepIndex: 0, completed: [] };
  killPlayer(g, keeper.id, "demon_attack");
  assert.equal(keeper.ravenkeeperTriggered, true);
  assert.equal(
    nightSteps(g).some((s) => s.roleId === "ravenkeeper"),
    true,
  );
  const g2 = game8();
  const poisoned = g2.players[0];
  poisoned.character = "ravenkeeper";
  poisoned.perceivedCharacter = "ravenkeeper";
  poisoned.poisoned = true;
  g2.phase = "night";
  g2.night = { number: 2, stepIndex: 0, completed: [] };
  killPlayer(g2, poisoned.id, "demon_attack");
  assert.equal(poisoned.ravenkeeperTriggered, false);
  assert.equal(
    nightSteps(g2).some((s) => s.roleId === "ravenkeeper"),
    true,
  );
});

test("la Virgen ejecuta antes de votar, conserva votos de muertos y pasa a la noche", () => {
  const g = game8();
  setRoles(g, [
    "chef",
    "virgin",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  g.players[7].alive = false;
  g.players[7].ghostVote = true;
  const result = addNomination(g, g.players[0].id, g.players[1].id, 1, [
    g.players[7].id,
  ]);
  assert.equal(result.nomination.votes, 0);
  assert.equal(g.players[7].ghostVote, true);
  assert.equal(g.phase, "night");
  assert.equal(g.round, 2);
});

test("la previsualización de la Virgen permite bloquear el voto antes de contarlo", () => {
  const g = game8();
  setRoles(g, [
    "chef",
    "virgin",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  const preview = previewVirginNomination(g, g.players[0].id, g.players[1].id);
  assert.equal(preview.virginFirstNomination, true);
  assert.equal(preview.virginTriggers, true);
  const outsider = game8();
  setRoles(outsider, [
    "butler",
    "virgin",
    "chef",
    "empath",
    "monk",
    "fortune_teller",
    "poisoner",
    "imp",
  ]);
  outsider.phase = "day";
  outsider.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  assert.equal(
    previewVirginNomination(
      outsider,
      outsider.players[0].id,
      outsider.players[1].id,
    ).virginTriggers,
    false,
  );
});

test("noche y día nuevos inicializan los estados de conducción", () => {
  const g = game8();
  beginNight(g);
  assert.equal(g.night.preflightConfirmed, false);
  beginDay(g);
  assert.equal(g.day.stage, "conversation");
  assert.equal(g.day.pendingNomination, null);
});

test("la validez de una votación conserva el umbral que había al contarla", () => {
  const g = game8();
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  addNomination(g, g.players[0].id, g.players[1].id, 3, []);
  assert.equal(g.day.nominations[0].qualified, false);
  g.players[7].alive = false;
  g.players[6].alive = false;
  assert.equal(executionLeader(g).nomineeId, null);
});

test("un Exterminador muerto no puede usar la habilidad", () => {
  const g = game8();
  setRoles(g, [
    "slayer",
    "chef",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.phase = "day";
  g.day.closed = false;
  g.players[0].alive = false;
  assert.throws(() => useSlayer(g, g.players[0].id, g.players[7].id), /muerto/);
});

test("al morir el Monje termina inmediatamente su protección", () => {
  const g = game8();
  const monk = g.players.find((p) => p.character === "monk");
  g.players[0].protected = true;
  killPlayer(g, monk.id, "demon_attack");
  assert.equal(
    g.players.some((p) => p.protected),
    false,
  );
});

test("Espía y Recluso solo se registran en los equipos permitidos y pierden esa opción envenenados", () => {
  const g = game8();
  setRoles(g, [
    "spy",
    "recluse",
    "chef",
    "empath",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  assert.equal(canRegisterAs(g.players[0], "washerwoman"), true);
  assert.equal(canRegisterAs(g.players[0], "imp"), false);
  assert.equal(canRegisterAs(g.players[1], "poisoner"), true);
  assert.equal(canRegisterAs(g.players[1], "washerwoman"), false);
  g.players[0].poisoned = true;
  g.players[1].poisoned = true;
  assert.equal(canRegisterAs(g.players[0], "washerwoman"), false);
  assert.equal(canRegisterAs(g.players[1], "poisoner"), false);
});

test("la información inicial sana exige un registro legal", () => {
  const g = game8();
  setRoles(g, [
    "spy",
    "recluse",
    "chef",
    "empath",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  assert.equal(
    startingInfoIsLegal(
      g,
      "washerwoman",
      [g.players[0].id, g.players[2].id],
      "mayor",
    ),
    true,
  );
  assert.equal(
    startingInfoIsLegal(
      g,
      "investigator",
      [g.players[1].id, g.players[2].id],
      "baron",
    ),
    true,
  );
  assert.equal(
    startingInfoIsLegal(
      g,
      "librarian",
      [g.players[2].id, g.players[3].id],
      "saint",
    ),
    false,
  );
});

test("los resultados posibles de Chef y Empática respetan registros independientes", () => {
  const g = game8();
  setRoles(g, [
    "spy",
    "recluse",
    "chef",
    "empath",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  assert.ok(possibleChefNumbers(g).includes(chefPairs(g)));
  const possible = possibleEmpathNumbers(g, g.players[2].id);
  assert.deepEqual(possible, [0, 1]);
});

test("la Adivina sana solo puede variar por un Recluso apto", () => {
  const g = game8();
  setRoles(g, [
    "fortune_teller",
    "recluse",
    "chef",
    "empath",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.players.forEach((p) => {
    p.redHerring = false;
  });
  assert.deepEqual(
    possibleFortuneAnswers(g, [g.players[1].id, g.players[2].id]),
    [false, true],
  );
  g.players[1].poisoned = true;
  assert.deepEqual(
    possibleFortuneAnswers(g, [g.players[1].id, g.players[2].id]),
    [false],
  );
  assert.deepEqual(
    possibleFortuneAnswers(g, [g.players[7].id, g.players[2].id]),
    [true],
  );
});

test("un Espía envenenado no activa a la Virgen como Aldeano", () => {
  const g = game8();
  setRoles(g, [
    "spy",
    "virgin",
    "chef",
    "empath",
    "monk",
    "fortune_teller",
    "washerwoman",
    "imp",
  ]);
  g.players[0].poisoned = true;
  g.phase = "day";
  g.day = {
    number: 1,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    closed: false,
  };
  const result = addNomination(g, g.players[0].id, g.players[1].id, 0, [], {
    spyRegistersTownsfolk: true,
  });
  assert.equal(result.virginTriggered, false);
  assert.equal(g.players[0].alive, true);
});

test("un Recluso envenenado no puede morir por el disparo del Exterminador", () => {
  const g = game8();
  setRoles(g, [
    "slayer",
    "recluse",
    "chef",
    "empath",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.players[1].poisoned = true;
  g.phase = "day";
  g.day.closed = false;
  const result = useSlayer(g, g.players[0].id, g.players[1].id, true);
  assert.equal(result.died, false);
  assert.equal(g.players[1].alive, true);
});

test("el orden nocturno completo coincide con la hoja de Trouble Brewing", () => {
  const roles = [
    "washerwoman",
    "librarian",
    "investigator",
    "chef",
    "empath",
    "fortune_teller",
    "undertaker",
    "monk",
    "ravenkeeper",
    "butler",
    "drunk",
    "poisoner",
    "spy",
    "scarlet_woman",
    "imp",
  ];
  const names = Array.from({ length: 15 }, (_, i) => `P${i + 1}`);
  const g = createGame(names, roles, { ...deterministic, secretDeal: false });
  g.phase = "night";
  g.players.find((p) => p.character === "drunk").perceivedCharacter = "soldier";
  assert.deepEqual(
    nightSteps(g).map((s) => s.roleId),
    [
      "minion_info",
      "demon_info",
      "poisoner",
      "washerwoman",
      "librarian",
      "investigator",
      "chef",
      "empath",
      "fortune_teller",
      "butler",
      "spy",
    ],
  );
  g.night = { number: 2, stepIndex: 0, completed: [] };
  g.day.executionCausedDeath = true;
  const keeper = g.players.find((p) => p.character === "ravenkeeper");
  keeper.alive = false;
  keeper.diedThisNight = true;
  keeper.ravenkeeperTriggered = true;
  assert.deepEqual(
    nightSteps(g).map((s) => s.roleId),
    [
      "poisoner",
      "monk",
      "imp",
      "ravenkeeper",
      "empath",
      "fortune_teller",
      "undertaker",
      "butler",
      "spy",
    ],
  );
});

test("el Alcalde protegido no redirige un ataque que no lo mataría", () => {
  const g = game8();
  setRoles(g, [
    "mayor",
    "chef",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.phase = "night";
  const [mayor, other] = g.players;
  mayor.protected = true;
  const result = resolveImpAttack(g, g.players[7].id, mayor.id, {
    redirectId: other.id,
  });
  assert.equal(result.died, false);
  assert.equal(result.reason, "protected");
  assert.equal(mayor.alive, true);
  assert.equal(other.alive, true);
});

test("una nominación con votos imposibles se rechaza sin cambiar la partida", () => {
  const g = game8();
  beginDay(g);
  for (const votes of [-1, 1.5, 9, NaN, Infinity]) {
    const before = JSON.stringify(g);
    assert.throws(() =>
      addNomination(g, g.players[0].id, g.players[1].id, votes),
    );
    assert.equal(JSON.stringify(g), before);
  }
  const before = JSON.stringify(g);
  assert.throws(() => addNomination(g, g.players[0].id, "inexistente", 0));
  assert.equal(JSON.stringify(g), before);
});

test("el Narrador puede elegir al Recluso sano para el pase y conserva su alineamiento", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "poisoner",
    "recluse",
    "empath",
    "monk",
    "butler",
    "chef",
    "fortune_teller",
  ]);
  g.phase = "night";
  const result = resolveImpAttack(g, g.players[0].id, g.players[0].id, {
    successorId: g.players[2].id,
  });
  assert.equal(result.successorId, g.players[2].id);
  assert.equal(g.players[2].character, "imp");
  assert.equal(g.players[2].alignment, "good");
  assert.equal(g.outcome, null);
});

test("un Recluso envenenado no puede recibir el pase por registro", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "poisoner",
    "recluse",
    "empath",
    "monk",
    "butler",
    "chef",
    "fortune_teller",
  ]);
  g.phase = "night";
  g.players[2].poisoned = true;
  const before = JSON.stringify(g);
  assert.throws(() =>
    resolveImpAttack(g, g.players[0].id, g.players[0].id, {
      successorId: g.players[2].id,
    }),
  );
  assert.equal(JSON.stringify(g), before);
});

test("un amo muerto es legal y el diagnóstico no borra su marcador", () => {
  const g = game8();
  setRoles(g, [
    "butler",
    "chef",
    "empath",
    "fortune_teller",
    "monk",
    "washerwoman",
    "poisoner",
    "imp",
  ]);
  g.players[1].alive = false;
  g.players[1].ghostVote = true;
  g.players[0].masterId = g.players[1].id;
  assert.equal(
    diagnoseGame(g).some((item) => item.id === "invalid-master"),
    false,
  );
  applyDiagnosticFix(g, "clear-invalid-masters");
  assert.equal(g.players[0].masterId, g.players[1].id);
});

test("el Alcalde puede redirigir el ataque al Diablillo y provocar un pase", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "poisoner",
    "mayor",
    "empath",
    "monk",
    "butler",
    "chef",
    "fortune_teller",
  ]);
  g.phase = "night";
  const result = resolveImpAttack(g, g.players[0].id, g.players[2].id, {
    redirectId: g.players[0].id,
  });
  assert.equal(result.successorId, g.players[1].id);
  assert.equal(g.players[0].alive, false);
  assert.equal(g.players[1].character, "imp");
  assert.equal(g.players[2].alive, true);
  assert.equal(g.outcome, null);
});

test("si el Alcalde redirige la muerte al Guardián, este despierta de inmediato", () => {
  const g = game8();
  setRoles(g, [
    "imp",
    "poisoner",
    "mayor",
    "ravenkeeper",
    "monk",
    "butler",
    "chef",
    "fortune_teller",
  ]);
  beginNight(g);
  g.round = 2;
  g.night.number = 2;
  const [imp, , mayor, ravenkeeper] = g.players;
  assert.equal(
    resolveImpAttack(g, imp.id, mayor.id, { redirectId: ravenkeeper.id }).died,
    true,
  );
  assert.equal(mayor.alive, true);
  assert.equal(ravenkeeper.ravenkeeperTriggered, true);
  assert.ok(
    nightSteps(g).some(
      (step) =>
        step.roleId === "ravenkeeper" && step.actorId === ravenkeeper.id,
    ),
  );
});

test("la Virgen no ejecuta al Borracho que cree ser Aldeano y gasta su primera nominación", () => {
  const g = game8();
  setRoles(g, [
    "drunk",
    "virgin",
    "empath",
    "fortune_teller",
    "monk",
    "butler",
    "poisoner",
    "imp",
  ]);
  g.players[0].perceivedCharacter = "chef";
  beginDay(g);
  const result = addNomination(g, g.players[0].id, g.players[1].id, 0);
  assert.equal(result.virginTriggered, false);
  assert.equal(g.players[0].alive, true);
  assert.equal(g.players[1].abilityUsed, true);
});
