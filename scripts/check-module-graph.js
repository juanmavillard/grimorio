import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, relative, join } from "node:path";
const root = resolve(import.meta.dirname, "..");
const walk = (path) =>
  readdirSync(path, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory()
      ? walk(join(path, item.name))
      : /\.(js|cjs)$/.test(item.name)
        ? [join(path, item.name)]
        : [],
  );
const files = ["src", "desktop", "scripts", "test", "browser-checks"]
  .flatMap((dir) => walk(join(root, dir)))
  .sort();
const set = new Set(files),
  edges = new Map(
    files.map((file) => [
      file,
      [
        ...readFileSync(file, "utf8").matchAll(
          /(?:import|export)\s+(?:[^"']*?\s+from\s+)?["']([^"']+)["']/g,
        ),
      ]
        .map((match) => match[1])
        .filter((value) => value.startsWith("."))
        .map((value) => resolve(dirname(file), value))
        .filter((value) => set.has(value)),
    ]),
  );
const done = new Set(),
  active = new Set();
function visit(file) {
  if (active.has(file))
    throw Error(`Dependencia circular en ${relative(root, file)}`);
  if (done.has(file)) return;
  active.add(file);
  for (const child of edges.get(file)) visit(child);
  active.delete(file);
  done.add(file);
}
for (const file of files) visit(file);
const classify = (file) => {
  if (file === "src/release.js") return "Generado";
  if (/^src\/[^/]+\.js$/.test(file) && file !== "src/app.js")
    return "Fachada pública / compatibilidad";
  if (file === "src/app.js") return "Composición de interfaz";
  if (file.startsWith("src/scripts/")) return "Paquete de guion";
  if (file.startsWith("src/core/")) return "Núcleo / datos / proyección";
  if (file.startsWith("src/application/")) return "Servicio de aplicación";
  if (file.startsWith("src/ui/")) return "Interfaz / adaptación de plataforma";
  if (file.startsWith("desktop/")) return "Escritorio / aislamiento";
  if (file.startsWith("test/") || file.startsWith("browser-checks/"))
    return "Prueba / soporte de pruebas";
  return "Herramienta de mantenimiento";
};
const body =
  "# Inventario de módulos\n\nGenerado por `node scripts/check-module-graph.js --write`. Cada archivo conserva una responsabilidad; las fachadas son contratos de compatibilidad, no duplicados para eliminar. Los índices Markdown son navegación. Los artefactos de dist y output se generan por separado y no contienen fuentes únicas.\n\n| Módulo | Responsabilidad |\n| --- | --- |\n" +
  files
    .map((file) => {
      const name = relative(root, file).replaceAll("\\", "/");
      return `| [${name}](../../${name}) | ${classify(name)} |`;
    })
    .join("\n") +
  "\n";
const target = join(root, "docs/tecnico/inventario-modulos.md");
if (process.argv.includes("--write")) writeFileSync(target, body);
else if (readFileSync(target, "utf8") !== body)
  throw Error(
    "Inventario desactualizado. Ejecuta node scripts/check-module-graph.js --write.",
  );
console.log(
  `Grafo válido: ${files.length} módulos, sin ciclos; inventario comprobado.`,
);
