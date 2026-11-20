import { clone, uid } from "./utils.js";
import { BASE3_EDITION, getScript, TROUBLE_BREWING_SCRIPT } from "./scripts.js";

export const CURRENT_SCHEMA_VERSION = 4;

function normalizedEvent(item) {
  return {
    id: item.id || uid(),
    at: item.at || new Date().toISOString(),
    phase: item.phase || "setup",
    round: item.round || 0,
    text: item.text || "Evento heredado.",
    detail: item.detail || "",
    event: item.event || {
      action: "legacy_note",
      actorId: null,
      targetId: null,
      automatic: false,
      rule: "Registro heredado",
      before: null,
      after: null,
    },
  };
}

function migrateV1ToV2(v1) {
  const next = clone(v1);
  next.schemaVersion = 2;
  next.editionId = BASE3_EDITION.id;
  next.scriptId = TROUBLE_BREWING_SCRIPT.id;
  next.history = (next.history || []).map(normalizedEvent);
  next.events = next.history.map((item) => ({
    ...item,
    event: { ...item.event },
  }));
  next.night ||= {
    number: next.round || 1,
    stepIndex: 0,
    completed: [],
    preflightConfirmed: false,
  };
  next.night.preflightConfirmed ??= false;
  next.day ||= {
    number: 0,
    nominations: [],
    executedId: null,
    executionCausedDeath: false,
    deathOccurred: false,
    closed: false,
  };
  next.day.deathOccurred ??= false;
  next.day.stage ||= next.phase === "day" ? "conversation" : "closed";
  next.day.pendingNomination ??= null;
  next.migratedFrom = 1;
  return next;
}

function migrateV2ToV3(v2) {
  const next = clone(v2);
  next.schemaVersion = 3;
  next.setupChoices ||= {};
  next.reminders ||= [];
  next.deathLog ||= [];
  next.pendingEffects ||= [];
  // Conserva los campos históricos de Trouble Brewing, pero deja trazados los
  // estados activos para el Grimorio común. No se elimina ningún dato antiguo.
  for (const player of next.players || []) {
    if (player.poisoned)
      next.reminders.push({
        id: uid(),
        playerId: player.id,
        sourceRole: "poisoner",
        type: "poison",
        label: "Envenenado",
        visibility: "private",
        duration: "until_dusk",
        data: { migrated: true },
        createdRound: next.round || 1,
      });
    if (player.protected)
      next.reminders.push({
        id: uid(),
        playerId: player.id,
        sourceRole: "monk",
        type: "protection",
        label: "Protegido",
        visibility: "private",
        duration: "until_dawn",
        data: { migrated: true },
        createdRound: next.round || 1,
      });
    if (player.redHerring)
      next.reminders.push({
        id: uid(),
        playerId: player.id,
        sourceRole: "fortune_teller",
        type: "red_herring",
        label: "Señuelo rojo",
        visibility: "private",
        duration: "permanent",
        data: { migrated: true },
        createdRound: 1,
      });
  }
  next.history = (next.history || []).map(normalizedEvent);
  next.events = (next.events || next.history).map(normalizedEvent);
  next.migratedFrom = next.migratedFrom || 2;
  return next;
}

/** La versión 4 normaliza los datos compartidos entre los tres guiones sin
 * retirar campos históricos, de modo que las partidas antiguas sigan abriendo. */
function migrateV3ToV4(v3) {
  const next = clone(v3);
  next.schemaVersion = 4;
  next.reminders = (next.reminders || []).map((reminder) => ({
    ...reminder,
    source: reminder.source || {
      roleId: reminder.sourceRole || null,
      playerId: null,
    },
    targetIds:
      reminder.targetIds || (reminder.playerId ? [reminder.playerId] : []),
    status: reminder.status || "active",
  }));
  next.deathLog = (next.deathLog || []).map((death) => ({
    ...death,
    triggerIds: death.triggerIds || [],
    resolution: death.resolution || (death.died ? "died" : "prevented"),
  }));
  next.pendingEffects = (next.pendingEffects || []).map((effect) => ({
    ...effect,
    status: effect.status || "pending",
    createdAt:
      effect.createdAt ||
      next.updatedAt ||
      next.createdAt ||
      new Date().toISOString(),
  }));
  next.migratedFrom = next.migratedFrom || 3;
  return next;
}

export function migrateGame(game) {
  if (!game || typeof game !== "object")
    throw new Error("La partida no tiene un formato válido.");
  const version = Number(game.schemaVersion || 1);
  if (version > CURRENT_SCHEMA_VERSION)
    throw new Error(
      "La partida procede de una versión más reciente de la aplicación.",
    );
  let next = clone(game);
  if (version === 1) next = migrateV1ToV2(next);
  if (next.schemaVersion === 2) next = migrateV2ToV3(next);
  if (next.schemaVersion === 3) next = migrateV3ToV4(next);
  if (next.schemaVersion !== CURRENT_SCHEMA_VERSION)
    throw new Error("No existe una migración para esta versión de partida.");
  const script = getScript(next.scriptId);
  if (!script || script.editionId !== next.editionId)
    throw new Error(
      "La edición o el guion de la partida no están disponibles en esta aplicación.",
    );
  if (version === CURRENT_SCHEMA_VERSION) {
    // Los datos v4 actuales se validan, no se reparan mediante valores por defecto.
    if (next.events === undefined) next.events = clone(next.history);
  } else {
    next.history = (next.history || []).map(normalizedEvent);
    next.events = (next.events || next.history).map(normalizedEvent);
  }
  return next;
}

export function isMigrationNeeded(game) {
  return Number(game?.schemaVersion || 1) < CURRENT_SCHEMA_VERSION;
}
