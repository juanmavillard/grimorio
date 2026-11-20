export async function handleNightControl(
  action,
  target,
  { game, dispatch, nightSteps, recordNightStep, stopPhaseTimer, notify },
) {
  if (action === "night-preflight")
    return dispatch({ type: "night.preflight" }, "Noche preparada");
  if (action === "night-prev" || action === "night-jump")
    return dispatch({
      type: "night.index",
      index:
        action === "night-prev"
          ? Math.max(0, game.night.stepIndex - 1)
          : Number(target.dataset.index),
    });
  if (action === "night-complete") {
    const step = nightSteps(game)[game.night.stepIndex];
    try {
      if (step && game.night.completed.includes(step.id)) {
        const steps = nightSteps(game),
          next = steps.findIndex(
            (item) => !game.night.completed.includes(item.id),
          );
        await dispatch({
          type: "night.index",
          index: next < 0 ? steps.length : next,
        });
      } else if (step) await recordNightStep(step);
    } catch (error) {
      notify(error.message || "No se pudo registrar el paso.", "error");
    }
  }
  if (action === "start-day") {
    await dispatch({ type: "day.begin" }, `Comienza el día ${game.round}`);
    stopPhaseTimer();
  }
}
