// Excepciones de nominación y cierre del día de Trouble Brewing.
export function preview({
  state,
  nominatorId,
  nomineeId,
  options,
  previewVirginNomination,
}) {
  const result = previewVirginNomination(
    state,
    nominatorId,
    nomineeId,
    options,
  );
  return { ...result, skipVoting: result.virginTriggers };
}
export function afterNomination({ preview, nominee, nominator }) {
  if (preview.virginFirstNomination) nominee.abilityUsed = true;
  if (!preview.virginTriggers) return null;
  return {
    executedId: nominator.id,
    text: "La Virgen activa su habilidad.",
    detail: `${nominator.name} es ejecutado inmediatamente; terminan las nominaciones.`,
  };
}
export function onNoExecution({ state, hasAbility, alivePlayers, addHistory }) {
  const mayor = state.players.find(
    (p) => p.alive && p.character === "mayor" && hasAbility(p, state),
  );
  if (alivePlayers(state).length === 3 && mayor) {
    state.outcome = {
      winner: mayor.alignment,
      reason: "Tres jugadores vivos y ninguna ejecución: se activa el Alcalde.",
    };
    state.phase = "ended";
    addHistory(
      state,
      mayor.alignment === "good" ? "Victoria del Bien." : "Victoria del Mal.",
      state.outcome.reason,
    );
  }
}
