import { historyWindow } from "../core/read-models.js";
import { storageMetrics } from "../core/active-store.js";
import { RELEASE } from "../release.js";
import { runtimeInfo } from "./platform.js";
// Vistas privadas sin estado propio; las dependencias se reciben al renderizar.
export function createSupportViews(context) {
  const {
    game,
    diagnoseGame,
    loadRecoveryPoints,
    dateLabel,
    esc,
    shell,
    eventInspector,
    helpForSituation,
    activeDoubt,
    searchHelp,
    helpQuery,
    RULE_HELP,
    currentSources,
    DOUBT_GUIDES,
    ruleHelpMarkup,
    characterHelpMarkup,
    narratorSituationCard,
    character,
    roleName,
  } = context;

  function diagnosticsView() {
    const issues = diagnoseGame(game);
    const checkpoints = loadRecoveryPoints(game.id);
    const storage = storageMetrics();
    const content = `<div class="page-title"><div><p class="eyebrow">Comprobación privada</p><h1>Diagnóstico</h1><p>Aplicación ${esc(runtimeInfo().version || "web")} · recursos ${RELEASE.version} · formato ${game.schemaVersion}</p><p class="intro-copy">No cambia nada por sí solo. Revisa cada aviso y confirma cualquier corrección propuesta.</p></div><label class="diagnostic-export"><input id="diagnostic-anonymous" type="checkbox" checked> Exportar diagnóstico anónimo</label></div>
    <section class="diagnostic-summary panel ${issues.some((item) => item.severity === "error") ? "has-errors" : ""}"><h2>${issues.length ? `${issues.length} aviso${issues.length === 1 ? "" : "s"} para revisar` : "Todo parece coherente"}</h2><p>${issues.length ? "Los avisos no prueban que una decisión del Narrador sea incorrecta; señalan un estado que merece una revisión." : "La composición, los estados temporales y la fase actual no muestran incoherencias conocidas."}</p></section>
    <section class="diagnostic-list">${issues.length ? issues.map((item) => `<article class="diagnostic-item ${item.severity}"><span>${item.severity === "error" ? "!" : "i"}</span><div><h2>${esc(item.title)}</h2><p>${esc(item.detail)}</p></div>${item.fixId ? `<button class="secondary" data-action="apply-diagnostic-fix" data-fix="${esc(item.fixId)}">Aplicar corrección</button>` : "<small>Revisión manual necesaria</small>"}</article>`).join("") : '<p class="empty-state">No hay correcciones pendientes.</p>'}</section>
    <section class="panel"><h2>Almacenamiento local</h2><p>Partida: ${(storage.activeBytes / 1024).toFixed(1)} KiB · copias auxiliares: ${(storage.auxiliaryBytes / 1024).toFixed(1)} KiB / 2048 KiB.</p><p>Deshacer: ${storage.undo} · rehacer: ${storage.redo} · recuperación: ${storage.recovery} · revisión ${storage.revision}.</p><p>Último guardado: ${storage.lastSaveMs == null ? "sin medición en esta sesión" : `${storage.lastSaveMs.toFixed(1)} ms`}. ${storage.quota ? `Uso del origen: ${((100 * storage.usage) / storage.quota).toFixed(1)} %.` : "El navegador no proporciona una estimación de cuota."}</p>${storage.damaged ? `<p>Hay ${storage.damaged} copia(s) dañada(s) excluidas. Descarga un rescate desde Recuperación.</p>` : ""}${storage.activeBytes > storage.auxiliaryBudget ? "<p>La partida supera el presupuesto de copias auxiliares: algunas opciones de deshacer o recuperación pueden no conservarse. Descarga una copia.</p>" : ""}</section><section class="panel recovery-panel"><div><p class="eyebrow">Recuperación local</p><h2>Puntos de recuperación</h2><p>Se conservan los últimos ${checkpoints.length} guardados automáticos de esta partida en este navegador.</p></div><div class="recovery-list">${checkpoints.length ? checkpoints.map((point) => `<article><div><b>${dateLabel(point.at)}</b><small>${point.phase === "night" ? "Noche" : point.phase === "day" ? "Día" : point.phase} ${point.round || ""}</small></div><button class="secondary" data-action="restore-checkpoint" data-point="${point.id}">Restaurar</button></article>`).join("") : "<p>No hay puntos todavía.</p>"}</div></section>`;
    const aside = `<div class="aside-card"><h3>Exportar revisión</h3><p>Genera un archivo local con la versión, eventos y avisos. Se exporta sin nombres ni textos privados por defecto. Desmarca la opción anónima solo si quieres incluirlos.</p><button class="secondary full" data-action="export-diagnostics">Exportar diagnóstico</button></div><div class="aside-card muted"><h3>Qué no corrige</h3><p>La app no adivina decisiones deliberadas: información falsa, registros del Espía/Recluso, redirección del Alcalde y criterios narrativos siguen siendo tuyos.</p></div>`;
    return shell(content, aside);
  }

  function libraryView() {
    const content = `<div class="page-title"><div><p class="eyebrow">Este dispositivo</p><h1>Partida y archivos</h1><p class="intro-copy">Tu partida se guarda automáticamente aquí. Descarga una copia para conservarla o continuarla más adelante.</p></div></div><section class="panel files-card"><div><p class="eyebrow">${game ? "Partida activa" : "Sin partida activa"}</p><h2>${game ? esc(game.title) : "Tu próxima historia empieza aquí."}</h2><p>${game ? `Ronda ${esc(game.round || 1)} · ${game.phase === "night" ? "Noche" : game.phase === "day" ? "Día" : game.phase === "ended" ? "Terminada" : "Preparación"}` : "Crea una partida o carga una copia guardada."}</p></div><div class="files-actions">${game ? `<button class="primary" data-action="export">Descargar partida actual</button>` : ""}<label class="secondary file-label">Cargar partida<input type="file" id="import-file" accept="application/json,.json"></label></div></section><section class="panel"><h2>Borradores privados de esta pestaña</h2><p>Son elecciones todavía sin confirmar. Puedes descargarlos antes de recargar una pestaña obsoleta o descartarlos para actualizar la aplicación.</p><button class="secondary" data-action="export-drafts">Descargar borradores</button> <button class="text-btn" data-action="discard-all-drafts">Descartar borradores</button></section><section class="files-recovery panel"><div><p class="eyebrow">¿Necesitas una copia anterior?</p><h2>Recuperar partidas</h2><p>Consulta versiones guardadas, descarga una copia o elimina datos anteriores.</p></div><a class="secondary" href="recuperar.html">Abrir recuperación →</a></section>`;
    return shell(
      content,
      `<div class="aside-card"><p class="eyebrow">Privado y local</p><h3>Guarda tus copias</h3><p>Los archivos incluyen personajes, notas y nombres de jugadores. Guárdalos en un lugar privado.</p></div>`,
    );
  }

  function historyView() {
    const window = historyWindow(game, context.historyPage);
    const groups = window.records.reduce((acc, item) => {
      const key = item.round
        ? `${item.phase === "night" ? "Noche" : item.phase === "day" ? "Día" : "Partida"} ${item.round}`
        : "Preparación";
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
    const content = `<div class="page-title"><div><p class="eyebrow">Registro privado</p><h1>Historial</h1></div><button class="secondary" data-action="export">Exportar JSON</button></div><nav class="panel history-pagination" aria-label="Páginas del historial"><button class="secondary" data-action="history-page" data-page="${window.index - 1}" ${window.index === 0 ? "disabled" : ""}>Más recientes</button><span>Página ${window.index + 1} de ${window.total} · ${window.count} registros</span><button class="secondary" data-action="history-page" data-page="${window.index + 1}" ${window.index + 1 >= window.total ? "disabled" : ""}>Anteriores</button></nav><div class="timeline">${Object.entries(
      groups,
    )
      .map(
        ([label, items]) =>
          `<section><h2>${label}</h2>${items.map((item) => `<article><i></i><div><b>${esc(item.text)}</b>${item.detail ? `<p>${esc(item.detail)}</p>` : ""}${eventInspector(item)}<small>${new Date(item.at).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</small></div></article>`).join("")}</section>`,
      )
      .join("")}</div>`;
    return shell(
      content,
      `<div class="aside-card"><h3>Copia de seguridad</h3><p>La partida se guarda automáticamente en este navegador. Exporta un archivo si quieres moverla a otro dispositivo o conservarla.</p><button class="secondary full" data-action="export">Descargar copia</button></div>`,
    );
  }

  function referenceView() {
    const doubt = helpForSituation(activeDoubt);
    const results = searchHelp();
    const matchedIds = new Set(
      searchHelp(helpQuery).map((item) => `${item.type}:${item.id}`),
    );
    const rulesById = Object.fromEntries(
      RULE_HELP.map(([id, title, summary, detail, keywords]) => [
        id,
        {
          id,
          title,
          summary,
          detail,
          keywords,
          source: currentSources()[2]?.[1] || currentSources()[0]?.[1],
        },
      ]),
    );
    const relevantPlayers = game
      ? game.players.filter(
          (player) =>
            !doubt.roles.length ||
            doubt.roles.includes(player.character) ||
            doubt.roles.includes(player.perceivedCharacter),
        )
      : [];
    const content = `<div class="page-title"><div><p class="eyebrow">Referencia privada del Narrador</p><h1>Ayuda por capas</h1><p class="intro-copy">Respuesta breve primero; abre detalles o el manual cuando lo necesites. Nunca toma una decisión ambigua por ti.</p></div><label class="help-search"><span>Buscar regla, personaje o duda</span><input id="help-search" value="${esc(helpQuery)}" placeholder="Ej.: Virgen, veneno, registro, empate…"></label></div>
    <section class="panel doubt-resolver"><div><p class="eyebrow">Resolver una duda</p><h2>¿Qué situación tienes?</h2><div class="doubt-tabs">${DOUBT_GUIDES.map((guide) => `<button class="${guide.id === activeDoubt ? "active" : ""}" data-action="select-doubt" data-doubt="${guide.id}">${esc(guide.label)}</button>`).join("")}</div></div><div class="doubt-answer"><p>${esc(doubt.description)}</p><b>Siguiente paso recomendado</b><p>${esc(doubt.next)}</p>${relevantPlayers.length ? `<small>En esta partida: ${relevantPlayers.map((player) => esc(player.name)).join(" · ")}</small>` : "<small>No hay un personaje relacionado en esta partida.</small>"}</div><div class="doubt-rules">${doubt.ruleIds.map((id) => ruleHelpMarkup(rulesById[id])).join("")}</div></section>
    <section class="help-results"><div class="section-heading"><div><span class="step-no">?</span><h2>${helpQuery ? `Resultados para “${esc(helpQuery)}”` : "Personajes y reglas"}</h2></div><small id="help-result-count">${matchedIds.size} resultado${matchedIds.size === 1 ? "" : "s"}</small></div>${results.length ? `<div class="help-card-grid">${results.map((item) => `<div data-help-key="${item.type}:${item.id}" ${matchedIds.has(`${item.type}:${item.id}`) ? "" : "hidden"}>${item.type === "character" ? characterHelpMarkup(item.id) : ruleHelpMarkup(item)}</div>`).join("")}</div>` : ""}</section>
    <section class="panel sources"><h2>Fuentes oficiales verificadas</h2><p>Las reglas se contrastaron con las fuentes enlazadas. La consulta de ayuda y la partida siguen siendo locales.</p><ul>${currentSources()
      .map(
        ([label, url]) =>
          `<li><a href="${url}" target="_blank" rel="noreferrer">${label}<span>↗</span></a></li>`,
      )
      .join("")}</ul></section>`;
    return shell(
      content,
      `${narratorSituationCard()}<div class="aside-card"><p class="eyebrow">Principio rector</p><h3>El Narrador decide</h3><p>Los registros, la redirección del Alcalde y la información sin habilidad no son cálculos automáticos.</p></div><div class="aside-card muted"><h3>Atajos</h3><p>Desde un jugador o un paso nocturno puedes abrir la ficha del personaje. Pulsa ? para llegar aquí rápidamente.</p></div>`,
    );
  }

  function revealView() {
    const keyEvents = game.history
      .filter((item) =>
        /muere|convierte|envenen|Señuelo|Victoria|ejecut/i.test(
          `${item.text} ${item.detail || ""}`,
        ),
      )
      .slice(-12)
      .reverse();
    const content = `<div class="page-title"><div><p class="eyebrow">Después de la partida</p><h1>Revelación final</h1><p class="intro-copy">Revisa el reparto y los momentos que explican la historia antes de mostrarlos al grupo.</p></div><button class="primary" data-action="reveal-public">Mostrar al grupo</button></div><section class="reveal-summary panel"><h2>${game.outcome?.winner === "good" ? "Victoria del Bien" : "Victoria del Mal"}</h2><p>${esc(game.outcome?.reason || "")}</p><div class="reveal-grid private-reveal">${[
      ...game.players,
    ]
      .sort((a, b) => a.seat - b.seat)
      .map(
        (p) =>
          `<article class="${character(p.character).team}"><span>${p.seat + 1}</span><h3>${esc(p.name)}</h3><b>${roleName(p.character)}</b><small>${p.alignment === "good" ? "Bueno" : "Malvado"}${p.character === "drunk" ? ` · creía ser ${roleName(p.perceivedCharacter)}` : ""}</small></article>`,
      )
      .join(
        "",
      )}</div></section><section class="panel recap-card"><h2>Momentos a explicar</h2>${keyEvents.length ? `<ul>${keyEvents.map((item) => `<li><b>${esc(item.text)}</b>${item.detail ? `<span>${esc(item.detail)}</span>` : ""}</li>`).join("")}</ul>` : `<p>No hay eventos destacados registrados.</p>`}</section>`;
    return shell(
      content,
      `<div class="aside-card"><h3>Consejo</h3><p>Revela primero el resultado, después Demonio y Esbirros, y por último Borracho, señuelo rojo, venenos, registros y cambios de Demonio.</p></div>`,
    );
  }

  return {
    diagnosticsView,
    libraryView,
    historyView,
    referenceView,
    revealView,
  };
}
