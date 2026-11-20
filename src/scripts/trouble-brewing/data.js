export const TEAM_LABELS = {
  townsfolk: "Aldeanos",
  outsider: "Forasteros",
  minion: "Esbirros",
  demon: "Demonio",
};

export const TEAM_SHORT = {
  townsfolk: "A",
  outsider: "F",
  minion: "E",
  demon: "D",
};

export const CHARACTERS = [
  {
    id: "washerwoman",
    name: "Lavandera",
    team: "townsfolk",
    icon: "LA",
    timing: "first",
    ability: "Empiezas sabiendo que 1 de 2 jugadores es un Aldeano concreto.",
    run: "Elige un Aldeano que registre como tal, otro jugador señuelo y el personaje que mostrarás.",
  },
  {
    id: "librarian",
    name: "Bibliotecario",
    team: "townsfolk",
    icon: "BI",
    timing: "first",
    ability:
      "Empiezas sabiendo que 1 de 2 jugadores es un Forastero concreto (o que hay 0).",
    run: "Si no hay Forasteros puedes mostrar 0. El Borracho se muestra como Borracho, no como el personaje que cree ser.",
  },
  {
    id: "investigator",
    name: "Investigador",
    team: "townsfolk",
    icon: "IN",
    timing: "first",
    ability: "Empiezas sabiendo que 1 de 2 jugadores es un Esbirro concreto.",
    run: "El Recluso puede registrar como Esbirro; elige dos jugadores y el personaje mostrado.",
  },
  {
    id: "chef",
    name: "Chef",
    team: "townsfolk",
    icon: "CH",
    timing: "first",
    ability: "Empiezas sabiendo cuántas parejas de jugadores malvados hay.",
    run: "Cuenta cada borde del círculo cuyos dos extremos registren como malvados. Un jugador puede formar dos parejas.",
  },
  {
    id: "empath",
    name: "Empática",
    team: "townsfolk",
    icon: "EM",
    timing: "each",
    ability: "Cada noche, sabes cuántos de tus 2 vecinos vivos son malvados.",
    run: "Ignora jugadores muertos. Actúa después del Demonio y usa el estado actual al amanecer.",
  },
  {
    id: "fortune_teller",
    name: "Adivina",
    team: "townsfolk",
    icon: "AD",
    timing: "each",
    ability:
      "Cada noche eliges 2 jugadores y sabes si alguno es Demonio. Un jugador bueno registra como Demonio para ti.",
    run: "El señuelo rojo es siempre el mismo jugador bueno. Puede elegirse a sí misma y a jugadores muertos.",
  },
  {
    id: "undertaker",
    name: "Enterrador",
    team: "townsfolk",
    icon: "EN",
    timing: "other",
    ability: "Cada noche*, sabes qué personaje murió hoy por ejecución.",
    run: "Solo despierta si una ejecución causó una muerte. Muestra el personaje real; al Borracho se le muestra Borracho.",
  },
  {
    id: "monk",
    name: "Monje",
    team: "townsfolk",
    icon: "MO",
    timing: "other",
    ability:
      "Cada noche*, eliges a otro jugador: está a salvo del Demonio esa noche.",
    run: "No puede elegirse a sí mismo. La protección termina al amanecer.",
  },
  {
    id: "ravenkeeper",
    name: "Guardián de Cuervos",
    team: "townsfolk",
    icon: "GC",
    timing: "death",
    ability:
      "Si mueres de noche, despiertas, eliges a un jugador y sabes su personaje.",
    run: "Se resuelve inmediatamente después de su muerte nocturna, aunque ya esté muerto.",
  },
  {
    id: "virgin",
    name: "Virgen",
    team: "townsfolk",
    icon: "VI",
    timing: "day",
    ability:
      "La 1.ª vez que te nominan, si quien nomina es Aldeano, se ejecuta inmediatamente.",
    run: "Se gasta incluso borracha o envenenada y aunque no ocurra nada. El Espía puede registrar como Aldeano.",
  },
  {
    id: "slayer",
    name: "Exterminador",
    team: "townsfolk",
    icon: "EX",
    timing: "day",
    ability:
      "Una vez por partida, de día y en público, eliges un jugador: si es Demonio, muere.",
    run: "Se gasta incluso borracho o envenenado. El Recluso puede registrar como Demonio y morir sin terminar la partida.",
  },
  {
    id: "soldier",
    name: "Soldado",
    team: "townsfolk",
    icon: "SO",
    timing: "passive",
    ability: "Estás a salvo del Demonio.",
    run: "Un ataque del Diablillo no le mata, pero puede morir por ejecución. Sin habilidad, sí muere.",
  },
  {
    id: "mayor",
    name: "Alcalde",
    team: "townsfolk",
    icon: "AL",
    timing: "passive",
    ability:
      "Con solo 3 vivos y sin ejecución, tu equipo gana. Si mueres de noche, otro jugador podría morir en tu lugar.",
    run: "El Narrador decide la redirección. Un objetivo muerto, Soldado sano o protegido puede producir cero muertes.",
  },
  {
    id: "butler",
    name: "Mayordomo",
    team: "outsider",
    icon: "MY",
    timing: "each",
    ability:
      "Cada noche eliges amo: mañana solo puedes votar cuando vote esa persona.",
    run: "El propio jugador debe respetarlo. Un voto accidental se cuenta para no revelar su personaje.",
  },
  {
    id: "drunk",
    name: "Borracho",
    team: "outsider",
    icon: "BR",
    timing: "setup",
    ability:
      "No sabes que eres el Borracho. Crees ser un Aldeano, pero no lo eres.",
    run: "Recibe un Aldeano no jugado como personaje aparente. No tiene habilidad, pero simula sus despertares e información.",
  },
  {
    id: "recluse",
    name: "Recluso",
    team: "outsider",
    icon: "RE",
    timing: "passive",
    ability:
      "Puedes registrar como malvado y como Esbirro o Demonio, incluso muerto.",
    run: "El Narrador decide cada registro por separado. No obtiene la habilidad del personaje registrado.",
  },
  {
    id: "saint",
    name: "Santo",
    team: "outsider",
    icon: "SA",
    timing: "passive",
    ability: "Si mueres por ejecución, tu equipo pierde.",
    run: "Si está borracho o envenenado cuando muere por ejecución, la habilidad no funciona.",
  },
  {
    id: "poisoner",
    name: "Envenenador",
    team: "minion",
    icon: "EV",
    timing: "each",
    ability:
      "Cada noche eliges un jugador: queda envenenado esa noche y el día siguiente.",
    run: "El veneno anterior termina al anochecer. Si el Envenenador pierde la habilidad, su efecto persistente termina.",
  },
  {
    id: "spy",
    name: "Espía",
    team: "minion",
    icon: "ES",
    timing: "each",
    ability:
      "Cada noche ves el Grimorio. Puedes registrar como bueno y como Aldeano o Forastero, incluso muerto.",
    run: "Puede registrar de forma distinta ante cada habilidad. No obtiene la habilidad imitada.",
  },
  {
    id: "scarlet_woman",
    name: "Mujer Escarlata",
    team: "minion",
    icon: "ME",
    timing: "trigger",
    ability: "Si hay 5+ vivos y muere el Demonio, te conviertes en Demonio.",
    run: "Cuenta los vivos justo antes de la muerte. La transformación es inmediata y obligatoria si su habilidad funciona.",
  },
  {
    id: "baron",
    name: "Barón",
    team: "minion",
    icon: "BA",
    timing: "setup",
    ability: "Hay 2 Forasteros adicionales. [+2 Forasteros]",
    run: "Durante la preparación sustituye 2 Aldeanos por 2 Forasteros. No se revierte al morir.",
  },
  {
    id: "imp",
    name: "Diablillo",
    team: "demon",
    icon: "DI",
    timing: "other",
    ability:
      "Cada noche* eliges un jugador: muere. Si te matas así, un Esbirro se convierte en Diablillo.",
    run: "Puede elegir vivos, muertos o a sí mismo. El nuevo Diablillo no ataca esa misma noche.",
  },
];

