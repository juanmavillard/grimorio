import { addHistory } from "./events.js";
import { derivedReminders } from "./read-models.js";
import { uid, clone } from "./utils.js";
import * as tbDayPolicy from "../scripts/trouble-brewing/day-policy.js";
import * as bmrDayPolicy from "../scripts/bad-moon-rising/day-policy.js";
import * as snvDayPolicy from "../scripts/sects-and-violets/day-policy.js";
import * as tbAbilityPolicy from "../scripts/trouble-brewing/ability-policy.js";
import * as bmrAbilityPolicy from "../scripts/bad-moon-rising/ability-policy.js";
import * as snvAbilityPolicy from "../scripts/sects-and-violets/ability-policy.js";
import * as tbDeathPolicy from "../scripts/trouble-brewing/death-policy.js";
import * as bmrDeathPolicy from "../scripts/bad-moon-rising/death-policy.js";
import * as snvDeathPolicy from "../scripts/sects-and-violets/death-policy.js";
import * as tbSetupPolicy from "../scripts/trouble-brewing/setup-policy.js";
import * as bmrSetupPolicy from "../scripts/bad-moon-rising/setup-policy.js";
import * as snvSetupPolicy from "../scripts/sects-and-violets/setup-policy.js";
import * as tbNightPolicy from "../scripts/trouble-brewing/night-policy.js";
import * as bmrNightPolicy from "../scripts/bad-moon-rising/night-policy.js";
import * as snvNightPolicy from "../scripts/sects-and-violets/night-policy.js";
import { createTroubleBrewingRules } from "../scripts/trouble-brewing/rules.js";
import { createBadMoonRisingRules } from "../scripts/bad-moon-rising/rules.js";
import { createSectsVioletsRules } from "../scripts/sects-and-violets/rules.js";
import { createTroubleBrewingInformation } from "../scripts/trouble-brewing/information.js";
import { createBadMoonRisingInformation } from "../scripts/bad-moon-rising/information.js";
import { createSectsVioletsInformation } from "../scripts/sects-and-violets/information.js";
import {
  getScript,
  SCRIPT_HANDLERS,
  scriptForGame,
  TROUBLE_BREWING_SCRIPT,
} from "./scripts.js";

const DAY_POLICIES = Object.freeze({
  trouble_brewing: tbDayPolicy,
  bad_moon_rising: bmrDayPolicy,
  sects_and_violets: snvDayPolicy,
});
const ABILITY_POLICIES = Object.freeze({
  trouble_brewing: tbAbilityPolicy,
  bad_moon_rising: bmrAbilityPolicy,
  sects_and_violets: snvAbilityPolicy,
});
const DEATH_POLICIES = Object.freeze({
  trouble_brewing: tbDeathPolicy,
  bad_moon_rising: bmrDeathPolicy,
  sects_and_violets: snvDeathPolicy,
});
const SETUP_POLICIES = Object.freeze({
  trouble_brewing: tbSetupPolicy,
  bad_moon_rising: bmrSetupPolicy,
  sects_and_violets: snvSetupPolicy,
});
const NIGHT_POLICIES = Object.freeze({
  trouble_brewing: tbNightPolicy,
  bad_moon_rising: bmrNightPolicy,
  sects_and_violets: snvNightPolicy,
});

export { uid, clone } from "./utils.js";
export const character = (id, scriptId = TROUBLE_BREWING_SCRIPT.id) =>
  getScript(scriptId)?.characterById[id];
export const isGoodTeam = (team) => team === "townsfolk" || team === "outsider";
export const defaultAlignment = (
  characterId,
  scriptId = TROUBLE_BREWING_SCRIPT.id,
) => (isGoodTeam(character(characterId, scriptId)?.team) ? "good" : "evil");

/** Proyección para enseñar el personaje sin revelar Borracho ni Lunático. */
export function privateDealProjection(state, playerId) {
  const player = state.players.find((item) => item.id === playerId);
  if (!player) throw new Error("No existe el jugador del reparto.");
  const identity = SETUP_POLICIES[
    state.scriptId || TROUBLE_BREWING_SCRIPT.id
  ]?.dealIdentity?.({ player, state }) || {
    id: player.perceivedCharacter,
    alignment: player.alignment,
  };
  const apparent = character(identity.id, state.scriptId);
  if (!apparent || (identity.mustBeDemon && apparent.team !== "demon"))
    throw new Error("Falta una identidad aparente válida para el reparto.");
  return {
    characterId: apparent.id,
    name: apparent.name,
    ability: apparent.ability,
    icon: apparent.icon,
    team: apparent.team,
    alignment: identity.alignment,
  };
}

const scriptCharacters = (scriptId = TROUBLE_BREWING_SCRIPT.id) =>
  getScript(scriptId)?.characters || [];
const scriptPlayerCounts = (scriptId = TROUBLE_BREWING_SCRIPT.id) =>
  getScript(scriptId)?.playerCounts || {};

function outsiderAdjustment(
  selectedIds = [],
  choices = {},
  scriptId = TROUBLE_BREWING_SCRIPT.id,
) {
  const script = getScript(scriptId);
  return script?.compositionAdjustment?.({ selectedIds, choices }) || 0;
}

export function expectedComposition(
  count,
  modifier = false,
  scriptId = TROUBLE_BREWING_SCRIPT.id,
) {
  getScript(scriptId);
  const base = scriptPlayerCounts(scriptId)[count];
  if (!base) return null;
  const [townsfolk, outsider, minion, demon] = base;
  // Compatibilidad con las llamadas antiguas: en Trouble Brewing el segundo
  // argumento era el booleano de Barón. Los guiones nuevos aceptan una opción
  // normalizada { selectedIds, choices }.
  const selectedIds = Array.isArray(modifier)
    ? modifier
    : modifier?.selectedIds ||
      SETUP_POLICIES[scriptId]?.legacyCompositionModifier?.(modifier) ||
      [];
  const choices = modifier?.choices || {};
  const delta = outsiderAdjustment(selectedIds, choices, scriptId);
  return {
    townsfolk: townsfolk - delta,
    outsider: outsider + delta,
    minion,
    demon,
  };
}

export function validateSetup(
  count,
  selectedIds,
  scriptId = TROUBLE_BREWING_SCRIPT.id,
  choices = {},
) {
  const errors = [];
  const script = getScript(scriptId);
  if (!script)
    return {
      valid: false,
      errors: ["El guion seleccionado no está disponible."],
      expected: null,
      actual: {},
    };
  if (!scriptPlayerCounts(scriptId)[count])
    errors.push(
      `${script.name} admite de ${script.setup.minPlayers} a ${script.setup.maxPlayers} jugadores sin Viajeros.`,
    );
  if (new Set(selectedIds).size !== selectedIds.length)
    errors.push("No puede repetirse un personaje.");
  const expected = expectedComposition(
    count,
    { selectedIds, choices },
    scriptId,
  );
  if (!expected) return { valid: false, errors, expected: null, actual: {} };
  const actual = { townsfolk: 0, outsider: 0, minion: 0, demon: 0 };
  selectedIds.forEach((id) => {
    if (character(id, scriptId)) actual[character(id, scriptId).team] += 1;
    else errors.push(`Personaje desconocido: ${id}`);
  });
  for (const key of Object.keys(expected))
    if (actual[key] !== expected[key])
      errors.push(
        `${key}: ${actual[key]} seleccionados; hacen falta ${expected[key]}.`,
      );
  errors.push(
    ...(SETUP_POLICIES[scriptId]?.validateComposition?.({
      selectedIds,
      choices,
    }) || []),
  );
  if (expected.outsider < 0 || expected.townsfolk < 0)
    errors.push(
      "El ajuste de composición no es posible con este número de jugadores.",
    );
  if (selectedIds.length !== count)
    errors.push(
      `Hay ${selectedIds.length} personajes para ${count} jugadores.`,
    );
  return { valid: errors.length === 0, errors, expected, actual };
}

