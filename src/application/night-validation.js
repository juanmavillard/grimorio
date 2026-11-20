import * as engine from "../core/engine.js";
export function validateNightResolution(game, input) {
  const {
    roleId,
    targetId,
    targetA,
    targetB,
    bmrRole,
    bmrDrunkTarget,
    waitForLater,
    snvRole,
    snvRoleGood,
    snvRoleEvil,
  } = input;
  const information = input.information || {};
  const decisions = input.decisions || {};
  const {
    canRegisterAs,
    chambermaidWakeCount,
    clockmakerNumber,
    flowergirlAnswer,
    getPlayer,
    hasAbility,
    oracleNumber,
    outsiderDiedDuringPreviousDay,
    possibleChefNumbers,
    possibleEmpathNumbers,
    possibleFortuneAnswers,
    seamstressSameAlignment,
    startingInfoIsLegal,
    townCrierAnswer,
    vortoxForcesFalseInformation,
  } = engine;

  const step = engine.nightSteps(game)[game.night.stepIndex];
  if (!step || step.roleId !== roleId || game.night.completed.includes(step.id))
    throw new Error("El paso nocturno ya cambió. Revisa la noche.");
  const actor = step.actorId ? engine.getPlayer(game, step.actorId) : null;
  const notify = (message) => {
    throw new Error(message);
  };
  const bmr = game.scriptId === "bad_moon_rising";
  const snv = game.scriptId === "sects_and_violets";
  const lunaticDemon = game.lunaticSetup?.apparentDemonId;
  const lunaticHasNightAction =
    roleId === "lunatic" && (game.night.number > 1 || lunaticDemon === "pukka");
  const lunaticNeedsPair =
    lunaticHasNightAction && lunaticDemon === "shabaloth";
  const gossipTrue = Boolean(decisions.gossipTrue);
  const outsiderDiedToday = outsiderDiedDuringPreviousDay(game);
  const bmrNeedsOne =
    [
      "grandmother",
      "sailor",
      "exorcist",
      "gambler",
      "professor",
      "devils_advocate",
      "assassin",
      "zombuul",
    ].includes(roleId) ||
    (roleId === "pukka" && actor?.exorcisedNight !== game.round) ||
    (roleId === "gossip" && gossipTrue) ||
    (roleId === "godfather" && game.night.number !== 1 && outsiderDiedToday) ||
    (lunaticHasNightAction && !lunaticNeedsPair && lunaticDemon !== "po_bmr");
  if (bmrNeedsOne && !targetId && !waitForLater)
    return notify("Elige un jugador antes de continuar.", "error");
  if (
    bmr &&
    (["chambermaid", "innkeeper", "shabaloth"].includes(roleId) ||
      lunaticNeedsPair) &&
    (!targetA || !targetB || targetA === targetB)
  )
    return notify("Elige dos jugadores distintos antes de continuar.", "error");
  if (
    bmr &&
    roleId === "sailor" &&
    (!bmrDrunkTarget || ![actor.id, targetId].includes(bmrDrunkTarget))
  )
    return notify(
      "El borracho debe ser el Marinero o el jugador que eligió.",
      "error",
    );
  if (
    bmr &&
    roleId === "innkeeper" &&
    (!bmrDrunkTarget || ![targetA, targetB].includes(bmrDrunkTarget))
  )
    return notify(
      "El borracho debe ser uno de los dos huéspedes protegidos.",
      "error",
    );
  if (
    bmr &&
    ["gambler", "courtier"].includes(roleId) &&
    !bmrRole &&
    !waitForLater
  )
    return notify("Elige un personaje antes de continuar.", "error");
  const snvNeedsTarget = [
    "evil_twin",
    "snake_charmer",
    "dreamer",
    "witch",
    "cerenovus",
    "pit_hag",
    "fang_gu",
    "vigormortis",
    "no_dashii",
    "vortox",
  ].includes(roleId);
  if (snv && snvNeedsTarget && !targetId)
    return notify("Elige un jugador antes de continuar.", "error");
  if (snv && roleId === "dreamer" && targetId === actor?.id)
    return notify("El Soñador debe elegir a otra persona.", "error");
  if (
    snv &&
    roleId === "seamstress" &&
    !waitForLater &&
    (!targetA ||
      !targetB ||
      targetA === targetB ||
      targetA === actor?.id ||
      targetB === actor?.id)
  )
    return notify(
      "La Costurera debe elegir a otros dos jugadores distintos.",
      "error",
    );
  if (snv && ["cerenovus", "pit_hag"].includes(roleId) && !snvRole)
    return notify("Elige un personaje antes de continuar.", "error");
  if (snv && hasAbility(actor, game)) {
    const falseInfo = vortoxForcesFalseInformation(game);
    const shownValue = information.value;
    const requireTruthState = (shown, base, label) => {
      if (shown !== (falseInfo ? base : !base)) return false;
      notify(
        `${label}: ${falseInfo ? "con Vortox la información debe ser falsa" : "la información sana debe ser correcta"}.`,
        "error",
      );
      return true;
    };
    if (roleId === "dreamer") {
      if (!snvRoleGood || !snvRoleEvil)
        return notify(
          "Elige los dos personajes que mostrarás al Soñador.",
          "error",
        );
      const correct = [snvRoleGood, snvRoleEvil].filter(
        (id) => id === getPlayer(game, targetId)?.character,
      ).length;
      if ((!falseInfo && correct !== 1) || (falseInfo && correct === 1))
        return notify(
          falseInfo
            ? "Con Vortox, la pareja del Soñador no puede contener exactamente el personaje correcto."
            : "Una de las dos fichas del Soñador debe ser el personaje correcto.",
          "error",
        );
    }
    if (roleId === "seamstress" && !waitForLater) {
      const base = seamstressSameAlignment(game, targetA, targetB),
        shown = shownValue === "same";
      if (requireTruthState(shown, base, "Costurera")) return;
    }
    if (["flowergirl", "town_crier"].includes(roleId)) {
      const base =
          roleId === "flowergirl"
            ? flowergirlAnswer(game)
            : townCrierAnswer(game),
        shown = shownValue === "yes";
      if (
        requireTruthState(
          shown,
          base,
          roleId === "flowergirl" ? "Florista" : "Pregonero",
        )
      )
        return;
    }
    if (["clockmaker", "oracle"].includes(roleId)) {
      const base =
          roleId === "clockmaker" ? clockmakerNumber(game) : oracleNumber(game),
        shown = Number(shownValue);
      if (
        base !== null &&
        requireTruthState(
          shown === base,
          true,
          roleId === "clockmaker" ? "Relojero" : "Oráculo",
        )
      )
        return;
    }
  }
  const goonChosenByChambermaid =
    bmr &&
    roleId === "chambermaid" &&
    [targetA, targetB]
      .map((id) => getPlayer(game, id))
      .some(
        (player) =>
          player?.character === "goon" &&
          player.goonTriggeredRound !== game.round &&
          hasAbility(player, game),
      );
  if (
    bmr &&
    roleId === "chambermaid" &&
    hasAbility(actor, game) &&
    !goonChosenByChambermaid
  ) {
    const shown = Number(information.value);
    const base = chambermaidWakeCount(game, [targetA, targetB]);
    if (shown !== base)
      return notify(
        `Una Camarera sana debe ver ${base} con esos dos jugadores.`,
        "error",
      );
  }
  if (
    ["poisoner", "monk", "butler", "imp", "ravenkeeper"].includes(roleId) &&
    !targetId
  )
    return notify("Elige un jugador antes de continuar.", "error");
  if (["washerwoman", "librarian", "investigator"].includes(roleId)) {
    const a = information.playerA,
      b = information.playerB,
      shown = information.roleId;
    if (shown !== "zero" && (!a || !b || a === b))
      return notify(
        "Elige dos jugadores distintos para la información.",
        "error",
      );
    if (
      hasAbility(actor, game) &&
      !startingInfoIsLegal(game, roleId, [a, b], shown)
    )
      return notify(
        "Esa información no es legal para un personaje sano. Revisa los jugadores, el personaje mostrado y los registros de Espía/Recluso.",
        "error",
      );
  }
  if (roleId === "fortune_teller") {
    const a = information.playerA,
      b = information.playerB;
    if (!a || !b || a === b)
      return notify("La Adivina debe elegir dos jugadores distintos.", "error");
    const shown = information.value === "yes";
    if (
      hasAbility(actor, game) &&
      !possibleFortuneAnswers(game, [a, b]).includes(shown)
    )
      return notify(
        "La respuesta elegida no es posible para una Adivina sana con esos objetivos.",
        "error",
      );
  }
  if (roleId === "chef" && hasAbility(actor, game)) {
    const shown = Number(information.value);
    if (!possibleChefNumbers(game).includes(shown))
      return notify(
        "Ese número no es posible para un Chef sano, incluso usando los registros permitidos.",
        "error",
      );
  }
  if (roleId === "empath" && hasAbility(actor, game)) {
    const shown = Number(information.value);
    if (!possibleEmpathNumbers(game, actor.id).includes(shown))
      return notify(
        "Ese número no es posible para una Empática sana con sus vecinos vivos.",
        "error",
      );
  }
  if (["undertaker", "ravenkeeper"].includes(roleId)) {
    const selectedId = roleId === "undertaker" ? game.day.executedId : targetId;
    const shown = information.roleId;
    const receivesTrueInfo =
      roleId === "ravenkeeper"
        ? actor.ravenkeeperTriggered
        : hasAbility(actor, game);
    if (receivesTrueInfo && !canRegisterAs(getPlayer(game, selectedId), shown))
      return notify(
        "Ese personaje no puede registrarse así ante esta habilidad sana.",
        "error",
      );
  }
  if (roleId === "imp") {
    const redirectId = decisions.mayorRedirectId || null;
    if (redirectId && redirectId === targetId)
      return notify(
        "La redirección del Alcalde debe elegir a otro jugador.",
        "error",
      );
  }
}
