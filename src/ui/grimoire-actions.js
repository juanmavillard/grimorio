export async function savePlayerChanges(target, { dispatch, notify }) {
  const value = (id) => document.querySelector(id)?.value;
  const checked = (id) => Boolean(document.querySelector(id)?.checked);
  const values = {
    character: value("#edit-character"),
    perceivedCharacter: value("#edit-perceived"),
    alignment: value("#edit-alignment"),
    masterId: value("#edit-master") || null,
    alive: checked("#edit-alive"),
    poisoned: checked("#edit-poison"),
    protected: checked("#edit-protected"),
    redHerring: checked("#edit-red"),
    abilityUsed: checked("#edit-used"),
    ghostVote: checked("#edit-vote"),
    notes: value("#edit-notes"),
  };
  const type = {
    "save-player": "player.notes",
    "resolve-player": "player.resolve",
    "correct-player": "player.correct",
  }[target.dataset.action];
  const reason = value("#edit-reason") || "";
  if (
    type !== "player.notes" &&
    !confirm(
      type === "player.correct"
        ? "¿Corregir solo el registro? No se activarán ni limpiarán automáticamente habilidades. Revisa veneno, protección, usos, efectos y victoria."
        : "¿Resolver este cambio mediante el motor? Se registrarán las consecuencias y podrás deshacerlo.",
    )
  )
    return;
  await dispatch({
    type,
    playerId: target.dataset.id,
    values,
    reason,
    cause: value("#edit-cause") || "other",
    successorId: value("#edit-successor") || null,
  });
  notify("Jugador actualizado");
  document.querySelector("#player-dialog")?.close();
}
