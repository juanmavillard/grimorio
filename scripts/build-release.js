import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, relative, join } from "node:path";
import { createHash } from "node:crypto";
const root = resolve(import.meta.dirname, "..");
const walk = (path) =>
  readdirSync(path, { withFileTypes: true }).flatMap((item) =>
    item.isDirectory()
      ? walk(join(path, item.name))
      : item.name.endsWith(".js") || item.name.endsWith(".css")
        ? [relative(root, join(path, item.name)).replaceAll("\\", "/")]
        : [],
  );
export function releaseFiles() {
  const assets = [
    "index.html",
    "recuperar.html",
    "manifest.webmanifest",
    "icon.svg",
    ...walk(join(root, "src")).filter((file) => file !== "src/release.js"),
  ].sort();
  const hashes = Object.fromEntries(
    assets.map((file) => [
      file,
      createHash("sha256")
        .update(readFileSync(join(root, file)))
        .digest("hex"),
    ]),
  );
  const version = createHash("sha256")
    .update(JSON.stringify(hashes))
    .update(readFileSync(join(root, "sw.js")))
    .digest("hex")
    .slice(0, 16);
  const release = {
    version,
    assets: [...assets, "src/release.js", "release-manifest.js"],
    hashes,
  };
  return {
    "src/release.js": `// Generado por scripts/build-release.js\nexport const RELEASE = ${JSON.stringify(release, null, 2)};\n`,
    "release-manifest.js": `// Generado por scripts/build-release.js\nself.GRIMORIO_RELEASE = ${JSON.stringify(release, null, 2)};\n`,
  };
}
const outputs = releaseFiles();
if (process.argv.includes("--check")) {
  for (const [file, expected] of Object.entries(outputs))
    if (readFileSync(join(root, file), "utf8") !== expected)
      throw new Error(
        `Manifiesto desactualizado: ${file}. Ejecuta npm run release:generate.`,
      );
  console.log("Manifiesto de versión y huellas válidos.");
} else
  for (const [file, content] of Object.entries(outputs))
    writeFileSync(join(root, file), content);
