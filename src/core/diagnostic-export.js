// Los diagnósticos anónimos usan una lista cerrada de campos; ni los textos
// libres ni los objetos de eventos se pueden sanear de forma fiable por sustitución.
export function diagnosticPayload(game, issues, includeNames = false) {
  const summary = {
    phase: game.phase,
    round: game.round,
    playerCount: game.players.length,
  };
  if (!includeNames) {
    const phase = (value) =>
      ["assign", "deal", "night", "day", "ended", "setup"].includes(value)
        ? value
        : null;
    return {
      format: "grimorio-diagnostic",
      version: 1,
      anonymous: true,
      schemaVersion: Number.isInteger(game.schemaVersion)
        ? game.schemaVersion
        : null,
      game: {
        phase: phase(game.phase),
        round: Number.isInteger(game.round) ? game.round : null,
        playerCount: game.players.length,
        winner: ["good", "evil"].includes(game.outcome?.winner)
          ? game.outcome.winner
          : null,
      },
      diagnostics: issues.map((issue) => ({
        severity: ["error", "warning", "info"].includes(issue.severity)
          ? issue.severity
          : "info",
      })),
      events: (game.history || []).slice(0, 120).map((item) => ({
        phase: phase(item.phase),
        round: Number.isInteger(item.round) ? item.round : null,
        automatic:
          typeof item.event?.automatic === "boolean"
            ? item.event.automatic
            : null,
      })),
    };
  }
  return {
    format: "grimorio-diagnostic",
    version: 1,
    exportedAt: new Date().toISOString(),
    schemaVersion: game.schemaVersion,
    game: { title: game.title, ...summary, outcome: game.outcome },
    diagnostics: issues.map(({ id, severity, title, detail }) => ({
      id,
      severity,
      title,
      detail,
    })),
    events: game.history.slice(0, 120).map((item) => ({
      at: item.at,
      phase: item.phase,
      round: item.round,
      text: item.text,
      detail: item.detail || "",
      event: item.event || null,
    })),
  };
}
