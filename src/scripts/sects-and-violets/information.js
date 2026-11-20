// Reglas de información propias del guion.
export function createSectsVioletsInformation({
  isSnv,
  hasAbility,
  character,
  getPlayer,
}) {
  function vortoxForcesFalseInformation(state) {
    return (
      isSnv(state) &&
      state.players.some(
        (player) =>
          player.alive &&
          player.character === "vortox" &&
          hasAbility(player, state),
      )
    );
  }

  function clockmakerNumber(state) {
    if (!isSnv(state))
      throw new Error("Este cálculo pertenece a Sects & Violets.");
    const ordered = [...state.players].sort((a, b) => a.seat - b.seat);
    const demons = ordered
      .map((player, index) => ({ player, index }))
      .filter(
        ({ player }) =>
          character(player.character, state.scriptId)?.team === "demon",
      );
    const minions = ordered
      .map((player, index) => ({ player, index }))
      .filter(
        ({ player }) =>
          character(player.character, state.scriptId)?.team === "minion",
      );
    if (!demons.length || !minions.length) return null;
    return Math.min(
      ...demons.flatMap((demon) =>
        minions.map((minion) => {
          const distance = Math.abs(demon.index - minion.index);
          return Math.min(distance, ordered.length - distance);
        }),
      ),
    );
  }

  function flowergirlAnswer(state) {
    if (!isSnv(state))
      throw new Error("Este cálculo pertenece a Sects & Violets.");
    return (state.day?.nominations || []).some(
      (nomination) =>
        nomination.demonVoted ??
        (nomination.voterIds || []).some(
          (id) =>
            character(getPlayer(state, id)?.character, state.scriptId)?.team ===
            "demon",
        ),
    );
  }

  function townCrierAnswer(state) {
    if (!isSnv(state))
      throw new Error("Este cálculo pertenece a Sects & Violets.");
    return (state.day?.nominations || []).some(
      (nomination) =>
        nomination.minionNominated ??
        character(
          getPlayer(state, nomination.nominatorId)?.character,
          state.scriptId,
        )?.team === "minion",
    );
  }

  function oracleNumber(state) {
    if (!isSnv(state))
      throw new Error("Este cálculo pertenece a Sects & Violets.");
    return state.players.filter(
      (player) => !player.alive && player.alignment === "evil",
    ).length;
  }

  function seamstressSameAlignment(state, firstId, secondId) {
    if (!isSnv(state))
      throw new Error("Este cálculo pertenece a Sects & Violets.");
    const first = getPlayer(state, firstId),
      second = getPlayer(state, secondId);
    if (!first || !second || first.id === second.id)
      throw new Error("La Costurera debe elegir dos jugadores distintos.");
    return first.alignment === second.alignment;
  }

  return {
    vortoxForcesFalseInformation,
    clockmakerNumber,
    flowergirlAnswer,
    townCrierAnswer,
    oracleNumber,
    seamstressSameAlignment,
  };
}
