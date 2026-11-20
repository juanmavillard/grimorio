import { initializePwa } from "./ui/pwa.js";
import { createApplicationService } from "./application/service.js";
import { createDraftManager } from "./ui/drafts.js";
import { handleSharedControl } from "./ui/shared-controls.js";
import { handleDiagnosticAction } from "./ui/diagnostic-actions.js";
import {
  handleShortcut,
  navigateFromLocation,
  navigateTo,
  canNavigate,
} from "./ui/navigation.js";
import { createHelpMarkup } from "./ui/help-markup.js";
import { createPhaseTimer } from "./ui/phase-timer.js";
import { createShell } from "./ui/shell.js";
import {
  downloadJson,
  handleGameAction,
  handleGameImport,
} from "./ui/game-actions.js";
import { handleDealAction, saveAssignmentChoice } from "./ui/deal-actions.js";
import { handleSetupAction } from "./ui/setup-actions.js";
import { savePlayerChanges } from "./ui/grimoire-actions.js";
import { handlePendingAction } from "./ui/pending-actions.js";
import { handleNightControl } from "./ui/night-controls.js";
import {
  OFFICIAL_SOURCES as TB_OFFICIAL_SOURCES,
  PLAYER_COUNTS,
  TEAM_LABELS,
} from "./data.js";
import {
  abilityRole,
  aliveNeighbours,
  blockingPendingEffects,
  character as engineCharacter,
  chefPairs,
  empathNumber,
  executionLeader,
  defaultAlignment as engineDefaultAlignment,
  diagnoseGame,
  expectedComposition,
  fortuneAnswer,
  getPlayer,
  hasAbility,
  majority,
  clockmakerNumber,
  flowergirlAnswer,
  narratorBrief,
  narratorRelations,
  nightDeathAnnouncements,
  nightSteps,
  oracleNumber,
  possibleChefNumbers,
  possibleEmpathNumbers,
  possibleFortuneAnswers,
  privateDealProjection,
  randomRoleSet,
  roleAbilityUsed,
  statusSummary,
  townCrierAnswer,
  townSquareProjection,
  validateSetup,
  validateSetupDecisions,
  vortoxForcesFalseInformation,
} from "./engine.js";
import {
  deleteFavoriteSetup,
  loadFavoriteSetups,
  replaceFavoriteSetups,
  saveFavoriteSetup,
} from "./core/preferences.js";
import {
  openActiveStore,
  onSaveStatus,
  canRedo,
  canUndo,
  loadRecoveryPoints,
  currentRevision,
  onRevisionChange,
} from "./core/active-store.js";
import {
  CURATED_PROFILES,
  EXPERIENCE_OPTIONS,
  OFFICIAL_PRESETS,
  STYLE_OPTIONS,
  buildCuratedPreset,
  curatedPresetsFor,
  favoriteFromSelection,
  guidedPreset,
  officialPresetsFor,
  setupWarnings,
  validatePresetDefinition,
} from "./presets.js";
import {
  DOUBT_GUIDES,
  RULE_HELP,
  helpForRole,
  helpForSituation,
  searchHelp,
} from "./help.js";
import { getScript, SCRIPT_DEFINITIONS } from "./scripts.js";
import { createNightActions } from "./ui/night-actions.js";
import { createSetupViews } from "./ui/setup-views.js";
import { renderGrimoire } from "./ui/grimoire-view.js";
import { createNightView } from "./ui/night-view.js";
import { handleDayAction } from "./ui/day-actions.js";
import { createDayView } from "./ui/day-view.js";
import { createSupportViews } from "./ui/support-views.js";
import { parseGameFile, checkFileSize } from "./core/game-files.js";
import { captureSetupDraft, restoreSetupDraft } from "./ui/form-adapters.js";
import { readRescueSnapshot } from "./core/recovery-store.js";
import { diagnosticPayload } from "./core/diagnostic-export.js";
import { initializePlatform } from "./ui/platform.js";
import { installDesktopLifecycle } from "./ui/desktop-lifecycle.js";

await initializePlatform();

const app = document.querySelector("#app");
let game = null;
let startupStorageError = null;
try {
  game = await openActiveStore();
} catch (error) {
  startupStorageError = `No se pudo abrir el almacenamiento: ${error.message}. Abre Recuperar partidas para descargar una copia.`;
}
const saveIndicator = document.createElement("div");
saveIndicator.className = "save-indicator";
saveIndicator.setAttribute("role", "status");
saveIndicator.setAttribute("aria-live", "polite");
document.body.append(saveIndicator);
let saveStatusSnapshot = { state: "saved", error: null };
function updateSaveIndicator(state, error) {
  saveStatusSnapshot = { state, error };
  saveIndicator.hidden = Boolean(document.body.dataset.privateOverlay);
  if (saveIndicator.hidden) {
    saveIndicator.textContent = "";
    return;
  }
  saveIndicator.dataset.state = state;
  saveIndicator.textContent =
    state === "saving"
      ? "Guardando…"
      : state === "error"
        ? `Error al guardar: ${error?.message || "revisa el almacenamiento"}`
        : "Guardado en este dispositivo";
}
onSaveStatus(updateSaveIndicator);
updateSaveIndicator(
  startupStorageError ? "error" : "saved",
  startupStorageError ? new Error(startupStorageError) : null,
);
let view = game
  ? ["assign", "deal"].includes(game.phase)
    ? game.phase
    : game.phase === "ended"
      ? "grimoire"
      : game.phase
  : "setup";
