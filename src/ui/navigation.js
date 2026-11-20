export function canNavigate(destination, game) {
  if (!game) return ["setup", "library"].includes(destination);
  if (["assign", "deal"].includes(game.phase))
    return destination === game.phase;
  if (
    ![
      "grimoire",
      "night",
      "day",
      "history",
      "diagnostics",
      "library",
      "reference",
      "reveal",
    ].includes(destination)
  )
    return false;
  if (destination === "reveal")
    return (
      game.phase === "ended" && ["good", "evil"].includes(game.outcome?.winner)
    );
  return !(
    ["day", "night"].includes(destination) && destination !== game.phase
  );
}
export function navigateTo(destination, context) {
  if (!canNavigate(destination, context.game)) return false;
  context.view = destination;
  const url = new URL(location.href);
  url.searchParams.set("view", destination);
  url.hash = destination;
  if (url.href !== location.href) history.pushState(null, "", url);
  context.render();
  return true;
}
export function setPrivacyMode(mode, context) {
  if (mode === "reveal" && !canNavigate("reveal", context.game)) return false;
  if (mode && !context.game) return false;
  document
    .querySelectorAll("#toast, dialog, .save-indicator")
    .forEach((element) => {
      if (element.dataset.privateDialog)
        element.dispatchEvent(new Event("private-dismiss"));
      else if (element.tagName === "DIALOG") element.close();
      else {
        element.hidden = Boolean(mode);
        if (mode) element.textContent = "";
      }
    });
  if (mode) document.body.dataset.privateOverlay = mode;
  else delete document.body.dataset.privateOverlay;
  context.render();
  if (mode) document.querySelector('[data-action="hide-overlay"]')?.focus();
  return true;
}
export function handleShortcut(event, context) {
  if (
    /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName || "") ||
    event.target?.isContentEditable
  )
    return;
  if (event.key === "Escape" && document.body.dataset.privateOverlay) {
    setPrivacyMode(null, context);
    return;
  }
  if (!context.game || event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.toLowerCase() === "t") {
    setPrivacyMode("town", context);
    return;
  }
  const destination =
    event.key === "?"
      ? "reference"
      : { g: "grimoire", n: "night", d: "day", h: "reference" }[
          event.key.toLowerCase()
        ];
  if (destination) {
    event.preventDefault();
    navigateTo(destination, context);
  }
}
export function navigateFromLocation(context) {
  let destination;
  try {
    destination =
      new URLSearchParams(location.search).get("view") ||
      decodeURIComponent(location.hash.slice(1));
  } catch {
    return;
  }
  if (destination) navigateTo(destination, context);
}
