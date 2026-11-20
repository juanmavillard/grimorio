export function specialDeath({
  state,
  player,
  playerId,
  cause,
  options,
  abilityWasActive,
  recordDeathAttempt,
  addHistory,
}) {
  if (
    player.character === "zombuul" &&
    state.scriptId === "bad_moon_rising" &&
    abilityWasActive &&
    !player.zombuulRegisteredDead &&
    !options.ignoreProtection
  ) {
    player.zombuulRegisteredDead = true;
    player.alive = false;
    player.ghostVote = true;
    player.diedThisNight = state.phase === "night";
    if (state.phase === "day") state.day.deathOccurred = true;
    recordDeathAttempt(state, playerId, {
      cause,
      died: false,
      preventedBy: "zombuul_first_death",
      reason: "El Zombuul sigue vivo, pero registra como muerto.",
      resolution: "registered_dead",
    });
    addHistory(
      state,
      `${player.name} registra como muerto.`,
      "La primera muerte del Zombuul no lo mata realmente.",
      {
        action: "zombuul_first_death",
        targetId: playerId,
        automatic: true,
        rule: "Zombuul",
      },
    );
    return { died: false, reason: "zombuul_registered_dead" };
  }
}
export function afterDeath({
  state,
  player,
  playerId,
  cause,
  options,
  character,
  resolveMinstrel,
  hasAbility,
  killPlayer,
}) {
  if (
    cause === "execution" &&
    character(player.character, state.scriptId)?.team === "minion"
  )
    resolveMinstrel(state, player.id);
  if (
    !options.skipGrandmother &&
    (cause === "demon_attack" || cause === "night_redirect")
  ) {
    const grandmother = state.players.find(
      (candidate) =>
        candidate.alive &&
        candidate.character === "grandmother" &&
        candidate.grandmotherChildId === playerId &&
        hasAbility(candidate, state),
    );
    if (grandmother) {
      grandmother.grandmotherTriggerPending = false;
      killPlayer(state, grandmother.id, "grandmother", {
        sourceId: options.sourceId,
        skipGrandmother: true,
      });
    }
  }
}
export function prepareDeath({ player }) {
  if (player.character === "moonchild") player.moonchildPending = true;
}
export function canAttemptDead(player) {
  return player.character === "zombuul" && player.zombuulRegisteredDead;
}
export function preventDeath({
  state,
  player,
  cause,
  options,
  bmrDeathPrevention,
  recordBmrPrevention,
}) {
  const reason = bmrDeathPrevention(state, player, cause, options);
  return reason ? recordBmrPrevention(state, player, cause, reason) : null;
}
export function afterCleanup({ state, player, refreshBmrDrunkenness }) {
  if (player.character === "courtier") refreshBmrDrunkenness(state);
}

export function countsAsAlive(player) {
  return player.character === "zombuul" && player.zombuulRegisteredDead;
}
export function blocksTwoAliveVictory(state) {
  return (state.pendingEffects || []).some(
    (effect) =>
      effect.type === "mastermind_extra_day" && effect.status === "pending",
  );
}
export function deferDemonVictory({
  state,
  playerId,
  cause,
  anotherLivingDemon,
  hasAbility,
  addHistory,
  uid,
}) {
  const active =
    cause === "execution" &&
    state.players.some(
      (p) => p.alive && p.character === "mastermind" && hasAbility(p, state),
    );
  if (!state.outcome && active && !anotherLivingDemon) {
    (state.pendingEffects ||= []).push({
      id: uid(),
      type: "mastermind_extra_day",
      playerId,
      cause,
      createdRound: state.round,
      private: true,
      status: "pending",
    });
    addHistory(
      state,
      "Mente Maestra: día adicional.",
      "El Demonio murió por ejecución. Juega un día más; si entonces ejecutan a alguien, pierde su equipo.",
      { action: "pending_effect", automatic: true, rule: "Mente Maestra" },
    );
  }
  return active;
}
