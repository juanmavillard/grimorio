import {
  CHARACTERS,
  CHARACTER_BY_ID,
  FIRST_NIGHT_ORDER,
  GROUPED_CHARACTERS,
  OFFICIAL_SOURCES,
  OTHER_NIGHT_ORDER,
  PLAYER_COUNTS,
  TEAM_LABELS,
} from "../scripts/trouble-brewing/data.js";
import { BMR_CHARACTERS, BMR_NIGHT } from "../scripts/bad-moon-rising/data.js";
import { SV_CHARACTERS, SV_NIGHT } from "../scripts/sects-and-violets/data.js";

const groupCharacters = (characters) =>
  Object.groupBy
    ? Object.groupBy(characters, (role) => role.team)
    : characters.reduce(
        (groups, role) => ((groups[role.team] ||= []).push(role), groups),
        {},
      );
const indexCharacters = (characters) =>
  Object.fromEntries(characters.map((role) => [role.id, role]));

/**
 * Contrato de edición: agrupa guiones publicados y sus fuentes, sin reglas de UI.
 * Los futuros guiones añaden otra definición a SCRIPT_DEFINITIONS, no condicionales
 * repartidos por la interfaz.
 */
export const BASE3_EDITION = {
  id: "base3",
  name: "Blood on the Clocktower · Base 3",
  source: "https://bloodontheclocktower.com/",
  scripts: ["trouble_brewing", "bad_moon_rising", "sects_and_violets"],
};

/** @type {ScriptDefinition} Datos declarativos de Trouble Brewing. */
export const TROUBLE_BREWING_SCRIPT = {
  id: "trouble_brewing",
  editionId: BASE3_EDITION.id,
  name: "Trouble Brewing",
  subtitle: "El guion introductorio de Blood on the Clocktower",
  status: "stable",
  characters: CHARACTERS,
  characterById: CHARACTER_BY_ID,
  groupedCharacters: GROUPED_CHARACTERS,
  playerCounts: PLAYER_COUNTS,
  teamLabels: TEAM_LABELS,
  nightOrder: { first: FIRST_NIGHT_ORDER, other: OTHER_NIGHT_ORDER },
  sourceUrls: OFFICIAL_SOURCES,
  compositionAdjustment: ({ selectedIds }) =>
    selectedIds.includes("baron") ? 2 : 0,
  firstNightInfo: { minionBefore: true, demonBefore: true },
  setup: {
    minPlayers: 5,
    maxPlayers: 15,
    travellers: false,
    fabled: false,
    demonRoles: ["imp"],
    baronRole: "baron",
    modifier: "baron",
  },
  handlerIds: [
    "setup",
    "night",
    "day",
    "nomination",
    "execution",
    "death",
    "registration",
    "character_change",
    "victory",
  ],
};

const STANDARD_PLAYER_COUNTS = PLAYER_COUNTS;
const SCRIPT_SOURCES = {
  bmr: [
    [
      "Bad Moon Rising · sitio oficial",
      "https://bloodontheclocktower.com/pages/bad-moon-rising",
    ],
    [
      "Bad Moon Rising · guía de personajes",
      "https://wiki.bloodontheclocktower.com/Bad_Moon_Rising",
    ],
    ["Recursos de reglas y datos", "https://release.botc.app/resources/"],
  ],
  snv: [
    [
      "Sects & Violets · sitio oficial",
      "https://bloodontheclocktower.com/pages/sects-violets",
    ],
    [
      "Sects & Violets · guía de personajes",
      "https://wiki.bloodontheclocktower.com/Sects_%26_Violets",
    ],
    ["Recursos de reglas y datos", "https://release.botc.app/resources/"],
  ],
};

/** Bad Moon Rising: el Padrino cambia la composición en −1 o +1 Forastero. */
export const BAD_MOON_RISING_SCRIPT = {
  id: "bad_moon_rising",
  editionId: BASE3_EDITION.id,
  name: "Bad Moon Rising",
  subtitle: "Muertes múltiples, supervivencias y riesgos",
  status: "stable",
  characters: BMR_CHARACTERS,
  characterById: indexCharacters(BMR_CHARACTERS),
  groupedCharacters: groupCharacters(BMR_CHARACTERS),
  playerCounts: STANDARD_PLAYER_COUNTS,
  teamLabels: TEAM_LABELS,
  nightOrder: BMR_NIGHT,
  sourceUrls: SCRIPT_SOURCES.bmr,
  compositionAdjustment: ({ selectedIds, choices }) =>
    selectedIds.includes("godfather")
      ? Number(choices.godfatherOutsiders ?? 1)
      : 0,
  firstNightInfo: { minionBefore: true, demonAfter: "lunatic" },
  setup: {
    minPlayers: 5,
    maxPlayers: 15,
    travellers: false,
    fabled: false,
    demonRoles: ["zombuul", "pukka", "shabaloth", "po_bmr"],
    modifier: "godfather",
    choices: [
      {
        id: "godfatherOutsiders",
        label: "Padrino: ajuste de Forasteros",
        values: [-1, 1],
        default: 1,
      },
    ],
  },
  handlerIds: [
    "setup",
    "night",
    "day",
    "nomination",
    "execution",
    "death",
    "survival",
    "character_change",
    "victory",
  ],
};

