// Restricciones de despertar propias de Sects & Violets.
export function skipNightStep({
  state,
  roleId,
  actor,
  number,
  alreadyCompleted,
  alivePlayers,
  roleAbilityUsed,
}) {
  if (alreadyCompleted) return false;
  return (
    (roleId === "witch" && alivePlayers(state).length <= 3) ||
    (roleId === "seamstress" && roleAbilityUsed(actor, "seamstress")) ||
    (roleId === "juggler" && number !== 2) ||
    (roleId === "fang_gu" && actor.fangGuSkipAttackNight === number)
  );
}

export function extraSteps({
  state,
  roleId,
  number,
  position,
  actualRoleForNight,
  character,
}) {
  if (position !== "after" || roleId !== "philosopher" || number <= 1)
    return [];
  return state.players
    .filter(
      (p) =>
        p.alive &&
        p.character === "philosopher" &&
        actualRoleForNight(p) === "clockmaker" &&
        p.philosopherChoiceNight === number,
    )
    .map((actor) => ({
      id: `clockmaker-${actor.id}`,
      roleId: "clockmaker",
      actorId: actor.id,
      name: character("clockmaker", state.scriptId).name,
    }));
}
export function apparentNightRole(player) {
  return player.character === "philosopher"
    ? player.philosopherRole || player.philosopherSimulatedRole
    : null;
}
export function onDusk(state) {
  state.witchCurseId = null;
  state.witchCurseRound = null;
  state.witchSourceId = null;
  state.players.forEach((player) => {
    if (player.character === "cerenovus") {
      player.cerenovusTargetId = null;
      player.cerenovusRole = null;
    }
  });
}
