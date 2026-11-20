export function validateDecisions({
  assignedIds,
  decisions,
  character,
  scriptId,
}) {
  const errors = [],
    { drunkBelief = null, redHerringIsGood = false } = decisions;
  const drunk = assignedIds.includes("drunk");
  if (
    drunk &&
    (!drunkBelief ||
      assignedIds.includes(drunkBelief) ||
      character(drunkBelief, scriptId)?.team !== "townsfolk")
  )
    errors.push("El Borracho debe creer ser un Aldeano fuera de juego.");
  if (!drunk && drunkBelief)
    errors.push("No debe configurarse personaje aparente si no hay Borracho.");
  if (assignedIds.includes("fortune_teller") && !redHerringIsGood)
    errors.push("El señuelo rojo debe ser un jugador bueno.");
  return errors;
}
export function apparentRole({
  role,
  options,
  inPlay,
  character,
  scriptId,
  shuffle,
  unusedTownsfolk,
}) {
  if (role !== "drunk") return role;
  const belief = options.drunkBelief;
  return belief &&
    !inPlay.has(belief) &&
    character(belief, scriptId)?.team === "townsfolk"
    ? belief
    : shuffle(unusedTownsfolk, options.random)[0];
}
export function excludedBluffRole(players) {
  return players.find((p) => p.character === "drunk")?.perceivedCharacter;
}
export function finishPlayers({ players, shuffle, random }) {
  const candidates = players.filter((p) => p.alignment === "good");
  if (
    players.some((p) => p.character === "fortune_teller") &&
    candidates.length
  )
    shuffle(candidates, random)[0].redHerring = true;
}
export function legacyCompositionModifier(enabled) {
  return enabled ? ["baron"] : [];
}
export function assignedIdentity(player, { drunkBelief, redId }) {
  return {
    perceivedCharacter:
      player.character === "drunk" ? drunkBelief : player.character,
    redHerring: player.id === redId,
  };
}
