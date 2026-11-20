// Solo lectura: los datos antiguos permanecen disponibles en recuperación.
export const LEGACY_ACTIVE_KEYS = [
  "grimorio.base3.game.v1",
  "grimorio.tb.game.v1",
];
export function readLegacyActiveGame(storage = localStorage) {
  for (const key of LEGACY_ACTIVE_KEYS) {
    const raw = storage.getItem(key);
    if (raw !== null) return JSON.parse(raw);
  }
  return null;
}
