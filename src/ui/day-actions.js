export async function handleDayAction(action, target, context) {
  const { dispatch, notify, render } = context;
  const value = (id) => document.querySelector(id)?.value;
  const checked = (id) => Boolean(document.querySelector(id)?.checked);
  const voters = () =>
    [...document.querySelectorAll("[data-voter]:checked")].map(
      (el) => el.dataset.voter,
    );
  let command, message;
  if (action === "open-nominations") {
    command = { type: "day.open" };
    message = "Nominaciones abiertas";
  }
  if (action === "start-nomination") {
    if (!value("#nominator") || !value("#nominee"))
      return notify("Elige quién nomina y a quién.", "error");
    command = {
      type: "day.nominate",
      nominatorId: value("#nominator"),
      nomineeId: value("#nominee"),
      spyRegistersTownsfolk: checked("#spy-virgin"),
    };
    message = "Nominación iniciada";
  }
  if (action === "cancel-nomination") {
    command = { type: "day.cancel" };
    message = "Nominación cancelada";
  }
  if (action === "advance-nomination") {
    command =
      target.dataset.next === "complete"
        ? { type: "day.vote", voterIds: voters() }
        : { type: "day.advance", stage: target.dataset.next };
    message =
      target.dataset.next === "defense"
        ? "Comienza la defensa"
        : target.dataset.next === "vote"
          ? "Comienza la votación"
          : "Votación registrada";
  }
  if (action === "add-nomination") {
    command = {
      type: "day.directVote",
      nominatorId: value("#nominator"),
      nomineeId: value("#nominee"),
      voterIds: voters(),
      spyRegistersTownsfolk: checked("#spy-virgin"),
    };
    message = "Nominación registrada";
  }
  if (action === "close-day") {
    if (!confirm("¿Cerrar nominaciones y resolver la ejecución de hoy?"))
      return;
    command = {
      type: "day.close",
      pacifistSaves: checked("#bmr-pacifist-save"),
    };
    message = "Día resuelto";
  }
  const abilities = {
    "choose-moonchild": [
      "ability.moonchild",
      [value("#bmr-moonchild"), value("#bmr-moonchild-target")],
      "Elección del Niño Lunar registrada",
    ],
    "resolve-tinker": [
      "ability.tinker",
      [value("#bmr-tinker")],
      "Muerte del Manitas registrada",
    ],
    "record-savant": [
      "ability.savant",
      [value("#snv-savant"), value("#snv-savant-detail")],
      "Visita del Sabio registrada",
    ],
    "use-artist": [
      "ability.artist",
      [
        value("#snv-artist"),
        value("#snv-artist-question"),
        value("#snv-artist-answer"),
      ],
      "Pregunta del Artista registrada",
    ],
    "record-juggler": [
      "ability.juggler",
      [value("#snv-juggler"), value("#snv-juggler-detail")],
      "Conjeturas del Malabarista registradas",
    ],
    "use-slayer": [
      "ability.slayer",
      [
        value("#slayer-actor"),
        value("#slayer-target"),
        checked("#recluse-demon"),
      ],
      "Disparo resuelto",
    ],
  };
  if (abilities[action]) {
    const [type, args, text] = abilities[action];
    if (
      action === "resolve-tinker" &&
      !confirm("¿Hacer morir ahora al Manitas?")
    )
      return;
    command = { type, args };
    message = text;
  }
  if (action === "resolve-madness") {
    const [sourceRole, targetId] = (value("#snv-madness-target") || "").split(
      ":",
    );
    if (
      !targetId ||
      !confirm(
        "¿Ejecutar ahora a este jugador por la decisión de locura? La ejecución terminará el día.",
      )
    )
      return;
    command = { type: "ability.madness", args: [targetId, sourceRole] };
    message = "Ejecución por locura resuelta";
  }
  if (!command) return;
  try {
    const before = context.game;
    await dispatch(command, message);
    if (before.phase === "day" && context.game.phase !== "day") {
      context.view =
        context.game.phase === "ended" ? "grimoire" : context.game.phase;
      render();
    }
    if (
      action === "start-nomination" &&
      context.game.day.pendingNomination?.witchTriggered
    )
      notify("El nominador muere; la nominación continúa si la partida sigue.");
  } catch (error) {
    notify(error.message, "error");
  }
}
