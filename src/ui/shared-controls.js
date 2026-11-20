import { setPrivacyMode } from "./navigation.js";
// Controles efímeros que no modifican la partida guardada.
export function handleSharedControl(action, target, context) {
  if (action === "grimoire-filter")
    context.grimoireFilter = target.dataset.filter || "all";
  else if (action === "open-help-query") {
    context.helpQuery = target.dataset.query || "";
    context.view = "reference";
  } else if (action === "select-doubt") {
    context.activeDoubt = target.dataset.doubt || "information";
    context.view = "reference";
  } else if (action === "open-library") context.view = "library";
  else if (action === "reload-update") {
    context.update();
    return;
  } else if (action === "hide-overlay") return setPrivacyMode(null, context);
  else {
    const modes = {
      privacy: "cover",
      "public-view": "town",
      "reveal-public": "reveal",
      "spy-mode": "spy",
    };
    if (!modes[action]) return;
    return setPrivacyMode(modes[action], context);
  }
  context.render();
}