export function validateSetupDecisions(
  count,
  assignedIds,
  decisions = {},
  scriptId = TROUBLE_BREWING_SCRIPT.id,
) {
  const errors = [
    ...validateSetup(count, assignedIds, scriptId, decisions.setupChoices || {})
      .errors,
  ];
  const { drunkBelief = null, bluffs = [] } = decisions;
  errors.push(
    ...(SETUP_POLICIES[scriptId]?.validateDecisions?.({
      count,
      assignedIds,
      decisions,
      scriptId,
      character,
      getScript,
      expectedComposition,
      scriptCharacters,
      isGoodTeam,
    }) || []),
  );
  if (count >= 7) {
    if (bluffs.length !== 3 || new Set(bluffs).size !== 3)
      errors.push("Deben elegirse tres bluffs distintos.");
    if (
      bluffs.some(
        (id) =>
          assignedIds.includes(id) ||
          id === drunkBelief ||
          !isGoodTeam(character(id, scriptId)?.team),
      )
    )
      errors.push(
        "Los bluffs deben ser personajes buenos fuera de juego y distintos del personaje aparente del Borracho.",
      );
  } else if (bluffs.length)
    errors.push(
      "En partidas de 5–6 jugadores no se entregan bluffs al Demonio real.",
    );

  return { valid: errors.length === 0, errors };
}

export function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function randomRoleSet(
  count,
  random = Math.random,
  scriptId = TROUBLE_BREWING_SCRIPT.id,
) {
  const base = expectedComposition(count, false, scriptId);
  const characters = scriptCharacters(scriptId);
  const groups = Object.fromEntries(
    ["townsfolk", "outsider", "minion", "demon"].map((team) => [
      team,
      shuffle(
        characters.filter((c) => c.team === team),
        random,
      ),
    ]),
  );
  const minions = groups.minion.slice(0, base.minion).map((c) => c.id);
  const demon = groups.demon[0]?.id;
  const comp = expectedComposition(
    count,
    {
      selectedIds: [...minions, demon],
      choices: SETUP_POLICIES[scriptId]?.defaultCompositionChoices?.() || {},
    },
    scriptId,
  );
  return [
    ...groups.townsfolk.slice(0, comp.townsfolk).map((c) => c.id),
    ...groups.outsider.slice(0, comp.outsider).map((c) => c.id),
    ...minions,
    demon,
  ];
}

export function createGame(names, selectedIds, options = {}) {
  const scriptId = options.scriptId || TROUBLE_BREWING_SCRIPT.id;
  const script = getScript(scriptId);
  const setupChoices = options.setupChoices || {};
  const check = validateSetup(
    names.length,
    selectedIds,
    scriptId,
    setupChoices,
  );
  if (!check.valid) throw new Error(check.errors.join(" "));
  const roles = shuffle(selectedIds, options.random);
  const inPlay = new Set(selectedIds);
  const unusedTownsfolk = script.characters
    .filter((c) => c.team === "townsfolk" && !inPlay.has(c.id))
    .map((c) => c.id);
  const players = names.map((name, seat) => {
    const role = roles[seat];
    const perceivedCharacter =
      SETUP_POLICIES[scriptId]?.apparentRole?.({
        role,
        options,
        inPlay,
        character,
        scriptId,
        shuffle,
        unusedTownsfolk,
      }) || role;
    return {
      id: uid(),
      name: name.trim() || `Jugador ${seat + 1}`,
      seat,
      character: role,
      perceivedCharacter,
      alignment: defaultAlignment(role, scriptId),
      alive: true,
      ghostVote: false,
      poisoned: false,
      protected: false,
      redHerring: false,
      masterId: null,
      abilityUsed: false,
      diedThisNight: false,
      notes: "",
    };
  });
  const goodNotInPlay = script.characters.filter(
    (c) =>
      isGoodTeam(c.team) &&
      !inPlay.has(c.id) &&
      c.id !== SETUP_POLICIES[scriptId]?.excludedBluffRole?.(players),
  );
  const bluffs =
    names.length >= 7
      ? shuffle(goodNotInPlay, options.random)
          .slice(0, 3)
          .map((c) => c.id)
      : [];
  SETUP_POLICIES[scriptId]?.finishPlayers?.({
    players,
    shuffle,
    random: options.random,
  });
  const now = new Date().toISOString();
  const createdEvent = {
    id: uid(),
    at: now,
    phase: "setup",
    text: "Partida creada.",
    detail: "",
    event: {
      action: "game_created",
      actorId: null,
      targetId: null,
      automatic: true,
      rule: script.name,
      before: null,
      after: null,
    },
  };
  return {
    schemaVersion: 4,
    editionId: script.editionId,
    scriptId: script.id,
    id: uid(),
    title: options.title || `Partida de ${script.name}`,
    createdAt: now,
    updatedAt: now,
    phase: "assign",
    round: 1,
    outcome: null,
    players,
    bluffs,
    secretDeal: options.secretDeal !== false,
    selectedRoles: [...selectedIds],
    dealIndex: 0,
    setupPreset: options.preset
      ? {
          id: options.preset.id,
          title: options.preset.title,
          source: options.preset.source,
          customized: Boolean(options.preset.customized),
        }
      : null,
    setupChoices,
    reminders: [],
    deathLog: [],
    pendingEffects: [],
    lunaticSetup: options.lunaticSetup || null,
    night: { number: 1, stepIndex: 0, completed: [] },
    day: {
      number: 0,
      nominations: [],
      executedId: null,
      executionCausedDeath: false,
      deathOccurred: false,
      closed: false,
    },
    history: [createdEvent],
    events: [clone(createdEvent)],
  };
}

export function alivePlayers(state) {
  return state.players.filter((p) => p.alive);
}
// El Zombuul que registra como muerto cuenta como muerto para la plaza, votos,
// vecindad y mayoría, pero sigue vivo para la condición de dos vivos.
function victoryAlivePlayers(state) {
  return state.players.filter(
    (player) =>
      player.alive ||
      DEATH_POLICIES[state.scriptId || "trouble_brewing"]?.countsAsAlive?.(
        player,
      ),
  );
}
export function majority(state) {
  return Math.ceil(alivePlayers(state).length / 2);
}
export function getPlayer(state, id) {
  return state.players.find((p) => p.id === id);
}
export function actualRoleForNight(player) {
  return (
    Object.values(NIGHT_POLICIES)
      .map((policy) => policy.apparentNightRole?.(player))
      .find(Boolean) || player.character
  );
}

function finishDeferredTwinVictory(state) {
  return (
    DEATH_POLICIES[
      state.scriptId || "trouble_brewing"
    ]?.finishDeferredVictory?.({
      state,
      isSnv,
      character,
      getPlayer,
      hasAbility,
      addHistory,
    }) || false
  );
}
export function abilityRole(player) {
  return (
    Object.values(ABILITY_POLICIES)
      .map((policy) => policy.effectiveRole?.(player))
      .find(Boolean) || player?.character
  );
}
export function hasRoleAbility(player, roleId, state) {
  return abilityRole(player) === roleId && hasAbility(player, state);
}
export function roleAbilityUsed(player, roleId) {
  return Object.values(ABILITY_POLICIES).some((policy) =>
    policy.acquiredAbility?.(player, roleId),
  )
    ? snvAbilityPolicy.acquiredAbilityUsed(player)
    : Boolean(player?.abilityUsed);
}
export function markRoleAbilityUsed(player, roleId) {
  if (
    Object.values(ABILITY_POLICIES).some((policy) =>
      policy.acquiredAbility?.(player, roleId),
    )
  )
    snvAbilityPolicy.markAcquiredAbilityUsed(player);
  else player.abilityUsed = true;
}
export function hasAbility(player, state = null) {
  if (!player) return false;
  const policy = ABILITY_POLICIES[state?.scriptId];
  const alive =
    player.alive ||
    (state && policy?.aliveForAbility?.(player, state, character));
  // Las identidades aparentes se mantienen en jugadores heredados sin guion.
  const identityDisabled = Object.values(ABILITY_POLICIES).some((candidate) =>
    candidate.disabledIdentity?.(player),
  );
  return Boolean(
    alive &&
      !player.poisoned &&
      !identityDisabled &&
      !(state && policy?.disabled?.(player, state, character)),
  );
}

