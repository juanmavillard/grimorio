// Paquete estable de Sects & Violets: catálogo y orden nocturno auditados.
const role = (id, name, team, ability, timing = "other") => ({
  id,
  name,
  team,
  ability,
  timing,
  icon: name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  run: "Sigue la guía contextual, registra objetivos y conserva la decisión del Narrador.",
});

export const SV_CHARACTERS = [
  role(
    "clockmaker",
    "Relojero",
    "townsfolk",
    "Empiezas sabiendo la distancia entre el Demonio y su Esbirro más cercano.",
    "first",
  ),
  role(
    "dreamer",
    "Soñador",
    "townsfolk",
    "Cada noche eliges a otro jugador: recibes un personaje bueno y uno malvado; uno es correcto.",
  ),
  role(
    "snake_charmer",
    "Encantador de Serpientes",
    "townsfolk",
    "Cada noche eliges un jugador vivo: si es el Demonio, intercambiáis personajes y alineamientos; el antiguo Demonio queda envenenado.",
  ),
  role(
    "mathematician",
    "Matemático",
    "townsfolk",
    "Cada noche sabes cuántas habilidades funcionaron anormalmente hoy por la habilidad de otro personaje.",
  ),
  role(
    "flowergirl",
    "Florista",
    "townsfolk",
    "Cada noche*, sabes si un Demonio votó hoy.",
  ),
  role(
    "town_crier",
    "Pregonero",
    "townsfolk",
    "Cada noche*, sabes si un Esbirro nominó hoy.",
  ),
  role(
    "oracle",
    "Oráculo",
    "townsfolk",
    "Cada noche* sabes cuántos jugadores muertos son malvados.",
  ),
  role(
    "savant",
    "Sabio",
    "townsfolk",
    "Cada día puedes visitar al Narrador en privado para recibir dos afirmaciones: una verdadera y una falsa.",
  ),
  role(
    "seamstress",
    "Costurera",
    "townsfolk",
    "Una vez por partida, de noche, eliges a otros 2 jugadores: sabes si tienen la misma alineación.",
  ),
  role(
    "philosopher",
    "Filósofo",
    "townsfolk",
    "Una vez por partida, de noche, eliges un personaje bueno: ganas su habilidad. Si ese personaje está en juego, queda borracho.",
  ),
  role(
    "artist",
    "Artista",
    "townsfolk",
    "Una vez por partida, durante el día, puedes preguntar en privado al Narrador una cuestión de sí/no.",
  ),
  role(
    "juggler",
    "Malabarista",
    "townsfolk",
    "En tu primer día, adivinas públicamente hasta 5 personajes. Esa noche sabes cuántos acertaste.",
  ),
  role(
    "sage",
    "Sabio Ermitaño",
    "townsfolk",
    "Si el Demonio te mata, aprendes que es uno de dos jugadores.",
  ),
  role(
    "mutant",
    "Mutante",
    "outsider",
    "Si estás públicamente loco respecto a ser un Forastero, podrías ser ejecutado.",
  ),
  role(
    "sweetheart",
    "Enamoradizo",
    "outsider",
    "Cuando mueres, un jugador queda borracho desde ese momento.",
  ),
  role(
    "barber",
    "Barbero",
    "outsider",
    "Si mueres hoy o esta noche, el Demonio puede intercambiar los personajes de dos jugadores que no sean otro Demonio.",
  ),
  role(
    "klutz",
    "Patoso",
    "outsider",
    "Al saber que has muerto, eliges públicamente un jugador vivo: si es malvado, tu equipo pierde.",
  ),
  role(
    "evil_twin",
    "Gemelo Malvado",
    "minion",
    "Tú y un jugador del equipo contrario sabéis quién es el otro. Si ejecutan al bueno, gana el Mal; el Bien no puede ganar mientras ambos sigáis vivos.",
    "first",
  ),
  role(
    "witch",
    "Bruja",
    "minion",
    "Cada noche eliges un jugador: si nomina mañana, muere inmediatamente. Con 3 jugadores vivos, pierdes esta habilidad.",
  ),
  role(
    "cerenovus",
    "Cerenovus",
    "minion",
    "Cada noche eliges un jugador y un personaje bueno: debe convencer de ser ese personaje mañana o podría ser ejecutado.",
  ),
  role(
    "pit_hag",
    "Pit-Hag",
    "minion",
    "Cada noche* eliges un jugador y un personaje que no esté en juego: se convierte en él. Si creas un Demonio, las muertes de esta noche son arbitrarias.",
  ),
  role(
    "fang_gu",
    "Fang Gu",
    "demon",
    "Cada noche* eliges un jugador: muere. El primer Forastero que mates se convierte en un Fang Gu malvado y tú mueres en su lugar. [+1 Forastero]",
  ),
  role(
    "vigormortis",
    "Vigormortis",
    "demon",
    "Cada noche* eliges un jugador: muere. Los Esbirros que matas conservan su habilidad y envenenan a 1 vecino Aldeano. [-1 Forastero]",
  ),
  role(
    "no_dashii",
    "No Dashii",
    "demon",
    "Cada noche* eliges un jugador: muere. Tus dos vecinos Aldeanos están envenenados.",
  ),
  role(
    "vortox",
    "Vortox",
    "demon",
    "Cada noche* eliges un jugador: muere. Las habilidades de Aldeano producen información falsa. Si nadie es ejecutado hoy, gana el Mal.",
  ),
];

export const SV_NIGHT = {
  first: [
    "philosopher",
    "snake_charmer",
    "evil_twin",
    "witch",
    "cerenovus",
    "clockmaker",
    "dreamer",
    "seamstress",
    "mathematician",
  ],
  // Los disparadores de muerte se resuelven cuando ocurren. El Malabarista
  // recibe su cifra una sola vez, en la segunda noche.
  other: [
    "philosopher",
    "snake_charmer",
    "witch",
    "cerenovus",
    "pit_hag",
    "fang_gu",
    "no_dashii",
    "vortox",
    "vigormortis",
    "dreamer",
    "flowergirl",
    "town_crier",
    "oracle",
    "seamstress",
    "juggler",
    "mathematician",
  ],
};