let toastTimer;
let favoriteSetups = loadFavoriteSetups();
let renderedPresets = new Map();
let historyPage = 0;
let grimoireFilter = "all";
let activeDoubt = "information";
let helpQuery = "";
let pwaUpdateAvailable = false;

const initialPreset = OFFICIAL_PRESETS[0];

const setup = {
  scriptId: "trouble_brewing",
  count: 8,
  names: Array.from({ length: 8 }, (_, i) => `Jugador ${i + 1}`),
  roles: [...initialPreset.roles],
  secretDeal: true,
  title: "Noche en Ravenswood Bluff",
  experience: "new",
  style: "balanced",
  drunkBelief: initialPreset.drunkBelief,
  appliedPreset: {
    id: initialPreset.id,
    title: initialPreset.title,
    source: initialPreset.source,
    roles: [...initialPreset.roles],
    customized: false,
  },
  setupChoices: {},
};

const activeScriptId = () => game?.scriptId || setup.scriptId;
const activeScript = () =>
  getScript(activeScriptId()) || getScript("trouble_brewing");
const character = (id) => engineCharacter(id, activeScriptId());
const currentCharacters = () => activeScript().characters;
const currentGroupedCharacters = () => activeScript().groupedCharacters;
const currentSources = () => activeScript().sourceUrls || TB_OFFICIAL_SOURCES;

const esc = (value = "") =>
  String(value).replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
const roleName = (id) => character(id)?.name || "—";
const playerOptions = (players, selected = "", filter = () => true) =>
  `<option value="">Elegir…</option>${players
    .filter(filter)
    .map(
      (p) =>
        `<option value="${p.id}" ${p.id === selected ? "selected" : ""}>${esc(p.name)} · ${roleName(p.character)}</option>`,
    )
    .join("")}`;
const roleOptions = (selected = "", filter = () => true) =>
  currentCharacters()
    .filter(filter)
    .map(
      (c) =>
        `<option value="${c.id}" ${c.id === selected ? "selected" : ""}>${c.name}</option>`,
    )
    .join("");
const badge = (text, kind = "neutral") =>
  `<span class="badge ${kind}">${text}</span>`;

function sourceLabel(source) {
  return source === "official"
    ? "Ejemplo oficial"
    : source === "favorite"
      ? "Favorita local"
      : "Recomendación de la app";
}

function applySetupPreset(preset) {
  const count = Number(preset.count ?? preset.playerCounts?.[0] ?? setup.count);
  const check = validatePresetDefinition({ ...preset, count });
  if (!check.valid) throw new Error(check.errors[0]);
  setup.count = count;
  setup.names = Array.from(
    { length: count },
    (_, i) => setup.names[i] || `Jugador ${i + 1}`,
  );
  setup.roles = [...preset.roles];
  setup.drunkBelief = preset.drunkBelief || null;
  setup.appliedPreset = {
    id: preset.id,
    title: preset.title,
    source: preset.source,
    roles: [...preset.roles],
    customized: false,
  };
}

function presetCard(preset, options = {}) {
  renderedPresets.set(preset.id, preset);
  const warnings = [
    ...new Set([
      ...(preset.warnings || []),
      ...setupWarnings(setup.count, preset.roles, preset.experience),
    ]),
  ];
  const active = setup.appliedPreset?.id === preset.id;
  const roles = preset.roles
    .map(
      (id) =>
        `<span class="role-pill ${character(id).team}">${roleName(id)}</span>`,
    )
    .join("");
  return `<article class="formation-card ${options.featured ? "featured" : ""} ${active ? "active" : ""}">
    <div class="formation-head"><div><span class="formation-source ${preset.source}">${sourceLabel(preset.source)}</span><h3>${esc(preset.title)}</h3></div><span class="difficulty">${esc(preset.difficulty || `${setup.count} jugadores`)}</span></div>
    <p>${esc(preset.description || `Formación guardada para ${setup.count} jugadores.`)}</p>
    ${preset.goals?.length ? `<ul class="goal-list">${preset.goals.map((goal) => `<li>${esc(goal)}</li>`).join("")}</ul>` : ""}
    <div class="role-preview">${roles}</div>
    ${warnings.length && (options.featured || active) ? `<details class="formation-warnings"><summary>${warnings.length} aviso${warnings.length === 1 ? "" : "s"} para preparar</summary>${warnings.map((warning) => `<p>${esc(warning)}</p>`).join("")}</details>` : ""}
    <div class="formation-actions"><button class="${options.featured ? "primary" : "secondary"}" data-action="apply-preset" data-preset="${esc(preset.id)}">${active && !setup.appliedPreset?.customized ? "Aplicada ✓" : "Usar formación"}</button>${options.profileId ? `<button class="text-btn" data-action="randomize-profile" data-profile="${esc(options.profileId)}">Otra variante</button>` : ""}${preset.source === "favorite" ? `<button class="danger-quiet" data-action="delete-favorite" data-preset="${esc(preset.id)}">Eliminar</button>` : ""}</div>
  </article>`;
}

