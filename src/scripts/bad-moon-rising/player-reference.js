// Referencia pública revisada: no contiene decisiones privadas ni estado de partida.
export const PLAYER_REFERENCE = {
  grandmother: {
    moment: "Primera noche; reacción a la muerte del nieto",
    clarification:
      "No vuelves a recibir información cada noche. El nieto no conoce el vínculo.",
  },
  sailor: {
    moment: "Cada noche; supervivencia continua",
    clarification:
      "Puedes elegirte. La borrachera puede hacerte perder tu protección.",
  },
  chambermaid: {
    moment: "Cada noche",
    clarification:
      "No puedes elegirte; elige dos vivos distintos. Cuenta despertares por habilidad.",
  },
  exorcist: {
    moment: "Cada noche*",
    clarification:
      "Puedes elegir a un muerto, pero no repetir al jugador de la noche anterior.",
  },
  innkeeper: {
    moment: "Cada noche*",
    clarification:
      "La protección es nocturna; uno de los dos elegidos queda borracho.",
  },
  gambler: {
    moment: "Cada noche*",
    clarification: "Puedes apostar por ti mismo o por un muerto.",
  },
  gossip: {
    moment: "Declaración de día; efecto esa noche",
    clarification:
      "La afirmación debe ser pública y quedar clara como uso de tu habilidad.",
  },
  courtier: {
    moment: "Una vez, de noche",
    clarification: "Puedes esperar; eliges un personaje, no un jugador.",
  },
  professor: {
    moment: "Una vez, de noche*",
    clarification:
      "Puedes esperar; un muerto que no sea Aldeano no resucita por esta habilidad.",
  },
  minstrel: {
    moment: "Cuando un Esbirro muere por ejecución",
    clarification: "Una ejecución sin muerte no activa el efecto.",
  },
  tea_lady: {
    moment: "Protección continua",
    clarification:
      "Se consideran tus dos vecinos vivos; deben ser ambos buenos.",
  },
  pacifist: {
    moment: "Ante la ejecución de un jugador bueno",
    clarification: "La supervivencia es posible, no obligatoria.",
  },
  fool: {
    moment: "Primera vez que fueras a morir",
    clarification: "Una ejecución puede consumirse aunque no mueras.",
  },
  goon: {
    moment: "Primera elección nocturna que te afecta",
    clarification: "La elección debe proceder de la habilidad de otro jugador.",
  },
  lunatic: {
    moment: "Según el Demonio que crees ser",
    clarification:
      "No conoces tu identidad real. Tus elecciones no causan las muertes del Demonio.",
  },
  tinker: {
    moment: "En cualquier momento",
    clarification:
      "Tu muerte no demuestra por sí sola que te haya atacado alguien.",
  },
  moonchild: {
    moment: "Cuando conoces tu muerte",
    clarification:
      "Elige públicamente un vivo; la consecuencia se resuelve por la noche.",
  },
  godfather: {
    moment: "Información inicial; ataque nocturno condicional",
    clarification:
      "Sabes personajes Forasteros, no sus jugadores. El ajuste inicial es -1 o +1.",
  },
  devils_advocate: {
    moment: "Cada noche",
    clarification:
      "Elige un vivo distinto al de la noche anterior; la ejecución puede ocurrir sin muerte.",
  },
  assassin: {
    moment: "Una vez, de noche*",
    clarification:
      "Puedes esperar; tu ataque ignora las protecciones que normalmente impedirían morir.",
  },
  mastermind: {
    moment: "Tras una ejecución del Demonio que terminaría la partida",
    clarification: "El día extra puede cambiar qué equipo pierde al ejecutar.",
  },
  zombuul: {
    moment: "Cada noche* si nadie murió de día",
    clarification:
      "Tu primera muerte es aparente: aún debes ser eliminado de verdad.",
  },
  pukka: {
    moment: "Cada noche",
    clarification:
      "Primero se envenena al nuevo objetivo; después se resuelve el anterior.",
  },
  shabaloth: {
    moment: "Cada noche*",
    clarification:
      "Una regurgitación posible no es una resurrección garantizada.",
  },
  po_bmr: {
    moment: "Cada noche*",
    clarification:
      "Elegir a nadie carga el siguiente ataque; entonces eliges tres jugadores.",
  },
};