const isBmr = (state) => state?.scriptId === "bad_moon_rising";
const isSnv = (state) => state?.scriptId === "sects_and_violets";

function endPersistentEffects(state, player) {
  DEATH_POLICIES[state.scriptId || "trouble_brewing"]?.endPersistentEffects?.({
    state,
    player,
    actualRoleForNight,
    getPlayer,
    applySnvPassiveEffects,
  });
}

function resetCharacterUsage(player) {
  player.abilityUsed = false;
  Object.values(DEATH_POLICIES).forEach((policy) =>
    policy.resetCharacterUsage?.(player),
  );
}

export function aliveNeighbours(state, playerId) {
  const ordered = [...state.players].sort((a, b) => a.seat - b.seat);
  const index = ordered.findIndex((p) => p.id === playerId);
  if (index < 0 || ordered.length < 2) return [];
  const found = [];
  for (const direction of [-1, 1]) {
    for (let distance = 1; distance < ordered.length; distance++) {
      const candidate =
        ordered[
          (index + direction * distance + ordered.length) % ordered.length
        ];
      if (candidate.alive) {
        found.push(candidate);
        break;
      }
    }
  }
  return found;
}

/** Vecinos de S&V que buscan al Aldeano más cercano en cada sentido. A
 * diferencia de Empática, no saltan muertos: No Dashii y Vigormortis siguen
 * considerando a un Aldeano muerto como vecino y saltan otros equipos. */
function closestTownsfolkNeighbours(state, playerId) {
  const ordered = [...state.players].sort((a, b) => a.seat - b.seat);
  const index = ordered.findIndex((player) => player.id === playerId);
  if (index < 0) return [];
  const found = [];
  for (const direction of [-1, 1]) {
    for (let distance = 1; distance < ordered.length; distance += 1) {
      const candidate =
        ordered[
          (index + direction * distance + ordered.length) % ordered.length
        ];
      if (
        character(candidate.character, state.scriptId)?.team === "townsfolk"
      ) {
        found.push(candidate);
        break;
      }
    }
  }
  return [...new Map(found.map((player) => [player.id, player])).values()];
}

export const {
  chefPairs,
  empathNumber,
  fortuneAnswer,
  canRegisterAs,
  startingInfoIsLegal,
  possibleChefNumbers,
  possibleEmpathNumbers,
  possibleFortuneAnswers,
} = createTroubleBrewingInformation({
  aliveNeighbours,
  getPlayer,
  character,
  isGoodTeam,
});

export { addHistory };

/** Recordatorio privado reutilizable por cualquier guion. Los campos antiguos
 * siguen existiendo durante la transición para no romper Trouble Brewing. */
export function addReminder(state, reminder) {
  const record = {
    id: reminder.id || uid(),
    playerId: reminder.playerId || null,
    sourceRole: reminder.sourceRole || null,
    type: reminder.type || "custom",
    label: reminder.label || "Recordatorio",
    visibility: "private",
    duration: reminder.duration || "until_removed",
    data: clone(reminder.data || {}),
    createdRound: state.round,
    source: clone(
      reminder.source || {
        roleId: reminder.sourceRole || null,
        playerId: reminder.sourcePlayerId || null,
      },
    ),
    targetIds: [
      ...new Set(
        reminder.targetIds || (reminder.playerId ? [reminder.playerId] : []),
      ),
    ],
    status: reminder.status || "active",
    origin: "narrative",
  };
  (state.reminders ||= []).push(record);
  addHistory(
    state,
    `Recordatorio: ${record.label}.`,
    "Marcador privado añadido.",
    {
      action: "reminder_added",
      actorId: record.sourceRole,
      targetId: record.playerId,
      automatic: Boolean(reminder.automatic),
      rule: record.type,
      after: record,
    },
  );
  return record;
}

export function removeReminder(
  state,
  reminderId,
  reason = "El Narrador retiró el recordatorio.",
) {
  const record = (state.reminders || []).find((item) => item.id === reminderId);
  if (!record) return false;
  state.reminders = state.reminders.filter((item) => item.id !== reminderId);
  addHistory(state, `Recordatorio retirado: ${record.label}.`, reason, {
    action: "reminder_removed",
    targetId: record.playerId,
    automatic: false,
    rule: record.type,
    before: record,
  });
  return true;
}

export function activeReminders(state, playerId = null) {
  return [
    ...(state.reminders || []).filter(
      (record) =>
        !record.data?.migrated &&
        record.origin !== "derived" &&
        (!record.status || record.status === "active"),
    ),
    ...derivedReminders(state),
  ].filter((record) => playerId === null || record.playerId === playerId);
}

export function recordDeathAttempt(state, playerId, details = {}) {
  const player = getPlayer(state, playerId);
  const entry = {
    id: uid(),
    at: new Date().toISOString(),
    round: state.round,
    phase: state.phase,
    playerId,
    characterId: player?.character || null,
    team: character(player?.character, state.scriptId)?.team || null,
    cause: details.cause || "other",
    sourceId: details.sourceId || null,
    died: Boolean(details.died),
    preventedBy: details.preventedBy || null,
    reason: details.reason || null,
    automatic: Boolean(details.automatic),
    triggerIds: [...new Set(details.triggerIds || [])],
    resolution: details.resolution || (details.died ? "died" : "prevented"),
  };
  (state.deathLog ||= []).push(entry);
  if (player)
    addHistory(
      state,
      `${player.name}: intento de muerte ${entry.died ? "resuelto" : "evitado"}.`,
      entry.reason || entry.cause,
      {
        action: "death_attempt",
        actorId: entry.sourceId,
        targetId: playerId,
        automatic: entry.automatic,
        rule: entry.cause,
        after: entry,
      },
    );
  return entry;
}

export function outsiderDiedDuringPreviousDay(state) {
  const dayNumber = state.day?.number ?? state.round - 1;
  return (state.deathLog || []).some(
    (entry) =>
      entry.round === dayNumber &&
      entry.phase === "day" &&
      entry.died &&
      (entry.team ||
        character(
          entry.characterId || getPlayer(state, entry.playerId)?.character,
          state.scriptId,
        )?.team) === "outsider",
  );
}

/** Anuncios públicos de la noche actual. Conserva compatibilidad con
 * partidas antiguas que solo guardaban el marcador del jugador. */
export function nightDeathAnnouncements(state) {
  const night = state.night?.number ?? state.round;
  const ids = new Set(
    (state.deathLog || [])
      .filter(
        (entry) =>
          entry.phase === "night" &&
          entry.round === night &&
          (entry.died || entry.resolution === "registered_dead"),
      )
      .map((entry) => entry.playerId),
  );
  state.players
    .filter((player) => player.diedThisNight)
    .forEach((player) => ids.add(player.id));
  return state.players.filter((player) => ids.has(player.id) && !player.alive);
}

/** Decisiones que deben resolverse antes de continuar; los disparadores que
 * dependen de que un jugador conozca su muerte esperan al anuncio público. */
export function blockingPendingEffects(state, transition = "next") {
  // Los guardados antiguos pueden contener estos efectos incluso en otro guion.
  return (state.pendingEffects || []).filter(
    (effect) =>
      effect.status === "pending" &&
      Object.values(DEATH_POLICIES).some((policy) =>
        policy.blocksEffect?.(effect, state, transition),
      ),
  );
}

/** Deja una decisión explícita y privada para que el Narrador la resuelva. */
export function queueEffect(state, effect) {
  const record = {
    id: effect.id || uid(),
    type: effect.type || "custom",
    label: effect.label || "Decisión pendiente",
    source: clone(
      effect.source || {
        roleId: effect.sourceRole || null,
        playerId: effect.sourcePlayerId || null,
      },
    ),
    targetIds: [
      ...new Set(
        effect.targetIds || (effect.playerId ? [effect.playerId] : []),
      ),
    ],
    data: clone(effect.data || {}),
    status: "pending",
    private: true,
    createdRound: state.round,
    createdAt: new Date().toISOString(),
  };
  (state.pendingEffects ||= []).push(record);
  addHistory(
    state,
    `Decisión pendiente: ${record.label}.`,
    "Requiere confirmación del Narrador.",
    {
      action: "effect_queued",
      actorId: record.source.playerId,
      targetId: record.targetIds[0] || null,
      automatic: false,
      rule: record.type,
      after: record,
    },
  );
  return record;
}

