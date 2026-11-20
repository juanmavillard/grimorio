export async function handlePendingAction(
  action,
  target,
  { dispatch, notify },
) {
  try {
    if (action === "pit-hag-extra") {
      const id = document.querySelector("#pit-hag-extra-target")?.value;
      if (!id)
        return notify(
          "Elige un jugador antes de registrar la decisión.",
          "error",
        );
      return await dispatch(
        { type: "ability.pitHag", args: [id, target.dataset.dies === "true"] },
        "Decisión del Narrador registrada",
      );
    }
    if (action === "skip-pending") {
      if (
        !confirm("¿Marcar esta decisión como revisada sin aplicar un efecto?")
      )
        return;
      return await dispatch(
        { type: "effect.skip", effectId: target.dataset.effect },
        "Decisión pendiente revisada",
      );
    }
    const values = Object.fromEntries(
      ["target", "actor", "a", "b"].map((key) => [
        key,
        document.getElementById(`pending-${key}-${target.dataset.effect}`)
          ?.value,
      ]),
    );
    await dispatch(
      { type: "effect.resolve", effectId: target.dataset.effect, values },
      "Decisión pendiente resuelta",
    );
  } catch (error) {
    notify(error.message, "error");
  }
}
