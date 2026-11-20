export function aliveForAbility(player) {
  return player.character === "zombuul" && player.zombuulRegisteredDead;
}
export function disabled(player, state, character) {
  return (
    player.exorcisedNight === state.round &&
    character(player.character, state.scriptId)?.team === "demon"
  );
}
