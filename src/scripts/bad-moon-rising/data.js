// Paquete estable de Bad Moon Rising: catálogo y orden nocturno auditados.
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

export const BMR_CHARACTERS = [
  role(
    "grandmother",
    "Abuela",
    "townsfolk",
    "Empiezas sabiendo un jugador bueno y su personaje. Si el Demonio le mata, tú mueres también.",
    "first",
  ),
  role(
    "sailor",
    "Marinero",
    "townsfolk",
    "Cada noche eliges un jugador vivo: tú o él está borracho hasta el anochecer. Mientras tengas habilidad, no puedes morir.",
  ),
  role(
    "chambermaid",
    "Camarera",
    "townsfolk",
    "Cada noche eliges 2 jugadores vivos distintos de ti: sabes cuántos despertaron por su habilidad.",
  ),
  role(
    "exorcist",
    "Exorcista",
    "townsfolk",
    "Cada noche* eliges un jugador distinto al de la noche anterior: si es el Demonio, sabe quién eres y no despierta.",
  ),
  role(
    "innkeeper",
    "Posadero",
    "townsfolk",
    "Cada noche* eliges 2 jugadores: no pueden morir esta noche, pero uno está borracho hasta el anochecer.",
  ),
  role(
    "gambler",
    "Jugador",
    "townsfolk",
    "Cada noche* eliges un jugador y adivinas su personaje: si fallas, mueres.",
  ),
  role(
    "gossip",
    "Chismoso",
    "townsfolk",
    "Cada día puedes hacer una afirmación pública. Esta noche, si era verdadera, un jugador muere.",
  ),
  role(
    "courtier",
    "Cortesano",
    "townsfolk",
    "Una vez por partida, de noche, eliges un personaje: está borracho durante 3 noches y 3 días.",
  ),
  role(
    "professor",
    "Profesor",
    "townsfolk",
    "Una vez por partida, de noche*, eliges un muerto: si es Aldeano, resucita.",
  ),
  role(
    "minstrel",
    "Juglar",
    "townsfolk",
    "Cuando un Esbirro muere por ejecución, todos los demás jugadores salvo Viajeros están borrachos hasta el anochecer de mañana.",
  ),
  role(
    "tea_lady",
    "Dama del Té",
    "townsfolk",
    "Si tus dos vecinos vivos son buenos, no pueden morir.",
  ),
  role(
    "pacifist",
    "Pacifista",
    "townsfolk",
    "Los jugadores buenos ejecutados podrían no morir.",
  ),
  role(
    "fool",
    "Tonto",
    "townsfolk",
    "La primera vez que fueras a morir, no mueres.",
  ),
  role(
    "goon",
    "Matón",
    "outsider",
    "Cada noche, el primer jugador que te elige con su habilidad queda borracho hasta el anochecer. Pasas a su alineamiento.",
  ),
  role(
    "lunatic",
    "Lunático",
    "outsider",
    "Crees que eres un Demonio, pero no lo eres. El Demonio sabe quién eres y a quién eliges por la noche.",
  ),
  role("tinker", "Manitas", "outsider", "Podrías morir en cualquier momento."),
  role(
    "moonchild",
    "Niño Lunar",
    "outsider",
    "Al saber que has muerto, eliges públicamente un jugador vivo: si es bueno, muere esta noche.",
  ),
  role(
    "godfather",
    "Padrino",
    "minion",
    "Empiezas sabiendo los Forasteros en juego. Si un Forastero murió hoy, eliges un jugador esta noche: muere. [-1 o +1 Forastero]",
    "first",
  ),
  role(
    "devils_advocate",
    "Abogado del Diablo",
    "minion",
    "Cada noche eliges un vivo distinto al de la noche anterior: si lo ejecutan mañana, no muere.",
  ),
  role(
    "assassin",
    "Asesino",
    "minion",
    "Una vez por partida, de noche*, eliges un jugador: muere incluso si está protegido.",
  ),
  role(
    "mastermind",
    "Mente Maestra",
    "minion",
    "Si ejecutan al Demonio y eso terminaría la partida, se juega un día más. Si entonces ejecutan a alguien, pierde su equipo.",
  ),
  role(
    "zombuul",
    "Zombuul",
    "demon",
    "Cada noche*, si nadie murió hoy, eliges un jugador: muere. La primera vez que mueres, sigues vivo pero registras como muerto.",
  ),
  role(
    "pukka",
    "Pukka",
    "demon",
    "Cada noche eliges un jugador: queda envenenado. Si tienes habilidad, el previamente envenenado muere y recupera la salud.",
  ),
  role(
    "shabaloth",
    "Shabaloth",
    "demon",
    "Cada noche* eliges 2 jugadores: mueren. Un muerto que elegiste anoche podría ser regurgitado.",
  ),
  role(
    "po_bmr",
    "Po",
    "demon",
    "Cada noche* puedes elegir un jugador: muere. Si no elegiste a nadie anoche, elige 3 jugadores esta noche.",
  ),
];

export const BMR_NIGHT = {
  first: [
    "lunatic",
    "sailor",
    "courtier",
    "godfather",
    "devils_advocate",
    "pukka",
    "grandmother",
    "chambermaid",
  ],
  other: [
    "sailor",
    "courtier",
    "innkeeper",
    "gambler",
    "lunatic",
    "exorcist",
    "devils_advocate",
    "zombuul",
    "pukka",
    "shabaloth",
    "po_bmr",
    "assassin",
    "godfather",
    "gossip",
    "professor",
    "tinker",
    "moonchild",
    "grandmother",
    "chambermaid",
  ],
};