export function resolveEffect(state, effectId, resolution = {}) {
  const effect = (state.pendingEffects || []).find(
    (item) => item.id === effectId && item.status === "pending",
  );
  if (!effect) return null;
  effect.status = "resolved";
  effect.resolution = clone(resolution);
  effect.resolvedAt = new Date().toISOString();
  addHistory(
    state,
    `Decisión resuelta: ${effect.label}.`,
    resolution.note || "Confirmada por el Narrador.",
    {
      action: "effect_resolved",
      actorId: effect.source?.playerId || null,
      targetId: effect.targetIds?.[0] || null,
      automatic: false,
      rule: effect.type,
      before: null,
      after: effect,
    },
  );
  return effect;
}

/** Cambio común y trazable. Cada guion decide cuándo puede invocarlo. */
export function changeCharacter(state, playerId, nextCharacter, options = {}) {
  const player = getPlayer(state, playerId);
  const next = character(nextCharacter, state.scriptId);
  if (!player || !next)
    throw new Error("El jugador o personaje de destino no existe.");
  const before = {
    character: player.character,
    perceivedCharacter: player.perceivedCharacter,
    alignment: player.alignment,
  };
  endPersistentEffects(state, player);
  player.character = nextCharacter;
  player.perceivedCharacter = options.perceivedCharacter || nextCharacter;
  if (options.alignment) player.alignment = options.alignment;
  if (options.resetUsage !== false) resetCharacterUsage(player);
  addHistory(
    state,
    `${player.name} cambia de personaje.`,
    options.reason || "Cambio confirmado por el Narrador.",
    {
      action: "character_changed",
      actorId: options.sourcePlayerId || null,
      targetId: playerId,
      automatic: Boolean(options.automatic),
      rule: options.rule || "Cambio de personaje",
      before,
      after: {
        character: player.character,
        perceivedCharacter: player.perceivedCharacter,
        alignment: player.alignment,
      },
    },
  );
  return player;
}

export function nightSteps(state) {
  const number = state.night.number;
  const script = scriptForGame(state) || TROUBLE_BREWING_SCRIPT;
  const order =
    number === 1 ? script.nightOrder.first : script.nightOrder.other;
  const steps = [];
  const firstNightInfo =
    number === 1
      ? script.firstNightInfo || { minionBefore: true, demonBefore: true }
      : null;
  if (number === 1 && state.players.length >= 7) {
    if (firstNightInfo.minionBefore)
      steps.push({
        id: "minion_info",
        roleId: "minion_info",
        actorId: null,
        name: "Información de Esbirros",
      });
    if (firstNightInfo.demonBefore)
      steps.push({
        id: "demon_info",
        roleId: "demon_info",
        actorId: null,
        name: "Información del Demonio",
      });
  }
  for (const roleId of order) {
    const nightPolicy = NIGHT_POLICIES[state.scriptId || "trouble_brewing"];
    const policyContext = {
      state,
      roleId,
      number,
      alivePlayers,
      outsiderDiedDuringPreviousDay,
      character,
      roleAbilityUsed,
      actualRoleForNight,
    };
    steps.push(
      ...(nightPolicy?.extraSteps?.({ ...policyContext, position: "before" }) ||
        []),
    );
    // Los vivos se despiertan aunque estén borrachos o envenenados para
    // mantener la ficción. Los muertos solo actúan si una regla les conserva
    // la habilidad (Esbirros de Vigormortis o Zombuul que registra muerto).
    const actors = state.players.filter(
      (p) =>
        actualRoleForNight(p) === roleId &&
        (p.alive ||
          hasAbility(p, state) ||
          state.night.completed.includes(`${roleId}-${p.id}`) ||
          nightPolicy?.extraDeadActor?.({ ...policyContext, actor: p })),
    );
    for (const actor of actors) {
      const stepId = `${roleId}-${actor.id}`;
      const alreadyCompleted = state.night.completed.includes(stepId);
      if (
        nightPolicy?.skipNightStep?.({
          ...policyContext,
          actor,
          alreadyCompleted,
        })
      )
        continue;
      if (
        !nightPolicy?.permitsDeadActor?.(roleId) &&
        !actor.alive &&
        !hasAbility(actor, state) &&
        !alreadyCompleted
      )
        continue;
      steps.push({
        id: stepId,
        roleId,
        actorId: actor.id,
        name: character(roleId, script.id).name,
      });
    }
    steps.push(
      ...(nightPolicy?.extraSteps?.({ ...policyContext, position: "after" }) ||
        []),
    );
    if (firstNightInfo?.minionAfter === roleId)
      steps.push({
        id: "minion_info",
        roleId: "minion_info",
        actorId: null,
        name: "Información de Esbirros",
      });
    if (firstNightInfo?.demonAfter === roleId)
      steps.push({
        id: "demon_info",
        roleId: "demon_info",
        actorId: null,
        name: "Información del Demonio",
      });
  }
  return steps;
}

export function beginNight(state) {
  state.phase = "night";
  state.players.forEach((p) => {
    if (
      !NIGHT_POLICIES[
        state.scriptId || "trouble_brewing"
      ]?.keepsPoisonAtDusk?.()
    )
      p.poisoned = false;
    p.protected = false;
    p.diedThisNight = false;
  });
  state.night = {
    number: state.round,
    stepIndex: 0,
    completed: [],
    preflightConfirmed: false,
  };
  state.reminders = (state.reminders || []).filter(
    (record) => record.duration !== "until_dusk",
  );
  NIGHT_POLICIES[state.scriptId || "trouble_brewing"]?.onDusk?.(state, {
    refreshBmrDrunkenness,
  });
  applySnvPassiveEffects(state);
  addHistory(
    state,
    `Comienza la noche ${state.round}.`,
    state.scriptId === "bad_moon_rising"
      ? "Revisa venenos y muertes diferidas de Bad Moon Rising."
      : "Al anochecer termina el veneno de la noche anterior.",
    { action: "begin_night", automatic: true, rule: "Estados al anochecer" },
  );
}

export function beginDay(state) {
  state.phase = "day";
  state.players.forEach((p) => {
    p.protected = false;
  });
  DAY_POLICIES[state.scriptId || "trouble_brewing"]?.onDawn?.({
    state,
    alivePlayers,
  });
  state.day = {
    number: state.round,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    deathOccurred: false,
    closed: false,
    stage: "conversation",
    pendingNomination: null,
  };
  state.reminders = (state.reminders || []).filter(
    (record) => record.duration !== "until_dawn",
  );
  addHistory(
    state,
    `Comienza el día ${state.round}.`,
    `La protección del Monje termina al amanecer. ${alivePlayers(state).length} vivos; mayoría ${majority(state)}.`,
    { action: "begin_day", automatic: true, rule: "Estados al amanecer" },
  );
}

