// Resoluciones propias de Trouble Brewing con servicios compartidos del motor.
export function createTroubleBrewingRules({
  getPlayer,
  alivePlayers,
  hasAbility,
  character,
  endPersistentEffects,
  addHistory,
  killPlayer,
  nominationEligibility,
}) {
  function becomeImp(state, player) {
    endPersistentEffects(state, player);
    player.previousCharacter = player.character;
    player.transformedToDemon = true;
    player.character = "imp";
    player.perceivedCharacter = "imp";
    // Cambiar de personaje no cambia el alineamiento. Esto importa si el
    // Narrador decide que un Recluso sano registre como Esbirro para el pase.
    player.newDemonNeedsInfo = true;
    if (state.phase === "night") player.skipImpAttackNight = state.night.number;
  }

  function resolveDemonDeath(state, demonId, cause, successorId = null) {
    const demon = getPlayer(state, demonId);
    const livingBefore = alivePlayers(state).length;
    demon.formerDemon = true;
    demon.alive = false;
    demon.ghostVote = true;
    if (cause === "imp_self") {
      const forcedScarlet = state.players.find(
        (p) =>
          p.alive &&
          p.character === "scarlet_woman" &&
          hasAbility(p, state) &&
          livingBefore >= 5,
      );
      const candidates = state.players.filter(
        (p) =>
          p.alive &&
          (character(p.character)?.team === "minion" ||
            (p.id === successorId &&
              p.character === "recluse" &&
              hasAbility(p, state))),
      );
      const successor =
        forcedScarlet ||
        candidates.find((p) => p.id === successorId) ||
        (candidates.length === 1 ? candidates[0] : null);
      if (successor) {
        becomeImp(state, successor);
        addHistory(
          state,
          `${demon.name} se mata y ${successor.name} se convierte en Diablillo.`,
          forcedScarlet
            ? "La Mujer Escarlata tenía prioridad."
            : "Starpass del Diablillo.",
        );
        return { winner: null, successorId: successor.id };
      }
    }
    const scarlet = state.players.find(
      (p) => p.alive && p.character === "scarlet_woman" && hasAbility(p, state),
    );
    if (scarlet && livingBefore >= 5) {
      becomeImp(state, scarlet);
      addHistory(
        state,
        `${demon.name} muere; ${scarlet.name} se convierte en Diablillo.`,
        "Había al menos 5 vivos justo antes de la muerte.",
      );
      return { winner: null, successorId: scarlet.id };
    }
    state.outcome = { winner: "good", reason: "El Demonio ha muerto." };
    state.phase = "ended";
    addHistory(state, "Victoria del Bien.", state.outcome.reason);
    return { winner: "good", successorId: null };
  }

  function resolveImpAttack(state, actorId, targetId, options = {}) {
    const actor = getPlayer(state, actorId),
      target = getPlayer(state, targetId);
    if (!actor || !target) return { died: false, reason: "invalid" };
    if (!hasAbility(actor, state))
      return { died: false, reason: "demon_poisoned" };
    if (target.id === actor.id)
      return killPlayer(state, actor.id, "imp_self", {
        successorId: options.successorId,
      });
    if (
      target.character === "mayor" &&
      hasAbility(target, state) &&
      !target.protected &&
      options.redirectId &&
      options.redirectId !== target.id &&
      getPlayer(state, options.redirectId)
    ) {
      // La muerte redirigida sigue causada por el ataque del Diablillo. Si
      // vuelve contra él, su propia habilidad puede provocar el pase.
      if (options.redirectId === actor.id)
        return killPlayer(state, actor.id, "imp_self", {
          successorId: options.successorId,
        });
      return killPlayer(state, options.redirectId, "night_redirect", {
        demonPoisoned: false,
      });
    }
    return killPlayer(state, target.id, "demon_attack", {
      demonPoisoned: false,
    });
  }

  function previewVirginNomination(
    state,
    nominatorId,
    nomineeId,
    options = {},
  ) {
    const { nominator, nominee } = nominationEligibility(
      state,
      nominatorId,
      nomineeId,
    );
    const appearsToBeVirgin =
      nominee.character === "virgin" ||
      (nominee.character === "drunk" &&
        nominee.perceivedCharacter === "virgin");
    const virginFirstNomination = appearsToBeVirgin && !nominee.abilityUsed;
    const nominatorIsTownsfolk =
      character(nominator.character)?.team === "townsfolk" ||
      (nominator.character === "spy" &&
        !nominator.poisoned &&
        options.spyRegistersTownsfolk);
    const virginTriggers =
      virginFirstNomination &&
      nominee.character === "virgin" &&
      hasAbility(nominee, state) &&
      nominatorIsTownsfolk;
    return { nominator, nominee, virginFirstNomination, virginTriggers };
  }

  function useSlayer(state, actorId, targetId, recluseRegistersDemon = false) {
    const actor = getPlayer(state, actorId),
      target = getPlayer(state, targetId);
    if (!actor || !target) throw new Error("Selección inválida.");
    if (state.phase !== "day" || state.day.closed)
      throw new Error(
        "El Exterminador solo puede usar su habilidad durante el día.",
      );
    if (!actor.alive)
      throw new Error("Un Exterminador muerto ya no tiene habilidad.");
    if (actor.abilityUsed) throw new Error("La habilidad ya se usó.");
    actor.abilityUsed = true;
    const isSlayer =
      actor.character === "slayer" ||
      (actor.character === "drunk" && actor.perceivedCharacter === "slayer");
    const active = isSlayer && hasAbility(actor, state);
    const hits =
      active &&
      (target.character === "imp" ||
        (target.character === "recluse" &&
          !target.poisoned &&
          recluseRegistersDemon));
    addHistory(
      state,
      `${actor.name} declara un disparo de Exterminador contra ${target.name}.`,
      hits ? "El objetivo muere." : "No ocurre nada.",
      {
        action: "slayer",
        actorId: actor.id,
        targetId: target.id,
        automatic: false,
        rule: "Exterminador",
      },
    );
    return hits
      ? killPlayer(state, targetId, "slayer")
      : { died: false, reason: active ? "not_demon" : "no_ability" };
  }

  return {
    resolveDemonDeath,
    resolveImpAttack,
    previewVirginNomination,
    useSlayer,
  };
}
