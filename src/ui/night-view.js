// Presentación de la noche; las decisiones siguen en el controlador.
export function createNightView(context) {
  const {
    game,
    aliveNeighbours,
    character,
    chefPairs,
    clockmakerNumber,
    empathNumber,
    esc,
    flowergirlAnswer,
    getPlayer,
    hasAbility,
    helpButton,
    narratorSituationCard,
    nextActions,
    nightDeathAnnouncements,
    nightSteps,
    oracleNumber,
    playerOptions,
    possibleChefNumbers,
    possibleEmpathNumbers,
    roleName,
    roleOptions,
    shell,
    timerMarkup,
    townCrierAnswer,
    vortoxForcesFalseInformation,
  } = context;

  function bmrNightFields(step, actor, warning, select) {
    if (game.scriptId !== "bad_moon_rising" || !actor) return null;
    if (character(actor.character)?.team === "demon") {
      const lunatic = game.players.find(
        (player) => player.character === "lunatic",
      );
      const choices = lunatic?.lunaticChoices?.findLast(
        (entry) => entry.round === game.round,
      );
      if (choices)
        warning += `<div class="info-callout"><p>Antes de actuar, muestra a ${esc(actor.name)} las elecciones del Lunático: <b>${choices.targetIds.map((id) => esc(getPlayer(game, id)?.name || "—")).join(" · ") || "nadie"}</b>.</p></div>`;
    }
    const alive = (player) => player.alive;
    const dead = (player) => !player.alive;
    const target = (label = "Jugador elegido", filter = () => true) =>
      select("night-target", label, filter);
    const pair = (labelA, labelB, filter = () => true) =>
      `<div class="two-cols">${select("night-target-a", labelA, filter)}${select("night-target-b", labelB, filter)}</div>`;
    switch (step.roleId) {
      case "grandmother":
        return `${warning}${target("Jugador bueno conocido", (player) => player.id !== actor.id && player.alignment === "good")}`;
      case "sailor":
        return `${warning}${target("Jugador vivo elegido", alive)}<label class="field"><span>Quién queda borracho</span><select id="bmr-drunk-target">${playerOptions(game.players.filter((player) => player.alive))}</select></label><small>Debe ser el Marinero o el jugador elegido.</small>`;
      case "chambermaid":
        return `${warning}${pair("Primer jugador vivo", "Segundo jugador vivo", (player) => player.alive && player.id !== actor.id)}<label class="field"><span>Número mostrado (0–2)</span><input id="info-value" type="number" min="0" max="2" value="0"></label><small>Solo cuentan despertares por la habilidad propia, incluso si ese jugador estaba borracho o envenenado.</small>`;
      case "exorcist":
        return `${warning}${target("Jugador elegido", (player) => player.id !== actor.exorcistLastTargetId)}`;
      case "innkeeper":
        return `${warning}${pair("Primer jugador protegido", "Segundo jugador protegido")}<label class="field"><span>Cuál de los dos queda borracho</span><select id="bmr-drunk-target">${playerOptions(game.players)}</select></label>`;
      case "gambler":
        return `${warning}${target("Jugador elegido")}<label class="field"><span>Personaje apostado</span><select id="bmr-role">${roleOptions()}</select></label>`;
      case "courtier":
        return `${warning}<label class="check-line"><input id="night-wait" type="checkbox"><span>Esperar: no usar la habilidad esta noche</span></label><label class="field"><span>Personaje que queda borracho durante 3 noches y 3 días</span><select id="bmr-role">${roleOptions()}</select></label>`;
      case "professor":
        return `${warning}<label class="check-line"><input id="night-wait" type="checkbox"><span>Esperar: no usar la habilidad esta noche</span></label>${target("Jugador muerto elegido", dead)}`;
      case "devils_advocate":
        return `${warning}${target("Jugador vivo protegido de ejecución", (player) => player.alive && player.id !== actor.devilsAdvocateLastTargetId)}`;
      case "assassin":
        return `${warning}<label class="check-line"><input id="night-wait" type="checkbox"><span>Esperar: no usar la habilidad esta noche</span></label>${target("Jugador que muere ignorando protecciones")}`;
      case "pukka":
        return actor.exorcisedNight === game.round
          ? `<div class="info-callout"><p>El Exorcista impide que Pukka despierte. Resuelve la muerte diferida de su objetivo anterior, sin pedir una nueva elección.</p></div>`
          : `${warning}${target("Jugador que queda envenenado")}`;
      case "zombuul":
        return `${warning}${target("Jugador atacado")}`;
      case "shabaloth":
        return `${warning}${pair("Primer objetivo", "Segundo objetivo")}<label class="field"><span>Regurgitar (opcional; muerto elegido anoche)</span><select id="bmr-regurgitate">${playerOptions(game.players.filter((player) => !player.alive))}</select></label>`;
      case "po_bmr":
        return `${warning}${pair("Primer objetivo", "Segundo/tercer objetivo", () => true)}<label class="field"><span>Tercer objetivo (solo si Po cargó anoche)</span><select id="night-target-c">${playerOptions(game.players)}</select></label><small>Po puede no elegir a nadie. Si no eligió a nadie anoche, debe elegir exactamente tres.</small>`;
      case "godfather":
        return game.night.number === 1
          ? `${warning}<div class="info-callout"><p>Muestra al Padrino los Forasteros reales que están en juego.</p><p>Su ajuste de composición ya quedó guardado durante la preparación.</p></div>`
          : `${warning}${target("Víctima si hoy murió un Forastero")}<small>Si no murió un Forastero hoy, registra el paso sin aplicar una muerte.</small>`;
      case "gossip":
        return `${warning}${target("Víctima si la afirmación fue verdadera")}<label class="check-line"><input id="bmr-gossip-true" type="checkbox"><span>La afirmación pública fue verdadera.</span></label>`;
      case "moonchild":
        return `${warning}<div class="info-callout"><p>La elección pública ya está registrada. Si el objetivo es bueno, muere ahora durante la noche.</p></div>`;
      case "tinker":
        return `${warning}<div class="info-callout"><p>El Manitas no despierta: como Narrador puedes decidir una muerte en cualquier momento.</p></div><label class="check-line"><input id="bmr-tinker-dies" type="checkbox"><span>El Manitas muere durante este paso nocturno.</span></label>`;
      case "lunatic": {
        const fiction = game.lunaticSetup || {};
        const demonName = roleName(fiction.apparentDemonId || "pukka");
        const fakeMinions =
          (fiction.minionIds || [])
            .map((id) => getPlayer(game, id)?.name)
            .filter(Boolean)
            .join(" · ") || "—";
        const fakeBluffs =
          (fiction.bluffIds || []).map(roleName).join(" · ") || "—";
        const choices =
          game.night.number === 1 && fiction.apparentDemonId !== "pukka"
            ? ""
            : fiction.apparentDemonId === "shabaloth"
              ? pair("Primer objetivo fingido", "Segundo objetivo fingido")
              : fiction.apparentDemonId === "po_bmr"
                ? `${pair("Primer objetivo fingido", "Segundo objetivo fingido")}<label class="field"><span>Tercer objetivo fingido (si Po cargó)</span><select id="night-target-c">${playerOptions(game.players)}</select></label>`
                : target("Elección fingida del Lunático");
        return `${warning}<div class="info-callout"><p>El Lunático cree ser <b>${esc(demonName)}</b>.</p>${game.night.number === 1 ? `<p>Supuestos Esbirros: <b>${esc(fakeMinions)}</b>.</p><p>Bluffs fingidos: <b>${esc(fakeBluffs)}</b>.</p>` : ""}<small>Estas elecciones no causan muertes. Regístralas para mostrárselas al Demonio real.</small></div>${choices}`;
      }
      default:
        return null;
    }
  }

  function snvNightFields(step, actor, warning, select) {
    if (game.scriptId !== "sects_and_violets" || !actor) return null;
    const target = (label = "Jugador elegido", filter = () => true) =>
      select("night-target", label, filter);
    const pair = (left, right) =>
      `<div class="two-cols">${select("night-target-a", left)}${select("night-target-b", right)}</div>`;
    const role = (
      id = "snv-role",
      label = "Personaje elegido",
      filter = () => true,
    ) =>
      `<label class="field"><span>${label}</span><select id="${id}">${roleOptions("", filter)}</select></label>`;
    const falseInfo = vortoxForcesFalseInformation(game);
    const yesNo = (base) => {
      const shown = falseInfo ? !base : base;
      return `<div class="mechanic"><small>Resultado mecánico base</small><strong>${base ? "SÍ" : "NO"}</strong>${falseInfo ? "<p>Vortox activo: la información de Aldeano debe ser falsa.</p>" : ""}</div><label class="field"><span>Información mostrada</span><select id="info-value"><option value="yes" ${shown ? "selected" : ""}>SÍ</option><option value="no" ${!shown ? "selected" : ""}>NO</option></select></label>`;
    };
    switch (step.roleId) {
      case "evil_twin":
        return `${warning}${target("Jugador de alineamiento opuesto", (player) => player.alignment !== actor.alignment)}<small>Ambos conocen al otro en privado.</small>`;
      case "snake_charmer":
        return `${warning}${target("Jugador vivo elegido", (player) => player.alive)}<small>Si es Demonio y tienes habilidad, intercambiad personaje y alineamiento; el nuevo Encantador queda envenenado.</small>`;
      case "dreamer":
        return `${warning}${target("Jugador elegido", (player) => player.id !== actor.id)}<div class="two-cols">${role("snv-role-good", "Personaje bueno mostrado", (item) => ["townsfolk", "outsider"].includes(item.team))}${role("snv-role-evil", "Personaje malvado mostrado", (item) => ["minion", "demon"].includes(item.team))}</div>`;
      case "seamstress":
        return `${warning}<label class="check-line"><input id="night-wait" type="checkbox"><span>Esperar: no usar la habilidad esta noche</span></label>${pair("Primer jugador", "Segundo jugador")}<label class="field"><span>Respuesta mostrada</span><select id="info-value"><option value="same">Misma alineación</option><option value="different">Alineación distinta</option></select></label><small>Elige a otros dos jugadores. La aplicación comprobará la respuesta al registrar el paso${falseInfo ? "; Vortox exige la contraria" : ""}.</small>`;
      case "philosopher":
        return `${warning}<label class="field"><span>Personaje bueno cuya habilidad gana</span><select id="snv-role"><option value="">Esperar: no usar la habilidad esta noche</option>${roleOptions("", (item) => ["townsfolk", "outsider"].includes(item.team))}</select></label><small>Puede esperar. Si el personaje elegido está o entra en juego, queda ebrio mientras el Filósofo conserve habilidad.</small>`;
      case "witch":
        return `${warning}${target("Jugador maldito")}`;
      case "cerenovus":
        return `${warning}${target("Jugador afectado")}${role("snv-role", "Personaje bueno de la locura", (item) => ["townsfolk", "outsider"].includes(item.team))}`;
      case "pit_hag":
        return `${warning}${target("Jugador que cambia")}${role("snv-role", "Personaje elegido")}<small>Si el personaje ya está en juego, no ocurre ningún cambio.</small>`;
      case "fang_gu":
      case "vigormortis":
      case "no_dashii":
      case "vortox": {
        if (
          game.snvArbitraryDeathsRound === game.round &&
          game.snvArbitraryDeathsResolvedRound !== game.round
        )
          return `${warning}<div class="rule-warning"><b>Muertes arbitrarias de Pit-Hag.</b> Pide al Demonio su elección y decide después qué muertes ocurren. Marca cualquier número de jugadores, o ninguno; los demás sobreviven.</div>${target("Elección del Demonio")}<fieldset class="voters"><legend>Jugadores que mueren por decisión del Narrador</legend><div class="voter-grid">${game.players.map((player) => `<label class="voter"><input type="checkbox" data-snv-arbitrary-victim="${player.id}"><span><i>${player.seat + 1}</i>${esc(player.name)}</span></label>`).join("")}</div></fieldset>`;
        if (game.snvArbitraryDeathsRound === game.round)
          return `${warning}${target("Elección del Demonio")}<div class="info-callout"><p>Las muertes arbitrarias de Pit-Hag ya se resolvieron. Registra la elección sin aplicar automáticamente otra muerte.</p></div>`;
        return `${warning}${target("Objetivo del ataque")}`;
      }
      case "flowergirl":
        return `${warning}${yesNo(flowergirlAnswer(game))}`;
      case "town_crier":
        return `${warning}${yesNo(townCrierAnswer(game))}`;
      case "clockmaker": {
        const base = clockmakerNumber(game);
        return `${warning}<div class="mechanic"><small>Distancia mecánica mínima</small><strong>${base ?? "—"}</strong>${falseInfo ? "<p>Vortox activo: muestra una cifra distinta.</p>" : ""}</div><label class="field"><span>Número mostrado</span><input id="info-value" type="number" min="0" max="15" value="${base ?? 0}"></label>`;
      }
      case "oracle": {
        const base = oracleNumber(game);
        return `${warning}<div class="mechanic"><small>Muertos malvados</small><strong>${base}</strong>${falseInfo ? "<p>Vortox activo: muestra una cifra distinta.</p>" : ""}</div><label class="field"><span>Número mostrado</span><input id="info-value" type="number" min="0" max="15" value="${base}"></label>`;
      }
      case "mathematician":
      case "juggler":
        return `${warning}<label class="field"><span>Número mostrado</span><input id="info-value" type="number" min="0" max="15" value="0"></label><small>Revisa el historial de efectos o las conjeturas registradas; el Narrador confirma este cálculo.</small>`;
      case "savant":
        return `${warning}<div class="info-callout"><p>Entrega dos afirmaciones: una verdadera y una falsa, salvo que una regla cambie la información.</p></div>`;
      case "artist":
        return `${warning}<div class="info-callout"><p>Registra la pregunta privada y la respuesta que decidas comunicar.</p></div>`;
      default:
        return null;
    }
  }

  function nightActionFields(step) {
    if (game.night.completed.includes(step.id))
      return `<div class="info-callout"><p>Este paso ya está registrado. Usa «Registrar y seguir» para volver al siguiente paso pendiente; para modificarlo, usa Deshacer.</p></div>`;
    const actor = step.actorId ? getPlayer(game, step.actorId) : null;
    const activeRavenkeeperTrigger =
      step.roleId === "ravenkeeper" && actor?.ravenkeeperTriggered;
    const moonchildResolution = step.roleId === "moonchild" && !actor?.poisoned;
    const unhealthy =
      actor &&
      step.roleId !== "new_demon_info" &&
      !(
        activeRavenkeeperTrigger ||
        moonchildResolution ||
        hasAbility(actor, game)
      );
    const warning = unhealthy
      ? `<div class="rule-warning"><b>Sin habilidad activa.</b> ${actor.character === "drunk" ? "Es el Borracho." : actor.poisoned ? "Está envenenado." : "No puede actuar."} Simula el proceso y decide qué mostrar.</div>`
      : "";
    const select = (id, label, filter) =>
      `<label class="field"><span>${label}</span><select id="${id}">${playerOptions(game.players, "", filter)}</select></label>`;
    const bmrFields = bmrNightFields(step, actor, warning, select);
    if (bmrFields) return bmrFields;
    const snvFields = snvNightFields(step, actor, warning, select);
    if (snvFields) return snvFields;
    if (step.roleId === "minion_info") {
      const minions = game.players.filter(
        (p) => character(p.character)?.team === "minion",
      );
      const demon = game.players.find(
        (p) => character(p.character)?.team === "demon",
      );
      return `<div class="info-callout"><p>Despierta juntos a los Esbirros.</p><h3>${minions.map((p) => esc(p.name)).join(" · ")}</h3><p>Muéstrales al Demonio: <b>${esc(demon?.name || "—")}</b>.</p></div>`;
    }
    if (step.roleId === "demon_info") {
      const minions = game.players.filter(
        (p) => character(p.character)?.team === "minion",
      );
      const lunatic =
        game.scriptId === "bad_moon_rising"
          ? game.players.find((p) => p.character === "lunatic")
          : null;
      return `<div class="info-callout"><p>Despierta al Demonio y señala a sus Esbirros.</p><h3>${minions.map((p) => esc(p.name)).join(" · ")}</h3>${lunatic ? `<p>Señala también al Lunático: <b>${esc(lunatic.name)}</b>. Sus elecciones fingidas se guardan en el historial privado.</p>` : ""}<p>Muéstrale tres personajes buenos no jugados:</p><div class="bluff-cards">${game.bluffs.map((id) => `<span>${roleName(id)}</span>`).join("")}</div></div>`;
    }
    if (step.roleId === "new_demon_info") {
      return `<div class="info-callout"><p>Despierta a <b>${esc(actor.name)}</b>.</p><h3>Muéstrale «TÚ ERES» y la ficha de Diablillo.</h3><p>${actor.skipImpAttackNight === game.night.number ? "No vuelve a atacar esta noche." : "Después resolverá su ataque normal de esta noche."}</p></div>`;
    }
    if (["poisoner", "monk", "butler"].includes(step.roleId)) {
      const label =
        step.roleId === "poisoner"
          ? "Jugador envenenado"
          : step.roleId === "monk"
            ? "Jugador protegido"
            : "Amo elegido";
      return `${warning}${select("night-target", label, ["monk", "butler"].includes(step.roleId) ? (p) => p.id !== actor.id : () => true)}`;
    }
    if (step.roleId === "imp") {
      const successors = game.players.filter(
        (p) =>
          p.alive &&
          (character(p.character).team === "minion" ||
            (p.character === "recluse" && hasAbility(p, game))),
      );
      return `${warning}${select("night-target", "Objetivo del ataque", () => true)}<div class="conditional-fields"><label class="field"><span>Redirección del Alcalde (opcional)</span><select id="mayor-redirect">${playerOptions(game.players)}</select><small>Debe ser otro jugador. Úsalo solo si el objetivo es el Alcalde y decides redirigir.</small></label><label class="field"><span>Sucesor si se mata a sí mismo</span><select id="imp-successor">${playerOptions(successors)}</select><small>La Mujer Escarlata válida tiene prioridad. Elegir al Recluso sano supone decidir que registre como Esbirro; conservará su alineamiento.</small></label></div>`;
    }
    if (["washerwoman", "librarian", "investigator"].includes(step.roleId)) {
      const team =
        step.roleId === "washerwoman"
          ? "townsfolk"
          : step.roleId === "librarian"
            ? "outsider"
            : "minion";
      return `${warning}<div class="two-cols">${select("info-player-a", "Primer jugador mostrado", () => true)}${select("info-player-b", "Segundo jugador mostrado", () => true)}</div><label class="field"><span>Personaje mostrado</span><select id="info-role">${step.roleId === "librarian" ? `<option value="zero">0 · Ninguno</option>` : ""}${roleOptions("", (c) => c.team === team)}</select></label>`;
    }
    if (step.roleId === "chef") {
      return `${warning}<div class="mechanic"><small>Resultado mecánico base</small><strong>${chefPairs(game)}</strong><p>Valores legales con registros: ${possibleChefNumbers(game).join(", ")}.</p></div><label class="field"><span>Número mostrado</span><input id="info-value" type="number" min="0" max="15" value="${chefPairs(game)}"></label>`;
    }
    if (step.roleId === "empath") {
      const neighbors = aliveNeighbours(game, actor.id);
      return `${warning}<div class="mechanic"><small>Vecinos vivos</small><p>${neighbors.map((p) => `<b>${esc(p.name)}</b>`).join(" y ")}</p><strong>${empathNumber(game, actor.id)}</strong><p>Valores legales con registros: ${possibleEmpathNumbers(game, actor.id).join(", ")}.</p></div><label class="field"><span>Número mostrado</span><input id="info-value" type="number" min="0" max="2" value="${empathNumber(game, actor.id)}"></label>`;
    }
    if (step.roleId === "fortune_teller") {
      return `${warning}<div class="two-cols">${select("info-player-a", "Primer jugador", () => true)}${select("info-player-b", "Segundo jugador", () => true)}</div><div id="fortune-base" class="mechanic subtle"><small>Elige dos jugadores para calcular el resultado base.</small></div><label class="field"><span>Respuesta mostrada</span><select id="info-value"><option value="yes">SÍ</option><option value="no">NO</option></select></label>`;
    }
    if (step.roleId === "undertaker") {
      const executed = getPlayer(game, game.day.executedId);
      return `${warning}<div class="mechanic"><small>Murió por ejecución</small><p><b>${esc(executed?.name || "—")}</b></p><strong class="role-result">${roleName(executed?.character)}</strong></div><label class="field"><span>Personaje mostrado</span><select id="info-role">${roleOptions(executed?.character)}</select></label>`;
    }
    if (step.roleId === "ravenkeeper") {
      return `${warning}${select("night-target", "Jugador elegido", () => true)}<label class="field"><span>Personaje mostrado</span><select id="info-role">${roleOptions()}</select></label>`;
    }
    if (step.roleId === "spy")
      return `${warning}<div class="info-callout"><p>Muestra el Grimorio completo a <b>${esc(actor.name)}</b> durante el tiempo que necesite.</p><small>Incluye personajes, estados, señuelo rojo, veneno, protección e información preparada.</small><button class="secondary full spy-launch" type="button" data-action="spy-mode">Abrir vista segura para el Espía</button></div>`;
    const genericGuide =
      character(step.roleId)?.run ||
      "Pide la elección, aplica las condiciones de la habilidad y registra tu decisión.";
    return `${warning}<div class="info-callout"><p>${esc(genericGuide)}</p><small>El objetivo es opcional: úsalo cuando esta habilidad elija una persona. Las decisiones ambiguas no se aplican automáticamente.</small></div>${select("night-target", "Jugador afectado o elegido (opcional)", () => true)}`;
  }

  function nightView() {
    const steps = nightSteps(game);
    const index = Math.min(game.night.stepIndex, steps.length);
    const step = steps[index];
    const actor = step?.actorId ? getPlayer(game, step.actorId) : null;
    const pukkaExorcised =
      step?.roleId === "pukka" && actor?.exorcisedNight === game.round;
    const doesNotWake =
      pukkaExorcised || ["tinker", "moonchild"].includes(step?.roleId);
    const preflight = !game.night.preflightConfirmed;
    const deaths = nightDeathAnnouncements(game);
    const transformations = game.players.filter(
      (p) => p.transformedToDemon && p.previousCharacter,
    );
    const wakeList = steps
      .map(
        (item) =>
          `<li><b>${esc(item.name)}</b>${item.actorId ? ` · ${esc(getPlayer(game, item.actorId)?.name || "—")}` : ""}${item.roleId === "pukka" && getPlayer(game, item.actorId)?.exorcisedNight === game.round ? " · resolver muerte anterior sin despertar" : ["tinker", "moonchild"].includes(item.roleId) ? " · resolver sin despertar" : item.actorId && !hasAbility(getPlayer(game, item.actorId), game) ? " · simular" : ""}</li>`,
      )
      .join("");
    const content = `<div class="page-title"><div><p class="eyebrow">Secuencia guiada</p><h1>Noche ${game.night.number}</h1></div><div class="progress-label">${Math.min(index + 1, steps.length)} / ${steps.length || 0}</div></div>
    <div class="night-progress"><i style="width:${steps.length ? (index / steps.length) * 100 : 100}%"></i></div>
    ${timerMarkup()}
    ${preflight ? `<section class="panel night-card preflight-card"><div class="night-card-head"><div class="moon-sigil">✓</div><div><p>Antes de cerrar los ojos</p><h2>Lista de la noche</h2><span>${steps.length} paso${steps.length === 1 ? "" : "s"} aplicable${steps.length === 1 ? "" : "s"}</span></div></div><p class="ability-copy">Revisa a quién despertarás y qué información o decisiones tendrás que preparar. Un personaje sin habilidad se despierta igualmente si es necesario para mantener la simulación.</p><ol class="wake-list">${wakeList || "<li>No hay despertares pendientes.</li>"}</ol><div class="card-actions"><span></span><button class="primary" data-action="night-preflight">Cerrar los ojos y empezar <span>→</span></button></div></section>` : step ? `<section class="panel night-card"><div class="night-card-head"><div class="moon-sigil">☾</div><div><p>Paso ${index + 1}</p><h2>${esc(step.name)}</h2>${actor ? `<span>${doesNotWake ? "No despiertes a" : "Despierta a"} <b>${esc(actor.name)}</b></span>` : ""}</div></div><p class="ability-copy">${["minion_info", "demon_info"].includes(step.roleId) ? "Información inicial del equipo malvado." : step.roleId === "new_demon_info" ? "Los cambios de personaje se comunican en secreto a la primera oportunidad." : character(step.roleId)?.ability || ""}</p><details class="context-help"><summary>Ayuda para este paso</summary><p>${step.roleId === "imp" ? "Antes de aplicar la muerte, revisa veneno, Monje, Soldado, Alcalde y un posible cambio de Demonio." : character(step.roleId)?.run || "Sigue las indicaciones y anota la decisión que tomes."}</p>${helpButton(step.roleId === "imp" || step.roleId === "new_demon_info" ? "Diablillo" : character(step.roleId)?.name || "Información", "Abrir guía contextual")}</details><div class="night-fields">${nightActionFields(step)}<label class="field"><span>Nota para el historial (opcional)</span><textarea id="night-note" rows="2" placeholder="Decisión, gesto mostrado, detalle…"></textarea></label></div><div class="card-actions">${index > 0 ? `<button class="secondary" data-action="night-prev">← Anterior</button>` : "<span></span>"}<button class="primary" data-action="night-complete" data-step="${step.id}">Registrar y seguir <span>→</span></button></div></section>` : `<section class="panel night-card complete-card"><div class="moon-sigil">✓</div><h2>Resumen del amanecer</h2><p><b>Muertes para anunciar:</b> ${deaths.length ? deaths.map((p) => esc(p.name)).join(", ") : "ninguna"}.</p>${transformations.length ? `<p><b>Cambios privados registrados:</b> ${transformations.map((p) => esc(p.name)).join(", ")}.</p>` : ""}<p>Revisa condiciones de victoria, tapa el Grimorio y anuncia únicamente quién ha muerto, nunca la causa.</p><button class="primary large" data-action="start-day">Abrir los ojos · comenzar día ${game.round}</button></section>`}
    <div class="night-order">${steps.map((s, i) => `<button data-action="night-jump" data-index="${i}" class="${i === index ? "current" : ""} ${i < index ? "done" : ""}"><span>${i < index ? "✓" : i + 1}</span>${esc(s.name)}</button>`).join("")}</div>`;
    const aside = `${narratorSituationCard()}<div class="aside-card status-card"><p class="eyebrow">¿Qué hago ahora?</p><h3>Noche ${game.night.number}</h3><ol class="next-actions">${nextActions()
      .map((item) => `<li>${esc(item)}</li>`)
      .join(
        "",
      )}</ol></div><div class="aside-card"><p class="eyebrow">Regla clave</p><h3>Sin habilidad ≠ saltar</h3><p>Un jugador borracho o envenenado sigue despertando y actuando como si su habilidad funcionara. El resultado puede ser verdadero o falso.</p></div><div class="aside-card muted"><h3>Decide tú</h3><p>Los resultados calculados son una base. El Recluso, el Espía y el Alcalde exigen una decisión explícita del Narrador.</p></div>`;
    return shell(content, aside);
  }

  return { nightView };
}
