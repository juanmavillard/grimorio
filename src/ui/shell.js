import { renderPublicSquare } from "./public-square.js";
export function createShell({
  game,
  view,
  statusSummary,
  esc,
  activeScript,
  canUndo,
  canRedo,
  pwaUpdateAvailable,
  townSquareProjection,
  character,
  roleName,
  playerBadges,
}) {
  function header() {
    const summary = game ? statusSummary(game) : null;
    const nav =
      game && !["assign", "deal"].includes(game.phase)
        ? [
            ["grimoire", "Grimorio"],
            ["night", "Noche"],
            ["day", "Día"],
            ["history", "Historial"],
            ["diagnostics", "Diagnóstico"],
            ["library", "Partidas"],
            ["reference", "Ayuda"],
            ...(game.phase === "ended" ? [["reveal", "Revelación"]] : []),
          ]
        : [];
    return `<header class="topbar">
    <button type="button" class="brand" data-view="${game ? "grimoire" : "setup"}"><span class="brand-mark" aria-hidden="true">G</span><span><strong>Grimorio</strong><small>${esc(activeScript().name)} · privado</small></span></button>
    ${nav.length ? `<nav aria-label="Secciones">${nav.map(([id, label]) => `<a class="nav-btn ${view === id ? "active" : ""} ${(id === "night" && game.phase !== "night") || (id === "day" && game.phase !== "day") ? "disabled" : ""}" href="?view=${id}#${id}" data-view="${id}" ${(id === "night" && game.phase !== "night") || (id === "day" && game.phase !== "day") ? 'aria-disabled="true" tabindex="-1"' : ""}>${label}</a>`).join("")}</nav>` : ""}
    <div class="header-tools">
      ${summary ? `<span class="live-pill"><i></i>${summary.alive} vivos · N${game.round}</span>` : ""}
      ${!game ? `<button class="privacy-btn" data-action="open-library">Partidas</button>` : ""}
      ${game && !["assign", "deal"].includes(game.phase) ? `<button class="privacy-btn" data-action="public-view">Plaza pública</button><button class="privacy-btn" data-action="privacy">Tapar</button>` : ""}
      ${game ? `<button class="icon-btn" data-action="undo" ${canUndo() ? "" : "disabled"} title="Deshacer" aria-label="Deshacer">↶</button><button class="icon-btn" data-action="redo" ${canRedo() ? "" : "disabled"} title="Rehacer" aria-label="Rehacer">↷</button>` : ""}
      ${pwaUpdateAvailable ? `<button class="privacy-btn" data-action="reload-update">Actualizar</button>` : ""}
    </div>
  </header>`;
  }

  function privateOverlay() {
    const mode = document.body.dataset.privateOverlay;
    if (!mode) return "";
    if (mode === "town") {
      const town = townSquareProjection(game);
      return renderPublicSquare(town, esc);
    }
    if (mode === "reveal") {
      return `<div class="private-overlay public-overlay"><div class="overlay-head"><div><p class="eyebrow">Fin de partida</p><h1>Revelación</h1><p>${esc(game.outcome?.reason || "")}</p></div><button class="primary" data-action="hide-overlay">Cerrar revelación</button></div><div class="reveal-grid">${[
        ...game.players,
      ]
        .sort((a, b) => a.seat - b.seat)
        .map(
          (p) =>
            `<article class="${character(p.character).team}"><span>${p.seat + 1}</span><h2>${esc(p.name)}</h2><p>${roleName(p.character)}</p><small>${p.alignment === "good" ? "Equipo bueno" : "Equipo malvado"}${p.character === "drunk" ? ` · creía ser ${roleName(p.perceivedCharacter)}` : ""}</small></article>`,
        )
        .join("")}</div></div>`;
    }
    if (mode === "spy") {
      const reminders = game.history
        .filter((item) => item.phase === "night" && item.round === game.round)
        .reverse();
      return `<div class="private-overlay spy-overlay"><div class="overlay-head"><div><p class="eyebrow">Vista segura</p><h1>Grimorio para el Espía</h1></div><button class="primary" data-action="hide-overlay">Ocultar ahora</button></div><div class="spy-grid">${game.players.map((p) => `<article class="${character(p.character).team} ${p.alive ? "" : "dead"}"><span>${p.seat + 1}</span><h2>${esc(p.name)}</h2><p>${roleName(p.character)}</p><div>${playerBadges(p)}</div></article>`).join("")}</div>${reminders.length ? `<section class="spy-reminders"><h2>Recordatorios de esta noche</h2>${reminders.map((item) => `<p><b>${esc(item.text)}</b>${item.detail ? `<span>${esc(item.detail)}</span>` : ""}</p>`).join("")}</section>` : ""}</div>`;
    }
    return `<main class="private-overlay cover-overlay" data-action="hide-overlay" aria-label="Pantalla privada"><div><span>G</span><h1>Pantalla privada</h1><p>Toca para volver al Grimorio.</p></div></main>`;
  }

  function shell(content, aside = "") {
    if (document.body.dataset.privateOverlay) return privateOverlay();
    return `${header()}<main class="page ${aside ? "with-aside" : ""}"><section class="content">${content}</section>${aside ? `<aside class="side-rail">${aside}</aside>` : ""}</main><footer><span>Uso personal y offline</span><span>No afiliado a The Pandemonium Institute</span></footer>`;
  }

  return { header, shell };
}
