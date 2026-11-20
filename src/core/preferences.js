import { validatePresetDefinition } from "../scripts/trouble-brewing/presets.js";
// Las formaciones favoritas son independientes de la partida activa.
const KEY = "grimorio.base3.formations.v1";
const LEGACY_KEY = "grimorio.tb.formations.v1";
export function loadFavoriteSetups() {
  try {
    const value = JSON.parse(
      localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY) ?? "[]",
    );
    return Array.isArray(value)
      ? value.filter((item) => {
          try {
            return validatePresetDefinition(item).valid;
          } catch {
            return false;
          }
        })
      : [];
  } catch {
    return [];
  }
}
function requireValid(favorite) {
  const check = validatePresetDefinition(favorite);
  if (!check.valid) throw new Error(`Formación no válida: ${check.errors[0]}`);
}
export function saveFavoriteSetup(favorite) {
  requireValid(favorite);
  const favorites = loadFavoriteSetups().filter(
    (item) => item.id !== favorite.id,
  );
  favorites.push(favorite);
  localStorage.setItem(KEY, JSON.stringify(favorites));
  return favorites;
}
export function deleteFavoriteSetup(id) {
  const favorites = loadFavoriteSetups().filter((item) => item.id !== id);
  localStorage.setItem(KEY, JSON.stringify(favorites));
  return favorites;
}
export function replaceFavoriteSetups(favorites) {
  if (!Array.isArray(favorites))
    throw new Error("Lista de formaciones no válida.");
  favorites.forEach(requireValid);
  localStorage.setItem(KEY, JSON.stringify(favorites));
  return favorites;
}
