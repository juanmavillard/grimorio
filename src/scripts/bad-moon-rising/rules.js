// Resoluciones propias del guion; el motor suministra los servicios compartidos.
export function createBadMoonRisingRules({
  addHistory,
  aliveNeighbours,
  character,
  getPlayer,
  hasAbility,
  isBmr,
  killPlayer,
  outsiderDiedDuringPreviousDay,
  recordDeathAttempt,
}) {
  function bmrBaseDrunkenness(state, player) {
    return (
      state.pukkaPoisonedId === player.id ||
      player.sailorDrunkUntilDusk === state.round ||
      player.innkeeperDrunkUntilDusk === state.round ||
      player.minstrelDrunkUntilDusk === state.round ||
      player.goonDrunkUntilDusk === state.round
    );
  }

  /** Recalcula los estados continuos de BMR que dependen de otra habilidad.
   * El Cortesano deja de emborrachar a su personaje si el propio Cortesano
   * muere, se emborracha o se envenena; si vuelve a estar sano, el efecto
   * pendiente se reanuda mientras no haya vencido. */
  function refreshBmrDrunkenness(state) {
    if (!isBmr(state)) return;
    state.courtierEffects = (state.courtierEffects || []).filter(
      (effect) => state.round <= effect.expiresAfterRound,
    );
    const baseByPlayer = new Map(
      state.players.map((player) => [
        player.id,
        bmrBaseDrunkenness(state, player),
      ]),
    );
    state.players.forEach((player) => {
      player.courtierDrunk = false;
      player.poisoned = Boolean(baseByPlayer.get(player.id));
    });
    for (const effect of state.courtierEffects) {
      const source = getPlayer(state, effect.sourceId);
      const sourceActive = Boolean(
        source?.alive &&
          source.character === "courtier" &&
          !baseByPlayer.get(source.id),
      );
      if (!sourceActive) continue;
      state.players
        .filter((player) => player.character === effect.roleId)
        .forEach((player) => {
          player.courtierDrunk = true;
        });
    }
    state.players
      .filter((player) => player.courtierDrunk)
      .forEach((player) => {
        player.poisoned = true;
      });
  }

  /** Protección y supervivencia propias de Bad Moon Rising. Las opciones que
   * requieren criterio del Narrador (Pacifista) se pasan de forma explícita: el
   * motor nunca decide por sí solo si una muerte opcional se evita. */
  function bmrDeathPrevention(state, player, cause, options = {}) {
    if (!isBmr(state) || options.ignoreProtection) return null;
    if (player.character === "sailor" && hasAbility(player, state))
      return "sailor";
    if (
      state.phase === "night" &&
      player.innkeeperProtectedNight === state.round
    )
      return "innkeeper";
    if (
      cause === "execution" &&
      player.devilsAdvocateProtectedRound === state.round
    )
      return "devils_advocate";
    const protectedByTeaLady = state.players.some((candidate) => {
      if (
        !candidate.alive ||
        candidate.character !== "tea_lady" ||
        !hasAbility(candidate, state)
      )
        return false;
      const neighbours = aliveNeighbours(state, candidate.id);
      return (
        neighbours.length === 2 &&
        neighbours.every((neighbour) => neighbour.alignment === "good") &&
        neighbours.some((neighbour) => neighbour.id === player.id)
      );
    });
    if (protectedByTeaLady) return "tea_lady";
    if (
      player.character === "fool" &&
      hasAbility(player, state) &&
      !player.foolSurvived
    )
      return "fool";
    if (
      cause === "execution" &&
      player.alignment === "good" &&
      options.pacifistSaves &&
      state.players.some(
        (candidate) =>
          candidate.alive &&
          candidate.character === "pacifist" &&
          hasAbility(candidate, state),
      )
    )
      return "pacifist";
    return null;
  }

  function recordBmrPrevention(state, player, cause, reason) {
    if (reason === "fool") player.foolSurvived = true;
    recordDeathAttempt(state, player.id, {
      cause,
      died: false,
      preventedBy: reason,
      reason: `La muerte fue evitada por ${reason}.`,
    });
    addHistory(state, `${player.name} no muere.`, `Protección de ${reason}.`, {
      action: "death_prevented",
      targetId: player.id,
      automatic: reason !== "pacifist",
      rule: reason,
    });
    return { died: false, reason };
  }

  function requireBmrActor(state, actorId, roleId) {
    if (!isBmr(state))
      throw new Error("Esta resolución pertenece a Bad Moon Rising.");
    const actor = getPlayer(state, actorId);
    if (!actor || actor.character !== roleId)
      throw new Error("El personaje que actúa no es válido.");
    return actor;
  }

  function resolveGrandmotherSetup(state, actorId, childId) {
    const actor = requireBmrActor(state, actorId, "grandmother");
    const child = getPlayer(state, childId);
    if (!child || child.id === actor.id || child.alignment !== "good")
      throw new Error("La Abuela debe recibir otro jugador bueno.");
    actor.grandmotherChildId = childId;
    actor.grandmotherSetupPending = false;
    addHistory(
      state,
      `La Abuela conoce a ${child.name}.`,
      `Su personaje es ${character(child.character, state.scriptId)?.name || child.character}.`,
      {
        action: "grandmother_setup",
        actorId,
        targetId: childId,
        automatic: false,
        rule: "Abuela",
      },
    );
    return child;
  }

  function resolveSailor(state, actorId, chosenId, drunkId = chosenId) {
    const actor = requireBmrActor(state, actorId, "sailor");
    const chosen = getPlayer(state, chosenId);
    const target = getPlayer(state, drunkId);
    if (
      !chosen?.alive ||
      !target?.alive ||
      ![actor.id, chosen.id].includes(target.id)
    )
      throw new Error(
        "El Marinero debe elegir un vivo y emborracharse él o a ese jugador.",
      );
    if (!hasAbility(actor, state))
      return { applied: false, reason: "no_ability" };
    target.poisoned = true;
    target.sailorDrunkUntilDusk = state.round;
    actor.sailorLastChoiceId = chosen.id;
    refreshBmrDrunkenness(state);
    addHistory(
      state,
      `Marinero elige a ${chosen.name}.`,
      `${target.name} queda borracho hasta el anochecer.`,
      {
        action: "sailor",
        actorId,
        targetId: chosenId,
        automatic: false,
        rule: "Marinero",
      },
    );
    return { applied: true, chosenId, drunkId };
  }

  function resolveInnkeeper(state, actorId, targetIds, drunkId) {
    const actor = requireBmrActor(state, actorId, "innkeeper");
    const targets = [...new Set(targetIds || [])].map((id) =>
      getPlayer(state, id),
    );
    const drunk = getPlayer(state, drunkId);
    if (
      targets.length !== 2 ||
      targets.some((target) => !target) ||
      !targets.some((target) => target.id === drunkId)
    )
      throw new Error(
        "El Posadero elige 2 jugadores y uno de ellos queda borracho.",
      );
    if (!hasAbility(actor, state))
      return { applied: false, reason: "no_ability" };
    targets.forEach((target) => {
      target.innkeeperProtectedNight = state.round;
    });
    drunk.poisoned = true;
    drunk.innkeeperDrunkUntilDusk = state.round;
    refreshBmrDrunkenness(state);
    addHistory(
      state,
      `Posadero protege a ${targets.map((target) => target.name).join(" y ")}.`,
      `${drunk.name} queda borracho hasta el anochecer.`,
      {
        action: "innkeeper",
        actorId,
        targetId: drunkId,
        automatic: false,
        rule: "Posadero",
      },
    );
    return {
      applied: true,
      targetIds: targets.map((target) => target.id),
      drunkId,
    };
  }

  function resolveExorcist(state, actorId, targetId) {
    const actor = requireBmrActor(state, actorId, "exorcist");
    const target = getPlayer(state, targetId);
    if (!target || target.id === actor.exorcistLastTargetId)
      throw new Error(
        "El Exorcista debe elegir un jugador distinto al de la noche anterior.",
      );
    actor.exorcistLastTargetId = targetId;
    if (!hasAbility(actor, state))
      return { applied: false, reason: "no_ability" };
    if (character(target.character, state.scriptId)?.team === "demon") {
      target.exorcisedNight = state.round;
      addHistory(
        state,
        `Exorcista bloquea a ${target.name}.`,
        "El Demonio aprende quién es el Exorcista y no actúa esta noche.",
        {
          action: "exorcist",
          actorId,
          targetId,
          automatic: true,
          rule: "Exorcista",
        },
      );
      return { applied: true, demon: true };
    }
    addHistory(
      state,
      `Exorcista elige a ${target.name}.`,
      "No era el Demonio.",
      {
        action: "exorcist",
        actorId,
        targetId,
        automatic: false,
        rule: "Exorcista",
      },
    );
    return { applied: true, demon: false };
  }

  function resolveGambler(state, actorId, targetId, guessedCharacter) {
    const actor = requireBmrActor(state, actorId, "gambler");
    const target = getPlayer(state, targetId);
    if (!target || !guessedCharacter)
      throw new Error("El Jugador necesita objetivo y personaje adivinado.");
    if (!hasAbility(actor, state))
      return { applied: false, reason: "no_ability" };
    const correct = target.character === guessedCharacter;
    const result = correct
      ? { died: false, reason: "correct_guess" }
      : killPlayer(state, actorId, "gambler");
    addHistory(
      state,
      `Jugador apuesta por ${target.name}.`,
      correct ? "Acierta y no muere." : "Falla y se resuelve su muerte.",
      {
        action: "gambler",
        actorId,
        targetId,
        automatic: true,
        rule: "Jugador",
      },
    );
    return { ...result, correct };
  }

  function resolveCourtier(state, actorId, roleId) {
    const actor = requireBmrActor(state, actorId, "courtier");
    if (actor.abilityUsed || !character(roleId, state.scriptId))
      throw new Error(
        "El Cortesano solo puede usar una vez una elección de personaje válida.",
      );
    actor.abilityUsed = true;
    if (!hasAbility(actor, state)) {
      addHistory(
        state,
        `Cortesano elige a ${character(roleId, state.scriptId).name}.`,
        "No tenía habilidad activa: no se emborracha ningún personaje y el uso se consume.",
        { action: "courtier", actorId, automatic: false, rule: "Cortesano" },
      );
      return { roleId, applied: false, reason: "no_ability" };
    }
    state.courtierEffects ||= [];
    // Actúa esta noche y permanece durante los dos ciclos completos siguientes:
    // tres noches y tres días en total; expira al anochecer del tercer día.
    state.courtierEffects.push({
      roleId,
      expiresAfterRound: state.round + 2,
      sourceId: actorId,
    });
    refreshBmrDrunkenness(state);
    addHistory(
      state,
      `Cortesano embriaga a ${character(roleId, state.scriptId).name}.`,
      "El efecto dura tres noches y tres días.",
      { action: "courtier", actorId, automatic: false, rule: "Cortesano" },
    );
    return { roleId };
  }

  function resolveProfessor(state, actorId, targetId) {
    const actor = requireBmrActor(state, actorId, "professor");
    const target = getPlayer(state, targetId);
    if (actor.abilityUsed || !target || target.alive)
      throw new Error("El Profesor debe elegir una persona muerta.");
    actor.abilityUsed = true;
    const town =
      character(target.character, state.scriptId)?.team === "townsfolk";
    if (hasAbility(actor, state) && town) {
      target.alive = true;
      target.ghostVote = false;
      target.diedThisNight = false;
      target.abilityUsed = false;
      if (target.character === "grandmother")
        target.grandmotherSetupPending = true;
    }
    addHistory(
      state,
      `Profesor elige a ${target.name}.`,
      hasAbility(actor, state) && town
        ? "Resucita como Aldeano."
        : "No resucita.",
      {
        action: "professor",
        actorId,
        targetId,
        automatic: true,
        rule: "Profesor",
      },
    );
    return { resurrected: hasAbility(actor, state) && town };
  }

  function resolveDevilsAdvocate(state, actorId, targetId) {
    const actor = requireBmrActor(state, actorId, "devils_advocate");
    const target = getPlayer(state, targetId);
    if (!target?.alive || target.id === actor.devilsAdvocateLastTargetId)
      throw new Error(
        "El Abogado del Diablo debe elegir un vivo distinto al de la noche anterior.",
      );
    actor.devilsAdvocateLastTargetId = targetId;
    if (!hasAbility(actor, state))
      return { applied: false, reason: "no_ability" };
    target.devilsAdvocateProtectedRound = state.round;
    addHistory(
      state,
      `Abogado del Diablo protege a ${target.name}.`,
      "No morirá si le ejecutan mañana.",
      {
        action: "devils_advocate",
        actorId,
        targetId,
        automatic: true,
        rule: "Abogado del Diablo",
      },
    );
    return { applied: true };
  }

  function resolveAssassin(state, actorId, targetId) {
    const actor = requireBmrActor(state, actorId, "assassin");
    const target = getPlayer(state, targetId);
    if (actor.abilityUsed || !target)
      throw new Error(
        "El Asesino necesita un objetivo válido y una habilidad sin usar.",
      );
    const active = hasAbility(actor, state);
    const goonCanReact =
      target.character === "goon" &&
      hasAbility(target, state) &&
      target.goonTriggeredRound !== state.round;
    actor.abilityUsed = true;
    const result = active
      ? killPlayer(state, targetId, "assassin", {
          sourceId: actorId,
          ignoreProtection: true,
        })
      : { died: false, reason: "no_ability" };
    if (goonCanReact)
      resolveGoon(state, targetId, actorId, { force: active && result.died });
    addHistory(
      state,
      `Asesino actúa.`,
      result.died
        ? "La muerte ignora protecciones."
        : "No hay efecto por falta de habilidad.",
      {
        action: "assassin",
        actorId,
        targetId,
        automatic: true,
        rule: "Asesino",
      },
    );
    return result;
  }

  function resolveGossip(state, actorId, targetId, statementWasTrue) {
    const actor = requireBmrActor(state, actorId, "gossip");
    if (!statementWasTrue || !hasAbility(actor, state)) {
      addHistory(
        state,
        `Chismoso: no hay muerte adicional.`,
        statementWasTrue
          ? "No tenía habilidad activa."
          : "La afirmación no era verdadera.",
        { action: "gossip", actorId, automatic: false, rule: "Chismoso" },
      );
      return {
        died: false,
        reason: statementWasTrue ? "no_ability" : "false_statement",
      };
    }
    const result = killPlayer(state, targetId, "gossip", { sourceId: actorId });
    addHistory(
      state,
      "Chismoso: se resuelve una muerte.",
      "La afirmación pública era verdadera.",
      {
        action: "gossip",
        actorId,
        targetId,
        automatic: false,
        rule: "Chismoso",
      },
    );
    return result;
  }

  function resolveMinstrel(state, minionId) {
    if (!isBmr(state))
      throw new Error("Esta resolución pertenece a Bad Moon Rising.");
    const minion = getPlayer(state, minionId);
    const minstrel = state.players.find(
      (player) =>
        player.alive &&
        player.character === "minstrel" &&
        hasAbility(player, state),
    );
    if (
      !minstrel ||
      !minion ||
      character(minion.character, state.scriptId)?.team !== "minion"
    )
      return { applied: false };
    state.players
      .filter((player) => player.id !== minstrel.id)
      .forEach((player) => {
        player.poisoned = true;
        player.minstrelDrunkUntilDusk = state.round + 1;
      });
    refreshBmrDrunkenness(state);
    addHistory(
      state,
      "Juglar embriaga a la mesa.",
      "Tras ejecutar a un Esbirro, todos los demás quedan borrachos hasta el anochecer de mañana.",
      {
        action: "minstrel",
        actorId: minstrel.id,
        targetId: minionId,
        automatic: true,
        rule: "Juglar",
      },
    );
    return { applied: true };
  }

  function resolveGoon(state, goonId, chooserId, options = {}) {
    if (!isBmr(state))
      throw new Error("Esta resolución pertenece a Bad Moon Rising.");
    const goon = getPlayer(state, goonId),
      chooser = getPlayer(state, chooserId);
    if (
      !goon ||
      !chooser ||
      goon.character !== "goon" ||
      goon.goonTriggeredRound === state.round
    )
      return { applied: false };
    if (!options.force && !hasAbility(goon, state))
      return { applied: false, reason: "no_ability" };
    goon.goonTriggeredRound = state.round;
    chooser.poisoned = true;
    chooser.goonDrunkUntilDusk = state.round;
    goon.alignment = chooser.alignment;
    refreshBmrDrunkenness(state);
    addHistory(
      state,
      `Matón cambia al equipo ${goon.alignment === "good" ? "bueno" : "malvado"}.`,
      `${chooser.name} fue el primer jugador que lo eligió esta noche y queda borracho hasta el anochecer.`,
      {
        action: "goon",
        actorId: goonId,
        targetId: chooserId,
        automatic: true,
        rule: "Matón",
      },
    );
    return { applied: true, alignment: goon.alignment };
  }

  /** Cuenta solamente despertares provocados por la habilidad propia: excluye
   * información inicial, despertares causados por otro personaje y accidentes. */

  function resolveTinkerDeath(state, playerId) {
    if (!isBmr(state))
      throw new Error("Esta resolución pertenece a Bad Moon Rising.");
    const player = getPlayer(state, playerId);
    if (!player || player.character !== "tinker")
      throw new Error("Solo puede morir el Manitas.");
    return killPlayer(state, playerId, "tinker");
  }

  function resolveGodfather(state, actorId, targetId) {
    const actor = requireBmrActor(state, actorId, "godfather");
    const outsiderDiedToday = outsiderDiedDuringPreviousDay(state);
    if (!outsiderDiedToday || !hasAbility(actor, state))
      return {
        died: false,
        reason: outsiderDiedToday ? "no_ability" : "no_outsider_died",
      };
    const result = killPlayer(state, targetId, "godfather", {
      sourceId: actorId,
    });
    addHistory(state, "Padrino ataca.", "Hoy murió un Forastero.", {
      action: "godfather",
      actorId,
      targetId,
      automatic: true,
      rule: "Padrino",
    });
    return result;
  }

  function chooseMoonchild(state, actorId, targetId) {
    const actor = requireBmrActor(state, actorId, "moonchild");
    const target = getPlayer(state, targetId);
    if (!actor.moonchildPending || !target?.alive)
      throw new Error("El Niño Lunar debe elegir un jugador vivo tras morir.");
    actor.moonchildTargetId = targetId;
    actor.moonchildTargetWasGood = target.alignment === "good";
    addHistory(
      state,
      `Niño Lunar elige a ${target.name}.`,
      "La resolución ocurrirá esta noche.",
      {
        action: "moonchild_choice",
        actorId,
        targetId,
        automatic: false,
        rule: "Niño Lunar",
      },
    );
    return { selected: true, targetId };
  }

  function resolveMoonchild(state, actorId) {
    const actor = requireBmrActor(state, actorId, "moonchild");
    const target = getPlayer(state, actor.moonchildTargetId);
    if (!actor.moonchildPending || !target)
      return { died: false, reason: "no_pending_choice" };
    // El alineamiento se fija en el momento de la elección; la embriaguez o el
    // veneno se comprueban al resolver la muerte, aunque el Niño esté muerto.
    const wasGood = actor.moonchildTargetWasGood ?? target.alignment === "good";
    const result = actor.poisoned
      ? { died: false, reason: "no_ability" }
      : wasGood
        ? killPlayer(state, target.id, "moonchild", { sourceId: actorId })
        : { died: false, reason: "evil_target" };
    actor.moonchildPending = false;
    addHistory(
      state,
      `Niño Lunar resuelve su elección de ${target.name}.`,
      actor.poisoned
        ? "Sin habilidad al resolver: no produce muerte."
        : wasGood
          ? "El objetivo registró como bueno al ser elegido; se resuelve su muerte."
          : "El objetivo registró como malvado al ser elegido y no muere.",
      {
        action: "moonchild",
        actorId,
        targetId: target.id,
        automatic: true,
        rule: "Niño Lunar",
      },
    );
    return result;
  }

  function resolveShabaloth(state, actorId, targetIds, regurgitateId = null) {
    const actor = requireBmrActor(state, actorId, "shabaloth");
    const targets = [...new Set(targetIds || [])].filter(Boolean);
    if (targets.length !== 2 || targets.some((id) => !getPlayer(state, id)))
      throw new Error(
        "El Shabaloth debe elegir dos jugadores distintos y válidos.",
      );
    if (!hasAbility(actor, state)) {
      const goon = targets
        .map((id) => getPlayer(state, id))
        .find((player) => player.character === "goon");
      if (goon) resolveGoon(state, goon.id, actorId);
      return { deaths: [], reason: "no_ability" };
    }
    let regurgitated = null;
    if (
      regurgitateId &&
      (actor.shabalothLastTargets || []).includes(regurgitateId)
    ) {
      const candidate = getPlayer(state, regurgitateId);
      if (candidate && !candidate.alive) {
        candidate.alive = true;
        candidate.ghostVote = false;
        candidate.diedThisNight = false;
        candidate.abilityUsed = false;
        if (candidate.character === "grandmother")
          candidate.grandmotherSetupPending = true;
        if (candidate.character === "zombuul")
          candidate.zombuulRegisteredDead = false;
        regurgitated = candidate.id;
      }
    }
    const deaths = [];
    for (const id of targets) {
      if (state.outcome || !hasAbility(actor, state)) break;
      const chosen = getPlayer(state, id);
      if (chosen.character === "goon") resolveGoon(state, chosen.id, actorId);
      if (!hasAbility(actor, state)) {
        deaths.push({ died: false, reason: "no_ability" });
        break;
      }
      deaths.push(killPlayer(state, id, "demon_attack", { sourceId: actorId }));
    }
    actor.shabalothLastTargets = [...targets];
    addHistory(
      state,
      "Shabaloth resuelve sus elecciones.",
      `${deaths.filter((result) => result.died).length} muerte(s)${regurgitated ? " y una regurgitación" : ""}.`,
      { action: "shabaloth", actorId, automatic: true, rule: "Shabaloth" },
    );
    return { deaths, regurgitated };
  }

  function resolvePo(state, actorId, targetIds = []) {
    const actor = requireBmrActor(state, actorId, "po_bmr");
    const targets = [...new Set(targetIds || [])].filter(Boolean);
    const required = actor.poLastChoiceNone ? 3 : 1;
    if (
      required === 3 ? targets.length !== 3 : ![0, 1].includes(targets.length)
    )
      throw new Error(
        required === 3
          ? "Po debe elegir exactamente 3 jugadores esta noche."
          : "Po puede elegir 1 jugador o no elegir a nadie.",
      );
    if (targets.some((id) => !getPlayer(state, id)))
      throw new Error("Po necesita objetivos válidos.");
    actor.poLastChoiceNone = targets.length === 0;
    if (!hasAbility(actor, state)) {
      const goon = targets
        .map((id) => getPlayer(state, id))
        .find((player) => player.character === "goon");
      if (goon) resolveGoon(state, goon.id, actorId);
      return {
        deaths: [],
        charged: actor.poLastChoiceNone,
        reason: "no_ability",
      };
    }
    const deaths = [];
    for (const id of targets) {
      if (state.outcome || !hasAbility(actor, state)) break;
      const chosen = getPlayer(state, id);
      if (chosen.character === "goon") resolveGoon(state, chosen.id, actorId);
      if (!hasAbility(actor, state)) {
        deaths.push({ died: false, reason: "no_ability" });
        break;
      }
      deaths.push(killPlayer(state, id, "demon_attack", { sourceId: actorId }));
    }
    addHistory(
      state,
      "Po resuelve su ataque.",
      targets.length
        ? `${targets.length} objetivo(s) elegido(s).`
        : "No elige a nadie; podrá elegir tres la próxima noche.",
      { action: "po", actorId, automatic: true, rule: "Po" },
    );
    return { deaths, charged: actor.poLastChoiceNone };
  }

  /** El objetivo anterior sigue envenenado durante su muerte; el Exorcista
   * impide una nueva elección, pero no evita esa muerte diferida. */
  function resolvePukkaNight(state, actorId, targetId) {
    if (state.scriptId !== "bad_moon_rising")
      throw new Error("Esta resolución pertenece a Bad Moon Rising.");
    const actor = getPlayer(state, actorId),
      target = getPlayer(state, targetId);
    const exorcised = actor?.exorcisedNight === state.round;
    if (!actor || actor.character !== "pukka" || (!target && !exorcised))
      throw new Error("Pukka u objetivo inválido.");
    if (exorcised && actor.alive && !actor.poisoned) {
      const previousId = state.pukkaPoisonedId || null;
      if (previousId) {
        const previous = getPlayer(state, previousId);
        if (previous) {
          killPlayer(state, previousId, "demon_attack", { sourceId: actorId });
          previous.poisoned = false;
        }
      }
      state.pukkaPoisonedId = null;
      refreshBmrDrunkenness(state);
      addHistory(
        state,
        "Pukka: muerte anterior diferida.",
        "El Exorcista impide la elección de esta noche, pero no la muerte pendiente.",
        {
          action: "pukka_delayed",
          actorId,
          targetId: previousId,
          automatic: true,
          rule: "Pukka y Exorcista",
        },
      );
      return {
        previousId,
        targetId: null,
        poisoned: false,
        reason: "exorcised",
      };
    }
    // Todas las partes de la habilidad dependen de que Pukka la conserve. Si
    // está ebrio o envenenado, el objetivo anterior sigue envenenado: no muere
    // hasta una noche posterior en la que Pukka vuelva a tener habilidad.
    if (!hasAbility(actor, state)) {
      addHistory(
        state,
        `Pukka${target ? ` elige a ${target.name}` : " no despierta"}.`,
        "Pukka no tiene habilidad: no envenena ni mata al objetivo anterior.",
        { action: "pukka", actorId, targetId, automatic: true, rule: "Pukka" },
      );
      return {
        previousId: state.pukkaPoisonedId || null,
        targetId,
        poisoned: false,
        reason: "no_ability",
      };
    }
    const previousId = state.pukkaPoisonedId;
    target.poisoned = true;
    if (previousId) {
      const previous = getPlayer(state, previousId);
      if (previous) {
        killPlayer(state, previousId, "demon_attack", { sourceId: actorId });
        previous.poisoned = false;
      }
    }
    target.poisoned = true;
    state.pukkaPoisonedId = targetId;
    refreshBmrDrunkenness(state);
    addHistory(
      state,
      `Pukka elige a ${target.name}.`,
      previousId
        ? "El nuevo objetivo queda envenenado; después se resuelve la muerte del objetivo anterior y se retira su veneno."
        : "El objetivo queda envenenado.",
      { action: "pukka", actorId, targetId, automatic: true, rule: "Pukka" },
    );
    return { previousId, targetId, poisoned: true };
  }

  /** El Zombuul solo ataca tras un día sin muertes, incluso si se ejecutó a un muerto. */
  function resolveZombuulAttack(state, actorId, targetId) {
    if (state.scriptId !== "bad_moon_rising")
      throw new Error("Esta resolución pertenece a Bad Moon Rising.");
    if (state.day?.deathOccurred)
      return { died: false, reason: "someone_died_today" };
    const actor = getPlayer(state, actorId);
    if (!actor || actor.character !== "zombuul" || !hasAbility(actor, state))
      return { died: false, reason: "no_ability" };
    return killPlayer(state, targetId, "demon_attack", { sourceId: actorId });
  }

  return {
    refreshBmrDrunkenness,
    bmrDeathPrevention,
    recordBmrPrevention,
    resolveGrandmotherSetup,
    resolveSailor,
    resolveInnkeeper,
    resolveExorcist,
    resolveGambler,
    resolveCourtier,
    resolveProfessor,
    resolveDevilsAdvocate,
    resolveAssassin,
    resolveGossip,
    resolveMinstrel,
    resolveGoon,
    resolveTinkerDeath,
    resolveGodfather,
    chooseMoonchild,
    resolveMoonchild,
    resolveShabaloth,
    resolvePo,
    resolvePukkaNight,
    resolveZombuulAttack,
  };
}