export function killPlayer(state, playerId, cause = "other", options = {}) {
  const player = getPlayer(state, playerId);
  if (!player) return { died: false, reason: "invalid_player" };
  const deathPolicy = DEATH_POLICIES[state.scriptId || "trouble_brewing"];
  const executionOutcome = deathPolicy?.executionSnapshot?.({
    state,
    player,
    playerId,
    cause,
    getPlayer,
    hasAbility,
    addHistory,
  });
  if (!player.alive && !deathPolicy?.canAttemptDead?.(player)) {
    executionOutcome?.();
    recordDeathAttempt(state, playerId, {
      cause,
      sourceId: options.sourceId,
      died: false,
      resolution: "already_dead",
      reason: "El jugador ya estaba muerto.",
    });
    return { died: false, reason: "already_dead" };
  }
  const abilityWasActive = hasAbility(player, state);
  const prevention = deathPolicy?.preventDeath?.({
    state,
    player,
    cause,
    options,
    bmrDeathPrevention,
    recordBmrPrevention,
  });
  if (prevention) return prevention;
  if (
    cause === "demon_attack" ||
    cause === "night_redirect" ||
    cause === "imp_self"
  ) {
    if (options.demonPoisoned) {
      recordDeathAttempt(state, playerId, {
        cause,
        died: false,
        preventedBy: "demon_poisoned",
        reason: "El Demonio no tiene habilidad.",
      });
      return { died: false, reason: "demon_poisoned" };
    }
    if (player.protected) {
      recordDeathAttempt(state, playerId, {
        cause,
        died: false,
        preventedBy: "protection",
        reason: "Protección activa.",
      });
      return { died: false, reason: "protected" };
    }
    const attackPrevention = deathPolicy?.attackPrevention?.({
      state,
      player,
      hasAbility,
    });
    if (attackPrevention) {
      recordDeathAttempt(state, playerId, {
        cause,
        died: false,
        preventedBy: attackPrevention.preventedBy,
        reason: attackPrevention.message,
      });
      return { died: false, reason: attackPrevention.reason };
    }
  }
  deathPolicy?.validateAttempt?.({
    state,
    player,
    playerId,
    cause,
    options,
    hasAbility,
    alivePlayers,
    character,
  });
  const diedAtNight = state.phase === "night";
  deathPolicy?.prepareDeath?.({ state, player, diedAtNight, abilityWasActive });
  const specialDeath = deathPolicy?.specialDeath?.({
    state,
    player,
    playerId,
    cause,
    options,
    abilityWasActive,
    diedAtNight,
    recordDeathAttempt,
    addHistory,
    resolveDemonDeath,
  });
  if (specialDeath) return specialDeath;
  player.alive = false;
  player.ghostVote = true;
  player.diedThisNight = diedAtNight;
  if (state.phase === "day") state.day.deathOccurred = true;
  executionOutcome?.();
  const source = options.sourceId ? getPlayer(state, options.sourceId) : null;
  deathPolicy?.onDeathMarked?.({
    state,
    player,
    source,
    alivePlayers,
    character,
  });
  endPersistentEffects(state, player);
  deathPolicy?.afterCleanup?.({
    state,
    player,
    applySnvPassiveEffects,
    refreshBmrDrunkenness,
  });
  recordDeathAttempt(state, playerId, {
    cause,
    sourceId: options.sourceId,
    died: true,
    automatic: true,
    reason: cause,
  });
  addHistory(
    state,
    `${player.name} muere.`,
    cause === "execution"
      ? "Por ejecución."
      : diedAtNight
        ? "Durante la noche."
        : "Durante el día.",
    { action: "death", targetId: player.id, automatic: true, rule: cause },
  );
  deathPolicy?.afterDeath?.({
    state,
    player,
    playerId,
    cause,
    options,
    abilityWasActive,
    getPlayer,
    character,
    abilityRole,
    queueEffect,
    resolveMinstrel,
    hasAbility,
    killPlayer,
  });
  if (character(player.character, state.scriptId)?.team === "demon") {
    const anotherLivingDemon = state.players.some(
      (candidate) =>
        candidate.alive &&
        character(candidate.character, state.scriptId)?.team === "demon",
    );
    const deferred = deathPolicy?.deferDemonVictory?.({
      state,
      playerId,
      cause,
      anotherLivingDemon,
      hasAbility,
      getPlayer,
      addHistory,
      uid,
    });
    if (!state.outcome && !deferred && !anotherLivingDemon) {
      state.outcome = { winner: "good", reason: "El Demonio ha muerto." };
      state.phase = "ended";
      addHistory(state, "Victoria del Bien.", state.outcome.reason, {
        action: "victory",
        automatic: true,
        rule: "Demonio muerto",
      });
    }
    return { died: true, reason: "demon_review" };
  }
  finishDeferredTwinVictory(state);
  const specialOutcome = deathPolicy?.afterNonDemonDeath?.({
    state,
    player,
    cause,
    abilityWasActive,
    addHistory,
  });
  if (
    !specialOutcome &&
    !state.outcome &&
    victoryAlivePlayers(state).length <= 2 &&
    !deathPolicy?.blocksTwoAliveVictory?.(state)
  ) {
    state.outcome = {
      winner: "evil",
      reason: "Solo quedan 2 jugadores vivos.",
    };
    state.phase = "ended";
    addHistory(state, "Victoria del Mal.", state.outcome.reason);
  }
  return { died: true, reason: "killed" };
}

export const { chambermaidWakeCount } = createBadMoonRisingInformation({
  getPlayer,
  nightSteps,
});
export const {
  vortoxForcesFalseInformation,
  clockmakerNumber,
  flowergirlAnswer,
  townCrierAnswer,
  oracleNumber,
  seamstressSameAlignment,
} = createSectsVioletsInformation({ isSnv, hasAbility, character, getPlayer });

export function nominationEligibility(state, nominatorId, nomineeId) {
  const nominator = getPlayer(state, nominatorId),
    nominee = getPlayer(state, nomineeId);
  if (state.phase !== "day" || state.day.closed)
    throw new Error(
      "Las nominaciones solo pueden registrarse durante un día abierto.",
    );
  const pending = state.day.pendingNomination;
  const killedDuringNomination = DAY_POLICIES[
    state.scriptId || "trouble_brewing"
  ]?.permitsDeadNominator?.({ pending, nominatorId, nomineeId });
  if (!nominator?.alive && !killedDuringNomination)
    throw new Error("Solo un jugador vivo puede nominar.");
  if (!nominee) throw new Error("El jugador nominado no existe.");
  if (state.day.nominations.some((n) => n.nominatorId === nominatorId))
    throw new Error("Ese jugador ya ha nominado hoy.");
  if (state.day.nominations.some((n) => n.nomineeId === nomineeId))
    throw new Error("Ese jugador ya ha sido nominado hoy.");
  return { nominator, nominee };
}

/** Registra los votos y consulta las excepciones de nominación del guion. */

export function addNomination(
  state,
  nominatorId,
  nomineeId,
  votes,
  voterIds = [],
  options = {},
) {
  const policy = DAY_POLICIES[state.scriptId || "trouble_brewing"];
  const preview =
    policy?.preview?.({
      state,
      nominatorId,
      nomineeId,
      options,
      previewVirginNomination,
    }) || nominationEligibility(state, nominatorId, nomineeId);
  const { nominator, nominee } = preview;
  const countedVoters = preview.skipVoting ? [] : voterIds;
  const countedVotes = preview.skipVoting ? 0 : Number(votes);
  if (
    !Number.isInteger(countedVotes) ||
    countedVotes < 0 ||
    countedVotes > state.players.length
  )
    throw new Error(
      "El número de votos debe ser un entero entre cero y el número de jugadores.",
    );
  if (new Set(countedVoters).size !== countedVoters.length)
    throw new Error(
      "Un jugador no puede votar dos veces en la misma votación.",
    );
  if (
    countedVoters.some((id) => {
      const voter = getPlayer(state, id);
      return !voter || (!voter.alive && !voter.ghostVote);
    })
  )
    throw new Error("Hay un voto de un jugador que no puede votar.");
  if (countedVoters.length && countedVotes !== countedVoters.length)
    throw new Error("El total no coincide con los votos individuales.");
  const threshold = majority(state);
  const nomination = {
    id: uid(),
    nominatorId,
    nomineeId,
    votes: countedVotes,
    voterIds: [...countedVoters],
    threshold,
    qualified: countedVotes >= threshold,
    at: new Date().toISOString(),
    demonVoted: countedVoters.some(
      (id) =>
        character(getPlayer(state, id)?.character, state.scriptId)?.team ===
        "demon",
    ),
    minionNominated:
      character(nominator.character, state.scriptId)?.team === "minion",
  };
  state.day.nominations.push(nomination);
  state.day.pendingNomination = null;
  state.day.stage = "nomination";
  countedVoters.forEach((id) => {
    const voter = getPlayer(state, id);
    if (voter && !voter.alive) voter.ghostVote = false;
  });
  addHistory(
    state,
    `${nominator.name} nomina a ${nominee.name}${preview.skipVoting ? "." : `: ${countedVotes} voto${countedVotes === 1 ? "" : "s"}.`}`,
    "",
    {
      action: "nomination",
      actorId: nominator.id,
      targetId: nominee.id,
      automatic: false,
      rule: "Nominación y votación",
    },
  );
  const immediate = policy?.afterNomination?.({
    state,
    preview,
    nominee,
    nominator,
    nominatorId,
    resolveWitchNomination,
  });
  if (immediate) {
    state.day.executedId = immediate.executedId;
    const result = killPlayer(state, immediate.executedId, "execution");
    state.day.executionCausedDeath = result.died;
    state.day.closed = true;
    addHistory(state, immediate.text, immediate.detail);
    if (!state.outcome) {
      state.round += 1;
      beginNight(state);
    }
  }
  // Campo histórico conservado para consumidores y partidas compatibles.
  return { virginTriggered: Boolean(immediate), nomination };
}

