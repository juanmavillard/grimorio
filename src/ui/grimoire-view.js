// Presentación privada del Grimorio; el controlador proporciona el estado actual.
export function renderGrimoire(context) {
  const {
    game,
    grimoireFilter,
    narratorRelations,
    statusSummary,
    nightSteps,
    esc,
    character,
    hasAbility,
    getPlayer,
    playerBadges,
    playerDialog,
    roleName,
    narratorSituationCard,
    shell,
  } = context;
  function grimoireView() {
    const ordered = [...game.players].sort((a, b) => a.seat - b.seat);
    const relations = narratorRelations(game).labelsByPlayer;
    const summary = statusSummary(game);
    const nocturnal = game.phase === "night" ? nightSteps(game) : [];
    const currentStep = nocturnal[game.night?.stepIndex];
    const canNominate =
      game.phase === "day"
        ? ordered.filter(
            (p) =>
              p.alive &&
              !game.day.nominations.some((n) => n.nominatorId === p.id),
          )
        : [];
    const ghostReady = ordered.filter((p) => !p.alive && p.ghostVote);
    const ghostSpent = ordered.filter((p) => !p.alive && !p.ghostVote);
    const content = `<div class="page-title"><div><p class="eyebrow">${esc(game.title)}</p><h1>Grimorio</h1></div><div class="phase-chip ${game.phase}">${game.phase === "night" ? "Noche" : game.phase === "day" ? "Día" : game.phase === "ended" ? "Partida terminada" : "Preparación"} ${game.phase !== "ended" ? game.round : ""}</div></div>
    ${game.outcome ? `<div class="outcome ${game.outcome.winner}"><span>${game.outcome.winner === "good" ? "✦" : "◆"}</span><div><p>Victoria del ${game.outcome.winner === "good" ? "Bien" : "Mal"}</p><small>${esc(game.outcome.reason)}</small></div></div>` : ""}
    <div class="grimoire-filters" role="toolbar" aria-label="Filtros privados del Grimorio">${[
      ["all", "Todos"],
      ["active", "Actúa ahora"],
      ["status", "Con estado"],
      ["evil", "Malvados"],
      ["relations", "Relaciones"],
    ]
      .map(
        ([id, label]) =>
          `<button class="${grimoireFilter === id ? "active" : ""}" aria-pressed="${grimoireFilter === id}" data-action="grimoire-filter" data-filter="${id}">${label}</button>`,
      )
      .join("")}</div>
    <section class="grimoire-wrap panel">
      <div class="circle-board">
        <div class="circle-center"><span>${summary.alive}</span><small>vivos</small><b>mayoría ${summary.majority}</b></div>
        ${ordered
          .map((p, i) => {
            const angle = (i / ordered.length) * Math.PI * 2 - Math.PI / 2;
            const x = 50 + Math.cos(angle) * 41,
              y = 50 + Math.sin(angle) * 41;
            const labels = relations[p.id] || [];
            const match =
              grimoireFilter === "all" ||
              (grimoireFilter === "active" && labels.includes("actúa ahora")) ||
              (grimoireFilter === "status" &&
                (p.poisoned ||
                  p.protected ||
                  p.redHerring ||
                  p.masterId ||
                  !p.alive)) ||
              (grimoireFilter === "evil" && p.alignment === "evil") ||
              (grimoireFilter === "relations" && labels.length);
            return `<button class="seat ${p.alive ? "" : "is-dead"} ${character(p.character).team} ${match ? "" : "filter-muted"} ${labels.length ? "has-relation" : ""}" style="--x:${x}%;--y:${y}%" data-player="${p.id}"><span class="seat-no">${i + 1}</span><strong>${esc(p.name)}</strong><span>${roleName(p.character)}</span><div class="mini-badges">${playerBadges(p)}</div>${labels.length ? `<small class="relation-label">${esc(labels.slice(0, 2).join(" · "))}</small>` : ""}</button>`;
          })
          .join("")}
      </div>
    </section>
    <div class="action-strip">
      ${game.phase === "night" ? `<button class="primary" data-view="night">Continuar noche <span>→</span></button>` : ""}
      ${game.phase === "day" ? `<button class="primary" data-view="day">Gestionar día <span>→</span></button>` : ""}
      <button class="secondary" data-action="export">Exportar copia</button>
      <label class="secondary file-label">Importar<input type="file" id="import-file" accept="application/json"></label>
      <button class="danger-quiet" data-action="new-game">Nueva partida</button>
    </div>`;
    const aside = `${narratorSituationCard()}<div class="aside-card status-card"><p class="eyebrow">¿Qué tengo que hacer ahora?</p><h3>${game.phase === "night" ? `Noche ${game.round}` : game.phase === "day" ? `Día ${game.round}` : "Partida cerrada"}</h3>${game.phase === "night" ? `<p><b>${currentStep ? `Ahora: ${esc(currentStep.name)}` : "Noche completada"}</b><br>Quedan ${summary.pending} pasos nocturnos.</p>` : game.phase === "day" ? `<p>${summary.alive} vivos · mayoría ${summary.majority}.<br>${game.day.nominations.length} nominaciones registradas.</p><p><b>Pueden nominar:</b> ${canNominate.map((p) => esc(p.name)).join(", ") || "nadie"}.</p><p><b>Voto de muerto:</b> ${ghostReady.map((p) => esc(p.name)).join(", ") || "ninguno"}.<br><b>Gastado:</b> ${ghostSpent.map((p) => esc(p.name)).join(", ") || "ninguno"}.</p>` : `<p>${esc(game.outcome?.reason || "")}</p>`}</div>
    <div class="aside-card"><h3>Estados activos</h3><ul class="state-list">${
      ordered
        .flatMap((p) => [
          p.poisoned ? `<li><b>Veneno</b><span>${esc(p.name)}</span></li>` : "",
          p.protected
            ? `<li><b>Protección</b><span>${esc(p.name)}</span></li>`
            : "",
          p.redHerring
            ? `<li><b>Señuelo rojo</b><span>${esc(p.name)}</span></li>`
            : "",
          p.masterId
            ? `<li><b>${p.character === "butler" && hasAbility(p, game) ? "Amo" : "Amo aparente"} de ${esc(p.name)}</b><span>${esc(getPlayer(game, p.masterId)?.name || "—")}</span></li>`
            : "",
        ])
        .filter(Boolean)
        .join("") || `<li class="empty">Ningún estado temporal.</li>`
    }</ul></div>
    <div class="aside-card evil-card"><h3>Equipo malvado</h3>${ordered
      .filter((p) => p.alignment === "evil")
      .map(
        (p) =>
          `<p><b>${esc(p.name)}</b><span>${roleName(p.character)}</span></p>`,
      )
      .join(
        "",
      )}<hr><small>Bluffs del Demonio</small><p class="bluffs">${game.bluffs.map(roleName).join(" · ") || "No se dan en partidas de 5–6."}</p></div>`;
    return shell(content, aside) + playerDialog();
  }

  return grimoireView();
}
