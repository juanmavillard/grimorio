// Recordatorios derivados: nunca se guardan ni actúan como fuente de reglas.
export function derivedReminders(state) {
  return state.players.flatMap((player) =>
    [
      player.poisoned && {
        type: "poison",
        label: "Sin habilidad por veneno o embriaguez",
        duration: "derived",
      },
      player.protected && {
        type: "protection",
        label: "Protección activa",
        duration: "derived",
      },
      player.redHerring && {
        type: "red_herring",
        label: "Señuelo de la Adivina",
        duration: "permanent",
      },
      player.masterId && {
        type: "master",
        label: "Amo elegido",
        duration: "derived",
        data: { masterId: player.masterId },
      },
    ]
      .filter(Boolean)
      .map((record) => ({
        ...record,
        id: `derived-${record.type}-${player.id}`,
        playerId: player.id,
        targetIds: [player.id],
        origin: "derived",
        status: "active",
        visibility: "private",
      })),
  );
}

const historyCache = new WeakMap();
export function historyWindow(state, page = 0) {
  let cached = historyCache.get(state);
  if (
    !cached ||
    cached.history !== state.history ||
    cached.length !== state.history.length
  ) {
    cached = {
      history: state.history,
      length: state.history.length,
      pages: new Map(),
    };
    historyCache.set(state, cached);
  }
  const total = Math.max(1, Math.ceil(cached.length / 50)),
    index = Math.max(0, Math.min(total - 1, Number.isInteger(page) ? page : 0));
  if (!cached.pages.has(index))
    cached.pages.set(index, {
      index,
      total,
      count: cached.length,
      records: state.history.slice(index * 50, index * 50 + 50),
    });
  return cached.pages.get(index);
}
