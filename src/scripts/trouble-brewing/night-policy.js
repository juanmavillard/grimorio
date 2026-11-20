// Excepciones de despertar de Trouble Brewing; el orden se conserva en data.js.
export function skipNightStep({
  state,
  roleId,
  actor,
  number,
  alreadyCompleted,
}) {
  return (
    (roleId === "ravenkeeper" && !actor.diedThisNight && !alreadyCompleted) ||
    (roleId === "undertaker" && !state.day.executionCausedDeath) ||
    (roleId === "imp" && actor.skipImpAttackNight === number)
  );
}

export function extraDeadActor({ roleId, actor }) {
  return roleId === "ravenkeeper" && actor.diedThisNight;
}
export function permitsDeadActor(roleId) {
  return roleId === "ravenkeeper";
}
export function extraSteps({ state, roleId, number, position }) {
  if (roleId !== "imp") return [];
  return state.players
    .filter(
      (p) =>
        p.character === "imp" &&
        (p.newDemonNeedsInfo ||
          state.night.completed.includes(`new_demon_info-${p.id}-${number}`)) &&
        (position === "before"
          ? p.skipImpAttackNight !== number
          : p.skipImpAttackNight === number),
    )
    .map((actor) => ({
      id: `new_demon_info-${actor.id}-${number}`,
      roleId: "new_demon_info",
      actorId: actor.id,
      name: "Informar al nuevo Diablillo",
    }));
}
export function apparentNightRole(player) {
  return player.character === "drunk" ? player.perceivedCharacter : null;
}
export function onDusk(state) {
  state.players.forEach((player) => {
    player.ravenkeeperTriggered = false;
  });
}