/** Sects & Violets: cambios, registros y locura requieren decisión humana. */
export const SECTS_AND_VIOLETS_SCRIPT = {
  id: "sects_and_violets",
  editionId: BASE3_EDITION.id,
  name: "Sects & Violets",
  subtitle: "Información intensa, cambios y locura",
  status: "stable",
  characters: SV_CHARACTERS,
  characterById: indexCharacters(SV_CHARACTERS),
  groupedCharacters: groupCharacters(SV_CHARACTERS),
  playerCounts: STANDARD_PLAYER_COUNTS,
  teamLabels: TEAM_LABELS,
  nightOrder: SV_NIGHT,
  sourceUrls: SCRIPT_SOURCES.snv,
  compositionAdjustment: ({ selectedIds }) =>
    selectedIds.includes("fang_gu")
      ? 1
      : selectedIds.includes("vigormortis")
        ? -1
        : 0,
  firstNightInfo: { minionAfter: "snake_charmer", demonAfter: "snake_charmer" },
  setup: {
    minPlayers: 5,
    maxPlayers: 15,
    travellers: false,
    fabled: false,
    demonRoles: ["fang_gu", "vigormortis", "no_dashii", "vortox"],
    modifier: "demon",
  },
  handlerIds: [
    "setup",
    "night",
    "day",
    "nomination",
    "execution",
    "death",
    "registration",
    "character_change",
    "madness",
    "victory",
  ],
};

export const SCRIPT_DEFINITIONS = Object.freeze({
  [TROUBLE_BREWING_SCRIPT.id]: TROUBLE_BREWING_SCRIPT,
  [BAD_MOON_RISING_SCRIPT.id]: BAD_MOON_RISING_SCRIPT,
  [SECTS_AND_VIOLETS_SCRIPT.id]: SECTS_AND_VIOLETS_SCRIPT,
});
export const EDITION_DEFINITIONS = Object.freeze({
  [BASE3_EDITION.id]: BASE3_EDITION,
});

export function getScript(scriptId = TROUBLE_BREWING_SCRIPT.id) {
  return Object.hasOwn(SCRIPT_DEFINITIONS, scriptId)
    ? SCRIPT_DEFINITIONS[scriptId]
    : null;
}

export function getEdition(editionId = BASE3_EDITION.id) {
  return Object.hasOwn(EDITION_DEFINITIONS, editionId)
    ? EDITION_DEFINITIONS[editionId]
    : null;
}

export function scriptForGame(game) {
  return getScript(game?.scriptId || TROUBLE_BREWING_SCRIPT.id);
}

export function validateScriptDefinition(script) {
  const errors = [];
  if (!script?.id || !script?.editionId || !Array.isArray(script?.characters))
    errors.push("La definición del guion está incompleta.");
  if (script && !getEdition(script.editionId))
    errors.push("La edición del guion no está registrada.");
  if (
    script &&
    !script.characters.every((role) => role.id && role.team && role.ability)
  )
    errors.push("Cada personaje debe tener identificador, equipo y habilidad.");
  if (
    script &&
    new Set(script.characters.map((role) => role.id)).size !==
      script.characters.length
  )
    errors.push("No puede haber personajes duplicados en un guion.");
  if (script && !script.setup?.demonRoles?.length)
    errors.push("El guion debe declarar sus Demonios posibles.");
  if ((script && !script.nightOrder?.first) || !script.nightOrder?.other)
    errors.push("Falta un orden nocturno declarativo.");
  return { valid: errors.length === 0, errors };
}

/**
 * Registro de puntos de extensión del motor. Trouble Brewing mantiene su lógica
 * específica en engine.js; otros guiones pueden añadir manejadores sin construir
 * un lenguaje artificial de reglas.
 */
export const SCRIPT_HANDLERS = Object.freeze({
  trouble_brewing: Object.freeze({
    setup: "troubleBrewingSetup",
    night: "troubleBrewingNight",
    day: "troubleBrewingDay",
    nomination: "troubleBrewingNomination",
    execution: "troubleBrewingExecution",
    death: "troubleBrewingDeath",
    registration: "troubleBrewingRegistration",
    character_change: "troubleBrewingCharacterChange",
    victory: "troubleBrewingVictory",
  }),
  bad_moon_rising: Object.freeze({
    setup: "guidedSetup",
    night: "guidedNight",
    day: "guidedDay",
    nomination: "guidedNomination",
    execution: "guidedExecution",
    death: "deathQueue",
    survival: "guidedSurvival",
    character_change: "guidedCharacterChange",
    victory: "guidedVictory",
  }),
  sects_and_violets: Object.freeze({
    setup: "guidedSetup",
    night: "guidedNight",
    day: "guidedDay",
    nomination: "guidedNomination",
    execution: "guidedExecution",
    death: "deathQueue",
    registration: "guidedRegistration",
    character_change: "guidedCharacterChange",
    madness: "guidedMadness",
    victory: "guidedVictory",
  }),
});