export function executionLeader(state) {
  const threshold = majority(state);
  const eligible = state.day.nominations.filter(
    (n) => n.qualified ?? n.votes >= (n.threshold ?? threshold),
  );
  if (!eligible.length)
    return { nomineeId: null, votes: 0, tied: false, threshold };
  const max = Math.max(...eligible.map((n) => n.votes));
  const leaders = eligible.filter((n) => n.votes === max);
  return {
    nomineeId: leaders.length === 1 ? leaders[0].nomineeId : null,
    votes: max,
    tied: leaders.length > 1,
    threshold,
  };
}

/** Datos deliberadamente públicos para la pantalla Town Square. */
export function townSquareProjection(state) {
  const leader = state.phase === "day" ? executionLeader(state) : null;
  const players = [...state.players]
    .sort((a, b) => a.seat - b.seat)
    .map((player) => ({
      id: player.id,
      seat: player.seat,
      name: player.name,
      alive: player.alive,
      ghostVote: !player.alive && player.ghostVote,
    }));
  return {
    round: state.round,
    phase: state.phase,
    players,
    nomination: leader
      ? {
          nomineeId: leader.nomineeId,
          votes: leader.votes || 0,
          threshold: leader.threshold,
          tied: leader.tied,
        }
      : null,
  };
}

export function closeDay(state, options = {}) {
  if (state.day.closed) return;
  const leader = executionLeader(state);
  const policy = DAY_POLICIES[state.scriptId || "trouble_brewing"];
  const snapshot = policy?.beforeClose?.({ state });
  state.day.closed = true;
  state.day.stage = "closed";
  state.day.pendingNomination = null;
  if (leader.nomineeId) {
    state.day.executedId = leader.nomineeId;
    const result = killPlayer(
      state,
      leader.nomineeId,
      "execution",
      policy?.executionOptions?.(options) || {},
    );
    state.day.executionCausedDeath = result.died;
  } else {
    addHistory(
      state,
      leader.tied ? "Empate: hoy no hay ejecución." : "Hoy no hay ejecución.",
    );
    policy?.onNoExecution?.({ state, hasAbility, alivePlayers, addHistory });
  }
  policy?.afterClose?.({
    state,
    leader,
    snapshot,
    getPlayer,
    hasAbility,
    addHistory,
  });
  if (!state.outcome) {
    state.round += 1;
    beginNight(state);
  }
}

export function statusSummary(state) {
  const alive = alivePlayers(state).length;
  const pending =
    state.phase === "night"
      ? nightSteps(state).slice(state.night.stepIndex).length
      : 0;
  return {
    alive,
    dead: state.players.length - alive,
    majority: Math.ceil(alive / 2),
    pending,
  };
}

// Private, derived prompts for the Storyteller. They never form part of the
// town-square projection and therefore cannot leak through the public view.
export function narratorRelations(state) {
  const relations = new Map(
    state.players.map((player) => [player.id, new Set()]),
  );
  const add = (id, label) => relations.get(id)?.add(label);
  const current =
    state.phase === "night" ? nightSteps(state)[state.night.stepIndex] : null;
  if (current?.actorId) add(current.actorId, "actúa ahora");
  state.players
    .filter((p) => p.poisoned)
    .forEach((p) => add(p.id, "envenenado"));
  state.players
    .filter((p) => p.protected)
    .forEach((p) => add(p.id, "protegido"));
  state.players
    .filter((p) => p.redHerring)
    .forEach((p) => add(p.id, "señuelo rojo"));
  state.players
    .filter((p) => p.transformedToDemon || p.formerDemon)
    .forEach((p) => add(p.id, "cambio de Demonio"));
  state.players
    .filter((p) => p.masterId)
    .forEach((p) => {
      add(p.id, "Mayordomo");
      add(p.masterId, "amo del Mayordomo");
    });
  state.players
    .filter((p) => actualRoleForNight(p) === "empath" && p.alive)
    .forEach((p) => {
      add(p.id, "Empática");
      aliveNeighbours(state, p.id).forEach((neighbour) =>
        add(neighbour.id, "vecino de Empática"),
      );
    });
  const pending = state.day?.pendingNomination;
  if (pending) {
    add(pending.nominatorId, "nominador");
    add(pending.nomineeId, "nominado");
  }
  return {
    currentActorId: current?.actorId || null,
    labelsByPlayer: Object.fromEntries(
      [...relations].map(([id, labels]) => [id, [...labels]]),
    ),
  };
}

export function narratorBrief(state) {
  const summary = statusSummary(state);
  const relations = narratorRelations(state);
  const now = [],
    announcements = [],
    attention = [];
  if (state.phase === "night") {
    const step = nightSteps(state)[state.night.stepIndex];
    if (!state.night.preflightConfirmed)
      now.push("Confirma los despertares y prepara la pantalla privada.");
    else if (
      step?.roleId === "pukka" &&
      getPlayer(state, step.actorId)?.exorcisedNight === state.round
    )
      now.push("Resuelve la muerte diferida de Pukka sin despertarlo.");
    else if (step && ["tinker", "moonchild"].includes(step.roleId))
      now.push("Revisa este efecto sin despertar al jugador.");
    else if (step)
      now.push(
        `Despierta a ${step.actorId ? getPlayer(state, step.actorId)?.name || step.name : step.name} y registra tu decisión.`,
      );
    else {
      now.push("Revisa muertes y transformaciones antes de abrir el día.");
      announcements.push("Al amanecer, anuncia únicamente quién ha muerto.");
    }
    if (state.players.some((p) => p.poisoned))
      attention.push(
        isBmr(state)
          ? "Revisa el origen y la duración de cada veneno o embriaguez; algunos duran varias noches."
          : "Revisa el origen y la duración de cada veneno antes de retirarlo.",
      );
    if (state.players.some((p) => p.protected))
      attention.push("La protección del Monje termina al amanecer.");
  } else if (state.phase === "day") {
    if (state.day.pendingNomination)
      now.push(
        `Resuelve la ${state.day.pendingNomination.stage === "vote" ? "votación" : state.day.pendingNomination.stage === "defense" ? "defensa" : "acusación"} en curso.`,
      );
    else if (state.day.stage === "conversation")
      now.push(
        "Deja conversar; abre nominaciones cuando la mesa esté preparada.",
      );
    else now.push("Acepta una nominación válida o cierra el día.");
    announcements.push(
      "Antes de una votación, da acusación y defensa; anuncia solo el resultado público.",
    );
    const ghosts = state.players.filter((p) => !p.alive && p.ghostVote);
    if (ghosts.length)
      attention.push(
        `Voto fantasma disponible: ${ghosts.map((p) => p.name).join(", ")}.`,
      );
    if (
      state.players.some(
        (p) => p.character === "slayer" && p.alive && !p.abilityUsed,
      )
    )
      attention.push(
        "El Exterminador todavía puede declarar su habilidad pública.",
      );
    if (state.day.pendingNomination?.virginTriggered)
      attention.push(
        "La Virgen resolverá una ejecución inmediata: no abras votación.",
      );
  } else if (state.phase === "ended")
    now.push(
      "Prepara la revelación: resultado, reparto y decisiones que explicar.",
    );
  const recent = state.history
    .slice(0, 4)
    .map((event) => ({ text: event.text, detail: event.detail }));
  return {
    phase: state.phase,
    round: state.round,
    alive: summary.alive,
    majority: summary.majority,
    pendingNight: summary.pending,
    now,
    announcements,
    attention,
    recent,
    relations,
  };
}