export const CHARACTER_BY_ID = Object.fromEntries(
  CHARACTERS.map((c) => [c.id, c]),
);
export const GROUPED_CHARACTERS = Object.groupBy
  ? Object.groupBy(CHARACTERS, (c) => c.team)
  : CHARACTERS.reduce((acc, c) => ((acc[c.team] ||= []).push(c), acc), {});

export const PLAYER_COUNTS = {
  5: [3, 0, 1, 1],
  6: [3, 1, 1, 1],
  7: [5, 0, 1, 1],
  8: [5, 1, 1, 1],
  9: [5, 2, 1, 1],
  10: [7, 0, 2, 1],
  11: [7, 1, 2, 1],
  12: [7, 2, 2, 1],
  13: [9, 0, 3, 1],
  14: [9, 1, 3, 1],
  15: [9, 2, 3, 1],
};

export const FIRST_NIGHT_ORDER = [
  "poisoner",
  "washerwoman",
  "librarian",
  "investigator",
  "chef",
  "empath",
  "fortune_teller",
  "butler",
  "spy",
];
export const OTHER_NIGHT_ORDER = [
  "poisoner",
  "monk",
  "imp",
  "ravenkeeper",
  "empath",
  "fortune_teller",
  "undertaker",
  "butler",
  "spy",
];

export const OFFICIAL_SOURCES = [
  ["Trouble Brewing", "https://wiki.bloodontheclocktower.com/Trouble_Brewing"],
  ["Preparación oficial", "https://wiki.bloodontheclocktower.com/Setup"],
  [
    "Habilidades y precedencia",
    "https://wiki.bloodontheclocktower.com/Abilities",
  ],
  [
    "Estados: muerte, veneno y borrachera",
    "https://wiki.bloodontheclocktower.com/States",
  ],
  [
    "Glosario, votos y ejecuciones",
    "https://wiki.bloodontheclocktower.com/Glossary",
  ],
  ["Términos de uso", "https://bloodontheclocktower.com/pages/terms-of-use"],
];
