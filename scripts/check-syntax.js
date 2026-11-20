import { readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
const root = resolve(import.meta.dirname, "..");
const walk = (path) =>
  readdirSync(path, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(join(path, entry.name))
      : entry.name.endsWith(".js")
        ? [join(path, entry.name)]
        : [],
  );
const files = ["src", "scripts", "test", "browser-checks", "desktop"]
  .flatMap((dir) => walk(join(root, dir)))
  .concat(
    join(root, "sw.js"),
    join(root, "release-manifest.js"),
    join(root, "desktop/preload.cjs"),
  );
for (const file of files) {
  const result = spawnSync(process.execPath, ["--check", file], {
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(1);
  }
}
console.log(`Sintaxis válida: ${files.length} archivos JavaScript.`);
