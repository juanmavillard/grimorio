// Validación y registro de cada paso de noche.
export function createNightActions(context) {
  const { game } = context;

  async function recordNightStep(step) {
    const roleId = step.roleId;
    const targetId = document.querySelector("#night-target")?.value;
    const targetA = document.querySelector("#night-target-a")?.value;
    const targetB = document.querySelector("#night-target-b")?.value;
    const targetC = document.querySelector("#night-target-c")?.value;
    const bmrRole = document.querySelector("#bmr-role")?.value;
    const bmrDrunkTarget = document.querySelector("#bmr-drunk-target")?.value;
    const bmrRegurgitate = document.querySelector("#bmr-regurgitate")?.value;
    const bmrTinkerDies = Boolean(
      document.querySelector("#bmr-tinker-dies")?.checked,
    );
    const waitForLater = Boolean(
      document.querySelector("#night-wait")?.checked,
    );
    const snvRole = document.querySelector("#snv-role")?.value;
    const snvRoleGood = document.querySelector("#snv-role-good")?.value;
    const snvRoleEvil = document.querySelector("#snv-role-evil")?.value;
    const snvArbitraryVictims = [
      ...document.querySelectorAll("[data-snv-arbitrary-victim]:checked"),
    ].map((input) => input.dataset.snvArbitraryVictim);
    const note = document.querySelector("#night-note")?.value.trim() || "";
    const lunaticDemon = game.lunaticSetup?.apparentDemonId;
    const lunaticHasNightAction =
      roleId === "lunatic" &&
      (game.night.number > 1 || lunaticDemon === "pukka");
    const value = (id) => document.getElementById(id)?.value;
    const information = {
      value: value("info-value"),
      playerA: value("info-player-a"),
      playerB: value("info-player-b"),
      roleId: value("info-role"),
    };
    const decisions = {
      gossipTrue: Boolean(document.getElementById("bmr-gossip-true")?.checked),
      mayorRedirectId: value("mayor-redirect"),
      impSuccessorId: value("imp-successor"),
    };
    await context.dispatch(
      {
        type: "night.record",
        input: {
          roleId,
          targetId,
          targetA,
          targetB,
          targetC,
          bmrRole,
          bmrDrunkTarget,
          bmrRegurgitate,
          bmrTinkerDies,
          waitForLater,
          snvRole,
          snvRoleGood,
          snvRoleEvil,
          snvArbitraryVictims,
          note,
          lunaticHasNightAction,
          information,
          decisions,
        },
      },
      "Paso nocturno registrado",
    );
  }

  return { recordNightStep };
}