/** Comprueba incoherencias que conviene revisar, sin cambiar nunca la partida. */
export function diagnoseGame(state) {
  const issues = [];
  const issue = (id, severity, title, detail, fixId = null) =>
    issues.push({ id, severity, title, detail, fixId });
  const setup = validateSetup(
    state.players.length,
    state.selectedRoles || [],
    state.scriptId,
    state.setupChoices || {},
  );
  if (!setup.valid)
    issue(
      "composition",
      "error",
      "La composición inicial no es válida",
      setup.errors.join(" "),
    );

  const livingDemons = state.players.filter(
    (p) => p.alive && character(p.character, state.scriptId)?.team === "demon",
  );
  if (state.phase !== "ended" && livingDemons.length !== 1)
    issue(
      "demon-count",
      "error",
      "Debe haber un único Demonio vivo",
      `Ahora hay ${livingDemons.length}. Revisa cambios manuales, transformaciones y muertes.`,
    );
  if (state.phase === "ended" && !state.outcome)
    issue(
      "outcome-missing",
      "error",
      "La partida está cerrada sin resultado",
      "Indica el resultado manualmente o deshaz el último cambio.",
    );
  if (state.phase !== "ended" && state.outcome)
    issue(
      "outcome-open",
      "warning",
      "Hay un resultado guardado con la partida abierta",
      "Revisa si se deshizo una victoria a medias.",
    );

  const mismatchedAlignment = state.players.filter(
    (p) => defaultAlignment(p.character, state.scriptId) !== p.alignment,
  );
  if (mismatchedAlignment.length)
    issue(
      "alignment-mismatch",
      "warning",
      "Hay personajes con un alineamiento inesperado",
      `${mismatchedAlignment.map((p) => p.name).join(", ")}. Revisa cambios manuales o transformaciones.`,
    );

  const legalBluffs =
    state.players.length < 7
      ? !(state.bluffs || []).length
      : state.bluffs?.length === 3 &&
        new Set(state.bluffs).size === 3 &&
        state.bluffs.every(
          (id) =>
            !state.selectedRoles.includes(id) &&
            id !==
              state.players.find((player) => player.character === "drunk")
                ?.perceivedCharacter &&
            isGoodTeam(character(id, state.scriptId)?.team),
        );
  if (!legalBluffs)
    issue(
      "invalid-bluffs",
      "warning",
      "Los bluffs del Demonio no son válidos",
      "Con 7 o más jugadores deben ser tres personajes buenos distintos y fuera de juego.",
    );

  const redHerrings = state.players.filter((p) => p.redHerring);
  const hasFortuneTeller = state.players.some(
    (p) => p.character === "fortune_teller",
  );
  if (state.scriptId === TROUBLE_BREWING_SCRIPT.id) {
    if (redHerrings.length > 1)
      issue(
        "red-herring-many",
        "error",
        "Hay más de un señuelo rojo",
        "La Adivina solo puede tener un señuelo rojo.",
        "clear-extra-red-herrings",
      );
    if (
      redHerrings.some((p) => p.alignment !== "good") ||
      (!hasFortuneTeller && redHerrings.length)
    )
      issue(
        "red-herring-invalid",
        "warning",
        "El señuelo rojo no es válido",
        "Debe ser un único jugador bueno y solo se usa si hay Adivina.",
        "clear-invalid-red-herrings",
      );
  }

  const livingGhostVotes = state.players.filter((p) => p.alive && p.ghostVote);
  if (livingGhostVotes.length)
    issue(
      "living-ghost-vote",
      "warning",
      "Un jugador vivo tiene voto fantasma",
      `${livingGhostVotes.map((p) => p.name).join(", ")}.`,
      "clear-living-ghost-votes",
    );
  if (state.phase !== "night" && state.players.some((p) => p.protected))
    issue(
      "stale-protection",
      "warning",
      "Hay protección fuera de la noche",
      "La protección del Monje termina al amanecer.",
      "clear-protection",
    );
  const poisonHasSource =
    state.players.some(
      (p) => p.character === "poisoner" && hasAbility(p, state),
    ) ||
    (state.scriptId === "bad_moon_rising" && Boolean(state.pukkaPoisonedId)) ||
    (state.scriptId === "sects_and_violets" &&
      (state.players.some((p) => p.noDashiiPoisoned) ||
        state.players.some((p) => p.vigormortisPoisonedId)));
  if (!poisonHasSource && state.players.some((p) => p.poisoned))
    issue(
      "stale-poison",
      "warning",
      "Hay veneno sin una fuente activa",
      "Revisa si procede de Envenenador, Pukka, No Dashii o Vigormortis; si no, elimina el estado.",
      "clear-poison",
    );
  const invalidMasters = state.players.filter(
    (p) => p.masterId && (p.masterId === p.id || !getPlayer(state, p.masterId)),
  );
  if (invalidMasters.length)
    issue(
      "invalid-master",
      "warning",
      "Hay un amo de Mayordomo inválido",
      `${invalidMasters.map((p) => p.name).join(", ")}. Revisa el objetivo o elimina el estado.`,
      "clear-invalid-masters",
    );
  if (state.phase !== "day" && state.day?.pendingNomination)
    issue(
      "pending-outside-day",
      "warning",
      "Hay una nominación a medio resolver fuera del día",
      "Cancélala o vuelve al día para resolverla.",
      "clear-pending-nomination",
    );
  if (state.phase === "night") {
    const totalSteps = nightSteps(state).length;
    if (state.night.stepIndex < 0 || state.night.stepIndex > totalSteps)
      issue(
        "night-index",
        "warning",
        "El paso nocturno está fuera de rango",
        `Hay ${totalSteps} pasos posibles para esta noche.`,
        "clamp-night-index",
      );
    const stepIds = new Set(nightSteps(state).map((step) => step.id));
    if ((state.night.completed || []).some((id) => !stepIds.has(id)))
      issue(
        "night-completed",
        "warning",
        "Hay pasos nocturnos que no corresponden a esta noche",
        "Revisa el historial o vuelve a un punto de recuperación.",
      );
  }
  if (state.phase === "day" && state.day?.closed)
    issue(
      "closed-day-open",
      "warning",
      "El día está cerrado pero sigue activo",
      "El cierre del día debería llevar a la siguiente noche.",
    );
  return issues;
}

