import { listPackage, extractFile } from "@electron/asar";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import assert from "node:assert/strict";
import { RELEASE } from "../src/release.js";
import { createHash } from "node:crypto";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const asar = resolve(
  process.argv[2] ||
    (process.platform === "darwin"
      ? "dist/mac-universal/Grimorio Base 3.app/Contents/Resources/app.asar"
      : "dist/win-unpacked/resources/app.asar"),
);
const sourceMetadata = JSON.parse(readFileSync("package.json", "utf8"));
const packagedMetadata = JSON.parse(
  extractFile(asar, "package.json").toString(),
);
for (const field of ["name", "version", "main"])
  assert.equal(packagedMetadata[field], sourceMetadata[field], field);
const files = listPackage(asar)
  .map((file) => file.replaceAll("\\", "/"))
  .filter((file) => !file.endsWith("/"));
const allowed = new Set([
  ...RELEASE.assets.filter((file) => !["release-manifest.js"].includes(file)),
  "desktop/main.js",
  "desktop/preload.cjs",
  "desktop/security.js",
  "desktop/files.js",
  "desktop/error.html",
  "desktop/THIRD_PARTY_NOTICES.md",
  "package.json",
]);
const contents = files.filter((file) => {
  try {
    return extractFile(asar, file.slice(1)) instanceof Buffer;
  } catch {
    return false;
  }
});
for (const file of contents) {
  assert.ok(
    allowed.has(file.slice(1)),
    `Archivo no previsto en el paquete: ${file}`,
  );
  if (file !== "/package.json")
    assert.equal(
      hash(extractFile(asar, file.slice(1))),
      hash(readFileSync(file.slice(1))),
      `El paquete contiene código distinto de las fuentes: ${file}`,
    );
}
for (const file of allowed)
  if (!["manifest.webmanifest"].includes(file))
    assert.ok(files.includes("/" + file), `Falta ${file}`);
const licenseRoot =
  basename(dirname(asar)) === "resources"
    ? dirname(dirname(asar))
    : dirname(asar);
assert.ok(existsSync(join(licenseRoot, "LICENSE.electron.txt")));
assert.ok(existsSync(join(licenseRoot, "LICENSES.chromium.html")));
console.log(
  `Paquete verificado: ${contents.length} archivos autorizados, sin perfiles, pruebas ni datos personales; fuentes y licencias coincidentes.`,
);