function notify(message, kind = "ok") {
  let el = document.querySelector("#toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.append(el);
  }
  if (document.body.dataset.privateOverlay) {
    el.hidden = true;
    return;
  }
  el.className = `toast ${kind}`;
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.hidden = true;
  }, 2600);
}

const { startPhaseTimer, stopPhaseTimer, timerMarkup } = createPhaseTimer({
  notify,
  render,
  esc,
});

function nextActions() {
  if (!game) return [];
  if (game.phase === "night") {
    const steps = nightSteps(game),
      step = steps[game.night.stepIndex];
    if (!game.night.preflightConfirmed)
      return [
        "Confirma quién debe despertar y prepara tus gestos.",
        "Asegúrate de que la pantalla está privada.",
      ];
    if (
      step?.roleId === "pukka" &&
      getPlayer(game, step.actorId)?.exorcisedNight === game.round
    )
      return [
        "Resuelve la muerte diferida de Pukka sin despertarlo.",
        "Registra el resultado antes de pasar al siguiente paso.",
      ];
    if (step && ["tinker", "moonchild"].includes(step.roleId))
      return [
        "Revisa el efecto sin despertar al jugador.",
        "Registra el resultado antes de pasar al siguiente paso.",
      ];
    if (step)
      return [
        `Despierta a ${step.actorId ? getPlayer(game, step.actorId)?.name || step.name : step.name}.`,
        "Registra la decisión antes de pasar al siguiente paso.",
      ];
    return [
      "Revisa muertes, transformaciones y condiciones de victoria.",
      "Anuncia solo quién ha muerto y abre el día.",
    ];
  }
  if (game.phase === "day") {
    if (game.day.pendingNomination) {
      const stages = {
        accusation: "Escucha la acusación.",
        defense: "Escucha la defensa.",
        vote: "Recorre la votación y registra las manos.",
      };
      return [
        stages[game.day.pendingNomination.stage] || "Resuelve la nominación.",
        "Comprueba primero si se activa la Virgen.",
      ];
    }
    if (game.day.stage === "conversation")
      return [
        "Da tiempo para hablar y abrir conversaciones privadas.",
        "Cuando el grupo esté listo, abre nominaciones.",
      ];
    return [
      "Acepta otra nominación o cierra el día.",
      "Revisa la picota y los votos fantasma.",
    ];
  }
  if (game.phase === "ended")
    return [
      "Abre la revelación final cuando el grupo esté reunido.",
      "Explica los momentos de desinformación importantes.",
    ];
  return [];
}

function narratorSituationCard() {
  const brief = narratorBrief(game);
  const list = (items, empty = "Nada pendiente.") =>
    items.length
      ? `<ul>${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>`
      : `<p class="muted-copy">${empty}</p>`;
  return `<section class="aside-card table-situation"><p class="eyebrow">Situación de la mesa</p><h3>${brief.phase === "night" ? `Noche ${brief.round}` : brief.phase === "day" ? `Día ${brief.round}` : "Partida terminada"}</h3>
    <div><b>Ahora</b>${list(brief.now)}</div>
    ${brief.announcements.length ? `<div><b>Anuncia</b>${list(brief.announcements)}</div>` : ""}
    ${brief.attention.length ? `<div><b>Revisar</b>${list(brief.attention)}</div>` : ""}
    <div class="situation-recent"><b>Desde el último evento</b>${
      brief.recent.length
        ? brief.recent
            .slice(0, 2)
            .map(
              (item) =>
                `<p>${esc(item.text)}${item.detail ? `<small>${esc(item.detail)}</small>` : ""}</p>`,
            )
            .join("")
        : '<p class="muted-copy">Aún no hay cambios.</p>'
    }</div>
    ${pendingEffectsMarkup()}
    ${pitHagNightControls()}
    <button class="text-btn" data-view="reference">Resolver una duda →</button>
  </section>`;
}

function pendingEffectsMarkup() {
  const pending = (game?.pendingEffects || []).filter(
    (effect) =>
      effect.status === "pending" && effect.type !== "mastermind_extra_day",
  );
  if (!pending.length) return "";
  const select = (effect, suffix, players = game.players) =>
    `<select id="pending-${suffix}-${effect.id}">${playerOptions(players)}</select>`;
  return `<div class="pending-effects"><b>Decisiones pendientes</b>${pending
    .map((effect) => {
      const allowed = game.players.filter(
        (player) =>
          !effect.targetIds?.length || effect.targetIds.includes(player.id),
      );
      let controls = "";
      if (
        effect.type === "sweetheart_drunk" ||
        effect.type === "klutz_choice" ||
        effect.type === "vigormortis_neighbour"
      )
        controls = `${select(effect, "target", allowed)}<button class="secondary" data-action="resolve-pending" data-effect="${effect.id}" data-type="${effect.type}">Resolver</button>`;
      else if (effect.type === "barber_swap") {
        const demons = game.players.filter(
          (player) => character(player.character)?.team === "demon",
        );
        controls = `${select(effect, "actor", demons)}${select(effect, "a")}${select(effect, "b")}<button class="secondary" data-action="resolve-pending" data-effect="${effect.id}" data-type="barber_swap">Intercambiar</button><button class="text-btn" data-action="skip-pending" data-effect="${effect.id}">No intercambiar</button>`;
      } else if (effect.type === "sage_info")
        controls = `${select(effect, "a", allowed)}${select(effect, "b", allowed)}<button class="secondary" data-action="resolve-pending" data-effect="${effect.id}" data-type="sage_info">Registrar información</button>`;
      else
        controls = `<button class="secondary" data-action="skip-pending" data-effect="${effect.id}">Marcar revisado</button>`;
      return `<article><span>${esc(effect.label)}</span><small>${esc(effect.data?.instruction || "Requiere una decisión privada.")}</small><div>${controls}</div></article>`;
    })
    .join("")}</div>`;
}

