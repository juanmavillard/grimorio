import { CHARACTERS, CHARACTER_BY_ID, PLAYER_COUNTS } from "./data.js";

export const OFFICIAL_SETUP_SOURCE =
  "https://wiki.bloodontheclocktower.com/Setup";

export const ROLE_TAGS = {
  washerwoman: ["first-info", "confirmation", "beginner"],
  librarian: ["first-info", "outsider-info", "beginner"],
  investigator: ["first-info", "evil-info", "beginner"],
  chef: ["first-info", "seating", "beginner"],
  empath: ["ongoing-info", "seating", "beginner"],
  fortune_teller: ["ongoing-info", "demon-info", "misinformation"],
  undertaker: ["ongoing-info", "execution", "confirmation"],
  monk: ["protection", "night-choice", "beginner"],
  ravenkeeper: ["death-trigger", "character-info", "bluffing"],
  virgin: ["public", "execution", "confirmation"],
  slayer: ["public", "execution", "demon-info"],
  soldier: ["protection", "passive", "beginner"],
  mayor: ["alternate-win", "execution", "advanced"],
  butler: ["voting", "night-choice", "beginner"],
  drunk: ["misinformation", "setup", "outsider-info"],
  recluse: ["registration", "misinformation", "advanced"],
  saint: ["execution", "risk", "alternate-win"],
  poisoner: ["misinformation", "night-choice", "ongoing"],
  spy: ["registration", "misinformation", "advanced"],
  scarlet_woman: ["demon-safety", "transformation", "beginner"],
  baron: ["setup", "outsider-info", "advanced"],
  imp: ["demon", "night-choice", "transformation"],
};

export const EXPERIENCE_OPTIONS = [
  { id: "new", label: "Primera partida" },
  { id: "regular", label: "Algunas partidas" },
  { id: "experienced", label: "Grupo experimentado" },
];

export const STYLE_OPTIONS = [
  { id: "balanced", label: "Equilibrada" },
  { id: "information", label: "Información y deducción" },
  { id: "deception", label: "Engaño y registros" },
  { id: "execution", label: "Riesgo y ejecuciones" },
];

export const OFFICIAL_PRESETS = [
  {
    id: "official-information-8",
    source: "official",
    title: "Información abundante",
    playerCounts: [8],
    difficulty: "Iniciación",
    experience: "new",
    styles: ["balanced", "information"],
    description:
      "Mucha información para empezar a hablar y una red de seguridad para el equipo malvado.",
    goals: [
      "Información inicial y recurrente",
      "Borrachera",
      "Relevo del Demonio",
    ],
    roles: [
      "chef",
      "empath",
      "fortune_teller",
      "undertaker",
      "virgin",
      "drunk",
      "scarlet_woman",
      "imp",
    ],
    drunkBelief: "investigator",
    warnings: [
      "El Borracho cree ser Investigador: prepara información falsa plausible y recuerda que no activa a la Virgen.",
    ],
    sourceUrl: OFFICIAL_SETUP_SOURCE,
  },
  {
    id: "official-quiet-risk-8",
    source: "official",
    title: "Información discreta y riesgo",
    playerCounts: [8],
    difficulty: "Intermedia",
    experience: "regular",
    styles: ["execution", "balanced"],
    description:
      "Una partida más silenciosa en la que los poderes públicos y las decisiones del día pesan mucho.",
    goals: ["Riesgo de ejecución", "Protección", "Habilidades públicas"],
    roles: [
      "empath",
      "fortune_teller",
      "ravenkeeper",
      "slayer",
      "mayor",
      "saint",
      "poisoner",
      "imp",
    ],
    warnings: [
      "Puede terminar pronto por Exterminador, Santo o Alcalde; recomendable cuando el grupo ya entiende las condiciones de victoria.",
    ],
    sourceUrl: OFFICIAL_SETUP_SOURCE,
  },
  {
    id: "official-registration-8",
    source: "official",
    title: "Registros avanzados",
    playerCounts: [8],
    difficulty: "Avanzada",
    experience: "experienced",
    styles: ["deception", "information"],
    description:
      "Explora cómo Espía y Recluso pueden registrar de formas inesperadas sin cambiar su personaje real.",
    goals: [
      "Registros",
      "Confirmación pública",
      "Información posterior a ejecuciones",
    ],
    roles: [
      "washerwoman",
      "fortune_teller",
      "undertaker",
      "slayer",
      "virgin",
      "recluse",
      "spy",
      "imp",
    ],
    warnings: [
      "El Narrador debe decidir y anotar cada registro del Espía y del Recluso por separado.",
    ],
    sourceUrl: OFFICIAL_SETUP_SOURCE,
  },
];

