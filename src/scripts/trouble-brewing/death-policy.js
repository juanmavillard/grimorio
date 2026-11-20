export function validateAttempt({
  state,
  player,
  playerId,
  cause,
  options,
  hasAbility,
  alivePlayers,
  character,
}) {
  if (cause === "imp_self" && player.character === "imp") {
    const forcedScarlet = state.players.some(
      (p) =>
        p.alive &&
        p.character === "scarlet_woman" &&
        hasAbility(p, state) &&
        alivePlayers(state).length >= 5,
    );
    const candidates = state.players.filter(
      (p) =>
        p.alive &&
        (character(p.character, state.scriptId)?.team === "minion" ||
          (p.id === options.successorId &&
            p.character === "recluse" &&
            hasAbility(p, state))),
    );
    if (
      !forcedScarlet &&
      options.successorId &&
      !candidates.some((p) => p.id === options.successorId)
    )
      throw new Error(
        "El sucesor elegido no puede recibir el pase del Diablillo.",
      );
    if (
      !forcedScarlet &&
      candidates.length > 1 &&
      !candidates.some((p) => p.id === options.successorId)
    )
      throw new Error(
        "El Narrador debe elegir qué Esbirro vivo recibe el pase del Diablillo.",
      );
  }
}
export function specialDeath({
  state,
  player,
  playerId,
  cause,
  options,
  diedAtNight,
  recordDeathAttempt,
  resolveDemonDeath,
}) {
  if (player.character === "imp") {
    player.diedThisNight = diedAtNight;
    if (state.phase === "day") state.day.deathOccurred = true;
    recordDeathAttempt(state, playerId, {
      cause,
      sourceId: options.sourceId,
      died: true,
      reason: "Demonio de Trouble Brewing.",
    });
    const result = resolveDemonDeath(
      state,
      playerId,
      cause,
      options.successorId,
    );
    return { died: true, reason: "demon", ...result };
  }
}
export function endPersistentEffects({ state, player, actualRoleForNight }) {
  if (player.character === "poisoner")
    state.players.forEach((p) => {
      p.poisoned = false;
    });
  if (player.character === "monk")
    state.players.forEach((p) => {
      p.protected = false;
    });
  if (actualRoleForNight(player) === "butler") player.masterId = null;
}
export function attackPrevention({ state, player, hasAbility }) {
  return player.character === "soldier" && hasAbility(player, state)
    ? { preventedBy: "soldier", reason: "soldier", message: "Soldado sano." }
    : null;
}
export function prepareDeath({ player, diedAtNight, abilityWasActive }) {
  player.ravenkeeperTriggered =
    diedAtNight && player.character === "ravenkeeper" && abilityWasActive;
}

export function afterNonDemonDeath({
  state,
  player,
  cause,
  abilityWasActive,
  addHistory,
}) {
  if (
    state.outcome ||
    cause !== "execution" ||
    player.character !== "saint" ||
    !abilityWasActive
  )
    return false;
  state.outcome = {
    winner: "evil",
    reason: "El Santo murió por ejecución con su habilidad activa.",
  };
  state.phase = "ended";
  addHistory(state, "Victoria del Mal.", state.outcome.reason);
  return true;
}