function pitHagNightControls() {
  if (
    !game ||
    game.phase !== "night" ||
    game.snvArbitraryDeathsRound !== game.round
  )
    return "";
  return `<div class="pending-effects"><b>Pit-Hag: decisión adicional esta noche</b><p>Registra una muerte o una supervivencia en cualquier momento.</p><select id="pit-hag-extra-target">${playerOptions(game.players)}</select><button class="secondary" data-action="pit-hag-extra" data-dies="true">Resolver muerte</button><button class="secondary" data-action="pit-hag-extra" data-dies="false">Registrar supervivencia</button></div>`;
}

const { helpButton, characterHelpMarkup, ruleHelpMarkup } = createHelpMarkup({
  esc,
  helpForRole,
});

const application = createApplicationService({
  confirmOutcome: (outcome) =>
    confirm(
      `Condición de victoria detectada\n\n${outcome.reason}\n\n¿Confirmas el final de la partida?`,
    ),
  published: (next, previous, command) => {
    game = next;
    historyPage = 0;
    startupStorageError = null;
    drafts?.clearCurrent();
    if (["game.create", "game.clear", "game.import"].includes(command.type)) {
      drafts?.clearAll();
      delete document.body.dataset.privateOverlay;
      document.body.dataset.dealRevealed = "false";
    }
    if (
      game?.outcome ||
      ["game.clear", "game.import", "game.create"].includes(command.type)
    )
      stopPhaseTimer();
  },
});
async function dispatch(command, message) {
  const next = await application.dispatch(command);
  if (message) notify(message);
  render();
  return next;
}

const shellContext = () =>
  createShell({
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
  });
const header = () => shellContext().header();
const shell = (content, aside = "") => shellContext().shell(content, aside);

function setupViews() {
  return createSetupViews({
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
  });
}
const setupView = () => setupViews().setupView();
const assignmentView = () => setupViews().assignmentView();
const dealView = () => setupViews().dealView();

function playerBadges(p) {
  return [
    !p.alive ? badge("Muerto", "dead") : badge("Vivo", "alive"),
    p.poisoned ? badge("Veneno", "poison") : "",
    p.protected ? badge("Protegido", "safe") : "",
    p.redHerring ? badge("Señuelo", "warning") : "",
    p.transformedToDemon
      ? badge(`Antes: ${roleName(p.previousCharacter)}`, "warning")
      : "",
    p.formerDemon ? badge("Anterior Demonio", "dead") : "",
    !p.alive && p.ghostVote ? badge("Voto ✓", "vote") : "",
    !p.alive && !p.ghostVote ? badge("Voto gastado", "muted") : "",
  ].join("");
}

const grimoireView = () =>
  renderGrimoire({
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
  });

function playerDialog() {
  return `<dialog id="player-dialog"><form method="dialog" class="dialog-shell"><button class="dialog-close" value="cancel" aria-label="Cerrar">×</button><div id="player-dialog-body"></div></form></dialog>`;
}

