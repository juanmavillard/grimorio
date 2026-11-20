import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { SCRIPT_DEFINITIONS } from "../src/core/scripts.js";
import { CHARACTER_HELP } from "../src/ui/help.js";
import { publicCharacterSheet } from "../src/core/player-materials.js";

const ROOT = resolve(import.meta.dirname, "..");
const TEAM_ORDER = ["townsfolk", "outsider", "minion", "demon"];
const TEAM_NAMES = {
  townsfolk: "Aldeanos",
  outsider: "Forasteros",
  minion: "Esbirros",
  demon: "Demonios",
};
const MANUAL_PATHS = {
  trouble_brewing: "docs/manuales/guiones/trouble-brewing/personajes.md",
  bad_moon_rising: "docs/manuales/guiones/bad-moon-rising/personajes.md",
  sects_and_violets: "docs/manuales/guiones/sects-and-violets/personajes.md",
};

function actingMoment(script, role) {
  return `${publicCharacterSheet(script.id).characters.find((character) => character.id === role.id).moment}. No confundas una reacción o un efecto continuo con un despertar ordinario.`;
}

function renderRole(script, role) {
  const help = CHARACTER_HELP[role.id];
  const interactions = help.interactions.map((item) => `- ${item}`).join("\n");
  return `### ${role.name}\n\n**Habilidad parafraseada.** ${role.ability}\n\n**Momento y preparación.** ${actingMoment(script, role)} Revisa los recordatorios privados y las decisiones de preparación relacionadas antes de resolverla.\n\n**Cómo dirigirlo.** ${help.guide}\n\n**Información y resultado con habilidad.** ${help.truth}\n\n**Sin habilidad.** ${help.inactive}\n\n**Interacciones relevantes.**\n\n${interactions}\n\n**Ejemplo.** ${help.example}\n\n**Error frecuente.** ${help.mistake}\n\n[Fuente oficial](${help.source})`;
}

export function renderCharacterManual(scriptId) {
  const script = SCRIPT_DEFINITIONS[scriptId];
  if (!script) throw new Error(`Guion desconocido: ${scriptId}`);
  const intro = `# Personajes · ${script.name}\n\nAlmanaque operativo de los ${script.characters.length} personajes de **${script.name}**, generado desde la misma fuente estructurada que utiliza la ayuda privada de la aplicación. Las habilidades están parafraseadas; ante cualquier duda prevalece la fuente oficial enlazada. El Narrador conserva las decisiones ambiguas.\n\nTodas las fichas usan la misma estructura: habilidad, momento y preparación, dirección, información válida, ausencia de habilidad, interacciones, ejemplo y error frecuente.`;
  const sections = TEAM_ORDER.map((team) => {
    const roles = script.characters
      .filter((role) => role.team === team)
      .map((role) => renderRole(script, role))
      .join("\n\n");
    return `## ${TEAM_NAMES[team]}\n\n${roles}`;
  });
  return `${intro}\n\n${sections.join("\n\n")}\n`;
}

export function renderedCharacterManuals() {
  return Object.fromEntries(
    Object.entries(MANUAL_PATHS).flatMap(([scriptId, path]) => [
      [path, renderCharacterManual(scriptId)],
      [
        path.replace("personajes.md", "personajes-jugadores.md"),
        renderPlayerManual(scriptId),
      ],
    ]),
  );
}

export function renderPlayerManual(scriptId) {
  const sheet = publicCharacterSheet(scriptId);
  const sections = TEAM_ORDER.map(
    (team) =>
      `## ${TEAM_NAMES[team]}\n\n` +
      sheet.characters
        .filter((role) => role.team === team)
        .map(
          (role) =>
            `### ${role.name}\n\n${role.ability}\n\n**Cuándo:** ${role.moment}. **Aclaración:** ${role.clarification}\n\n[Referencia oficial](${role.source})`,
        )
        .join("\n\n"),
  );
  return `# Personajes para jugadores · ${sheet.name}\n\nReferencia breve de los ${sheet.characters.length} personajes del guion completo, no de los que están en una partida concreta. Aldeanos y Forasteros empiezan buenos; Esbirros y Demonios, malvados, salvo cambios de alineamiento.\n\n**Leyenda:** «noche*» excluye la primera noche. Borrachera y veneno pueden impedir habilidades y alterar información; normalmente no sabes si te afectan. Personaje y alineamiento son conceptos distintos. Las habilidades están parafraseadas; los nombres enlazan a fuentes oficiales, sin instrucciones privadas de dirección.\n\n${sections.join("\n\n")}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const [path, contents] of Object.entries(renderedCharacterManuals()))
    writeFileSync(resolve(ROOT, path), contents);
  console.log(
    "Almanaques de personajes regenerados desde la ayuda estructurada.",
  );
}
