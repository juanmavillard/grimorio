// Vista diurna y presentación de votos. El estado se recibe en cada actualización.
export function createDayView(context) {
  const {
    game,
    executionLeader,
    getPlayer,
    badge,
    esc,
    abilityRole,
    roleAbilityUsed,
    hasAbility,
    roleName,
    playerOptions,
    majority,
    timerMarkup,
    narratorSituationCard,
    nextActions,
    helpButton,
    shell,
  } = context;

  function nominationRows() {
    const lead = executionLeader(game);
    return (
      game.day.nominations
        .map((n) => {
          const nominator = getPlayer(game, n.nominatorId),
            nominee = getPlayer(game, n.nomineeId);
          const status =
            lead.nomineeId === nominee.id
              ? badge("En la picota", "warning")
              : lead.tied && n.votes === lead.votes
                ? badge("Empate", "muted")
                : "";
          return `<div class="nom-row"><span class="nom-arrow">→</span><div><b>${esc(nominee.name)}</b><small>nominado por ${esc(nominator.name)}</small></div><strong>${n.votes}</strong>${status}</div>`;
        })
        .join("") || `<div class="empty-state">Aún no hay nominaciones.</div>`
    );
  }

  function orderedForVote(nomineeId = null) {
    const ordered = [...game.players].sort((a, b) => a.seat - b.seat);
    if (!nomineeId) return ordered;
    const index = ordered.findIndex((p) => p.id === nomineeId);
    return index < 0
      ? ordered
      : [...ordered.slice(index + 1), ...ordered.slice(0, index + 1)];
  }

  function voterGrid(nomineeId = null) {
    return orderedForVote(nomineeId)
      .map((p, i, arr) => {
        const eligible = p.alive || p.ghostVote;
        return `<label class="voter ${p.alive ? "" : "dead-voter"} ${eligible ? "" : "ineligible"}"><input type="checkbox" data-voter="${p.id}" ${eligible ? "" : "disabled"}><span><i>${p.seat + 1}</i>${esc(p.name)}</span>${!p.alive ? `<small>${p.ghostVote ? "voto de muerto" : "gastado"}</small>` : ""}${i === arr.length - 1 && nomineeId ? `<em>nominado · último</em>` : ""}</label>`;
      })
      .join("");
  }

  function snvDayToolsMarkup() {
    if (game.scriptId !== "sects_and_violets") return "";
    const savants = game.players.filter(
      (player) =>
        player.alive &&
        abilityRole(player) === "savant" &&
        player.savantLastRound !== game.round,
    );
    const artists = game.players.filter(
      (player) =>
        player.alive &&
        abilityRole(player) === "artist" &&
        !roleAbilityUsed(player, "artist"),
    );
    const jugglers =
      game.round === 1
        ? game.players.filter(
            (player) =>
              player.alive &&
              abilityRole(player) === "juggler" &&
              !player.jugglerGuesses,
          )
        : [];
    const madness = [];
    game.players
      .filter(
        (player) =>
          abilityRole(player) === "mutant" && hasAbility(player, game),
      )
      .forEach((player) =>
        madness.push({
          player,
          role: "mutant",
          label: `${player.name} · Mutante`,
        }),
      );
    game.players
      .filter(
        (player) =>
          player.character === "cerenovus" &&
          hasAbility(player, game) &&
          player.cerenovusTargetId,
      )
      .forEach((source) => {
        const player = getPlayer(game, source.cerenovusTargetId);
        if (player)
          madness.push({
            player,
            role: "cerenovus",
            label: `${player.name} · Cerenovus (${roleName(source.cerenovusRole)})`,
          });
      });
    return `<section class="panel day-ability"><div><p class="eyebrow">Sects & Violets</p><h2>Información y locura durante el día</h2></div>
    ${savants.length ? `<hr><h3>Visita del Sabio</h3><div class="slayer-controls"><select id="snv-savant">${playerOptions(savants)}</select><textarea id="snv-savant-detail" rows="2" placeholder="Una afirmación verdadera y una falsa"></textarea><button class="secondary" data-action="record-savant">Registrar visita</button></div>` : ""}
    ${artists.length ? `<hr><h3>Pregunta del Artista</h3><div class="slayer-controls"><select id="snv-artist">${playerOptions(artists)}</select><input id="snv-artist-question" placeholder="Pregunta de sí o no"><select id="snv-artist-answer"><option value="yes">SÍ</option><option value="no">NO</option><option value="unknown">NO LO SÉ</option></select><button class="secondary" data-action="use-artist">Registrar pregunta</button></div>` : ""}
    ${jugglers.length ? `<hr><h3>Conjeturas del Malabarista</h3><div class="slayer-controls"><select id="snv-juggler">${playerOptions(jugglers)}</select><textarea id="snv-juggler-detail" rows="2" placeholder="Hasta cinco: jugador → personaje"></textarea><button class="secondary" data-action="record-juggler">Guardar conjeturas</button></div>` : ""}
    ${madness.length ? `<hr><h3>Decisión de locura</h3><p class="muted-copy">La ejecución es siempre una decisión del Narrador y termina el día.</p><div class="slayer-controls"><select id="snv-madness-target">${madness.map((entry) => `<option value="${entry.role}:${entry.player.id}">${esc(entry.label)}</option>`).join("")}</select><button class="secondary" data-action="resolve-madness">Ejecutar por locura</button></div>` : ""}
    ${!savants.length && !artists.length && !jugglers.length && !madness.length ? `<p class="muted-copy">No hay habilidades diurnas o decisiones de locura disponibles ahora.</p>` : ""}
  </section>`;
  }

  function dayView() {
    const lead = executionLeader(game);
    const nominators = game.players.filter(
      (p) =>
        p.alive && !game.day.nominations.some((n) => n.nominatorId === p.id),
    );
    const nominees = game.players.filter(
      (p) => !game.day.nominations.some((n) => n.nomineeId === p.id),
    );
    const slayers = game.players.filter(
      (p) =>
        p.alive &&
        !p.abilityUsed &&
        (p.character === "slayer" || p.perceivedCharacter === "slayer"),
    );
    const moonchildren =
      game.scriptId === "bad_moon_rising"
        ? game.players.filter(
            (p) =>
              p.character === "moonchild" &&
              p.moonchildPending &&
              !p.moonchildTargetId,
          )
        : [];
    const tinkers =
      game.scriptId === "bad_moon_rising"
        ? game.players.filter((p) => p.character === "tinker" && p.alive)
        : [];
    const stage = game.day.stage || "conversation";
    const pending = game.day.pendingNomination;
    const timerButtons = (label) =>
      `<div class="timer-actions"><span>${esc(label)}</span>${[60, 180, 300].map((seconds) => `<button class="secondary" data-action="timer-start" data-seconds="${seconds}" data-label="${esc(label)}">${seconds === 60 ? "1 min" : `${seconds / 60} min`}</button>`).join("")}</div>`;
    let nominationPanel;
    if (!pending && stage === "conversation") {
      nominationPanel = `<section class="panel conversation-card"><p class="eyebrow">Conversación</p><h2>El pueblo está hablando</h2><p>Da tiempo a conversaciones públicas y privadas. Cuando decidas abrir nominaciones, la aplicación guiará acusación, defensa y voto.</p>${timerButtons("Conversación")}<button class="primary" data-action="open-nominations">Abrir nominaciones <span>→</span></button></section>`;
    } else if (!pending) {
      nominationPanel = `<section class="panel nomination-card"><div class="section-heading"><div><span class="step-no">01</span><h2>Nueva nominación</h2></div></div><div class="two-cols"><label class="field"><span>Nomina</span><select id="nominator">${playerOptions(nominators)}</select></label><label class="field"><span>A quién</span><select id="nominee">${playerOptions(nominees)}</select></label></div><label class="spy-register"><input type="checkbox" id="spy-virgin"><span>Si quien nomina es el Espía y el objetivo la Virgen, hacer que registre como Aldeano.</span></label><div class="card-actions"><span></span><button class="primary" data-action="start-nomination" ${nominators.length && nominees.length ? "" : "disabled"}>Abrir acusación <span>→</span></button></div></section>`;
    } else {
      const nominator = getPlayer(game, pending.nominatorId),
        nominee = getPlayer(game, pending.nomineeId);
      const labels = {
        accusation: "Acusación",
        defense: "Defensa",
        vote: "Votación",
      };
      const stages = `<div class="flow-steps"><span class="done">Nominación</span><span class="${pending.stage === "accusation" ? "current" : "done"}">Acusación</span><span class="${pending.stage === "defense" ? "current" : pending.stage === "vote" ? "done" : ""}">Defensa</span><span class="${pending.stage === "vote" ? "current" : ""}">Voto</span></div>`;
      const flowBody =
        pending.stage === "vote" && pending.virginTriggered
          ? `<div class="virgin-callout"><b>La Virgen se activa.</b><p>${esc(nominator.name)} registra como Aldeano al nominar a una Virgen sana. No se realiza votación: será ejecutado inmediatamente y el día terminará.</p></div>`
          : pending.stage === "vote"
            ? `<fieldset class="voters"><legend>Manos levantadas · orden horario, termina el nominado</legend><div id="voter-grid">${voterGrid(pending.nomineeId)}</div></fieldset><div class="vote-total"><span>Votos</span><strong id="vote-count">0</strong></div>`
            : `<p class="flow-instruction">${pending.stage === "accusation" ? "Escucha una acusación breve antes de pasar a la defensa." : "Escucha la defensa antes de abrir el voto."}</p>${timerButtons(labels[pending.stage])}`;
      const next =
        pending.stage === "accusation"
          ? "Abrir defensa"
          : pending.stage === "defense"
            ? "Abrir votación"
            : pending.virginTriggered
              ? "Resolver Virgen"
              : "Registrar resultado";
      nominationPanel = `<section class="panel nomination-card nomination-flow"><div class="section-heading"><div><span class="step-no">01</span><h2>${labels[pending.stage]}</h2></div><span class="flow-pair">${esc(nominator.name)} → ${esc(nominee.name)}</span></div>${stages}${flowBody}<div class="card-actions"><button class="secondary" data-action="cancel-nomination" ${pending.witchTriggered ? 'disabled title="La nominación ya activó la Bruja; usa Deshacer para corregirla."' : ""}>Cancelar</button><button class="primary" data-action="advance-nomination" data-next="${pending.stage === "accusation" ? "defense" : pending.stage === "defense" ? "vote" : "complete"}">${next} <span>→</span></button></div></section>`;
    }
    const content = `<div class="page-title"><div><p class="eyebrow">Plaza del pueblo</p><h1>Día ${game.day.number}</h1></div><div class="majority"><span>${majority(game)}</span><small>mayoría</small></div></div>
    ${timerMarkup()}<div class="day-grid">${nominationPanel}
    <section class="panel ledger"><div class="section-heading"><div><span class="step-no">02</span><h2>Picota</h2></div></div>${nominationRows()}<div class="leader-summary ${lead.tied ? "tie" : ""}">${lead.tied ? `<b>Empate a ${lead.votes}</b><span>Ahora mismo no habría ejecución.</span>` : lead.nomineeId ? `<b>${esc(getPlayer(game, lead.nomineeId).name)} · ${lead.votes} votos</b><span>Sería ejecutado al cerrar el día.</span>` : `<b>Nadie en la picota</b><span>Se necesitan ${lead.threshold} votos.</span>`}</div>${game.scriptId === "bad_moon_rising" && game.players.some((player) => player.alive && player.character === "pacifist" && hasAbility(player, game)) ? `<label class="check-line"><input id="bmr-pacifist-save" type="checkbox"><span>El Pacifista evita esta ejecución de un jugador bueno.</span></label>` : ""}<button class="primary large" data-action="close-day" ${game.day.closed || pending ? "disabled" : ""}>Cerrar nominaciones y resolver</button></section></div>
    <section class="panel day-ability"><div><p class="eyebrow">Habilidad diurna</p><h2>Disparo del Exterminador</h2></div>${slayers.length ? `<div class="slayer-controls"><select id="slayer-actor">${playerOptions(slayers)}</select><select id="slayer-target">${playerOptions(game.players)}</select><label><input type="checkbox" id="recluse-demon"> El Recluso registra como Demonio</label><button class="secondary" data-action="use-slayer">Resolver</button></div>` : `<p class="muted-copy">No hay un Exterminador disponible.</p>`}${moonchildren.length ? `<hr><h2>Elección del Niño Lunar</h2><div class="slayer-controls"><select id="bmr-moonchild">${playerOptions(moonchildren)}</select><select id="bmr-moonchild-target">${playerOptions(game.players.filter((player) => player.alive))}</select><button class="secondary" data-action="choose-moonchild">Registrar elección pública</button></div>` : ""}${tinkers.length ? `<hr><h2>Muerte del Manitas</h2><div class="slayer-controls"><select id="bmr-tinker">${playerOptions(tinkers)}</select><button class="secondary" data-action="resolve-tinker">Resolver muerte elegida por el Narrador</button></div>` : ""}</section>${snvDayToolsMarkup()}`;
    const aside = `${narratorSituationCard()}<div class="aside-card status-card"><p class="eyebrow">¿Qué hago ahora?</p><h3>${stage === "conversation" ? "Conversación" : pending ? "Nominación en curso" : "Nominaciones"}</h3><ol class="next-actions">${nextActions()
      .map((item) => `<li>${esc(item)}</li>`)
      .join(
        "",
      )}</ol>${helpButton(pending ? "nominación" : "voto", "Consultar nominación y votos")}</div><div class="aside-card"><h3>Recordatorio</h3><p>Cada vivo puede votar varias veces, pero nominar solo una. Cada persona puede ser nominada una vez. Los muertos conservan un único voto para toda la partida.</p></div><div class="aside-card muted"><h3>Mayordomo</h3>${
      game.players
        .filter(
          (p) =>
            p.alive &&
            (p.character === "butler" || p.perceivedCharacter === "butler"),
        )
        .map((p) =>
          p.character === "butler" && hasAbility(p, game)
            ? `<p>${esc(p.name)} solo puede votar si también vota ${esc(getPlayer(game, p.masterId)?.name || "su amo")}. Un error se cuenta igualmente.</p>`
            : `<p>${esc(p.name)} no tiene una restricción real ahora, aunque debes mantener la simulación de su personaje aparente.</p>`,
        )
        .join("") || `<p>No hay un Mayordomo vivo aparente.</p>`
    }</div>`;
    return shell(content, aside);
  }

  return { dayView, voterGrid };
}
