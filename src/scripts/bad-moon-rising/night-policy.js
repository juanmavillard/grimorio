// Solo decide si se omite un despertar; no aplica efectos ni toma decisiones.
export function skipNightStep({
  state,
  roleId,
  actor,
  number,
  alreadyCompleted,
  alivePlayers,
  outsiderDiedDuringPreviousDay,
  character,
}) {
  if (alreadyCompleted) return false;
  if (
    roleId === "grandmother" &&
    number !== 1 &&
    !actor.grandmotherSetupPending
  )
    return true;
  if (
    roleId === "godfather" &&
    number !== 1 &&
    !outsiderDiedDuringPreviousDay(state)
  )
    return true;
  if (
    roleId === "moonchild" &&
    (!actor.moonchildPending || !actor.moonchildTargetId)
  )
    return true;
  if (roleId === "zombuul" && state.day?.deathOccurred) return true;
  if (
    roleId === "chambermaid" &&
    alivePlayers(state).filter((player) => player.id !== actor.id).length < 2
  )
    return true;
  if (
    roleId === "lunatic" &&
    state.lunaticSetup?.apparentDemonId === "zombuul" &&
    state.day?.deathOccurred
  )
    return true;
  if (
    ["courtier", "professor", "assassin"].includes(roleId) &&
    actor.abilityUsed
  )
    return true;
  return (
    character(roleId, state.scriptId)?.team === "demon" &&
    actor.exorcisedNight === state.round &&
    !(roleId === "pukka" && state.pukkaPoisonedId)
  );
}

export function extraDeadActor({ roleId, actor }) {
  return roleId === "moonchild" && actor.moonchildPending;
}
export function permitsDeadActor(roleId) {
  return roleId === "moonchild";
}
export function keepsPoisonAtDusk() {
  return true;
}
export function onDusk(state, { refreshBmrDrunkenness }) {
  refreshBmrDrunkenness(state);
}