function openPlayerDialog(id) {
  const p = getPlayer(game, id);
  const neighbors = aliveNeighbours(game, p.id);
  const personalHistory = game.history
    .filter(
      (item) => item.event?.actorId === p.id || item.event?.targetId === p.id,
    )
    .slice(0, 8);
  const dialog = document.querySelector("#player-dialog");
  const apparentHelp =
    p.character === "drunk" ? helpForRole(p.perceivedCharacter) : null;
  const abilityState = hasAbility(p, game)
    ? "Habilidad activa"
    : p.character === "drunk"
      ? `Simula ${roleName(p.perceivedCharacter)}; no hay habilidad real`
      : p.poisoned
        ? "Sin habilidad: envenenado"
        : p.alive
          ? "Sin habilidad activa"
          : "Sin habilidad: muerto";
  document.querySelector("#player-dialog-body").innerHTML =
    `<p class="eyebrow">Asiento ${p.seat + 1}</p><h2>${esc(p.name)}</h2><div class="dialog-badges">${playerBadges(p)}</div>
    <div class="ability-in-dialog"><b>${roleName(p.character)}</b><p>${character(p.character).ability}</p><small>${esc(abilityState)} · ${character(p.character).run}</small></div>${characterHelpMarkup(p.character, true)}${apparentHelp ? `<div class="apparent-role"><b>Personaje aparente: ${esc(apparentHelp.title)}</b><p>${esc(apparentHelp.summary)}</p>${helpButton(apparentHelp.title, "Consultar simulación")}</div>` : ""}<div class="neighbor-line"><span>Vecinos vivos actuales</span><b>${neighbors.map((x) => esc(x.name)).join(" · ") || "—"}</b></div>
    <div class="dialog-grid"><label class="field"><span>Personaje real</span><select id="edit-character">${roleOptions(p.character)}</select></label><label class="field"><span>Personaje que cree ser</span><select id="edit-perceived">${roleOptions(p.perceivedCharacter)}</select></label><label class="field"><span>Alineamiento</span><select id="edit-alignment"><option value="good" ${p.alignment === "good" ? "selected" : ""}>Bueno</option><option value="evil" ${p.alignment === "evil" ? "selected" : ""}>Malvado</option></select></label><label class="field"><span>Amo (Mayordomo)</span><select id="edit-master">${playerOptions(
      game.players.filter((x) => x.id !== p.id),
      p.masterId,
    )}</select></label></div>
    <div class="toggle-grid"><label><input id="edit-alive" type="checkbox" ${p.alive ? "checked" : ""}><span>Vivo</span></label><label><input id="edit-poison" type="checkbox" ${p.poisoned ? "checked" : ""}><span>Envenenado</span></label><label><input id="edit-protected" type="checkbox" ${p.protected ? "checked" : ""}><span>Protegido</span></label><label><input id="edit-red" type="checkbox" ${p.redHerring ? "checked" : ""}><span>Señuelo rojo</span></label><label><input id="edit-used" type="checkbox" ${p.abilityUsed ? "checked" : ""}><span>Habilidad usada</span></label><label><input id="edit-vote" type="checkbox" ${p.ghostVote ? "checked" : ""}><span>Voto de muerto disponible</span></label></div>
    <label class="field"><span>Notas privadas</span><textarea id="edit-notes" rows="3">${esc(p.notes)}</textarea></label>${personalHistory.length ? `<div class="personal-history"><span>Historial personal</span>${personalHistory.map((item) => `<p><b>${esc(item.text)}</b>${item.detail ? `<small>${esc(item.detail)}</small>` : ""}</p>`).join("")}</div>` : ""}
    <label class="field"><span>Motivo o habilidad (obligatorio para correcciones y resurrección)</span><textarea id="edit-reason" rows="2"></textarea></label>
    <label class="field"><span>Causa de muerte</span><select id="edit-cause"><option value="other">Decisión del Narrador</option><option value="demon_attack">Ataque del Demonio</option><option value="execution">Ejecución</option><option value="imp_self">El Diablillo se mata</option></select></label>
    <label class="field"><span>Sucesor del Diablillo, si procede</span><select id="edit-successor">${playerOptions(game.players.filter((x) => x.alive && x.id !== p.id))}</select></label>
    <p>Guardar notas no cambia los demás campos. Resolver aplica muerte, resurrección o cambio de personaje mediante el motor. La corrección avanzada solo modifica el registro y exige revisar sus consecuencias.</p>
    <div class="dialog-actions"><button class="secondary" value="cancel">Cancelar</button><button class="primary" type="button" data-action="save-player" data-id="${p.id}">Guardar notas</button><button class="secondary" type="button" data-action="resolve-player" data-id="${p.id}">Resolver cambio</button><button class="danger-quiet" type="button" data-action="correct-player" data-id="${p.id}">Corrección avanzada</button></div>`;
  dialog.dataset.playerId = id;
  dialog.showModal();
  drafts?.dialogOpened();
}

const nightView = () =>
  createNightView({
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
  }).nightView();

function dayViews() {
  return createDayView({
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
  });
}
const dayView = () => dayViews().dayView();
const voterGrid = (nomineeId) => dayViews().voterGrid(nomineeId);

