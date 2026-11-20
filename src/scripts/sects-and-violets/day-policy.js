export function permitsDeadNominator({ pending, nominatorId, nomineeId }) {
  return (
    pending?.nominatorId === nominatorId &&
    pending?.nomineeId === nomineeId &&
    pending?.witchTriggered
  );
}
export function afterNomination({
  state,
  nominatorId,
  resolveWitchNomination,
}) {
  resolveWitchNomination(state, nominatorId);
}
export function afterClose({ state, leader, hasAbility, addHistory }) {
  const vortox = state.players.some(
    (player) =>
      player.alive &&
      player.character === "vortox" &&
      hasAbility(player, state),
  );
  if (!state.outcome && vortox && !leader.nomineeId) {
    state.outcome = {
      winner: "evil",
      reason: "Con Vortox vivo, hoy no hubo ejecución.",
    };
    state.phase = "ended";
    addHistory(state, "Victoria del Mal.", state.outcome.reason, {
      action: "victory",
      automatic: true,
      rule: "Vortox",
    });
  }
}
export function onDawn({ state, alivePlayers }) {
  if (alivePlayers(state).length <= 3) {
    state.witchCurseId = null;
    state.witchCurseRound = null;
  }
}
