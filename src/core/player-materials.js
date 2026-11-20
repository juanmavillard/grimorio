import { getScript } from "./scripts.js";
import { PLAYER_REFERENCE as tb } from "../scripts/trouble-brewing/player-reference.js";
import { PLAYER_REFERENCE as bmr } from "../scripts/bad-moon-rising/player-reference.js";
import { PLAYER_REFERENCE as sv } from "../scripts/sects-and-violets/player-reference.js";

const reference = {
  trouble_brewing: tb,
  bad_moon_rising: bmr,
  sects_and_violets: sv,
};
const special = {
  po_bmr: "Po",
  devils_advocate: "Devil%27s_Advocate",
  pit_hag: "Pit-Hag",
};
export function publicCharacterSheet(scriptId) {
  const script = getScript(scriptId);
  if (!script || !reference[scriptId])
    throw new Error("Guion desconocido para la hoja de jugadores.");
  return {
    id: script.id,
    name: script.name,
    characters: script.characters.map((role) => {
      const entry = reference[scriptId][role.id];
      if (!entry) throw new Error(`Falta la referencia pública de ${role.id}.`);
      const slug =
        special[role.id] ||
        role.id
          .split("_")
          .map((word) => word[0].toUpperCase() + word.slice(1))
          .join("_");
      return {
        id: role.id,
        name: role.name,
        team: role.team,
        ability: role.ability,
        moment: entry.moment,
        clarification: entry.clarification,
        source: `https://wiki.bloodontheclocktower.com/${slug}`,
      };
    }),
  };
}
