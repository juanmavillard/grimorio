import { mkdirSync, writeFileSync } from "node:fs";
import { publicCharacterSheet } from "../src/core/player-materials.js";
import { SCRIPT_DEFINITIONS } from "../src/core/scripts.js";
import { readFileSync } from "node:fs";
mkdirSync("output/pdf", { recursive: true });
mkdirSync("output/qa", { recursive: true });
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
writeFileSync(
  "output/qa/player-sheets.json",
  JSON.stringify(
    {
      version,
      sheets: Object.keys(SCRIPT_DEFINITIONS).map(publicCharacterSheet),
    },
    null,
    2,
  ),
);
