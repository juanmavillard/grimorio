export function beforeClose({ state }) {
  return (state.pendingEffects || []).find(
    (effect) =>
      effect.type === "mastermind_extra_day" &&
      effect.status === "pending" &&
      effect.createdRound < state.round,
  );
}
export function executionOptions(options) {
  return { pacifistSaves: Boolean(options.pacifistSaves) };
}
export function afterClose({ state, leader, snapshot, getPlayer, addHistory }) {
  if (!snapshot) return;
  const executed = leader.nomineeId ? getPlayer(state, leader.nomineeId) : null;
  state.outcome = executed
    ? {
        winner: executed.alignment === "good" ? "evil" : "good",
        reason: `Mente Maestra: ${executed.name} fue ejecutado en el día adicional y su equipo pierde.`,
      }
    : {
        winner: "good",
        reason: "Mente Maestra: terminó el día adicional sin otra ejecución.",
      };
  state.phase = "ended";
  snapshot.status = "resolved";
  addHistory(
    state,
    state.outcome.winner === "good"
      ? "Victoria del Bien."
      : "Victoria del Mal.",
    state.outcome.reason,
    { action: "victory", automatic: true, rule: "Mente Maestra" },
  );
}
