// Preparación, asignación y reparto privado.
export function createSetupViews(context) {
  const {
    game,
    setup,
    renderedPresets,
    CURATED_PROFILES,
    SCRIPT_DEFINITIONS,
    PLAYER_COUNTS,
    activeScript,
    validateSetup,
    expectedComposition,
    character,
    guidedPreset,
    officialPresetsFor,
    curatedPresetsFor,
    favoriteSetups,
    setupWarnings,
    sourceLabel,
    esc,
    EXPERIENCE_OPTIONS,
    STYLE_OPTIONS,
    TEAM_LABELS,
    currentCharacters,
    currentGroupedCharacters,
    presetCard,
    shell,
    header,
    privateDealProjection,
    roleName,
  } = context;

  function setupView() {
    renderedPresets.clear();
    const script = activeScript();
    const isTroubleBrewing = setup.scriptId === "trouble_brewing";
    const validation = validateSetup(
      setup.count,
      setup.roles,
      setup.scriptId,
      setup.setupChoices,
    );
    const comp = expectedComposition(
      setup.count,
      { selectedIds: setup.roles, choices: setup.setupChoices },
      setup.scriptId,
    );
    const selectedCount = (team) =>
      setup.roles.filter((id) => character(id)?.team === team).length;
    const names = Array.from(
      { length: setup.count },
      (_, i) => setup.names[i] || `Jugador ${i + 1}`,
    );
    setup.names = names;
    const guided = isTroubleBrewing
      ? guidedPreset(setup.count, setup.experience, setup.style)
      : null;
    const official = isTroubleBrewing ? officialPresetsFor(setup.count) : [];
    const curated = isTroubleBrewing ? curatedPresetsFor(setup.count) : [];
    const favorites = favoriteSetups.filter(
      (preset) =>
        Number(preset.count ?? preset.playerCounts?.[0]) === setup.count,
    );
    const currentWarnings = isTroubleBrewing
      ? setupWarnings(setup.count, setup.roles, setup.experience)
      : [
          "Este guion se dirige con ayuda guiada: registra las decisiones que dependan del Narrador.",
        ];
    const appliedText = setup.appliedPreset
      ? `${sourceLabel(setup.appliedPreset.source)}: ${setup.appliedPreset.title}${setup.appliedPreset.customized ? " · modificada manualmente" : ""}`
      : "Selección manual";
    const content = `<div class="hero compact">
      <p class="eyebrow">Asistente privado de Narrador</p>
      <h1>Prepara la aldea.</h1>
      <p>Todo queda en este dispositivo. Elige un guion, prepara una formación y entra en la primera noche.</p>
    </div>
    <section class="panel formation-guide">
      <div class="section-heading"><div><span class="step-no">01</span><h2>Elige el tipo de partida</h2></div><span class="selection-origin">${esc(appliedText)}</span></div>
      <div class="preference-grid">
        <label class="field"><span>Guion</span><select id="setup-script">${Object.values(
          SCRIPT_DEFINITIONS,
        )
          .map(
            (item) =>
              `<option value="${item.id}" ${item.id === setup.scriptId ? "selected" : ""}>${item.name} · ${item.status === "stable" ? "Estable" : "En auditoría"}</option>`,
          )
          .join("")}</select></label>
        ${
          isTroubleBrewing
            ? `
        <label class="field"><span>Experiencia del grupo</span><select id="setup-experience">${EXPERIENCE_OPTIONS.map((option) => `<option value="${option.id}" ${option.id === setup.experience ? "selected" : ""}>${option.label}</option>`).join("")}</select></label>
        <label class="field"><span>Estilo que buscas</span><select id="setup-style">${STYLE_OPTIONS.map((option) => `<option value="${option.id}" ${option.id === setup.style ? "selected" : ""}>${option.label}</option>`).join("")}</select></label>`
            : `<div class="guide-copy"><b>${esc(script.subtitle)}</b><br>La preparación y los despertares se guían paso a paso; las decisiones ambiguas siguen siendo tuyas.</div>`
        }
      </div>
      <p class="guide-copy">${isTroubleBrewing ? "La recomendación adapta la composición al tamaño de la mesa. No juega por ti: puedes cambiar cualquier personaje después." : "La composición oficial se valida automáticamente. Puedes editar los personajes y las decisiones de preparación."}</p>
      ${guided ? presetCard(guided, { featured: true, profileId: guided.id.replace(/^curated-|-[0-9]+$/g, "") }) : ""}
      ${setup.roles.includes("godfather") ? `<label class="field"><span>Ajuste del Padrino</span><select id="godfather-outsiders"><option value="1" ${Number(setup.setupChoices.godfatherOutsiders ?? 1) === 1 ? "selected" : ""}>+1 Forastero</option><option value="-1" ${Number(setup.setupChoices.godfatherOutsiders) === -1 ? "selected" : ""}>−1 Forastero</option></select><small>La elección es privada y queda guardada con la partida.</small></label>` : ""}
      ${
        isTroubleBrewing
          ? `
      <details class="formation-library">
        <summary>Explorar biblioteca de formaciones</summary>
        <div class="library-section"><div class="library-heading"><div><p class="eyebrow">Ejemplos del reglamento</p><h3>Formaciones oficiales</h3></div>${setup.count !== 8 ? `<small>Los ejemplos oficiales disponibles son para 8 jugadores.</small>` : `<a href="https://wiki.bloodontheclocktower.com/Setup" target="_blank" rel="noreferrer">Ver fuente oficial ↗</a>`}</div>
          ${official.length ? `<div class="formation-grid">${official.map((preset) => presetCard(preset)).join("")}</div>` : `<p class="empty-state">Cambia a 8 jugadores para ver los tres ejemplos oficiales. Las recomendaciones de la app sí se adaptan a esta mesa.</p>`}
        </div>
        <div class="library-section"><div class="library-heading"><div><p class="eyebrow">Perfiles adaptables</p><h3>Recomendaciones de la aplicación</h3></div><small>Generadas para ${setup.count} jugadores y siempre validadas.</small></div>
          <div class="formation-grid">${curated.map((preset, index) => presetCard(preset, { profileId: CURATED_PROFILES[index].id })).join("")}</div>
        </div>
        <div class="library-section"><div class="library-heading"><div><p class="eyebrow">Este dispositivo</p><h3>Mis formaciones</h3></div><div class="library-tools"><button class="text-btn" data-action="save-favorite">Guardar selección actual</button><button class="text-btn" data-action="export-formations" ${favoriteSetups.length ? "" : "disabled"}>Exportar</button><label class="text-btn file-label">Importar<input type="file" id="formation-import" accept="application/json"></label></div></div>
          ${favorites.length ? `<div class="formation-grid">${favorites.map((preset) => presetCard(preset)).join("")}</div>` : `<p class="empty-state">Todavía no tienes formaciones guardadas para ${setup.count} jugadores.</p>`}
        </div>
      </details>`
          : ""
      }
    </section>
    <div class="setup-grid">
      <section class="panel setup-card">
        <div class="section-heading"><div><span class="step-no">02</span><h2>La mesa</h2></div></div>
        <label class="field"><span>Nombre de la partida</span><input id="setup-title" value="${esc(setup.title)}"></label>
        <label class="field"><span>Número de jugadores</span><select id="player-count">${Object.keys(
          PLAYER_COUNTS,
        )
          .map(
            (n) =>
              `<option ${Number(n) === setup.count ? "selected" : ""}>${n}</option>`,
          )
          .join("")}</select></label>
        <div class="name-grid">${names.map((name, i) => `<label class="mini-field"><span>Asiento ${i + 1}</span><input class="player-name" data-index="${i}" value="${esc(name)}"></label>`).join("")}</div>
      </section>
      <section class="panel setup-card roles-card">
        <div class="section-heading"><div><span class="step-no">03</span><h2>El guion secreto</h2></div><div><button class="text-btn" data-action="save-favorite">Guardar</button><button class="text-btn" data-action="suggest-roles">Reparto aleatorio</button></div></div>
        <div class="composition">${Object.entries(comp)
          .map(
            ([team, amount]) =>
              `<span class="comp ${team}"><b>${selectedCount(team)}/${amount}</b>${TEAM_LABELS[team]}</span>`,
          )
          .join("")}</div>
        ${Object.entries(currentGroupedCharacters())
          .map(
            ([team, chars]) =>
              `<fieldset class="role-group ${team}"><legend>${TEAM_LABELS[team]}</legend><div class="role-picker">${chars.map((c) => `<label class="role-check ${setup.roles.includes(c.id) ? "chosen" : ""}"><input type="checkbox" data-role="${c.id}" ${setup.roles.includes(c.id) ? "checked" : ""}><span class="sigil">${c.icon}</span><span>${c.name}</span></label>`).join("")}</div></fieldset>`,
          )
          .join("")}
        <div class="validation ${validation.valid ? "valid" : "invalid"}">${validation.valid ? "✓ Reparto válido" : validation.errors.map((e) => `<span>• ${esc(e)}</span>`).join("")}</div>
        ${validation.valid && currentWarnings.length ? `<div class="setup-warning-list"><b>Antes de repartir</b>${currentWarnings.map((warning) => `<span>• ${esc(warning)}</span>`).join("")}</div>` : ""}
      </section>
    </div>
    <section class="panel launch-card">
      <label class="switch-row"><input id="secret-deal" type="checkbox" ${setup.secretDeal ? "checked" : ""}><span><b>Reparto secreto en este dispositivo</b><small>Cada jugador verá solo su personaje y pasará el dispositivo.</small></span></label>
      ${script.status !== "stable" ? `<p class="notice">Este guion está en auditoría: el catálogo puede consultarse, pero la creación de partidas queda bloqueada hasta verificar reglas, ayuda y pruebas.</p>` : ""}
      <button class="primary large" data-action="create-game" ${validation.valid && script.status === "stable" ? "" : "disabled"}>Crear partida <span>→</span></button>
    </section>`;
    const aside = `<div class="aside-card"><p class="eyebrow">Composición</p><h3>${setup.count} jugadores</h3><dl>${Object.entries(
      comp,
    )
      .map(
        ([team, n]) => `<div><dt>${TEAM_LABELS[team]}</dt><dd>${n}</dd></div>`,
      )
      .join(
        "",
      )}</dl>${setup.roles.includes("baron") ? `<p class="notice">El Barón sustituye 2 Aldeanos por 2 Forasteros.</p>` : ""}</div>
    <div class="aside-card muted"><h3>Cómo usar las recomendaciones</h3><p>“Oficial” indica un ejemplo publicado en las reglas. Las demás son propuestas de esta aplicación y no pretenden ser la única forma correcta de preparar la partida.</p></div>
    <div class="aside-card muted"><h3>Antes de empezar</h3><p>La posición de los nombres debe coincidir con el orden horario de los asientos. Podrás corregir personajes y estados después.</p></div>`;
    return shell(content, aside);
  }

  function assignmentView() {
    const isTroubleBrewing = game.scriptId === "trouble_brewing";
    const isBmr = game.scriptId === "bad_moon_rising";
    const inPlay = new Set(game.selectedRoles);
    const unusedTownsfolk = currentCharacters().filter(
      (c) => c.team === "townsfolk" && !inPlay.has(c.id),
    );
    const bluffChoices = currentCharacters().filter(
      (c) =>
        ["townsfolk", "outsider"].includes(c.team) &&
        !inPlay.has(c.id) &&
        c.id !==
          game.players.find((p) => p.character === "drunk")?.perceivedCharacter,
    );
    const drunk = game.players.find((p) => p.character === "drunk");
    const fortune = game.players.find((p) => p.character === "fortune_teller");
    const goodPlayers = game.players.filter((p) => p.alignment === "good");
    const selectedRed =
      game.players.find((p) => p.redHerring)?.id || goodPlayers[0]?.id;
    const lunatic = isBmr
      ? game.players.find((p) => p.character === "lunatic")
      : null;
    const bmrDemons = isBmr
      ? currentCharacters().filter((c) => c.team === "demon")
      : [];
    const bmrGoodRoles = isBmr
      ? currentCharacters().filter((c) =>
          ["townsfolk", "outsider"].includes(c.team),
        )
      : [];
    const bmrMinionIds = isBmr
      ? game.players
          .filter(
            (p) => character(p.character, game.scriptId)?.team === "minion",
          )
          .map((p) => p.id)
      : [];
    const defaultLunatic =
      isBmr && lunatic
        ? {
            apparentDemonId:
              game.lunaticSetup?.apparentDemonId ||
              game.players.find(
                (p) => character(p.character, game.scriptId)?.team === "demon",
              )?.character ||
              bmrDemons[0]?.id,
            minionIds: game.lunaticSetup?.minionIds || bmrMinionIds,
            bluffIds:
              game.lunaticSetup?.bluffIds ||
              bmrGoodRoles.slice(0, 3).map((role) => role.id),
          }
        : null;
    const content = `<div class="page-title"><div><p class="eyebrow">Preparación final</p><h1>Coloca las fichas.</h1></div><button class="secondary" data-action="shuffle-assignment">Barajar asignación</button></div>
    <p class="intro-copy">Ajusta el resultado del sorteo. Esta pantalla es la última revisión privada antes del reparto y de la primera noche.</p>
    <section class="panel assignment-panel"><div class="assignment-grid">${game.players.map((p) => `<article><span class="seat-index">${p.seat + 1}</span><label class="field"><span>${esc(p.name)}</span><select class="assignment-role" data-id="${p.id}">${game.selectedRoles.map((id) => `<option value="${id}" ${id === p.character ? "selected" : ""}>${roleName(id)}</option>`).join("")}</select></label></article>`).join("")}</div></section>
    <section class="panel setup-decisions"><div class="section-heading"><div><span class="step-no">03</span><h2>Decisiones de preparación</h2></div></div>
      ${
        isTroubleBrewing
          ? `
      <div class="decision-grid">
        <label class="field"><span>Aldeano que cree ser el Borracho</span><select id="assign-drunk" ${drunk ? "" : "disabled"}><option value="">${drunk ? "Elegir…" : "No hay Borracho"}</option>${unusedTownsfolk.map((c) => `<option value="${c.id}" ${drunk?.perceivedCharacter === c.id ? "selected" : ""}>${c.name}</option>`).join("")}</select></label>
        <label class="field"><span>Señuelo rojo de la Adivina</span><select id="assign-red" ${fortune ? "" : "disabled"}><option value="">${fortune ? "Elegir jugador bueno…" : "No hay Adivina"}</option>${goodPlayers.map((p) => `<option value="${p.id}" ${p.id === selectedRed ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></label>
      </div>
      `
          : isBmr && lunatic
            ? `<div class="decision-grid lunatic-setup"><div class="info-callout"><p><b>Preparación del Lunático</b></p><p>Estos datos son privados: el Lunático recibe una ficción de Demonio; el Demonio real conoce al Lunático y verá sus elecciones cada noche.</p></div><label class="field"><span>Demonio que cree ser</span><select id="assign-lunatic-demon">${bmrDemons.map((role) => `<option value="${role.id}" ${role.id === defaultLunatic.apparentDemonId ? "selected" : ""}>${role.name}</option>`).join("")}</select></label><fieldset class="role-group minion"><legend>Supuestos Esbirros (${bmrMinionIds.length})</legend><div class="choice-grid">${game.players.map((player) => `<label class="check-line"><input type="checkbox" class="assign-lunatic-minion" value="${player.id}" ${defaultLunatic.minionIds.includes(player.id) ? "checked" : ""}><span>${esc(player.name)}</span></label>`).join("")}</div></fieldset><div class="bluff-setup"><p><b>Bluffs del Lunático</b><small>Tres personajes buenos; pueden estar en juego.</small></p>${[0, 1, 2].map((index) => `<select class="assign-lunatic-bluff">${bmrGoodRoles.map((role) => `<option value="${role.id}" ${role.id === defaultLunatic.bluffIds[index] ? "selected" : ""}>${role.name}</option>`).join("")}</select>`).join("")}</div></div>`
            : `<div class="info-callout"><p><b>Preparación guiada de ${esc(activeScript().name)}</b></p><p>Revisa el panel de ayuda para los marcadores iniciales y la información privada de cada personaje. Esta app no asigna automáticamente objetivos, información, locura ni decisiones de registro.</p></div>`
      }
      <div class="bluff-setup"><p><b>Bluffs seguros del Demonio real</b><small>${game.players.length < 7 ? "No se entregan en partidas de 5–6 jugadores." : "Tres personajes buenos que no están en juego."}</small></p>${game.players.length >= 7 ? [0, 1, 2].map((i) => `<select class="assign-bluff">${bluffChoices.map((c) => `<option value="${c.id}" ${game.bluffs[i] === c.id ? "selected" : ""}>${c.name}</option>`).join("")}</select>`).join("") : ""}</div>
    </section>
    <div class="launch-row"><button class="secondary" data-action="back-to-setup">← Volver a selección</button><button class="primary large" data-action="confirm-assignment">Confirmar y ${game.secretDeal ? "repartir" : "comenzar primera noche"} <span>→</span></button></div>`;
    const aside = `<div class="aside-card"><p class="eyebrow">Comprobaciones</p><h3>Antes de confirmar</h3><p>Cada personaje debe aparecer exactamente una vez. El supuesto Aldeano del Borracho y los tres bluffs deben estar fuera de juego. El señuelo debe ser bueno.</p></div><div class="aside-card muted"><h3>Orden de asientos</h3><p>El asiento 1 continúa en sentido horario. Este orden determina las parejas del Chef, los vecinos de la Empática y el conteo de votos.</p></div>`;
    return shell(content, aside);
  }

  function dealView() {
    const p = game.players[game.dealIndex];
    const apparentRole = privateDealProjection(game, p.id);
    const apparentAlignment = apparentRole.alignment;
    const revealed = document.body.dataset.dealRevealed === "true";
    const last = game.dealIndex === game.players.length - 1;
    return `${header()}<main class="deal-page"><div class="deal-card ${revealed ? "revealed" : ""}">
    <p class="eyebrow">Reparto ${game.dealIndex + 1} de ${game.players.length}</p>
    <h1>${esc(p.name)}</h1>
    ${revealed ? `<div class="role-reveal ${apparentRole.team}"><span class="reveal-sigil">${apparentRole.icon}</span><p>Tu personaje es</p><h2>${esc(apparentRole.name)}</h2><p class="ability">${esc(apparentRole.ability)}</p><span class="alignment">Eres ${apparentAlignment === "good" ? "BUENO" : "MALVADO"}</span></div><p class="pass-note">Memorízalo. Nadie más debe ver esta pantalla.</p><button class="primary large" data-action="hide-role">Ocultar y pasar</button>` : `<div class="sealed"><span>☾</span><p>Comprueba que nadie más está mirando.</p></div><button class="primary large" data-action="reveal-role">Ver mi personaje</button>`}
    ${!revealed && game.dealIndex > 0 ? `<button class="text-btn" data-action="deal-back">← Anterior</button>` : ""}
    ${revealed && last ? `<p class="tiny">Después de ocultarlo, el Narrador recuperará el dispositivo.</p>` : ""}
  </div></main>`;
  }

  return { setupView, assignmentView, dealView };
}
