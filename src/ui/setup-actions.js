import { promptText } from "./dialogs.js";
import { downloadJson } from "./game-actions.js";
// Formaciones: las preferencias siguen siendo independientes de la partida activa.
export async function handleSetupAction(action, target, context) {
  const {
    renderedPresets,
    notify,
    applySetupPreset,
    render,
    buildCuratedPreset,
    setup,
    randomRoleSet,
    validateSetup,
    favoriteFromSelection,
    setupWarnings,
    saveFavoriteSetup,
    deleteFavoriteSetup,
  } = context;
  if (action === "apply-preset") {
    const preset = renderedPresets.get(target.dataset.preset);
    if (!preset) return notify("No se encontró esa formación.", "error");
    try {
      applySetupPreset(preset);
      render();
      notify(`Formación aplicada: ${preset.title}`);
    } catch (error) {
      notify(error.message, "error");
    }
  }
  if (action === "randomize-profile") {
    try {
      const preset = buildCuratedPreset(setup.count, target.dataset.profile, {
        random: Math.random,
      });
      preset.id = `${preset.id}-variant-${Date.now()}`;
      applySetupPreset(preset);
      render();
      notify("Variante equilibrada generada");
    } catch (error) {
      notify(error.message, "error");
    }
  }
  if (action === "suggest-roles") {
    setup.roles = randomRoleSet(setup.count, Math.random, setup.scriptId);
    setup.drunkBelief = null;
    setup.appliedPreset = null;
    render();
  }
  if (action === "save-favorite") {
    const validation = validateSetup(
      setup.count,
      setup.roles,
      setup.scriptId,
      setup.setupChoices,
    );
    if (!validation.valid)
      return notify("Corrige el reparto antes de guardarlo.", "error");
    const suggestedName = setup.appliedPreset?.title
      ? `${setup.appliedPreset.title} · ${setup.count}`
      : `Formación de ${setup.count} jugadores`;
    const title = (
      await promptText("Nombre de la formación", suggestedName)
    )?.trim();
    if (!title) return;
    try {
      const favorite = favoriteFromSelection(
        title,
        setup.count,
        setup.roles,
        setup.roles.includes("drunk") ? setup.drunkBelief : null,
      );
      favorite.difficulty = "Personalizada";
      favorite.description =
        "Formación guardada localmente en este dispositivo.";
      favorite.warnings = setupWarnings(
        setup.count,
        setup.roles,
        setup.experience,
      );
      context.favoriteSetups = saveFavoriteSetup(favorite);
      render();
      notify("Formación guardada en este dispositivo");
    } catch (error) {
      notify(error.message, "error");
    }
  }
  if (action === "delete-favorite") {
    const preset = context.favoriteSetups.find(
      (item) => item.id === target.dataset.preset,
    );
    if (preset && confirm(`¿Eliminar la formación “${preset.title}”?`)) {
      context.favoriteSetups = deleteFavoriteSetup(preset.id);
      if (setup.appliedPreset?.id === preset.id) setup.appliedPreset = null;
      render();
      notify("Formación eliminada");
    }
  }
  if (action === "export-formations") {
    const payload = {
      format: "grimorio-formations",
      version: 1,
      exportedAt: new Date().toISOString(),
      formations: context.favoriteSetups,
    };
    await downloadJson(
      payload,
      `formaciones-base3-${new Date().toISOString().slice(0, 10)}.json`,
    );
  }
}
