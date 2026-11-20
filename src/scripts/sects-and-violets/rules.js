// Resoluciones propias del guion; el motor suministra los servicios compartidos.
export function createSectsVioletsRules({
  abilityRole,
  addHistory,
  alivePlayers,
  beginNight,
  changeCharacter,
  character,
  closestTownsfolkNeighbours,
  endPersistentEffects,
  finishDeferredTwinVictory,
  getPlayer,
  hasAbility,
  isSnv,
  killPlayer,
  markRoleAbilityUsed,
  queueEffect,
  recordDeathAttempt,
  resetCharacterUsage,
  resolveEffect,
  roleAbilityUsed,
}) {
  /** Estados pasivos inequívocos de Sects & Violets. Las decisiones de registro
   * e información quedan fuera de esta función y son siempre del Narrador. */
  function applySnvPassiveEffects(state) {
    if (state.scriptId !== "sects_and_violets") return;
    state.players.forEach((player) => {
      if (
        player.noDashiiPoisoned ||
        player.philosopherDrunk ||
        player.vigormortisPoisonSource
      )
        player.poisoned = false;
      player.vigormortisEnabled = false;
      player.noDashiiPoisoned = false;
      player.philosopherDrunk = false;
      player.vigormortisPoisonSource = false;
      if (player.snakeCharmerPoisoned) player.poisoned = true;
      if (player.sweetheartDrunk) player.poisoned = true;
    });
    const vigormortis = state.players.find(
      (player) =>
        player.alive &&
        player.character === "vigormortis" &&
        hasAbility(player, state),
    );
    if (vigormortis)
      state.players
        .filter(
          (player) =>
            !player.alive &&
            player.killedByVigormortis &&
            character(player.character, state.scriptId)?.team === "minion",
        )
        .forEach((minion) => {
          minion.vigormortisEnabled = true;
          const candidates = closestTownsfolkNeighbours(state, minion.id);
          if (
            minion.vigormortisPoisonedId &&
            candidates.some(
              (candidate) => candidate.id === minion.vigormortisPoisonedId,
            )
          ) {
            const target = getPlayer(state, minion.vigormortisPoisonedId);
            target.poisoned = true;
            target.vigormortisPoisonSource = true;
          } else if (candidates.length === 1) {
            minion.vigormortisPoisonedId = candidates[0].id;
            candidates[0].poisoned = true;
            candidates[0].vigormortisPoisonSource = true;
          } else if (
            candidates.length > 1 &&
            !(state.pendingEffects || []).some(
              (effect) =>
                effect.status === "pending" &&
                effect.type === "vigormortis_neighbour" &&
                effect.source?.playerId === minion.id,
            )
          ) {
            queueEffect(state, {
              type: "vigormortis_neighbour",
              label: `Vigormortis: vecino Aldeano de ${minion.name}`,
              source: { roleId: "vigormortis", playerId: minion.id },
              targetIds: candidates.map((candidate) => candidate.id),
              data: {
                minionId: minion.id,
                instruction:
                  "Elige el único vecino Aldeano que queda envenenado mientras este Esbirro conserve la habilidad.",
              },
            });
          }
        });
    const noDashii = state.players.find(
      (player) =>
        player.alive &&
        player.character === "no_dashii" &&
        hasAbility(player, state),
    );
    if (noDashii)
      closestTownsfolkNeighbours(state, noDashii.id).forEach((neighbour) => {
        neighbour.poisoned = true;
        neighbour.noDashiiPoisoned = true;
      });
    state.players
      .filter(
        (player) =>
          player.character === "philosopher" &&
          player.philosopherRole &&
          hasAbility(player, state),
      )
      .forEach((philosopher) => {
        const target = state.players.find(
          (player) =>
            player.id !== philosopher.id &&
            player.character === philosopher.philosopherRole,
        );
        philosopher.philosopherDrunkTargetId = target?.id || null;
        if (target) {
          target.philosopherDrunk = true;
          target.poisoned = true;
        }
      });
    finishDeferredTwinVictory(state);
  }

  function resolveSnakeCharmer(state, actorId, targetId) {
    if (!isSnv(state))
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const actor = getPlayer(state, actorId),
      target = getPlayer(state, targetId);
    if (!actor || !target?.alive || abilityRole(actor) !== "snake_charmer")
      throw new Error("El Encantador debe elegir un jugador vivo.");
    if (
      !hasAbility(actor, state) ||
      character(target.character, state.scriptId)?.team !== "demon"
    )
      return {
        swapped: false,
        reason: hasAbility(actor, state) ? "not_demon" : "no_ability",
      };
    const actorBefore = actor.character,
      targetBefore = target.character;
    const actorAlignment = actor.alignment,
      targetAlignment = target.alignment;
    endPersistentEffects(state, actor);
    endPersistentEffects(state, target);
    actor.character = targetBefore;
    actor.perceivedCharacter = targetBefore;
    actor.alignment = targetAlignment;
    target.character = actorBefore;
    target.perceivedCharacter = actorBefore;
    target.alignment = actorAlignment;
    target.snakeCharmerPoisoned = true;
    target.poisoned = true;
    resetCharacterUsage(actor);
    resetCharacterUsage(target);
    target.snakeCharmerPoisoned = true;
    target.poisoned = true;
    applySnvPassiveEffects(state);
    const newRoleName = character(target.character, state.scriptId).name;
    queueEffect(state, {
      type: "character_change_notice",
      label: `Informar a ${target.name} de su nuevo personaje`,
      source: { roleId: "snake_charmer", playerId: actorId },
      targetIds: [target.id],
      data: {
        instruction: `${target.name} es ahora ${newRoleName}, cambia de alineamiento y queda envenenado.`,
      },
    });
    queueEffect(state, {
      type: "character_change_notice",
      label: `Informar a ${actor.name} de su nuevo personaje`,
      source: { roleId: "snake_charmer", playerId: actorId },
      targetIds: [actor.id],
      data: {
        instruction: `${actor.name} es ahora ${character(actor.character, state.scriptId).name} y pertenece al equipo ${actor.alignment === "good" ? "bueno" : "malvado"}.`,
      },
    });
    addHistory(
      state,
      `Encantador y Demonio intercambian sus personajes.`,
      `${actor.name} pasa a ser ${character(actor.character, state.scriptId).name}; ${target.name} es ahora ${newRoleName} envenenado.`,
      {
        action: "snake_charmer",
        actorId,
        targetId,
        automatic: true,
        rule: "Encantador de Serpientes",
      },
    );
    return { swapped: true };
  }

  function resolveWitch(state, actorId, targetId) {
    if (!isSnv(state))
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const actor = getPlayer(state, actorId),
      target = getPlayer(state, targetId);
    if (!actor || !target || abilityRole(actor) !== "witch")
      throw new Error("Bruja u objetivo inválido.");
    if (!hasAbility(actor, state) || alivePlayers(state).length <= 3)
      return { applied: false, reason: "no_ability" };
    state.witchCurseId = targetId;
    state.witchCurseRound = state.round;
    state.witchSourceId = actorId;
    addHistory(
      state,
      `Bruja maldice a ${target.name}.`,
      "Si nomina mañana, morirá de inmediato; la nominación se conserva.",
      { action: "witch", actorId, targetId, automatic: true, rule: "Bruja" },
    );
    return { applied: true };
  }

  function resolvePitHag(state, actorId, targetId, roleId) {
    if (!isSnv(state))
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const actor = getPlayer(state, actorId),
      target = getPlayer(state, targetId),
      next = character(roleId, state.scriptId);
    if (!actor || !target || actor.character !== "pit_hag" || !next)
      throw new Error("Pit-Hag, objetivo o personaje inválido.");
    if (state.players.some((player) => player.character === roleId)) {
      addHistory(
        state,
        "Pit-Hag señala un personaje que ya está en juego.",
        "No ocurre ningún cambio de personaje.",
        {
          action: "pit_hag",
          actorId,
          targetId,
          automatic: true,
          rule: "Pit-Hag",
        },
      );
      return { changed: false, reason: "character_in_play" };
    }
    if (!hasAbility(actor, state))
      return { changed: false, reason: "no_ability" };
    const becomesDemon = next.team === "demon";
    changeCharacter(state, targetId, roleId, {
      sourcePlayerId: actorId,
      automatic: true,
      rule: "Pit-Hag",
      reason: "Pit-Hag cambia el personaje elegido.",
    });
    applySnvPassiveEffects(state);
    if (becomesDemon) {
      state.snvArbitraryDeathsRound = state.round;
      state.snvArbitrarySourceId = actorId;
    }
    queueEffect(state, {
      type: "character_change_notice",
      label: `Informar a ${target.name} de su nuevo personaje`,
      source: { roleId: "pit_hag", playerId: actorId },
      targetIds: [target.id],
      data: {
        instruction: `${target.name} es ahora ${next.name} y conserva su alineamiento.`,
      },
    });
    addHistory(
      state,
      "Pit-Hag resuelve su elección.",
      becomesDemon
        ? "Se creó un Demonio: las muertes de esta noche quedan a criterio del Narrador."
        : "Cambio de personaje registrado.",
      {
        action: "pit_hag",
        actorId,
        targetId,
        automatic: true,
        rule: "Pit-Hag",
      },
    );
    return { changed: true, arbitraryDeaths: becomesDemon };
  }

  function resolvePhilosopher(state, actorId, roleId) {
    if (!isSnv(state))
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const actor = getPlayer(state, actorId),
      chosen = character(roleId, state.scriptId);
    if (
      !actor ||
      actor.character !== "philosopher" ||
      !chosen ||
      !["townsfolk", "outsider"].includes(chosen.team)
    )
      throw new Error("El Filósofo debe elegir un personaje bueno.");
    if (actor.abilityUsed)
      throw new Error("El Filósofo ya ha usado su elección.");
    actor.abilityUsed = true;
    actor.philosopherChoiceNight = state.night?.number ?? state.round;
    if (!hasAbility(actor, state)) {
      actor.philosopherSimulatedRole = roleId;
      actor.philosopherGainedAbilityUsed = false;
      addHistory(
        state,
        `Filósofo elige a ${chosen.name} sin habilidad activa.`,
        "Su uso se consume; la habilidad elegida se simula sin efecto real.",
        { action: "philosopher", actorId, automatic: false, rule: "Filósofo" },
      );
      return { applied: false, reason: "no_ability" };
    }
    actor.philosopherRole = roleId;
    actor.philosopherGainedAbilityUsed = false;
    actor.philosopherDrunkTargetId =
      state.players.find(
        (player) => player.id !== actorId && player.character === roleId,
      )?.id || null;
    applySnvPassiveEffects(state);
    const target = getPlayer(state, actor.philosopherDrunkTargetId);
    addHistory(
      state,
      `Filósofo obtiene la habilidad de ${chosen.name}.`,
      target
        ? `${target.name} queda ebrio mientras el Filósofo conserve su habilidad.`
        : "Ese personaje no está en juego.",
      {
        action: "philosopher",
        actorId,
        targetId: target?.id || null,
        automatic: true,
        rule: "Filósofo",
      },
    );
    return { applied: true, roleId, drunkTargetId: target?.id || null };
  }

  function resolveSnvDemonAttack(state, actorId, targetId) {
    if (!isSnv(state))
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const actor = getPlayer(state, actorId),
      target = getPlayer(state, targetId);
    if (
      !actor ||
      !target ||
      !["fang_gu", "vigormortis", "no_dashii", "vortox"].includes(
        actor.character,
      )
    )
      throw new Error("Demonio u objetivo inválido.");
    if (!hasAbility(actor, state)) return { died: false, reason: "no_ability" };
    // El salto requiere que el Forastero haya sido realmente matado. Un objetivo
    // protegido (o que ya estaba muerto) no consume el salto de Fang Gu.
    if (
      actor.character === "fang_gu" &&
      target.alive &&
      !target.protected &&
      character(target.character, state.scriptId)?.team === "outsider" &&
      !state.fangGuJumped
    ) {
      state.fangGuJumped = true;
      actor.alive = false;
      actor.ghostVote = true;
      actor.formerDemon = true;
      actor.diedThisNight = state.phase === "night";
      endPersistentEffects(state, target);
      target.character = "fang_gu";
      target.perceivedCharacter = "fang_gu";
      target.alignment = "evil";
      resetCharacterUsage(target);
      target.fangGuSkipAttackNight = state.night.number;
      queueEffect(state, {
        type: "character_change_notice",
        label: `Informar a ${target.name} de que ahora es Fang Gu`,
        source: { roleId: "fang_gu", playerId: actorId },
        targetIds: [target.id],
        data: {
          instruction: `${target.name} pasa a ser Fang Gu malvado; ${actor.name} muere en su lugar.`,
        },
      });
      recordDeathAttempt(state, actorId, {
        cause: "fang_gu_jump",
        sourceId: actorId,
        died: true,
        automatic: true,
        reason: "Fang Gu muere al saltar al primer Forastero que mata.",
      });
      addHistory(
        state,
        "Fang Gu salta a un Forastero.",
        `${actor.name} muere; ${target.name} se convierte en Fang Gu malvado.`,
        {
          action: "fang_gu_jump",
          actorId,
          targetId,
          automatic: true,
          rule: "Fang Gu",
        },
      );
      return { died: false, jumped: true };
    }
    return killPlayer(state, targetId, "demon_attack", { sourceId: actorId });
  }

  function resolveEvilTwinSetup(state, actorId, targetId) {
    if (!isSnv(state))
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const actor = getPlayer(state, actorId),
      target = getPlayer(state, targetId);
    if (
      !actor ||
      !target ||
      actor.character !== "evil_twin" ||
      target.alignment === actor.alignment
    )
      throw new Error(
        "El Gemelo Malvado debe conocer a un jugador de alineamiento opuesto.",
      );
    actor.evilTwinTargetId = targetId;
    addHistory(
      state,
      `Gemelo Malvado conoce a ${target.name}.`,
      "Ambos reciben esta información en privado.",
      {
        action: "evil_twin_setup",
        actorId,
        targetId,
        automatic: false,
        rule: "Gemelo Malvado",
      },
    );
    return { targetId };
  }

  function resolveKlutzChoice(state, actorId, targetId) {
    if (!isSnv(state))
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const actor = getPlayer(state, actorId),
      target = getPlayer(state, targetId);
    if (
      !actor ||
      !target ||
      abilityRole(actor) !== "klutz" ||
      actor.alive ||
      !target.alive
    )
      throw new Error("La elección del Patoso no es válida.");
    const pending = (state.pendingEffects || []).find(
      (effect) =>
        effect.status === "pending" &&
        effect.type === "klutz_choice" &&
        effect.source?.playerId === actorId,
    );
    if (!pending)
      throw new Error("No hay una elección pendiente para este Patoso.");
    resolveEffect(state, pending.id, {
      targetId,
      note: `${actor.name} eligió a ${target.name}.`,
    });
    if (target.alignment === "evil") {
      state.outcome = {
        winner: actor.alignment === "good" ? "evil" : "good",
        reason: "El Patoso eligió a un jugador malvado y su equipo pierde.",
      };
      state.phase = "ended";
    }
    addHistory(
      state,
      `Patoso elige a ${target.name}.`,
      target.alignment === "evil"
        ? `Pierde el equipo ${actor.alignment === "good" ? "bueno" : "malvado"}.`
        : "El jugador elegido es bueno.",
      { action: "klutz", actorId, targetId, automatic: false, rule: "Patoso" },
    );
    return { evil: target.alignment === "evil" };
  }

  function resolveSweetheartDrunk(state, effectId, targetId) {
    if (!isSnv(state))
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const effect = (state.pendingEffects || []).find(
      (item) =>
        item.id === effectId &&
        item.type === "sweetheart_drunk" &&
        item.status === "pending",
    );
    const target = getPlayer(state, targetId);
    if (!effect || !target || !effect.targetIds.includes(targetId))
      throw new Error("El objetivo del Enamoradizo no es válido.");
    target.sweetheartDrunk = true;
    target.poisoned = true;
    resolveEffect(state, effectId, {
      targetId,
      note: `${target.name} queda ebrio por el Enamoradizo.`,
    });
    return target;
  }

  function resolveBarberSwap(state, effectId, demonId, firstId, secondId) {
    if (!isSnv(state))
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const effect = (state.pendingEffects || []).find(
      (item) =>
        item.id === effectId &&
        item.type === "barber_swap" &&
        item.status === "pending",
    );
    const demon = getPlayer(state, demonId),
      first = getPlayer(state, firstId),
      second = getPlayer(state, secondId);
    if (
      !effect ||
      !demon ||
      character(demon.character, state.scriptId)?.team !== "demon"
    )
      throw new Error("Elige qué Demonio resuelve al Barbero.");
    if (!first || !second || first.id === second.id)
      throw new Error("El Barbero debe intercambiar dos jugadores distintos.");
    if (
      [first, second].some(
        (player) =>
          player.id !== demonId &&
          character(player.character, state.scriptId)?.team === "demon",
      )
    )
      throw new Error(
        "El Demonio no puede elegir a otro Demonio para el intercambio.",
      );
    const firstCharacter = first.character,
      secondCharacter = second.character;
    endPersistentEffects(state, first);
    endPersistentEffects(state, second);
    first.character = secondCharacter;
    first.perceivedCharacter = secondCharacter;
    resetCharacterUsage(first);
    second.character = firstCharacter;
    second.perceivedCharacter = firstCharacter;
    resetCharacterUsage(second);
    applySnvPassiveEffects(state);
    resolveEffect(state, effectId, {
      demonId,
      targetIds: [firstId, secondId],
      note: `${first.name} y ${second.name} intercambian personajes; conservan alineamiento.`,
    });
    for (const player of [first, second])
      queueEffect(state, {
        type: "character_change_notice",
        label: `Informar a ${player.name} de su nuevo personaje`,
        source: { roleId: "barber", playerId: demonId },
        targetIds: [player.id],
        data: {
          instruction: `${player.name} es ahora ${character(player.character, state.scriptId)?.name} y conserva su alineamiento.`,
        },
      });
    addHistory(
      state,
      "El Demonio resuelve al Barbero.",
      `${first.name} es ahora ${character(first.character, state.scriptId)?.name}; ${second.name} es ahora ${character(second.character, state.scriptId)?.name}.`,
      {
        action: "barber_swap",
        actorId: demonId,
        targetId: firstId,
        automatic: false,
        rule: "Barbero",
      },
    );
    return { firstId, secondId };
  }

  function resolvePitHagArbitraryDeaths(state, targetIds = []) {
    if (
      !isSnv(state) ||
      state.phase !== "night" ||
      state.snvArbitraryDeathsRound !== state.round
    )
      throw new Error("Esta noche no tiene muertes arbitrarias de Pit-Hag.");
    const uniqueIds = [...new Set(targetIds.filter(Boolean))];
    if (uniqueIds.some((id) => !getPlayer(state, id)))
      throw new Error("Hay un jugador inválido en las muertes elegidas.");
    const results = uniqueIds.map((id) =>
      killPlayer(state, id, "pit_hag_arbitrary", {
        sourceId: state.snvArbitrarySourceId,
      }),
    );
    addHistory(
      state,
      "Muertes arbitrarias de Pit-Hag revisadas.",
      uniqueIds.length
        ? `${results.filter((result) => result.died).length} muerte(s) resuelta(s) por decisión del Narrador.`
        : "El Narrador decidió que no hubiera muertes arbitrarias.",
      { action: "pit_hag_arbitrary_deaths", automatic: false, rule: "Pit-Hag" },
    );
    state.snvArbitraryDeathsResolvedRound = state.round;
    return results;
  }

  function recordPitHagArbitraryChoice(state, playerId, shouldDie) {
    if (
      !isSnv(state) ||
      state.phase !== "night" ||
      state.snvArbitraryDeathsRound !== state.round
    )
      throw new Error("Esta noche no tiene muertes arbitrarias de Pit-Hag.");
    const player = getPlayer(state, playerId);
    if (!player) throw new Error("Elige un jugador válido.");
    const result = shouldDie
      ? killPlayer(state, playerId, "pit_hag_arbitrary", {
          sourceId: state.snvArbitrarySourceId,
        })
      : { died: false, reason: "narrator_spared" };
    addHistory(
      state,
      `Pit-Hag: decisión sobre ${player.name}.`,
      shouldDie
        ? result.died
          ? "El Narrador decidió una muerte arbitraria."
          : `No murió: ${result.reason}.`
        : "El Narrador decidió que sobreviviera en este momento.",
      {
        action: "pit_hag_arbitrary_choice",
        actorId: state.snvArbitrarySourceId || null,
        targetId: playerId,
        automatic: false,
        rule: "Pit-Hag",
      },
    );
    return result;
  }

  function recordSavantVisit(state, actorId, detail) {
    if (!isSnv(state) || state.phase !== "day")
      throw new Error("El Sabio actúa durante el día de Sects & Violets.");
    const actor = getPlayer(state, actorId);
    if (
      !actor?.alive ||
      abilityRole(actor) !== "savant" ||
      actor.savantLastRound === state.round
    )
      throw new Error("Este Sabio no puede recibir otra visita hoy.");
    if (!String(detail || "").trim())
      throw new Error("Anota las dos afirmaciones entregadas.");
    actor.savantLastRound = state.round;
    actor.savantNotes ||= [];
    actor.savantNotes.push({
      round: state.round,
      detail: String(detail).trim(),
    });
    addHistory(
      state,
      `Sabio visita al Narrador.`,
      `${String(detail).trim()}${hasAbility(actor, state) ? "" : " (Información simulada: no tiene habilidad activa.)"}`,
      { action: "savant", actorId, automatic: false, rule: "Sabio" },
    );
    return true;
  }

  function useArtistQuestion(state, actorId, question, answer) {
    if (!isSnv(state) || state.phase !== "day")
      throw new Error("El Artista actúa durante el día de Sects & Violets.");
    const actor = getPlayer(state, actorId);
    if (
      !actor?.alive ||
      abilityRole(actor) !== "artist" ||
      roleAbilityUsed(actor, "artist")
    )
      throw new Error("Este Artista no puede usar su habilidad.");
    if (
      !String(question || "").trim() ||
      !["yes", "no", "unknown"].includes(answer)
    )
      throw new Error(
        "Registra una pregunta y una respuesta: sí, no o no lo sé.",
      );
    markRoleAbilityUsed(actor, "artist");
    actor.artistQuestion = String(question).trim();
    actor.artistAnswer = answer;
    addHistory(
      state,
      `Artista pregunta en privado: ${actor.artistQuestion}`,
      `Respuesta mostrada: ${{ yes: "SÍ", no: "NO", unknown: "NO LO SÉ" }[answer]}.${hasAbility(actor, state) ? "" : " Información simulada: no tiene habilidad activa."}`,
      { action: "artist", actorId, automatic: false, rule: "Artista" },
    );
    return true;
  }

  function recordJugglerGuesses(state, actorId, detail) {
    if (!isSnv(state) || state.phase !== "day" || state.round !== 1)
      throw new Error(
        "El Malabarista solo hace conjeturas durante el primer día.",
      );
    const actor = getPlayer(state, actorId);
    if (
      !actor?.alive ||
      abilityRole(actor) !== "juggler" ||
      actor.jugglerGuesses
    )
      throw new Error("Este Malabarista no puede registrar otra tanda.");
    if (!String(detail || "").trim())
      throw new Error("Anota hasta cinco conjeturas públicas.");
    actor.jugglerGuesses = String(detail).trim();
    addHistory(
      state,
      "Malabarista registra sus conjeturas públicas.",
      actor.jugglerGuesses,
      { action: "juggler", actorId, automatic: false, rule: "Malabarista" },
    );
    return true;
  }

  function resolveMadnessExecution(state, targetId, sourceRole) {
    if (!isSnv(state) || state.phase !== "day" || state.day.closed)
      throw new Error("La ejecución por locura requiere un día abierto.");
    const target = getPlayer(state, targetId);
    const cerenovusTarget = state.players.some(
      (player) =>
        abilityRole(player) === "cerenovus" &&
        player.cerenovusTargetId === targetId &&
        hasAbility(player, state),
    );
    if (
      !target ||
      (sourceRole === "mutant"
        ? abilityRole(target) !== "mutant" || !hasAbility(target, state)
        : sourceRole === "cerenovus"
          ? !cerenovusTarget
          : true)
    )
      throw new Error("El jugador no tiene esa condición de locura activa.");
    state.day.executedId = targetId;
    state.day.closed = true;
    state.day.stage = "closed";
    state.day.pendingNomination = null;
    const result = killPlayer(state, targetId, "execution");
    state.day.executionCausedDeath = result.died;
    addHistory(
      state,
      `${target.name} es ejecutado por una decisión de locura.`,
      "La ejecución termina el día, aunque el objetivo ya estuviera muerto.",
      {
        action: "madness_execution",
        targetId,
        automatic: false,
        rule: sourceRole === "mutant" ? "Mutante" : "Cerenovus",
      },
    );
    if (!state.outcome) {
      state.round += 1;
      beginNight(state);
    }
    return result;
  }

  /** El Narrador resuelve la única elección que deja Vigormortis al matar a un
   * Esbirro. No se elige automáticamente entre dos vecinos legales. */
  function resolveVigormortisNeighbour(state, minionId, targetId) {
    if (state.scriptId !== "sects_and_violets")
      throw new Error("Esta resolución pertenece a Sects & Violets.");
    const minion = getPlayer(state, minionId),
      target = getPlayer(state, targetId);
    const legal =
      minion &&
      target &&
      minion.killedByVigormortis &&
      character(minion.character, state.scriptId)?.team === "minion" &&
      closestTownsfolkNeighbours(state, minion.id).some(
        (candidate) => candidate.id === target.id,
      );
    if (!legal)
      throw new Error(
        "El vecino elegido no es un Aldeano legal para Vigormortis.",
      );
    minion.vigormortisPoisonedId = target.id;
    target.poisoned = true;
    target.vigormortisPoisonSource = true;
    const effect = (state.pendingEffects || []).find(
      (item) =>
        item.status === "pending" &&
        item.type === "vigormortis_neighbour" &&
        item.source?.playerId === minionId,
    );
    if (effect)
      resolveEffect(state, effect.id, {
        targetId,
        note: `${target.name} queda envenenado por Vigormortis.`,
      });
    addHistory(
      state,
      `Vigormortis envenena a ${target.name}.`,
      `${minion.name} conserva su habilidad tras morir por Vigormortis.`,
      {
        action: "vigormortis_neighbour",
        actorId: minionId,
        targetId,
        automatic: false,
        rule: "Vigormortis",
      },
    );
    return target;
  }

  function resolveWitchNomination(state, nominatorId) {
    const witch = getPlayer(state, state.witchSourceId);
    if (
      !isSnv(state) ||
      alivePlayers(state).length <= 3 ||
      state.witchCurseId !== nominatorId ||
      state.witchCurseRound !== state.round ||
      !witch ||
      abilityRole(witch) !== "witch" ||
      !hasAbility(witch, state)
    )
      return { triggered: false };
    const nominator = getPlayer(state, nominatorId);
    if (!nominator?.alive) return { triggered: false };
    if (state.day.pendingNomination?.nominatorId === nominatorId)
      state.day.pendingNomination.witchTriggered = true;
    state.witchCurseId = null;
    state.witchCurseRound = null;
    const result = killPlayer(state, nominatorId, "witch", {
      sourceId: witch.id,
    });
    addHistory(
      state,
      "La Bruja activa su maldición.",
      `${nominator.name} muere al nominar; la nominación continúa si la partida sigue.`,
      {
        action: "witch_trigger",
        actorId: witch.id,
        targetId: nominatorId,
        automatic: true,
        rule: "Bruja",
      },
    );
    return { triggered: true, ...result };
  }

  return {
    resolveWitchNomination,
    applySnvPassiveEffects,
    resolveSnakeCharmer,
    resolveWitch,
    resolvePitHag,
    resolvePhilosopher,
    resolveSnvDemonAttack,
    resolveEvilTwinSetup,
    resolveKlutzChoice,
    resolveSweetheartDrunk,
    resolveBarberSwap,
    resolvePitHagArbitraryDeaths,
    recordPitHagArbitraryChoice,
    recordSavantVisit,
    useArtistQuestion,
    recordJugglerGuesses,
    resolveMadnessExecution,
    resolveVigormortisNeighbour,
  };
}
