// Reglas de información propias del guion.
export function createBadMoonRisingInformation({ getPlayer, nightSteps }) {
  function chambermaidWakeCount(state, targetIds) {
    const chosen = [...new Set(targetIds || [])].map((id) =>
      getPlayer(state, id),
    );
    if (chosen.length !== 2 || chosen.some((player) => !player?.alive))
      throw new Error("La Camarera debe elegir dos jugadores vivos distintos.");
    const steps = nightSteps(state);
    return chosen.filter((player) =>
      steps.some(
        (step) =>
          step.actorId === player.id &&
          ![
            "new_demon_info",
            "minion_info",
            "demon_info",
            "ravenkeeper",
            "moonchild",
            "tinker",
          ].includes(step.roleId) &&
          !(step.roleId === "pukka" && player.exorcisedNight === state.round),
      ),
    ).length;
  }

  return { chambermaidWakeCount };
}
