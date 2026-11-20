// Referencia pública revisada: no contiene decisiones privadas ni estado de partida.
export const PLAYER_REFERENCE = {
  washerwoman: {
    moment: "Primera noche",
    clarification:
      "Conoces dos candidatos, no cuál de ellos es el personaje mostrado.",
  },
  librarian: {
    moment: "Primera noche",
    clarification: "Un 0 indica que no se detectan Forasteros.",
  },
  investigator: {
    moment: "Primera noche",
    clarification:
      "Los registros del Recluso y del Espía pueden afectar a la información.",
  },
  chef: {
    moment: "Primera noche",
    clarification:
      "Las parejas son vecinos de asiento; el círculo une el último con el primero.",
  },
  empath: {
    moment: "Cada noche",
    clarification:
      "Se ignoran los vecinos muertos al buscar tus dos vecinos vivos.",
  },
  fortune_teller: {
    moment: "Cada noche",
    clarification:
      "Puedes elegirte y elegir muertos; el señuelo es un jugador bueno.",
  },
  undertaker: {
    moment: "Cada noche* tras una muerte por ejecución",
    clarification: "Una ejecución que no mata no aporta un personaje nuevo.",
  },
  monk: {
    moment: "Cada noche*",
    clarification: "No puedes protegerte a ti mismo.",
  },
  ravenkeeper: {
    moment: "Cuando mueres de noche",
    clarification: "Tu elección puede ser un jugador vivo o muerto.",
  },
  virgin: {
    moment: "Primera nominación que recibes",
    clarification:
      "Puede activarse sin una votación normal; no basta con que el nominador sea bueno.",
  },
  slayer: {
    moment: "Una vez, de día y en público",
    clarification: "El disparo se gasta aunque no muera nadie.",
  },
  soldier: {
    moment: "Protección continua",
    clarification:
      "No te protege de la ejecución ni de todas las demás habilidades.",
  },
  mayor: {
    moment: "Cierre del día y muertes nocturnas",
    clarification:
      "La victoria requiere exactamente tres vivos y ninguna ejecución ese día.",
  },
  butler: {
    moment: "Cada noche; restricción de voto al día siguiente",
    clarification:
      "Elige a otro jugador como amo. Puede ser un muerto con voto disponible.",
  },
  drunk: {
    moment: "Identidad aparente desde el inicio",
    clarification:
      "No sabes que eres el Borracho; tu habilidad aparente no funciona realmente.",
  },
  recluse: {
    moment: "Registro continuo, incluso muerto",
    clarification: "Registrar como malvado no cambia tu alineamiento real.",
  },
  saint: {
    moment: "Si mueres por ejecución",
    clarification: "Morir por otra causa no activa esta derrota.",
  },
  poisoner: {
    moment: "Cada noche",
    clarification: "El veneno dura esa noche y el día siguiente.",
  },
  spy: {
    moment: "Cada noche; registro continuo",
    clarification:
      "Puedes registrar como bueno, Aldeano o Forastero, incluso después de morir.",
  },
  scarlet_woman: {
    moment: "Cuando muere el Demonio",
    clarification:
      "Para el umbral se cuentan los vivos justo antes de esa muerte.",
  },
  baron: {
    moment: "Preparación",
    clarification:
      "Se sustituyen dos Aldeanos por dos Forasteros; morir no revierte el reparto.",
  },
  imp: {
    moment: "Cada noche*",
    clarification:
      "El pase ocurre si te matas con tu propio ataque y hay un sucesor apto.",
  },
};
