import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
const target = process.argv[2];
if (!["mac", "win"].includes(target)) throw Error("Indica mac o win.");
if (target === "mac" && process.platform !== "darwin")
  throw Error("El paquete Mac debe generarse en macOS.");
if (target === "win" && process.platform !== "win32")
  console.log(
    "Construcción cruzada de Windows: se verificará el contenido; la ejecución real en Windows queda pendiente.",
  );
const run = (script, args = []) => {
  const result = spawnSync(process.execPath, [script, ...args], {
    stdio: "inherit",
    env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: "false" },
  });
  if (result.status !== 0) process.exit(result.status || 1);
};
run("scripts/build-release.js", ["--check"]);
if (process.env.npm_execpath) run(process.env.npm_execpath, ["run", "check"]);
run("scripts/check-desktop.js");
run("node_modules/electron-builder/cli.js", [
  "--config",
  "desktop/builder.json",
  target === "mac" ? "--mac" : "--win",
  ...(target === "win" ? ["--x64"] : []),
  "--publish",
  "never",
]);
run("scripts/check-desktop-package.js", [
  target === "mac"
    ? "dist/mac-universal/Grimorio Base 3.app/Contents/Resources/app.asar"
    : "dist/win-unpacked/resources/app.asar",
]);
if (target === "win") run("scripts/check-windows-package.js");
const { version } = JSON.parse(await readFile("package.json", "utf8"));
const filename = `Grimorio-Base3-${version}-${target === "mac" ? "Mac-universal.zip" : "Windows.exe"}`;
const hash = createHash("sha256")
  .update(await readFile(join("dist", filename)))
  .digest("hex");
await writeFile(join("dist", `SHA256-${target}.txt`), `${hash}  ${filename}\n`);
console.log(
  `Paquete creado: ${resolve("dist", filename)}\nSHA-256: ${hash}\nGenerado no equivale a validado en todas las arquitecturas. Consulta la matriz de pruebas.`,
);