export const CURATED_PROFILES = [
  {
    id: "first-game",
    title: "Primera partida",
    difficulty: "Iniciación",
    experience: "new",
    styles: ["balanced"],
    description:
      "Roles legibles, información suficiente y pocas excepciones de registro.",
    goals: [
      "Aprender noche y día",
      "Compartir información",
      "Entender la ejecución",
    ],
    tags: ["beginner", "first-info", "ongoing-info", "confirmation"],
    avoid: ["advanced", "registration"],
    priority: {
      townsfolk: [
        "chef",
        "empath",
        "fortune_teller",
        "undertaker",
        "virgin",
        "monk",
        "washerwoman",
        "slayer",
        "soldier",
        "ravenkeeper",
        "librarian",
        "investigator",
        "mayor",
      ],
      outsider: ["drunk", "butler", "saint", "recluse"],
      minion: ["scarlet_woman", "poisoner", "baron", "spy"],
    },
  },
  {
    id: "balanced",
    title: "Partida equilibrada",
    difficulty: "Flexible",
    experience: "regular",
    styles: ["balanced"],
    description:
      "Combina información, protección, riesgo y desinformación sin concentrarse en una sola mecánica.",
    goals: [
      "Partida variada",
      "Varios caminos de deducción",
      "Buenas opciones de bluff",
    ],
    tags: ["first-info", "ongoing-info", "protection", "public"],
    avoid: [],
    priority: {
      townsfolk: [
        "washerwoman",
        "empath",
        "fortune_teller",
        "undertaker",
        "monk",
        "ravenkeeper",
        "virgin",
        "chef",
        "soldier",
        "slayer",
        "librarian",
        "investigator",
        "mayor",
      ],
      outsider: ["butler", "drunk", "saint", "recluse"],
      minion: ["poisoner", "scarlet_woman", "baron", "spy"],
    },
  },
  {
    id: "information",
    title: "Información y deducción",
    difficulty: "Intermedia",
    experience: "regular",
    styles: ["information"],
    description:
      "Muchas piezas de información que el grupo deberá ordenar y contrastar.",
    goals: [
      "Cruzar datos",
      "Observar cambios nocturnos",
      "Confirmar ejecuciones",
    ],
    tags: ["first-info", "ongoing-info", "character-info", "confirmation"],
    avoid: [],
    priority: {
      townsfolk: [
        "washerwoman",
        "investigator",
        "chef",
        "empath",
        "fortune_teller",
        "undertaker",
        "ravenkeeper",
        "librarian",
        "virgin",
        "monk",
        "slayer",
        "soldier",
        "mayor",
      ],
      outsider: ["drunk", "recluse", "butler", "saint"],
      minion: ["poisoner", "spy", "scarlet_woman", "baron"],
    },
  },
  {
    id: "deception",
    title: "Engaño y registros falsos",
    difficulty: "Avanzada",
    experience: "experienced",
    styles: ["deception"],
    description:
      "Favorece contradicciones plausibles, registros extraños y bluffs que necesitan seguimiento.",
    goals: [
      "Gestionar desinformación",
      "Practicar registros",
      "Construir mundos alternativos",
    ],
    tags: ["misinformation", "registration", "bluffing"],
    avoid: [],
    priority: {
      townsfolk: [
        "washerwoman",
        "librarian",
        "investigator",
        "fortune_teller",
        "undertaker",
        "ravenkeeper",
        "empath",
        "chef",
        "virgin",
        "slayer",
        "monk",
        "soldier",
        "mayor",
      ],
      outsider: ["recluse", "drunk", "butler", "saint"],
      minion: ["spy", "poisoner", "baron", "scarlet_woman"],
    },
  },
  {
    id: "execution",
    title: "Riesgo en las ejecuciones",
    difficulty: "Intermedia",
    experience: "regular",
    styles: ["execution"],
    description:
      "El pueblo obtiene pruebas potentes, pero cada nominación puede cambiar la partida.",
    goals: [
      "Gestionar la picota",
      "Valorar sacrificios",
      "Explorar victorias alternativas",
    ],
    tags: ["execution", "public", "risk", "alternate-win"],
    avoid: [],
    priority: {
      townsfolk: [
        "virgin",
        "slayer",
        "undertaker",
        "mayor",
        "empath",
        "fortune_teller",
        "chef",
        "ravenkeeper",
        "washerwoman",
        "monk",
        "soldier",
        "librarian",
        "investigator",
      ],
      outsider: ["saint", "butler", "drunk", "recluse"],
      minion: ["scarlet_woman", "poisoner", "baron", "spy"],
    },
  },
  {
    id: "experienced",
    title: "Grupo experimentado",
    difficulty: "Avanzada",
    experience: "experienced",
    styles: ["balanced", "deception"],
    description:
      "Aumenta las decisiones del Narrador y las interacciones que admiten varias lecturas legales.",
    goals: [
      "Registros complejos",
      "Cambios de Demonio",
      "Decisiones abiertas del Narrador",
    ],
    tags: ["advanced", "registration", "transformation", "misinformation"],
    avoid: [],
    priority: {
      townsfolk: [
        "fortune_teller",
        "undertaker",
        "ravenkeeper",
        "virgin",
        "slayer",
        "mayor",
        "empath",
        "investigator",
        "librarian",
        "chef",
        "monk",
        "soldier",
        "washerwoman",
      ],
      outsider: ["recluse", "drunk", "saint", "butler"],
      minion: ["spy", "baron", "poisoner", "scarlet_woman"],
    },
  },
];

