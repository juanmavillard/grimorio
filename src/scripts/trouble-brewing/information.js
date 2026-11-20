// Reglas de información propias del guion.
export function createTroubleBrewingInformation({
  aliveNeighbours,
  getPlayer,
  character,
  isGoodTeam,
}) {
  function chefPairs(state, evilOverrides = {}) {
    const ordered = [...state.players].sort((a, b) => a.seat - b.seat);
    let total = 0;
    for (let i = 0; i < ordered.length; i++) {
      const a = ordered[i],
        b = ordered[(i + 1) % ordered.length];
      const aEvil = evilOverrides[a.id] ?? a.alignment === "evil";
      const bEvil = evilOverrides[b.id] ?? b.alignment === "evil";
      if (aEvil && bEvil) total += 1;
    }
    return total;
  }

  function empathNumber(state, playerId, evilOverrides = {}) {
    return aliveNeighbours(state, playerId).filter(
      (p) => evilOverrides[p.id] ?? p.alignment === "evil",
    ).length;
  }

  function fortuneAnswer(state, selectedIds, demonOverrides = {}) {
    return selectedIds.some((id) => {
      const p = getPlayer(state, id);
      return (
        p && (demonOverrides[id] ?? (p.character === "imp" || p.redHerring))
      );
    });
  }

  function canRegisterAs(player, characterId) {
    if (!player || !character(characterId)) return false;
    if (player.character === characterId) return true;
    if (player.poisoned) return false;
    const shownTeam = character(characterId).team;
    if (player.character === "spy") return isGoodTeam(shownTeam);
    if (player.character === "recluse")
      return shownTeam === "minion" || shownTeam === "demon";
    return false;
  }

  function startingInfoIsLegal(state, roleId, selectedIds, shownRole) {
    if (roleId === "librarian" && shownRole === "zero") {
      return !state.players.some(
        (p) => character(p.character)?.team === "outsider",
      );
    }
    const requiredTeam =
      roleId === "washerwoman"
        ? "townsfolk"
        : roleId === "librarian"
          ? "outsider"
          : roleId === "investigator"
            ? "minion"
            : null;
    if (!requiredTeam || character(shownRole)?.team !== requiredTeam)
      return false;
    return selectedIds.some((id) =>
      canRegisterAs(getPlayer(state, id), shownRole),
    );
  }

  function possibleAlignment(player) {
    if (
      !player.poisoned &&
      (player.character === "spy" || player.character === "recluse")
    )
      return new Set(["good", "evil"]);
    return new Set([player.alignment]);
  }

  function possibleChefNumbers(state) {
    const ordered = [...state.players].sort((a, b) => a.seat - b.seat);
    let minimum = 0,
      flexible = 0;
    for (let i = 0; i < ordered.length; i++) {
      const a = possibleAlignment(ordered[i]);
      const b = possibleAlignment(ordered[(i + 1) % ordered.length]);
      const canCount = a.has("evil") && b.has("evil");
      const mustCount =
        a.size === 1 && a.has("evil") && b.size === 1 && b.has("evil");
      if (mustCount) minimum += 1;
      else if (canCount) flexible += 1;
    }
    return Array.from({ length: flexible + 1 }, (_, i) => minimum + i);
  }

  function possibleEmpathNumbers(state, playerId) {
    const neighbours = aliveNeighbours(state, playerId);
    const fixed = neighbours.filter((p) => {
      const options = possibleAlignment(p);
      return options.size === 1 && options.has("evil");
    }).length;
    const flexible = neighbours.filter(
      (p) => possibleAlignment(p).size > 1,
    ).length;
    return Array.from({ length: flexible + 1 }, (_, i) => fixed + i);
  }

  function possibleFortuneAnswers(state, selectedIds) {
    const selected = selectedIds
      .map((id) => getPlayer(state, id))
      .filter(Boolean);
    if (selected.some((p) => p.character === "imp" || p.redHerring))
      return [true];
    if (selected.some((p) => p.character === "recluse" && !p.poisoned))
      return [false, true];
    return [false];
  }

  return {
    chefPairs,
    empathNumber,
    fortuneAnswer,
    canRegisterAs,
    startingInfoIsLegal,
    possibleChefNumbers,
    possibleEmpathNumbers,
    possibleFortuneAnswers,
  };
}
