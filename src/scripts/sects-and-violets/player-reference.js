// Referencia pública revisada: no contiene decisiones privadas ni estado de partida.
export const PLAYER_REFERENCE = {
  clockmaker: {
    moment: "Primera noche",
    clarification:
      "La distancia se mide por asientos, en cualquiera de las dos direcciones.",
  },
  dreamer: {
    moment: "Cada noche",
    clarification:
      "Elige a otra persona. Recibes un personaje bueno y uno malvado.",
  },
  snake_charmer: {
    moment: "Cada noche",
    clarification:
      "Quien era Demonio pasa a tu personaje y queda envenenado; tú pasas a ser Demonio.",
  },
  mathematician: {
    moment: "Cada noche",
    clarification:
      "Cuenta habilidades alteradas por otras, no simplemente cuántos jugadores están envenenados.",
  },
  flowergirl: {
    moment: "Cada noche*",
    clarification: "Detectas si votó un Demonio, no a cuál ni cuántas veces.",
  },
  town_crier: {
    moment: "Cada noche*",
    clarification: "Detectas nominaciones de Esbirros, no votos.",
  },
  oracle: {
    moment: "Cada noche*",
    clarification:
      "Importa el alineamiento de los muertos, no su categoría de personaje.",
  },
  savant: {
    moment: "Cada día, visita privada",
    clarification:
      "No sabes cuál afirmación es verdadera; Vortox puede alterar esta información.",
  },
  seamstress: {
    moment: "Una vez, de noche",
    clarification:
      "Puedes esperar. Elige a otros dos jugadores; pueden estar muertos.",
  },
  philosopher: {
    moment: "Una vez, de noche",
    clarification:
      "Ganas una habilidad; no cambias automáticamente tu personaje.",
  },
  artist: {
    moment: "Una vez, de día y en privado",
    clarification: "Formula una pregunta de sí/no al Narrador.",
  },
  juggler: {
    moment: "Tu primer día; información esa noche",
    clarification:
      "Haz tus conjeturas públicamente. Solo recibes el total acertado.",
  },
  sage: {
    moment: "Si el Demonio te mata",
    clarification: "Recibes dos candidatos, no la identidad exacta.",
  },
  mutant: {
    moment: "Durante el día",
    clarification:
      "Locura significa intentar convencer al grupo; no exige actuar una emoción.",
  },
  sweetheart: {
    moment: "Cuando mueres",
    clarification:
      "No eliges a quién emborrachas y no tienes por qué conocerlo.",
  },
  barber: {
    moment: "Tras tu muerte de día o de noche",
    clarification:
      "El intercambio es opcional y no cambia por sí solo los alineamientos.",
  },
  klutz: {
    moment: "Cuando conoces tu muerte",
    clarification: "Debes elegir públicamente a un jugador vivo.",
  },
  evil_twin: {
    moment: "Información inicial y condiciones continuas",
    clarification:
      "Los personajes y los alineamientos son conceptos distintos.",
  },
  witch: {
    moment: "Cada noche; efecto al día siguiente",
    clarification:
      "La nominación cuenta aunque provoque la muerte del nominador.",
  },
  cerenovus: {
    moment: "Cada noche; locura durante el día siguiente",
    clarification:
      "Debes intentar convencer de ser el personaje indicado; la ejecución no es automática.",
  },
  pit_hag: {
    moment: "Cada noche*",
    clarification:
      "Cambiar de personaje no cambia por sí mismo el alineamiento.",
  },
  fang_gu: {
    moment: "Cada noche*",
    clarification:
      "El salto al primer Forastero sucede una sola vez en la partida.",
  },
  vigormortis: {
    moment: "Cada noche*; efectos continuos",
    clarification:
      "Solo los Esbirros muertos por este Demonio conservan su habilidad por este efecto.",
  },
  no_dashii: {
    moment: "Ataque cada noche*; veneno continuo",
    clarification:
      "Se buscan los Aldeanos más cercanos por cada lado, aunque estén muertos.",
  },
  vortox: {
    moment: "Ataque cada noche*; condición al cerrar el día",
    clarification:
      "La información de Aldeanos debe ser falsa, no solo dudosa. La ejecución puede ser de un muerto.",
  },
};
