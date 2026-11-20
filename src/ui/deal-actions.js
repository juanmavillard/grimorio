// Preparación, asignación y reparto: solo publicar el estado tras guardarlo.
export async function handleDealAction(action, context) {
  const {
    dispatch,
    game,
    setup,
    validateSetup,
    notify,
    render,
    engineDefaultAlignment,
    validateSetupDecisions,
  } = context;
  if (action === "create-game") {
    const validation = validateSetup(
      setup.count,
      setup.roles,
      setup.scriptId,
      setup.setupChoices,
    );
    if (!validation.valid) return notify(validation.errors[0], "error");
    await dispatch({
      type: "game.create",
      input: {
        names: setup.names.slice(0, setup.count),
        roles: setup.roles,
        options: {
          title: setup.title,
          secretDeal: setup.secretDeal,
          drunkBelief: setup.roles.includes("drunk") ? setup.drunkBelief : null,
          preset: setup.appliedPreset,
          scriptId: setup.scriptId,
          setupChoices: setup.setupChoices,
        },
      },
    });
    context.view = "assign";
    render();
  }
  if (action === "shuffle-assignment") {
    await dispatch({ type: "setup.shuffle" });
    render();
  }
  if (action === "back-to-setup") {
    await dispatch({ type: "game.clear" });
    context.view = "setup";
    render();
  }
  if (action === "confirm-assignment") {
    const fields = [...document.querySelectorAll(".assignment-role")];
    const playerIds = fields.map((field) => field.dataset.id);
    if (
      playerIds.length !== game.players.length ||
      new Set(playerIds).size !== game.players.length ||
      game.players.some((player) => !playerIds.includes(player.id))
    )
      return notify(
        "La asignación de jugadores no es válida. Recarga la pantalla.",
        "error",
      );
    const assigned = fields.map((x) => x.value);
    const expected = [...game.selectedRoles].sort().join("|");
    if ([...assigned].sort().join("|") !== expected)
      return notify(
        "Cada personaje seleccionado debe asignarse exactamente una vez.",
        "error",
      );
    const assignment = Object.fromEntries(
      fields.map((x) => [x.dataset.id, x.value]),
    );
    const drunkBelief = document.querySelector("#assign-drunk")?.value || null;
    const redId = document.querySelector("#assign-red")?.value || null;
    const newAlignment = (id) =>
      engineDefaultAlignment(assignment[id], game.scriptId);
    const bluffs = [...document.querySelectorAll(".assign-bluff")].map(
      (x) => x.value,
    );
    const lunaticSetup =
      game.scriptId === "bad_moon_rising" && assigned.includes("lunatic")
        ? {
            apparentDemonId:
              document.querySelector("#assign-lunatic-demon")?.value || null,
            minionIds: [
              ...document.querySelectorAll(".assign-lunatic-minion:checked"),
            ].map((input) => input.value),
            bluffIds: [
              ...document.querySelectorAll(".assign-lunatic-bluff"),
            ].map((input) => input.value),
          }
        : null;
    const decisions = validateSetupDecisions(
      game.players.length,
      assigned,
      {
        drunkBelief,
        redHerringIsGood: Boolean(redId && newAlignment(redId) === "good"),
        bluffs,
        lunatic: lunaticSetup,
        setupChoices: game.setupChoices || {},
      },
      game.scriptId,
    );
    if (!decisions.valid) return notify(decisions.errors[0], "error");
    await dispatch(
      {
        type: "setup.confirm",
        assignment,
        drunkBelief,
        redId,
        bluffs,
        lunaticSetup,
      },
      "Preparación confirmada",
    );
    context.view = context.game.phase;
    render();
  }
  if (action === "reveal-role") {
    document.body.dataset.dealRevealed = "true";
    render();
  }
  if (action === "hide-role") {
    document.body.dataset.dealRevealed = "false";
    await dispatch(
      { type: "deal.next" },
      game.dealIndex < game.players.length - 1
        ? "Pasa el dispositivo"
        : "El Narrador recupera el dispositivo",
    );
    context.view = context.game.phase;
    render();
  }
  if (action === "deal-back") await dispatch({ type: "deal.back" });
}

export async function saveAssignmentChoice(element, context) {
  await context.dispatch({
    type: "setup.assign",
    playerId: element.dataset.id,
    role: element.value,
  });
}
