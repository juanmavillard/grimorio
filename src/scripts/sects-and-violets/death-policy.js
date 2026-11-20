export function afterDeath({
  state,
  player,
  playerId,
  cause,
  options,
  abilityWasActive,
  getPlayer,
  character,
  abilityRole,
  queueEffect,
}) {
  {
    const source = options.sourceId ? getPlayer(state, options.sourceId) : null;
    const dyingRole = abilityRole(player);
    if (dyingRole === "sweetheart" && abilityWasActive)
      queueEffect(state, {
        type: "sweetheart_drunk",
        label: `Enamoradizo: elegir quién queda ebrio`,
        source: { roleId: "sweetheart", playerId },
        targetIds: state.players
          .filter((candidate) => candidate.id !== playerId)
          .map((candidate) => candidate.id),
        data: {
          instruction:
            "Elige en privado un jugador que queda ebrio desde ahora.",
        },
      });
    if (dyingRole === "barber" && abilityWasActive)
      queueEffect(state, {
        type: "barber_swap",
        label: `Barbero: intercambio opcional del Demonio`,
        source: { roleId: "barber", playerId },
        targetIds: state.players.map((candidate) => candidate.id),
        data: {
          instruction:
            "El Demonio puede elegir dos jugadores; puede elegirse a sí mismo, pero no a otro Demonio.",
        },
      });
    if (
      dyingRole === "sage" &&
      source &&
      character(source.character, state.scriptId)?.team === "demon" &&
      cause === "demon_attack"
    )
      queueEffect(state, {
        type: "sage_info",
        label: `Ermitaño: mostrar dos posibles Demonios`,
        source: { roleId: "sage", playerId },
        targetIds: state.players
          .filter((candidate) => candidate.id !== playerId)
          .map((candidate) => candidate.id),
        data: {
          demonId: source.id,
          unreliable: !abilityWasActive,
          instruction: abilityWasActive
            ? "Muestra al Ermitaño dos jugadores de acuerdo con su información y cualquier efecto que la altere."
            : "Su información es simulada: elige dos jugadores sin exigir que uno sea el Demonio.",
        },
      });
    if (dyingRole === "klutz" && abilityWasActive)
      queueEffect(state, {
        type: "klutz_choice",
        label: `Patoso: elección pública pendiente`,
        source: { roleId: "klutz", playerId },
        targetIds: state.players
          .filter((candidate) => candidate.alive)
          .map((candidate) => candidate.id),
        data: {
          instruction:
            "Cuando sepa que ha muerto, debe elegir públicamente un jugador vivo. Si es malvado, pierde el Bien.",
        },
      });
  }
}
export function endPersistentEffects({
  state,
  player,
  getPlayer,
  applySnvPassiveEffects,
}) {
  if (player.character !== "philosopher") return;
  const target = getPlayer(state, player.philosopherDrunkTargetId);
  if (target) target.philosopherDrunk = false;
  applySnvPassiveEffects(state);
}
export function blocksEffect(effect, state, transition) {
  return (
    [
      "sweetheart_drunk",
      "sage_info",
      "vigormortis_neighbour",
      "character_change_notice",
    ].includes(effect.type) ||
    (effect.type === "klutz_choice" && state.phase === "day") ||
    (effect.type === "barber_swap" &&
      (state.phase === "night" || transition === "night"))
  );
}
export function onDeathMarked({
  state,
  player,
  source,
  alivePlayers,
  character,
}) {
  if (alivePlayers(state).length <= 3) {
    state.witchCurseId = null;
    state.witchCurseRound = null;
  }
  if (
    source?.character === "vigormortis" &&
    character(player.character, state.scriptId)?.team === "minion"
  )
    player.killedByVigormortis = true;
}
export function afterCleanup({ state, player, applySnvPassiveEffects }) {
  if (
    player.killedByVigormortis ||
    ["vigormortis", "no_dashii"].includes(player.character)
  )
    applySnvPassiveEffects(state);
}
// También se limpia en personajes heredados de otros guiones que conservaran estos campos.
export function resetCharacterUsage(player) {
  player.philosopherRole = null;
  player.philosopherSimulatedRole = null;
  player.philosopherChoiceNight = null;
  player.philosopherDrunkTargetId = null;
  player.philosopherGainedAbilityUsed = false;
  player.savantLastRound = null;
  player.artistQuestion = null;
  player.artistAnswer = null;
  player.jugglerGuesses = null;
  player.cerenovusTargetId = null;
  player.cerenovusRole = null;
}

export function finishDeferredVictory({
  state,
  isSnv,
  character,
  getPlayer,
  hasAbility,
  addHistory,
}) {
  if (!isSnv(state) || !state.snvTwinVictoryPending || state.outcome)
    return false;
  const livingDemon = state.players.some(
    (p) => p.alive && character(p.character, state.scriptId)?.team === "demon",
  );
  const blockingTwin = state.players.some((p) => {
    const other = getPlayer(state, p.evilTwinTargetId);
    return (
      p.alive &&
      p.character === "evil_twin" &&
      hasAbility(p, state) &&
      other?.alive &&
      other.alignment !== p.alignment
    );
  });
  if (livingDemon || blockingTwin) return false;
  state.snvTwinVictoryPending = false;
  state.outcome = {
    winner: "good",
    reason: "El Demonio había muerto y el Gemelo ya no impide la victoria.",
  };
  state.phase = "ended";
  addHistory(state, "Victoria del Bien.", state.outcome.reason, {
    action: "victory",
    automatic: true,
    rule: "Gemelo Malvado",
  });
  return true;
}

export function executionSnapshot({
  state,
  player,
  playerId,
  cause,
  getPlayer,
  hasAbility,
  addHistory,
}) {
  // La habilidad se refiere a la ejecución, no a que esta cause una muerte.
  const evilTwin =
    cause === "execution" &&
    player.alignment === "good" &&
    state.players.find((candidate) => {
      const other = getPlayer(state, candidate.evilTwinTargetId);
      return (
        candidate.character === "evil_twin" &&
        candidate.alive &&
        hasAbility(candidate, state) &&
        other &&
        candidate.alignment !== other.alignment &&
        (candidate.id === playerId || other.id === playerId)
      );
    });
  const declareTwinVictory = () => {
    if (!evilTwin || state.outcome) return;
    state.outcome = {
      winner: "evil",
      reason: "El Gemelo bueno fue ejecutado.",
    };
    state.phase = "ended";
    addHistory(state, "Victoria del Mal.", state.outcome.reason, {
      action: "victory",
      automatic: true,
      rule: "Gemelo Malvado",
    });
  };

  return declareTwinVictory;
}

export function deferDemonVictory({
  state,
  anotherLivingDemon,
  hasAbility,
  getPlayer,
  addHistory,
}) {
  const active = state.players.some(
    (p) =>
      p.alive &&
      p.character === "evil_twin" &&
      hasAbility(p, state) &&
      getPlayer(state, p.evilTwinTargetId)?.alive &&
      getPlayer(state, p.evilTwinTargetId)?.alignment !== p.alignment,
  );
  if (!state.outcome && active && !anotherLivingDemon) {
    state.snvTwinVictoryPending = true;
    addHistory(
      state,
      "Victoria del Bien aplazada.",
      "El Demonio ha muerto, pero ambos Gemelos siguen vivos.",
      { action: "victory_deferred", automatic: true, rule: "Gemelo Malvado" },
    );
  }
  return active;
}
