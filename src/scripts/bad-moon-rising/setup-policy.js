export function validateComposition({ selectedIds, choices }) {
  return selectedIds.includes("godfather") &&
    ![-1, 1].includes(Number(choices.godfatherOutsiders ?? 1))
    ? ["El Padrino debe ajustar los Forasteros en −1 o +1."]
    : [];
}
export function validateDecisions({
  count,
  assignedIds,
  decisions,
  scriptId,
  getScript,
  expectedComposition,
  scriptCharacters,
  isGoodTeam,
}) {
  const errors = decisions.drunkBelief
    ? ["No debe configurarse personaje aparente si no hay Borracho."]
    : [];
  if (!assignedIds.includes("lunatic")) return errors;
  const lunatic = decisions.lunatic || {};
  const demonRoles = getScript(scriptId)?.setup?.demonRoles || [];
  const minionCount =
    expectedComposition(
      count,
      { selectedIds: assignedIds, choices: decisions.setupChoices || {} },
      scriptId,
    )?.minion || 0;
  const goodRoles = scriptCharacters(scriptId)
    .filter((role) => isGoodTeam(role.team))
    .map((role) => role.id);
  if (!demonRoles.includes(lunatic.apparentDemonId))
    errors.push(
      "El Lunático debe recibir una identidad aparente de Demonio de Bad Moon Rising.",
    );
  if (
    !Array.isArray(lunatic.minionIds) ||
    lunatic.minionIds.length !== minionCount ||
    new Set(lunatic.minionIds).size !== minionCount
  )
    errors.push(
      `El Lunático debe recibir ${minionCount} supuesto(s) Esbirro(s) distinto(s).`,
    );
  if (
    !Array.isArray(lunatic.bluffIds) ||
    lunatic.bluffIds.length !== 3 ||
    new Set(lunatic.bluffIds).size !== 3 ||
    lunatic.bluffIds.some((id) => !goodRoles.includes(id))
  )
    errors.push("El Lunático debe recibir tres bluffs buenos distintos.");
  return errors;
}
export function dealIdentity({ player, state }) {
  return player.character === "lunatic"
    ? {
        id: state.lunaticSetup?.apparentDemonId,
        alignment: "evil",
        mustBeDemon: true,
      }
    : null;
}
export function defaultCompositionChoices() {
  return { godfatherOutsiders: 1 };
}
