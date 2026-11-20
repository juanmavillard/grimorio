export function effectiveRole(player) {
  return player?.character === "philosopher"
    ? player.philosopherRole || player.philosopherSimulatedRole
    : null;
}
export function acquiredAbility(player, roleId) {
  return (
    player?.character === "philosopher" &&
    (player.philosopherRole || player.philosopherSimulatedRole) === roleId
  );
}
export function aliveForAbility(player, state, character) {
  return (
    player.vigormortisEnabled &&
    character(player.character, state.scriptId)?.team === "minion"
  );
}
export function disabledIdentity(player) {
  return player.character === "philosopher" && player.philosopherSimulatedRole;
}

export function acquiredAbilityUsed(player) {
  return Boolean(player.philosopherGainedAbilityUsed);
}
export function markAcquiredAbilityUsed(player) {
  player.philosopherGainedAbilityUsed = true;
}
