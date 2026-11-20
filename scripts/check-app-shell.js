import { RELEASE } from "../src/release.js";
import { existsSync, readFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  readFileSync(resolve(root, "manifest.webmanifest"), "utf8"),
);
readFileSync(resolve(root, "sw.js"), "utf8");
const entries = [
  "src/app.js",
  "src/ui/recovery.js",
  "src/engine.js",
  "src/migrations.js",
  "src/store.js",
  "src/data.js",
  "src/presets.js",
  "src/scripts.js",
  "src/help.js",
  "src/other-scripts.js",
];
const importsOf = (file) =>
  [
    ...readFileSync(file, "utf8").matchAll(
      /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
    ),
  ]
    .map((match) => match[1])
    .filter((specifier) => specifier.startsWith("."));
const modules = new Set();
const visit = (file) => {
  if (modules.has(file)) return;
  modules.add(file);
  for (const specifier of importsOf(file)) {
    const target = resolve(dirname(file), specifier);
    const withExtension = existsSync(target) ? target : `${target}.js`;
    if (!existsSync(withExtension))
      throw new Error(
        `Importación no encontrada: ${relative(root, file)} → ${specifier}`,
      );
    visit(withExtension);
  }
};
entries.forEach((entry) => visit(resolve(root, entry)));
const requiredAssets = [
  "index.html",
  "recuperar.html",
  "src/ui/recovery.js",
  "manifest.webmanifest",
  "icon.svg",
  "src/styles.css",
  ...[...modules].map((file) => relative(root, file).replaceAll("\\", "/")),
];

const errors = [];
if (!manifest.name || !manifest.start_url || manifest.display !== "standalone")
  errors.push(
    "El manifiesto PWA no contiene los campos mínimos de instalación.",
  );
if (!Array.isArray(manifest.icons) || !manifest.icons.length)
  errors.push("El manifiesto PWA no declara un icono.");
for (const asset of requiredAssets)
  if (!RELEASE.assets.includes(asset))
    errors.push(`El service worker no precachea ${asset}.`);

if (errors.length) {
  console.error(
    `Shell de aplicación no válido (${errors.length} problema${errors.length === 1 ? "" : "s"}):`,
  );
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(
    `Shell offline válido: grafo completo de ${requiredAssets.length} recursos precacheado.`,
  );
}
