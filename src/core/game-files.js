import { migrateGame } from "./migrations.js";
import { getScript } from "./scripts.js";

export const GAME_FILE_LIMIT = 50 * 1024 * 1024;
export const RESCUE_FILE_LIMIT = 200 * 1024 * 1024;
export function checkFileSize(file, limit = GAME_FILE_LIMIT) {
  if (file.size > limit)
    throw new Error(
      `El archivo supera el límite de ${limit / 1024 / 1024} MiB. No se ha cambiado la partida.`,
    );
}

// Valida estructura necesaria para abrir la interfaz, sin imponer reglas que
// impidan estados legítimos fruto de cambios de personaje o decisiones manuales.
export function validateGameForImport(raw) {
  if (
    !raw ||
    typeof raw !== "object" ||
    Array.isArray(raw) ||
    !Array.isArray(raw.players)
  )
    throw new Error("Archivo de partida no reconocido.");
  if (!Array.isArray(raw.bluffs))
    throw new Error(
      "Partida incompleta o inválida: falta la lista de farolillos.",
    );
  if (!Array.isArray(raw.history))
    throw new Error("Partida incompleta o inválida: falta el historial.");
  const game = migrateGame(raw);
  const script = getScript(game.scriptId);
  const fail = (message) => {
    throw new Error(`Partida incompleta o inválida: ${message}`);
  };
  const safeId = (id) =>
    typeof id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(id);
  const knownRole = (role) =>
    typeof role === "string" && Object.hasOwn(script.characterById, role);
  if (!safeId(game.id)) fail("identificador inválido.");
  if (typeof game.title !== "string") fail("falta el nombre.");
  if (!["assign", "deal", "night", "day", "ended"].includes(game.phase))
    fail("fase desconocida.");
  if (!Number.isInteger(game.round) || game.round < 1) fail("ronda inválida.");
  if (game.players.length < 5 || game.players.length > 15)
    fail("número de jugadores fuera de 5–15.");
  const ids = new Set(),
    seats = new Set();
  for (const player of game.players) {
    if (!player || !safeId(player.id) || ids.has(player.id))
      fail("identificadores de jugadores inválidos o repetidos.");
    ids.add(player.id);
    if (
      !Number.isInteger(player.seat) ||
      player.seat < 0 ||
      player.seat >= game.players.length ||
      seats.has(player.seat)
    )
      fail("asientos inválidos o repetidos.");
    seats.add(player.seat);
    if (typeof player.name !== "string" || !player.name.trim())
      fail("nombre de jugador ausente.");
    if (!knownRole(player.character)) fail("personaje desconocido.");
    if (
      player.perceivedCharacter != null &&
      !knownRole(player.perceivedCharacter)
    )
      fail("personaje aparente desconocido.");
    if (
      !["good", "evil"].includes(player.alignment) ||
      typeof player.alive !== "boolean"
    )
      fail("alineamiento o estado de vida inválido.");
    for (const key of [
      "ghostVote",
      "poisoned",
      "protected",
      "redHerring",
      "abilityUsed",
      "diedThisNight",
      "courtierDrunk",
      "foolSurvived",
      "formerDemon",
      "grandmotherSetupPending",
      "grandmotherTriggerPending",
      "killedByVigormortis",
      "moonchildPending",
      "moonchildTargetWasGood",
      "newDemonNeedsInfo",
      "noDashiiPoisoned",
      "philosopherDrunk",
      "philosopherGainedAbilityUsed",
      "poLastChoiceNone",
      "ravenkeeperTriggered",
      "snakeCharmerPoisoned",
      "sweetheartDrunk",
      "transformedToDemon",
      "vigormortisEnabled",
      "vigormortisPoisonSource",
      "zombuulRegisteredDead",
    ])
      if (player[key] != null && typeof player[key] !== "boolean")
        fail(`estado ${key} inválido.`);
    for (const key of [
      "devilsAdvocateProtectedRound",
      "exorcisedNight",
      "fangGuSkipAttackNight",
      "innkeeperProtectedNight",
      "minstrelDrunkUntilDusk",
      "philosopherChoiceNight",
      "sailorDrunkUntilDusk",
      "savantLastRound",
      "skipImpAttackNight",
      "goonTriggeredRound",
      "goonDrunkUntilDusk",
    ])
      if (
        player[key] != null &&
        (!Number.isInteger(player[key]) || player[key] < 0)
      )
        fail(`duración ${key} inválida.`);
    for (const key of ["artistQuestion", "jugglerGuesses"])
      if (player[key] != null && typeof player[key] !== "string")
        fail(`texto ${key} inválido.`);
    if (
      player.artistAnswer != null &&
      !["yes", "no", "unknown"].includes(player.artistAnswer)
    )
      fail("respuesta del Artista inválida.");
    if (player.notes != null && typeof player.notes !== "string")
      fail("notas inválidas.");
  }
  if (
    !Array.isArray(game.selectedRoles) ||
    game.selectedRoles.length !== game.players.length ||
    game.selectedRoles.some((role) => !knownRole(role))
  )
    fail("reparto inicial ausente o inválido.");
  for (const p of game.players) {
    for (const key of [
      "masterId",
      "grandmotherChildId",
      "evilTwinTargetId",
      "vigormortisPoisonedId",
      "philosopherDrunkTargetId",
      "moonchildTargetId",
      "cerenovusTargetId",
      "devilsAdvocateLastTargetId",
      "exorcistLastTargetId",
      "sailorLastChoiceId",
    ])
      if (p[key] != null && !ids.has(p[key]))
        fail(`referencia ${key} desconocida.`);
    for (const key of [
      "philosopherRole",
      "philosopherSimulatedRole",
      "previousCharacter",
      "cerenovusRole",
    ])
      if (p[key] != null && !knownRole(p[key]))
        fail(`personaje ${key} desconocido.`);
  }
  for (const key of [
    "pukkaPoisonedId",
    "witchSourceId",
    "witchCurseId",
    "snvArbitrarySourceId",
  ])
    if (game[key] != null && !ids.has(game[key]))
      fail(`referencia ${key} desconocida.`);
  if (
    game.courtierEffects != null &&
    (!Array.isArray(game.courtierEffects) ||
      game.courtierEffects.some(
        (effect) =>
          !effect ||
          !knownRole(effect.roleId) ||
          !ids.has(effect.sourceId) ||
          !Number.isInteger(effect.expiresAfterRound),
      ))
  )
    fail("efectos del Cortesano inválidos.");
  for (const player of game.players) {
    if (
      player.shabalothLastTargets != null &&
      (!Array.isArray(player.shabalothLastTargets) ||
        player.shabalothLastTargets.some((id) => !ids.has(id)))
    )
      fail("objetivos de Shabaloth inválidos.");
    if (
      player.savantNotes != null &&
      (!Array.isArray(player.savantNotes) ||
        player.savantNotes.some(
          (note) =>
            !note ||
            typeof note.detail !== "string" ||
            !Number.isInteger(note.round),
        ))
    )
      fail("notas del Sabio inválidas.");
    if (
      player.lunaticChoices != null &&
      (!Array.isArray(player.lunaticChoices) ||
        player.lunaticChoices.some(
          (choice) =>
            !choice ||
            !Number.isInteger(choice.round) ||
            !Array.isArray(choice.targetIds) ||
            choice.targetIds.some((id) => !ids.has(id)),
        ))
    )
      fail("elecciones del Lunático inválidas.");
  }
  if (game.bluffs.some((role) => !knownRole(role)))
    fail("farolillo desconocido.");
  if (
    !game.night ||
    !Number.isInteger(game.night.number) ||
    game.night.number < 1 ||
    !Number.isInteger(game.night.stepIndex) ||
    game.night.stepIndex < 0 ||
    !Array.isArray(game.night.completed) ||
    game.night.completed.some((id) => typeof id !== "string")
  )
    fail("estado de noche ausente o inválido.");
  if (
    !game.day ||
    !Number.isInteger(game.day.number) ||
    game.day.number < 0 ||
    !Array.isArray(game.day.nominations)
  )
    fail("estado de día ausente o inválido.");
  if (
    game.day.stage != null &&
    ![
      "conversation",
      "nomination",
      "accusation",
      "defense",
      "vote",
      "closed",
    ].includes(game.day.stage)
  )
    fail("etapa del día inválida.");
  if (game.day.closed != null && typeof game.day.closed !== "boolean")
    fail("cierre del día inválido.");
  if (game.day.executedId != null && !ids.has(game.day.executedId))
    fail("jugador ejecutado desconocido.");
  for (const nomination of game.day.nominations) {
    if (
      !nomination ||
      (nomination.qualified != null &&
        typeof nomination.qualified !== "boolean") ||
      (nomination.threshold != null &&
        (!Number.isInteger(nomination.threshold) ||
          nomination.threshold < 0 ||
          nomination.threshold > game.players.length)) ||
      !ids.has(nomination.nominatorId) ||
      !ids.has(nomination.nomineeId) ||
      !Number.isInteger(nomination.votes) ||
      nomination.votes < 0 ||
      nomination.votes > game.players.length ||
      (nomination.voterIds != null &&
        (!Array.isArray(nomination.voterIds) ||
          new Set(nomination.voterIds).size !== nomination.voterIds.length ||
          (nomination.voterIds.length > 0 &&
            nomination.votes !== nomination.voterIds.length) ||
          nomination.voterIds.some((id) => !ids.has(id))))
    )
      fail("nominación inválida.");
  }
  if (
    game.day.pendingNomination &&
    (!ids.has(game.day.pendingNomination.nominatorId) ||
      !ids.has(game.day.pendingNomination.nomineeId) ||
      !["accusation", "defense", "vote"].includes(
        game.day.pendingNomination.stage,
      ))
  )
    fail("nominación pendiente inválida.");
  if (!Array.isArray(game.history) || !Array.isArray(game.events))
    fail("historial inválido.");
  for (const list of [game.history, game.events])
    for (const item of list) {
      if (
        !item ||
        typeof item.text !== "string" ||
        typeof item.detail !== "string" ||
        typeof item.at !== "string" ||
        !Number.isFinite(Date.parse(item.at))
      )
        fail("texto o fecha del historial inválidos.");
      if (
        item.event != null &&
        (typeof item.event !== "object" || Array.isArray(item.event))
      )
        fail("evento inválido.");
    }
  for (const key of ["reminders", "deathLog", "pendingEffects"])
    if (game[key] != null && !Array.isArray(game[key]))
      fail(`${key} inválido.`);
  if (
    new Set((game.pendingEffects || []).map((effect) => effect?.id)).size !==
    (game.pendingEffects || []).length
  )
    fail("decisiones pendientes con identificadores repetidos.");
  for (const effect of game.pendingEffects || []) {
    if (
      !effect ||
      !safeId(effect.id) ||
      !safeId(effect.type) ||
      (effect.label != null && typeof effect.label !== "string") ||
      (effect.targetIds != null &&
        (!Array.isArray(effect.targetIds) ||
          effect.targetIds.some((id) => !ids.has(id))))
    )
      fail("decisión pendiente inválida.");
  }
  for (const effect of game.pendingEffects || []) {
    if (
      effect.status != null &&
      !["pending", "resolved"].includes(effect.status)
    )
      fail("estado de decisión inválido.");
    if (effect.source?.playerId != null && !ids.has(effect.source.playerId))
      fail("origen de decisión desconocido.");
    if (
      effect.data != null &&
      (typeof effect.data !== "object" || Array.isArray(effect.data))
    )
      fail("datos de decisión inválidos.");
    if (effect.type === "sage_info" && !ids.has(effect.data?.demonId))
      fail("falta el Demonio de la información pendiente.");
    if (
      ["klutz_choice", "vigormortis_neighbour"].includes(effect.type) &&
      !ids.has(effect.source?.playerId)
    )
      fail("falta el origen de la decisión pendiente.");
    for (const key of ["demonId", "minionId"])
      if (effect.data?.[key] != null && !ids.has(effect.data[key]))
        fail("referencia interna de decisión desconocida.");
  }
  if (
    new Set((game.reminders || []).map((reminder) => reminder?.id)).size !==
    (game.reminders || []).length
  )
    fail("recordatorios con identificadores repetidos.");
  for (const reminder of game.reminders || []) {
    if (
      !reminder ||
      !safeId(reminder.id) ||
      typeof reminder.label !== "string" ||
      (reminder.playerId != null && !ids.has(reminder.playerId)) ||
      (reminder.targetIds != null &&
        (!Array.isArray(reminder.targetIds) ||
          reminder.targetIds.some((id) => !ids.has(id))))
    )
      fail("recordatorio inválido.");
  }
  for (const death of game.deathLog || [])
    if (
      !death ||
      !ids.has(death.playerId) ||
      !Number.isInteger(death.round) ||
      typeof death.died !== "boolean"
    )
      fail("registro de muerte inválido.");
  if (
    game.outcome != null &&
    (!["good", "evil"].includes(game.outcome.winner) ||
      typeof game.outcome.reason !== "string" ||
      game.phase !== "ended")
  )
    fail("resultado incompatible con la fase.");
  if (
    game.phase === "ended" &&
    !["good", "evil"].includes(game.outcome?.winner)
  )
    fail("resultado final ausente.");
  if (
    ["assign", "deal"].includes(game.phase) &&
    (!Array.isArray(game.selectedRoles) ||
      game.selectedRoles.length !== game.players.length ||
      game.selectedRoles.some((role) => !knownRole(role)))
  )
    fail("reparto incompleto.");
  if (
    game.phase === "deal" &&
    (!Number.isInteger(game.dealIndex) ||
      game.dealIndex < 0 ||
      game.dealIndex >= game.players.length)
  )
    fail("reparto secreto inválido.");
  if (game.lunaticSetup != null) {
    if (
      typeof game.lunaticSetup !== "object" ||
      Array.isArray(game.lunaticSetup)
    )
      fail("preparación del Lunático inválida.");
    if (
      game.lunaticSetup.apparentDemonId != null &&
      (!knownRole(game.lunaticSetup.apparentDemonId) ||
        script.characterById[game.lunaticSetup.apparentDemonId].team !==
          "demon")
    )
      fail("Demonio aparente inválido.");
    if (
      game.lunaticSetup.minionIds != null &&
      (!Array.isArray(game.lunaticSetup.minionIds) ||
        game.lunaticSetup.minionIds.some((id) => !ids.has(id)))
    )
      fail("Esbirros aparentes inválidos.");
    if (
      game.lunaticSetup.bluffIds != null &&
      (!Array.isArray(game.lunaticSetup.bluffIds) ||
        game.lunaticSetup.bluffIds.some((role) => !knownRole(role)))
    )
      fail("farolillos aparentes inválidos.");
  }
  if (
    game.phase === "deal" &&
    game.players.some(
      (player) =>
        player.character === "drunk" && !knownRole(player.perceivedCharacter),
    )
  )
    fail("falta el personaje aparente del Borracho.");
  if (
    game.phase === "deal" &&
    game.players.some((player) => player.character === "lunatic") &&
    !game.lunaticSetup?.apparentDemonId
  )
    fail("falta el Demonio aparente del Lunático.");
  return game;
}
export function parseGameFile(text) {
  if (new TextEncoder().encode(text).length > GAME_FILE_LIMIT)
    throw new Error("El archivo supera el límite de 50 MiB.");
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("El archivo no contiene JSON válido.");
  }
  return { raw, game: validateGameForImport(raw) };
}
