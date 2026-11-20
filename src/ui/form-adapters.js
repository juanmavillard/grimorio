import { getScript } from "../core/scripts.js";

export function captureSetupDraft(root, setup) {
  const value = (id) => root.querySelector(`#${id}`)?.value;
  return {
    ...structuredClone(setup),
    title: value("setup-title") ?? setup.title,
    names: [...root.querySelectorAll(".player-name")].map(
      (input) => input.value,
    ),
    count: Number(value("player-count") ?? setup.count),
    scriptId: value("setup-script") ?? setup.scriptId,
    experience: value("setup-experience") ?? setup.experience,
    style: value("setup-style") ?? setup.style,
    secretDeal: root.querySelector("#secret-deal")?.checked ?? setup.secretDeal,
    roles: [...root.querySelectorAll("[data-role]:checked")].map(
      (input) => input.dataset.role,
    ),
    setupChoices: {
      ...setup.setupChoices,
      ...(value("godfather-outsiders") == null
        ? {}
        : { godfatherOutsiders: Number(value("godfather-outsiders")) }),
    },
  };
}

export function restoreSetupDraft(model, setup) {
  if (
    !model ||
    !Number.isInteger(model.count) ||
    model.count < 5 ||
    model.count > 15
  )
    return false;
  let script;
  try {
    script = getScript(model.scriptId);
  } catch {
    return false;
  }
  if (
    !script ||
    typeof model.title !== "string" ||
    !Array.isArray(model.names) ||
    model.names.length !== model.count ||
    model.names.some((name) => typeof name !== "string") ||
    !Array.isArray(model.roles) ||
    model.roles.some((role) => !Object.hasOwn(script.characterById, role))
  )
    return false;
  for (const key of [
    "count",
    "scriptId",
    "title",
    "names",
    "roles",
    "secretDeal",
    "experience",
    "style",
    "drunkBelief",
    "appliedPreset",
    "setupChoices",
  ])
    if (Object.hasOwn(model, key)) setup[key] = structuredClone(model[key]);
  return true;
}

// Asignación conserva únicamente decisiones sin confirmar; los roles asignados
// son autoridad del repositorio. Noche, voto y ficha usan campos independientes.
export const formKind = (view, playerId) =>
  playerId
    ? "player"
    : { setup: "setup", assign: "assignment", night: "night", day: "vote" }[
        view
      ] || "presentation";