function dateLabel(value) {
  return value
    ? new Date(value).toLocaleString("es-ES", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "—";
}

function eventInspector(item) {
  const event = item.event;
  if (!event) return "";
  const actor = event.actorId
    ? getPlayer(game, event.actorId)?.name || "Jugador eliminado"
    : null;
  const target = event.targetId
    ? getPlayer(game, event.targetId)?.name || "Jugador eliminado"
    : null;
  const rows = [
    event.action && `<li><b>Acción:</b> ${esc(event.action)}</li>`,
    actor && `<li><b>Actor:</b> ${esc(actor)}</li>`,
    target && `<li><b>Objetivo:</b> ${esc(target)}</li>`,
    event.automatic
      ? "<li><b>Origen:</b> resolución automática del motor</li>"
      : "<li><b>Origen:</b> decisión o registro del Narrador</li>",
    event.rule &&
      `<li><b>Referencia:</b> ${esc(event.rule)} ${helpButton(event.rule, "explicar")}</li>`,
    event.before &&
      event.after &&
      "<li><b>Cambio:</b> hay estado anterior y posterior para deshacerlo.</li>",
  ].filter(Boolean);
  return rows.length
    ? `<details class="why-event"><summary>¿Por qué?</summary><ul>${rows.join("")}</ul></details>`
    : "";
}

function supportViews() {
  return createSupportViews({
    game,
    historyPage,
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
  });
}
const diagnosticsView = () => supportViews().diagnosticsView();
const libraryView = () => supportViews().libraryView();
const historyView = () => supportViews().historyView();
const referenceView = () => supportViews().referenceView();
const revealView = () => supportViews().revealView();

function renderView() {
  if (!game) {
    app.innerHTML = view === "library" ? libraryView() : setupView();
    return;
  }
  if (game.phase === "assign") {
    view = "assign";
    app.innerHTML = assignmentView();
    return;
  }
  if (game.phase === "deal") {
    view = "deal";
    app.innerHTML = dealView();
    return;
  }
  if (
    (view === "night" && game.phase !== "night") ||
    (view === "day" && game.phase !== "day")
  )
    view = "grimoire";
  if (!canNavigate(view, game)) view = "grimoire";
  const views = {
    grimoire: grimoireView,
    night: nightView,
    day: dayView,
    history: historyView,
    diagnostics: diagnosticsView,
    library: libraryView,
    reference: referenceView,
    reveal: revealView,
  };
  app.innerHTML = (views[view] || grimoireView)();
}

let drafts = null;
function render() {
  drafts?.beforeRender();
  try {
    drafts?.prepareRender();
    renderView();
    drafts?.afterRender();
  } catch (error) {
    console.error(error);
    app.innerHTML = `<main class="page"><section class="panel render-error"><p class="eyebrow">Error local de interfaz</p><h1>No se pudo abrir esta pantalla.</h1><p>${esc(error?.message || "Error desconocido")}</p><button class="primary" data-action="open-library">Abrir partidas guardadas</button></section></main>`;
  }
  updateSaveIndicator(saveStatusSnapshot.state, saveStatusSnapshot.error);
  if (startupStorageError)
    app.insertAdjacentHTML(
      "afterbegin",
      `<div role="alert" style="padding:1rem;background:#702d19;color:white">${esc(startupStorageError)} <a href="recuperar.html">Abrir recuperación de partidas</a></div>`,
    );
}

const recordNightStep = (step) =>
  createNightActions({ game, dispatch }).recordNightStep(step);

let savingAction = false;
function guardAction(handler) {
  return async (event) => {
    if (savingAction || document.body.dataset.desktopClosing) return;
    savingAction = true;
    try {
      await handler(event);
    } catch (error) {
      game = application.state();
      render();
      notify(
        `No se guardó la acción: ${error.message || "error de almacenamiento"}. Descarga una copia de la partida.`,
        "error",
      );
    } finally {
      savingAction = false;
    }
  };
}

app.addEventListener(
  "click",
  guardAction(async (event) => {
    const target = event.target.closest(
      "button, [data-view], [data-player], [data-action]",
    );
    if (!target) return;
    const action = target.dataset.action;
    if (action === "history-page") {
      historyPage = Number(target.dataset.page);
      render();
      return;
    }
    if (await drafts?.handle(action)) {
      render();
      return;
    }
    if (
      [
        "night-complete",
        "start-day",
        "open-nominations",
        "start-nomination",
        "advance-nomination",
        "add-nomination",
        "close-day",
        "pit-hag-extra",
        "use-slayer",
        "resolve-tinker",
        "record-savant",
        "use-artist",
        "record-juggler",
        "resolve-madness",
      ].includes(action)
    ) {
      const blocking = blockingPendingEffects(
        game,
        action === "close-day" ? "night" : "next",
      );
      if (blocking.length)
        return notify(
          `Resuelve primero: ${blocking.map((effect) => effect.label).join(", ")}.`,
          "error",
        );
    }
    if (target.dataset.view) {
      event.preventDefault();
      navigateTo(target.dataset.view, navigationContext());
      return;
    }
    if (target.dataset.player) {
      openPlayerDialog(target.dataset.player);
      return;
    }
    if (["pit-hag-extra", "skip-pending", "resolve-pending"].includes(action)) {
      await handlePendingAction(action, target, { dispatch, notify });
      return;
    }
    if (
      [
        "night-preflight",
        "night-prev",
        "night-jump",
        "night-complete",
        "start-day",
      ].includes(action)
    ) {
      await handleNightControl(action, target, {
        game,
        dispatch,
        notify,
        nightSteps,
        recordNightStep,
        stopPhaseTimer,
      });
      return;
    }
    if (
      [
        "grimoire-filter",
        "open-help-query",
        "select-doubt",
        "open-library",
        "reload-update",
        "privacy",
        "public-view",
        "reveal-public",
        "spy-mode",
        "hide-overlay",
      ].includes(action)
    ) {
      handleSharedControl(action, target, {
        game,
        render,
        update: () =>
          setTimeout(() => drafts.flush().then(() => pwa.update()), 0),
        set view(value) {
          view = value;
        },
        set grimoireFilter(value) {
          grimoireFilter = value;
        },
        set helpQuery(value) {
          helpQuery = value;
        },
        set activeDoubt(value) {
          activeDoubt = value;
        },
      });
      return;
    }
    if (["export-diagnostics", "apply-diagnostic-fix"].includes(action)) {
      await handleDiagnosticAction(action, target, {
        game,
        diagnoseGame,
        diagnosticPayload,
        downloadJson,
        notify,
        dispatch,
      });
      return;
    }
    if (
      ["restore-checkpoint", "undo", "redo", "export", "new-game"].includes(
        action,
      )
    ) {
      await handleGameAction(action, target, gameContext());
      return;
    }
    if (
      [
        "apply-preset",
        "randomize-profile",
        "suggest-roles",
        "save-favorite",
        "delete-favorite",
        "export-formations",
      ].includes(action)
    ) {
      if (
        ["apply-preset", "randomize-profile", "suggest-roles"].includes(action)
      )
        drafts.clearCurrent();
      await handleSetupAction(action, target, {
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
        get favoriteSetups() {
          return favoriteSetups;
        },
        set favoriteSetups(value) {
          favoriteSetups = value;
        },
      });
      return;
    }
    if (
      [
        "create-game",
        "shuffle-assignment",
        "back-to-setup",
        "confirm-assignment",
        "reveal-role",
        "hide-role",
        "deal-back",
      ].includes(action)
    ) {
      await handleDealAction(action, dealContext());
      return;
    }
    if (["save-player", "resolve-player", "correct-player"].includes(action)) {
      await savePlayerChanges(target, { dispatch, notify });
      return;
    }
    if (action === "timer-start")
      startPhaseTimer(
        Number(target.dataset.seconds),
        target.dataset.label || "Tiempo",
      );
    if (action === "timer-stop") stopPhaseTimer();
    if (
      [
        "open-nominations",
        "start-nomination",
        "cancel-nomination",
        "advance-nomination",
        "add-nomination",
        "close-day",
        "choose-moonchild",
        "resolve-tinker",
        "record-savant",
        "use-artist",
        "record-juggler",
        "resolve-madness",
        "use-slayer",
      ].includes(action)
    ) {
      await handleDayAction(action, target, {
        dispatch,
        notify,
        render,
        get game() {
          return game;
        },
        set view(value) {
          view = value;
        },
      });
      return;
    }
  }),
);

const gameContext = () => ({
  get game() {
    return game;
  },
  set view(value) {
    view = value;
  },
  notify,
  render,
  dispatch,
  parseGameFile,
});
const dealContext = () => ({
  get game() {
    return game;
  },
  set view(value) {
    view = value;
  },
  setup,
  validateSetup,
  notify,
  render,
  engineDefaultAlignment,
  validateSetupDecisions,
  dispatch,
});
const saveAssignment = guardAction(async (event) =>
  saveAssignmentChoice(event.target, dealContext()),
);
app.addEventListener("change", async (event) => {
  const el = event.target;
  if (el.id === "setup-script") {
    drafts?.clearCurrent();
    setup.scriptId = el.value;
    setup.roles = randomRoleSet(setup.count, Math.random, setup.scriptId);
    setup.drunkBelief = null;
    setup.setupChoices = {};
    setup.appliedPreset = null;
    if (setup.scriptId === "trouble_brewing")
      applySetupPreset(
        guidedPreset(setup.count, setup.experience, setup.style),
      );
    render();
    return;
  }
  if (el.id === "godfather-outsiders") {
    setup.setupChoices.godfatherOutsiders = Number(el.value);
    render();
    return;
  }
  if (el.id === "player-count") {
    drafts?.clearCurrent();
    setup.count = Number(el.value);
    setup.names = Array.from(
      { length: setup.count },
      (_, i) => setup.names[i] || `Jugador ${i + 1}`,
    );
    try {
      if (setup.scriptId === "trouble_brewing")
        applySetupPreset(
          guidedPreset(setup.count, setup.experience, setup.style),
        );
      else {
        setup.roles = randomRoleSet(setup.count, Math.random, setup.scriptId);
        setup.appliedPreset = null;
      }
    } catch {
      setup.roles = randomRoleSet(setup.count, Math.random, setup.scriptId);
      setup.appliedPreset = null;
    }
    render();
  }
  if (el.id === "setup-experience") {
    setup.experience = el.value;
    render();
  }
  if (el.id === "setup-style") {
    setup.style = el.value;
    render();
  }
  if (el.dataset.role) {
    setup.roles = el.checked
      ? [...setup.roles, el.dataset.role]
      : setup.roles.filter((id) => id !== el.dataset.role);
    if (!setup.roles.includes("drunk")) setup.drunkBelief = null;
    if (setup.appliedPreset)
      setup.appliedPreset.customized =
        [...setup.roles].sort().join("|") !==
        [...setup.appliedPreset.roles].sort().join("|");
    render();
  }
  if (el.classList.contains("assignment-role")) {
    if (savingAction) {
      render();
      return;
    }
    await saveAssignment(event);
    return;
  }
  if (el.id === "secret-deal") setup.secretDeal = el.checked;
  if (el.matches("[data-voter]"))
    document.querySelector("#vote-count").textContent =
      document.querySelectorAll("[data-voter]:checked").length;
  if (el.id === "nominee") {
    const grid = document.querySelector("#voter-grid");
    if (grid) {
      grid.innerHTML = voterGrid(el.value);
      document.querySelector("#vote-count").textContent = "0";
    }
  }
  if (["info-player-a", "info-player-b"].includes(el.id)) {
    const a = document.querySelector("#info-player-a")?.value,
      b = document.querySelector("#info-player-b")?.value;
    const fortuneBase = document.querySelector("#fortune-base"),
      infoValue = document.querySelector("#info-value");
    if (a && b && fortuneBase && infoValue) {
      const yes = fortuneAnswer(game, [a, b]);
      const possible = possibleFortuneAnswers(game, [a, b])
        .map((x) => (x ? "SÍ" : "NO"))
        .join(" o ");
      fortuneBase.innerHTML = `<small>Resultado mecánico base</small><strong>${yes ? "SÍ" : "NO"}</strong><p>Respuestas legales con registros: ${possible}.</p>`;
      infoValue.value = yes ? "yes" : "no";
    }
  }
});

app.addEventListener("input", (event) => {
  if (event.target.classList.contains("player-name"))
    setup.names[Number(event.target.dataset.index)] = event.target.value;
  if (event.target.id === "setup-title") setup.title = event.target.value;
  if (event.target.id === "help-search") {
    helpQuery = event.target.value;
    const resultLabel = document.querySelector(
      ".help-results .section-heading h2",
    );
    if (resultLabel)
      resultLabel.textContent = helpQuery
        ? `Resultados para “${helpQuery}”`
        : "Personajes y reglas";
    const matching = new Set(
      searchHelp(helpQuery).map((item) => `${item.type}:${item.id}`),
    );
    document.querySelectorAll("[data-help-key]").forEach((item) => {
      item.hidden = !matching.has(item.dataset.helpKey);
    });
    const count = document.querySelector("#help-result-count");
    if (count)
      count.textContent = `${matching.size} resultado${matching.size === 1 ? "" : "s"}`;
  }
});

document.addEventListener("keydown", (event) =>
  handleShortcut(event, navigationContext()),
);

app.addEventListener(
  "change",
  guardAction(async (event) => {
    if (event.target.id === "formation-import") {
      const file = event.target.files[0];
      if (!file) return;
      try {
        checkFileSize(file);
        const parsed = JSON.parse(await file.text());
        const candidates = Array.isArray(parsed)
          ? parsed
          : parsed?.format === "grimorio-formations" && parsed?.version === 1
            ? parsed.formations
            : null;
        if (!Array.isArray(candidates))
          throw new Error("Archivo de formaciones no reconocido.");
        const imported = candidates.map((candidate, index) => {
          const normalized = {
            ...candidate,
            source: "favorite",
            count: Number(candidate.count ?? candidate.playerCounts?.[0]),
            playerCounts: [
              Number(candidate.count ?? candidate.playerCounts?.[0]),
            ],
          };
          const check = validatePresetDefinition(normalized);
          if (!check.valid)
            throw new Error(`Formación ${index + 1}: ${check.errors[0]}`);
          return { ...normalized, id: `imported-${Date.now()}-${index}` };
        });
        const merged = new Map(favoriteSetups.map((item) => [item.id, item]));
        imported.forEach((item) => merged.set(item.id, item));
        favoriteSetups = replaceFavoriteSetups([...merged.values()]);
        render();
        notify(
          `${imported.length} formación${imported.length === 1 ? " importada" : "es importadas"}`,
        );
      } catch (error) {
        notify(
          error.message || "No se pudieron importar las formaciones.",
          "error",
        );
      }
      return;
    }
    if (event.target.id === "import-file")
      await handleGameImport(event.target, gameContext());
  }),
);

// Native hash navigation is a deliberate fallback for installed PWAs and
// browsers that occasionally fail to forward a header click to the app.
const navigationContext = () => ({
  game,
  render,
  set view(value) {
    view = value;
  },
});
const navigate = () => navigateFromLocation(navigationContext());

window.addEventListener("hashchange", navigate);
window.addEventListener("popstate", navigate);

drafts = await createDraftManager({
  root: app,
  context: () => ({
    gameId: game?.id || null,
    revision: currentRevision(),
    view,
  }),
  notify: (message, type) => {
    if (saveStatusSnapshot.state !== "error") notify(message, type);
  },
  openDialog: openPlayerDialog,
  captureModel: (current) =>
    current === "setup" ? captureSetupDraft(app, setup) : null,
  restoreModel: (model, current) =>
    current === "setup" && restoreSetupDraft(model, setup),
});
onRevisionChange(() => {
  updateSaveIndicator(
    "error",
    new Error(
      "Otra pestaña ha actualizado la partida. Descarga tus datos o recarga para continuar.",
    ),
  );
});
navigate();
render();
const pwa = await initializePwa({
  canUpdate: () =>
    !savingAction && !application.busy() && !drafts?.hasChanges(),
  available: () => {
    pwaUpdateAvailable = true;
    notify("Hay una actualización preparada.");
    render();
  },
  notify,
});
installDesktopLifecycle({
  busy: () => savingAction || application.busy(),
  flush: () => drafts.prepareClose(),
  rescue: () => readRescueSnapshot({ memoryDrafts: drafts.exportData() }),
});
