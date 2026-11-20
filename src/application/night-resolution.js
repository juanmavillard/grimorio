import * as engine from "../core/engine.js";
export function applyNightResolution(draft, input) {
  const {
    roleId,
    targetId,
    targetA,
    targetB,
    targetC,
    bmrRole,
    bmrDrunkTarget,
    bmrRegurgitate,
    bmrTinkerDies,
    waitForLater,
    snvRole,
    snvRoleGood,
    snvRoleEvil,
    snvArbitraryVictims,
    note,
  } = input;
  const information = input.information || {};
  const decisions = input.decisions || {};
  const lunaticHasNightAction =
    roleId === "lunatic" &&
    (draft.night.number > 1 || draft.lunaticSetup?.apparentDemonId === "pukka");
  const {
    addHistory,
    chambermaidWakeCount,
    character,
    chefPairs,
    empathNumber,
    fortuneAnswer,
    getPlayer,
    hasAbility,
    markRoleAbilityUsed,
    nightSteps,
    resolveAssassin,
    resolveCourtier,
    resolveDevilsAdvocate,
    resolveEvilTwinSetup,
    resolveExorcist,
    resolveGambler,
    resolveGodfather,
    resolveGoon,
    resolveGossip,
    resolveGrandmotherSetup,
    resolveImpAttack,
    resolveInnkeeper,
    resolveMoonchild,
    resolvePhilosopher,
    resolvePitHag,
    resolvePitHagArbitraryDeaths,
    resolvePo,
    resolveProfessor,
    resolvePukkaNight,
    resolveSailor,
    resolveShabaloth,
    resolveSnakeCharmer,
    resolveSnvDemonAttack,
    resolveTinkerDeath,
    resolveWitch,
    resolveZombuulAttack,
  } = engine;
  const roleName = (id) => engine.character(id, draft.scriptId)?.name || "—";

  const draftStep = nightSteps(draft)[draft.night.stepIndex];
  const draftActor = draftStep.actorId
    ? getPlayer(draft, draftStep.actorId)
    : null;
  let detail = note;
  if (draft.scriptId === "sects_and_violets") {
    if (roleId === "evil_twin") {
      resolveEvilTwinSetup(draft, draftActor.id, targetId);
      detail ||= `Conoce a ${getPlayer(draft, targetId).name}; ambos reciben la información.`;
    } else if (roleId === "snake_charmer") {
      const result = resolveSnakeCharmer(draft, draftActor.id, targetId);
      detail ||= result.swapped
        ? "Intercambio de personaje y alineamiento; el nuevo Encantador queda envenenado."
        : "No hubo intercambio.";
    } else if (roleId === "witch") {
      resolveWitch(draft, draftActor.id, targetId);
      detail ||= `${getPlayer(draft, targetId).name} queda maldito para el próximo día.`;
    } else if (roleId === "pit_hag") {
      const result = resolvePitHag(draft, draftActor.id, targetId, snvRole);
      detail ||= result.arbitraryDeaths
        ? "Se creó un Demonio: decide las muertes nocturnas."
        : "Cambio de personaje registrado.";
    } else if (
      ["fang_gu", "vigormortis", "no_dashii", "vortox"].includes(roleId) &&
      draft.snvArbitraryDeathsRound === draft.round
    ) {
      if (draft.snvArbitraryDeathsResolvedRound !== draft.round) {
        const results = resolvePitHagArbitraryDeaths(
          draft,
          snvArbitraryVictims,
        );
        detail ||= `El Demonio eligió a ${getPlayer(draft, targetId)?.name}; muertes arbitrarias revisadas: ${results.filter((result) => result.died).length}.`;
      } else
        detail ||= `El Demonio eligió a ${getPlayer(draft, targetId)?.name}; no se aplica automáticamente otra muerte.`;
    } else if (
      ["fang_gu", "vigormortis", "no_dashii", "vortox"].includes(roleId)
    ) {
      const result = resolveSnvDemonAttack(draft, draftActor.id, targetId);
      detail ||= result.jumped
        ? "El Fang Gu salta al Forastero."
        : result.died
          ? "Ataque resuelto."
          : "No hubo muerte por falta de habilidad.";
    } else if (roleId === "philosopher") {
      if (!snvRole)
        detail ||= "El Filósofo espera y conserva su elección para otra noche.";
      else {
        const result = resolvePhilosopher(draft, draftActor.id, snvRole);
        detail ||= !result.applied
          ? "Elección simulada sin habilidad activa."
          : result.drunkTargetId
            ? `El Filósofo gana la habilidad de ${roleName(snvRole)}; ${getPlayer(draft, result.drunkTargetId).name} queda ebrio.`
            : `El Filósofo gana la habilidad de ${roleName(snvRole)}.`;
      }
    } else if (roleId === "cerenovus") {
      if (hasAbility(draftActor, draft)) {
        draftActor.cerenovusTargetId = targetId;
        draftActor.cerenovusRole = snvRole;
      }
      detail ||= hasAbility(draftActor, draft)
        ? `${getPlayer(draft, targetId).name} recibe una condición privada de locura sobre ${roleName(snvRole)}.`
        : "Elección simulada sin condición de locura real.";
    } else if (roleId === "seamstress") {
      if (waitForLater) detail ||= "La Costurera espera y conserva su uso.";
      else {
        markRoleAbilityUsed(draftActor, "seamstress");
        detail ||= `${getPlayer(draft, targetA).name} y ${getPlayer(draft, targetB).name}: ${information.value === "same" ? "misma" : "distinta"} alineación mostrada.`;
      }
    } else if (roleId === "dreamer") {
      detail ||= `${getPlayer(draft, targetId).name}: muestra ${roleName(snvRoleGood)} y ${roleName(snvRoleEvil)}.`;
    } else if (
      [
        "clockmaker",
        "flowergirl",
        "town_crier",
        "oracle",
        "mathematician",
        "juggler",
      ].includes(roleId)
    ) {
      detail ||= `Información mostrada: ${information.value ?? "—"}.`;
    } else if (["savant", "artist"].includes(roleId)) {
      detail ||= "Información o pregunta registrada en la nota privada.";
    }
  }
  if (draft.scriptId === "bad_moon_rising") {
    const chosenIds = waitForLater
      ? []
      : [targetId, targetA, targetB, targetC].filter(Boolean);
    const goon = chosenIds
      .map((id) => getPlayer(draft, id))
      .find((player) => player?.character === "goon");
    // La Abuela no «elige»: el Narrador señala a su nieto. Ese gesto no
    // activa al Matón. El Asesino se trata justo después de su muerte para
    // conservar la excepción oficial (el Matón cambia de equipo aunque muera).
    if (
      goon &&
      !["assassin", "grandmother", "shabaloth", "po_bmr"].includes(roleId)
    )
      resolveGoon(draft, goon.id, draftActor.id);
    if (roleId === "grandmother") {
      const child = resolveGrandmotherSetup(draft, draftActor.id, targetId);
      detail ||= `Conoce a ${child.name} y su personaje.`;
    } else if (roleId === "sailor") {
      resolveSailor(draft, draftActor.id, targetId, bmrDrunkTarget);
      detail ||= `${getPlayer(draft, bmrDrunkTarget).name} queda borracho.`;
    } else if (roleId === "chambermaid") {
      const base = chambermaidWakeCount(draft, [targetA, targetB]);
      detail ||= `${getPlayer(draft, targetA).name} y ${getPlayer(draft, targetB).name}: resultado base ${base}; mostró ${information.value ?? "0"}.`;
    } else if (roleId === "exorcist") {
      const result = resolveExorcist(draft, draftActor.id, targetId);
      detail ||= result.demon
        ? "Era el Demonio: no actúa esta noche."
        : "No era el Demonio.";
    } else if (roleId === "innkeeper") {
      resolveInnkeeper(
        draft,
        draftActor.id,
        [targetA, targetB],
        bmrDrunkTarget,
      );
      detail ||= `${getPlayer(draft, bmrDrunkTarget).name} queda borracho.`;
    } else if (roleId === "gambler") {
      const result = resolveGambler(draft, draftActor.id, targetId, bmrRole);
      detail ||= result.correct ? "Apuesta acertada." : "Apuesta fallada.";
    } else if (roleId === "courtier") {
      if (waitForLater) detail ||= "El Cortesano espera y conserva su uso.";
      else {
        const result = resolveCourtier(draft, draftActor.id, bmrRole);
        detail ||=
          result.applied === false
            ? "Elección simulada sin efecto real; uso consumido."
            : `${roleName(bmrRole)} queda borracho tres noches y tres días.`;
      }
    } else if (roleId === "professor") {
      if (waitForLater) detail ||= "El Profesor espera y conserva su uso.";
      else {
        const result = resolveProfessor(draft, draftActor.id, targetId);
        detail ||= result.resurrected ? "Resucita." : "No resucita.";
      }
    } else if (roleId === "devils_advocate") {
      resolveDevilsAdvocate(draft, draftActor.id, targetId);
      detail ||= "Protegido de ejecución mañana.";
    } else if (roleId === "assassin") {
      if (waitForLater) detail ||= "El Asesino espera y conserva su uso.";
      else {
        const result = resolveAssassin(draft, draftActor.id, targetId);
        detail ||= result.died
          ? "Muere ignorando protecciones."
          : "Sin muerte.";
      }
    } else if (roleId === "pukka") {
      const result = resolvePukkaNight(draft, draftActor.id, targetId);
      detail ||=
        result.reason === "exorcised"
          ? "El Exorcista impide la elección; se resuelve la muerte anterior."
          : result.reason === "no_ability"
            ? "Pukka no tiene habilidad: no hay elección efectiva ni muerte anterior."
            : result.previousId
              ? "El nuevo objetivo queda envenenado; se resuelve la muerte y curación del anterior."
              : "El objetivo queda envenenado.";
    } else if (roleId === "zombuul") {
      const result = resolveZombuulAttack(draft, draftActor.id, targetId);
      detail ||= result.died ? "Ataque resuelto." : "No ataca esta noche.";
    } else if (roleId === "shabaloth") {
      const result = resolveShabaloth(
        draft,
        draftActor.id,
        [targetA, targetB],
        bmrRegurgitate || null,
      );
      detail ||= `${result.deaths.filter((item) => item.died).length} muerte(s) resuelta(s).`;
    } else if (roleId === "po_bmr") {
      const targets = [targetA, targetB, targetC].filter(Boolean);
      const result = resolvePo(draft, draftActor.id, targets);
      detail ||=
        result.reason === "no_ability"
          ? result.charged
            ? "Elección simulada sin muerte; Po conserva la carga."
            : "Elecciones simuladas sin muerte; se registra su última elección."
          : result.charged
            ? "Po no elige a nadie y carga su próximo ataque."
            : "Ataque de Po resuelto.";
    } else if (roleId === "godfather" && draft.night.number === 1) {
      detail ||= `Personajes Forasteros en juego: ${
        draft.players
          .filter(
            (player) =>
              character(player.character, draft.scriptId)?.team === "outsider",
          )
          .map((player) => roleName(player.character))
          .join(", ") || "ninguno"
      }.`;
    } else if (roleId === "godfather") {
      const result = resolveGodfather(draft, draftActor.id, targetId);
      detail ||= result.died
        ? "El Padrino mata tras la muerte de un Forastero."
        : "No había un Forastero muerto hoy o no había habilidad.";
    } else if (roleId === "gossip") {
      const result = resolveGossip(
        draft,
        draftActor.id,
        targetId,
        decisions.gossipTrue,
      );
      detail ||= result.died
        ? "La afirmación era verdadera: ocurre una muerte."
        : "No ocurre muerte por el Chismoso.";
    } else if (roleId === "tinker" && bmrTinkerDies) {
      const result = resolveTinkerDeath(draft, draftActor.id);
      detail ||= result.died
        ? "El Manitas muere por decisión del Narrador."
        : "La muerte del Manitas fue evitada.";
    } else if (roleId === "moonchild") {
      const result = resolveMoonchild(draft, draftActor.id);
      detail ||= result.died
        ? "El objetivo bueno muere esta noche."
        : result.reason === "no_ability"
          ? "El Niño Lunar está ebrio o envenenado al resolver; no causa muerte."
          : "El objetivo no muere; revisa su alineamiento al elegir y las posibles protecciones.";
    } else if (roleId === "lunatic") {
      const choices = [targetId, targetA, targetB, targetC].filter(Boolean);
      if (lunaticHasNightAction) {
        draftActor.lunaticChoices ||= [];
        draftActor.lunaticChoices.push({
          round: draft.round,
          targetIds: choices,
        });
        detail ||= `El Lunático finge elegir a ${
          choices
            .map((id) => getPlayer(draft, id)?.name)
            .filter(Boolean)
            .join(" y ") || "nadie"
        }; el Demonio real conoce la elección.`;
      } else
        detail ||=
          "El Lunático recibe su información inicial fingida; su Demonio aparente no actúa esta primera noche.";
    }
  }
  if (roleId === "new_demon_info") {
    draftActor.newDemonNeedsInfo = false;
    detail ||= `${draftActor.name} aprende en secreto que ahora es el Diablillo.`;
  } else if (roleId === "poisoner" && targetId) {
    const target = getPlayer(draft, targetId);
    target.poisoned =
      hasAbility(draftActor, draft) && target.id !== draftActor.id;
    detail ||=
      target.id === draftActor.id
        ? `${target.name} se elige a sí mismo; su efecto se anula al perder la habilidad.`
        : `${target.name} queda ${target.poisoned ? "envenenado" : "sin efecto real"}.`;
  } else if (roleId === "monk" && targetId) {
    getPlayer(draft, targetId).protected = hasAbility(draftActor, draft);
    detail ||= `${getPlayer(draft, targetId).name} queda protegido.`;
  } else if (roleId === "butler" && targetId) {
    draftActor.masterId = targetId;
    detail ||= `${getPlayer(draft, targetId).name} es el amo.`;
  } else if (roleId === "imp" && targetId) {
    const redirectId = decisions.mayorRedirectId || null;
    const successorId = decisions.impSuccessorId || null;
    const result = resolveImpAttack(draft, draftActor.id, targetId, {
      redirectId,
      successorId,
    });
    detail ||= `Objetivo: ${getPlayer(draft, targetId)?.name}. Resultado: ${result.died ? "muerte" : "sin muerte"} (${result.reason}).`;
  } else if (["washerwoman", "librarian", "investigator"].includes(roleId)) {
    const a = information.playerA,
      b = information.playerB,
      r = information.roleId;
    detail ||= `${getPlayer(draft, a)?.name || "—"} / ${getPlayer(draft, b)?.name || "—"}: ${r === "zero" ? "0" : roleName(r)}.`;
  } else if (["chef", "empath", "fortune_teller"].includes(roleId)) {
    const value = information.value;
    const a = information.playerA,
      b = information.playerB;
    const base =
      roleId === "chef"
        ? chefPairs(draft)
        : roleId === "empath"
          ? empathNumber(draft, draftActor.id)
          : fortuneAnswer(draft, [a, b])
            ? "SÍ"
            : "NO";
    const shown =
      roleId === "fortune_teller" ? (value === "yes" ? "SÍ" : "NO") : value;
    detail ||=
      roleId === "fortune_teller"
        ? `${getPlayer(draft, a)?.name || "—"} + ${getPlayer(draft, b)?.name || "—"}. Resultado base: ${base}. Narrador mostró: ${shown}.`
        : `Resultado mecánico base: ${base}. Narrador mostró: ${shown}.`;
  } else if (["undertaker", "ravenkeeper"].includes(roleId)) {
    const shown = information.roleId;
    detail ||= `Personaje mostrado: ${roleName(shown)}.`;
  }
  addHistory(
    draft,
    `${draftStep.name}${draftActor ? ` · ${draftActor.name}` : ""}`,
    detail || "Paso completado.",
    {
      action: "night_step",
      actorId: draftActor?.id || null,
      targetId: targetId || null,
      automatic: false,
      rule: draftStep.name,
    },
  );
  draft.night.completed.push(draftStep.id);
  const nextSteps = nightSteps(draft);
  const nextIndex = nextSteps.findIndex(
    (item) => !draft.night.completed.includes(item.id),
  );
  draft.night.stepIndex = nextIndex < 0 ? nextSteps.length : nextIndex;
}