const TEAM_KEYS = ["townsfolk", "outsider", "minion", "demon"];

function composition(count, hasBaron) {
  const base = PLAYER_COUNTS[count];
  if (!base) return null;
  return {
    townsfolk: base[0] - (hasBaron ? 2 : 0),
    outsider: base[1] + (hasBaron ? 2 : 0),
    minion: base[2],
    demon: base[3],
  };
}

function hashRandom(text) {
  let seed =
    [...text].reduce(
      (value, char) => Math.imul(value ^ char.charCodeAt(0), 16777619),
      2166136261,
    ) >>> 0;
  return () => {
    seed += 0x6d2b79f5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickTeam(team, amount, profile, random, selected = []) {
  if (!amount) return [];
  const priorities = profile.priority[team] || [];
  return CHARACTERS.filter(
    (role) => role.team === team && !selected.includes(role.id),
  )
    .map((role) => {
      const priorityIndex = priorities.indexOf(role.id);
      const tags = ROLE_TAGS[role.id] || [];
      const tagScore =
        tags.filter((tag) => profile.tags.includes(tag)).length * 12;
      const avoidScore =
        tags.filter((tag) => profile.avoid.includes(tag)).length * 35;
      return {
        id: role.id,
        score:
          (priorityIndex < 0 ? 0 : 100 - priorityIndex * 5) +
          tagScore -
          avoidScore +
          random() * 3,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, amount)
    .map((role) => role.id);
}

export function profileForPreferences(experience = "new", style = "balanced") {
  if (experience === "new" && style === "balanced") return "first-game";
  if (experience === "experienced" && style === "balanced")
    return "experienced";
  if (style === "information") return "information";
  if (style === "deception")
    return experience === "experienced" ? "deception" : "balanced";
  if (style === "execution") return "execution";
  return "balanced";
}

export function buildCuratedPreset(
  count,
  profileId = "balanced",
  options = {},
) {
  const profile =
    CURATED_PROFILES.find((item) => item.id === profileId) ||
    CURATED_PROFILES[1];
  if (!PLAYER_COUNTS[count])
    throw new Error("Trouble Brewing admite de 5 a 15 jugadores.");
  const random = options.random || hashRandom(`${profile.id}:${count}`);
  const minions = pickTeam("minion", PLAYER_COUNTS[count][2], profile, random);
  const comp = composition(count, minions.includes("baron"));
  const outsiders = pickTeam(
    "outsider",
    comp.outsider,
    profile,
    random,
    minions,
  );
  const townsfolk = pickTeam("townsfolk", comp.townsfolk, profile, random, [
    ...minions,
    ...outsiders,
  ]);
  const roles = [...townsfolk, ...outsiders, ...minions, "imp"];
  const preset = {
    id: `curated-${profile.id}-${count}`,
    source: "curated",
    title: profile.title,
    playerCounts: [count],
    difficulty: profile.difficulty,
    experience: profile.experience,
    styles: profile.styles,
    description: profile.description,
    goals: [...profile.goals],
    roles,
    drunkBelief: roles.includes("drunk")
      ? CHARACTERS.find(
          (role) => role.team === "townsfolk" && !roles.includes(role.id),
        )?.id || null
      : null,
    warnings: [],
  };
  preset.warnings = setupWarnings(count, roles, preset.experience);
  return preset;
}

export function guidedPreset(count, experience, style, options = {}) {
  return buildCuratedPreset(
    count,
    profileForPreferences(experience, style),
    options,
  );
}

export function officialPresetsFor(count) {
  return OFFICIAL_PRESETS.filter((preset) =>
    preset.playerCounts.includes(Number(count)),
  );
}

export function curatedPresetsFor(count) {
  return CURATED_PROFILES.map((profile) =>
    buildCuratedPreset(Number(count), profile.id),
  );
}

export function validatePresetDefinition(candidate) {
  const errors = [];
  const count = Number(candidate?.count ?? candidate?.playerCounts?.[0]);
  const roles = Array.isArray(candidate?.roles) ? candidate.roles : [];
  if (!PLAYER_COUNTS[count])
    errors.push("El número de jugadores debe estar entre 5 y 15.");
  if (!candidate?.title?.trim())
    errors.push("La formación necesita un nombre.");
  if (roles.length !== count)
    errors.push(
      `La formación contiene ${roles.length} personajes para ${count || "—"} jugadores.`,
    );
  if (new Set(roles).size !== roles.length)
    errors.push("No puede haber personajes repetidos.");
  if (roles.some((id) => !CHARACTER_BY_ID[id]))
    errors.push("La formación contiene personajes desconocidos.");
  const comp = composition(count, roles.includes("baron"));
  if (comp) {
    const actual = Object.fromEntries(
      TEAM_KEYS.map((team) => [
        team,
        roles.filter((id) => CHARACTER_BY_ID[id]?.team === team).length,
      ]),
    );
    TEAM_KEYS.forEach((team) => {
      if (actual[team] !== comp[team])
        errors.push(
          `Composición incorrecta de ${team}: ${actual[team]}/${comp[team]}.`,
        );
    });
  }
  if (
    candidate?.drunkBelief &&
    (!roles.includes("drunk") ||
      roles.includes(candidate.drunkBelief) ||
      CHARACTER_BY_ID[candidate.drunkBelief]?.team !== "townsfolk")
  ) {
    errors.push(
      "El personaje aparente del Borracho debe ser un Aldeano fuera de juego.",
    );
  }
  return { valid: errors.length === 0, errors, count, roles };
}

export function setupWarnings(count, roles, experience = "regular") {
  const warnings = [];
  const tags = new Set(roles.flatMap((id) => ROLE_TAGS[id] || []));
  const advanced = roles
    .filter((id) => (ROLE_TAGS[id] || []).includes("registration"))
    .map((id) => CHARACTER_BY_ID[id].name);
  if (roles.includes("baron"))
    warnings.push(
      "El Barón cambia la composición: sustituye dos Aldeanos por dos Forasteros.",
    );
  if (roles.includes("drunk"))
    warnings.push(
      "El Borracho necesita un Aldeano fuera de juego como personaje aparente.",
    );
  if (roles.includes("fortune_teller"))
    warnings.push(
      "La Adivina necesita un señuelo rojo bueno antes de comenzar.",
    );
  if (count >= 7)
    warnings.push(
      "Prepara tres bluffs buenos, distintos y fuera de juego para el Demonio.",
    );
  if (!tags.has("first-info") && !tags.has("ongoing-info"))
    warnings.push(
      "Hay poca información directa; la partida puede avanzar despacio.",
    );
  if (experience === "new" && advanced.length)
    warnings.push(
      `Registros avanzados para una primera partida: ${advanced.join(" y ")}.`,
    );
  if (roles.includes("saint") && roles.includes("mayor"))
    warnings.push(
      "Santo y Alcalde hacen especialmente importante explicar el cierre del día y las victorias alternativas.",
    );
  return warnings;
}

export function favoriteFromSelection(title, count, roles, drunkBelief = null) {
  const favorite = {
    id: globalThis.crypto?.randomUUID?.() || `favorite-${Date.now()}`,
    source: "favorite",
    title: title.trim(),
    count: Number(count),
    playerCounts: [Number(count)],
    roles: [...roles],
    drunkBelief: drunkBelief || null,
    createdAt: new Date().toISOString(),
  };
  const check = validatePresetDefinition(favorite);
  if (!check.valid) throw new Error(check.errors[0]);
  return favorite;
}