/** Aplica únicamente correcciones mecánicas seguras propuestas por diagnoseGame. */
export function applyDiagnosticFix(state, fixId) {
  let description = null;
  if (fixId === "clear-extra-red-herrings") {
    const valid = state.players.find(
      (p) => p.redHerring && p.alignment === "good",
    );
    state.players.forEach((p) => {
      p.redHerring = p.id === valid?.id;
    });
    description = "Se conservó como máximo un señuelo rojo bueno.";
  } else if (fixId === "clear-invalid-red-herrings") {
    state.players.forEach((p) => {
      p.redHerring = false;
    });
    description = "Se eliminó el señuelo rojo inválido.";
  } else if (fixId === "clear-living-ghost-votes") {
    state.players
      .filter((p) => p.alive)
      .forEach((p) => {
        p.ghostVote = false;
      });
    description = "Se retiraron votos fantasma de jugadores vivos.";
  } else if (fixId === "clear-protection") {
    state.players.forEach((p) => {
      p.protected = false;
    });
    description = "Se retiraron protecciones que ya habían terminado.";
  } else if (fixId === "clear-poison") {
    state.players.forEach((p) => {
      p.poisoned = false;
    });
    description = "Se retiró veneno sin un Envenenador activo.";
  } else if (fixId === "clear-invalid-masters") {
    state.players
      .filter(
        (p) =>
          p.masterId && (p.masterId === p.id || !getPlayer(state, p.masterId)),
      )
      .forEach((p) => {
        p.masterId = null;
      });
    description = "Se retiraron amos de Mayordomo inválidos.";
  } else if (fixId === "clear-pending-nomination") {
    state.day.pendingNomination = null;
    description = "Se canceló la nominación pendiente fuera del día.";
  } else if (fixId === "clamp-night-index") {
    state.night.stepIndex = Math.max(
      0,
      Math.min(state.night.stepIndex, nightSteps(state).length),
    );
    description = "Se ajustó el paso nocturno al rango disponible.";
  }
  if (description)
    addHistory(state, "Corrección de diagnóstico aplicada.", description, {
      action: "diagnostic_fix",
      automatic: false,
      rule: "Comprobación de coherencia local",
    });
  return description;
}

/**
 * Registro ejecutable de capacidades del motor para un guion. Los identificadores
 * declarativos viven en scripts.js. Trouble Brewing expone sus resoluciones
 * específicas; otros guiones usan la misma conducción guiada y mantienen sus
 * decisiones de habilidad en controles privados del Narrador.
 */
export function handlersForScript(scriptId = TROUBLE_BREWING_SCRIPT.id) {
  if (!SCRIPT_HANDLERS[scriptId] || !getScript(scriptId)) return null;
  const common = {
    metadata: SCRIPT_HANDLERS[scriptId],
    setup: { validate: validateSetup, create: createGame },
    night: { begin: beginNight, steps: nightSteps },
    day: { begin: beginDay, close: closeDay },
    execution: { leader: executionLeader },
    death: { kill: killPlayer, record: recordDeathAttempt },
    victory: { status: statusSummary },
  };
  if (scriptId !== TROUBLE_BREWING_SCRIPT.id)
    return {
      ...common,
      nomination: { add: addNomination },
      character_change: { guided: true },
    };
  return {
    ...common,
    nomination: { preview: previewVirginNomination, add: addNomination },
    death: {
      kill: killPlayer,
      demonDeath: resolveDemonDeath,
      record: recordDeathAttempt,
    },
    registration: { canRegisterAs, startingInfoIsLegal },
    character_change: { becomeDemon: resolveDemonDeath },
  };
}

// Las fachadas públicas mantienen los nombres históricos del motor.
const {
  refreshBmrDrunkenness,
  bmrDeathPrevention,
  recordBmrPrevention,
  ...badMoonRisingResolutions
} = createBadMoonRisingRules({
  addHistory,
  aliveNeighbours,
  character,
  getPlayer,
  hasAbility,
  isBmr,
  killPlayer,
  outsiderDiedDuringPreviousDay,
  recordDeathAttempt,
});
export const {
  resolveGrandmotherSetup,
  resolveSailor,
  resolveInnkeeper,
  resolveExorcist,
  resolveGambler,
  resolveCourtier,
  resolveProfessor,
  resolveDevilsAdvocate,
  resolveAssassin,
  resolveGossip,
  resolveMinstrel,
  resolveGoon,
  resolveTinkerDeath,
  resolveGodfather,
  chooseMoonchild,
  resolveMoonchild,
  resolveShabaloth,
  resolvePo,
  resolvePukkaNight,
  resolveZombuulAttack,
} = badMoonRisingResolutions;
export const {
  applySnvPassiveEffects,
  resolveSnakeCharmer,
  resolveWitch,
  resolveWitchNomination,
  resolvePitHag,
  resolvePhilosopher,
  resolveSnvDemonAttack,
  resolveEvilTwinSetup,
  resolveKlutzChoice,
  resolveSweetheartDrunk,
  resolveBarberSwap,
  resolvePitHagArbitraryDeaths,
  recordPitHagArbitraryChoice,
  recordSavantVisit,
  useArtistQuestion,
  recordJugglerGuesses,
  resolveMadnessExecution,
  resolveVigormortisNeighbour,
} = createSectsVioletsRules({
  abilityRole,
  addHistory,
  alivePlayers,
  beginNight,
  changeCharacter,
  character,
  closestTownsfolkNeighbours,
  endPersistentEffects,
  finishDeferredTwinVictory,
  getPlayer,
  hasAbility,
  isSnv,
  killPlayer,
  markRoleAbilityUsed,
  queueEffect,
  recordDeathAttempt,
  resetCharacterUsage,
  resolveEffect,
  roleAbilityUsed,
});
export const {
  resolveDemonDeath,
  resolveImpAttack,
  previewVirginNomination,
  useSlayer,
} = createTroubleBrewingRules({
  getPlayer,
  alivePlayers,
  hasAbility,
  character,
  endPersistentEffects,
  addHistory,
  killPlayer,
  nominationEligibility,
});

/** Preparación confirmada: los servicios de aplicación aportan datos, no mutaciones. */
export function confirmAssignment(state, choices) {
  if (state.phase !== "assign")
    throw new Error("La preparación ya ha terminado.");
  const { assignment, drunkBelief, redId, bluffs, lunaticSetup } = choices;
  const assigned = state.players.map((player) => assignment?.[player.id]);
  if (
    [...assigned].sort().join("|") !== [...state.selectedRoles].sort().join("|")
  )
    throw new Error(
      "Cada personaje seleccionado debe asignarse exactamente una vez.",
    );
  const check = validateSetupDecisions(
    state.players.length,
    assigned,
    {
      drunkBelief,
      redHerringIsGood: Boolean(
        redId && defaultAlignment(assignment[redId], state.scriptId) === "good",
      ),
      bluffs,
      lunatic: lunaticSetup,
      setupChoices: state.setupChoices,
    },
    state.scriptId,
  );
  if (!check.valid) throw new Error(check.errors[0]);
  state.players.forEach((player) => {
    player.character = assignment[player.id];
    player.alignment = defaultAlignment(player.character, state.scriptId);
    const identity = SETUP_POLICIES[state.scriptId]?.assignedIdentity?.(
      player,
      choices,
    );
    player.perceivedCharacter =
      identity?.perceivedCharacter || player.character;
    player.redHerring = Boolean(identity?.redHerring);
  });
  state.bluffs = bluffs;
  state.lunaticSetup = lunaticSetup;
  addHistory(
    state,
    "Asignación y decisiones de preparación confirmadas.",
    "Las elecciones privadas se conservan en la partida.",
  );
  if (state.secretDeal) state.phase = "deal";
  else beginNight(state);
}
export function assignCharacter(state, playerId, role) {
  const player = getPlayer(state, playerId);
  if (
    state.phase !== "assign" ||
    !state.selectedRoles.includes(role) ||
    !player
  )
    throw new Error("La asignación seleccionada no es válida.");
  player.character = role;
  player.perceivedCharacter = role;
  player.alignment = defaultAlignment(role, state.scriptId);
}
export function shuffleAssignment(state, random = Math.random) {
  if (state.phase !== "assign")
    throw new Error("La preparación ya ha terminado.");
  const roles = shuffle(state.selectedRoles, random),
    script = scriptForGame(state),
    inPlay = new Set(state.selectedRoles);
  const unusedTownsfolk = script.characters
    .filter((role) => role.team === "townsfolk" && !inPlay.has(role.id))
    .map((role) => role.id);
  state.players.forEach((player, index) => {
    assignCharacter(state, player.id, roles[index]);
    player.redHerring = false;
    player.perceivedCharacter =
      SETUP_POLICIES[state.scriptId]?.apparentRole?.({
        role: player.character,
        options: { random },
        inPlay,
        character,
        scriptId: state.scriptId,
        shuffle,
        unusedTownsfolk,
      }) || player.character;
  });
  SETUP_POLICIES[state.scriptId]?.finishPlayers?.({
    players: state.players,
    shuffle,
    random,
  });
}
