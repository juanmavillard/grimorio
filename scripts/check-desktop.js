import { readFileSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { APP_ID } from "../desktop/security.js";
const config = JSON.parse(readFileSync("desktop/builder.json", "utf8"));
assert.equal(config.appId, APP_ID);
assert.equal(config.publish, null);
assert.equal(config.portable.requestExecutionLevel, "user");
assert.deepEqual(config.mac.target, [{ target: "zip", arch: ["universal"] }]);
assert.deepEqual(config.win.target, [{ target: "portable", arch: ["x64"] }]);
assert.equal(config.mac.identity, null);
assert.equal(config.win.signExecutable, false);
assert.equal(config.toolsets.nsis, "1.2.1");
assert.equal(config.mac.hardenedRuntime, false);
assert.ok(
  !config.files.some((path) =>
    /^(test|browser-checks|output|dist|node_modules|\.git|\.env)/.test(path),
  ),
);
for (const path of config.files.filter((path) => !path.includes("*")))
  assert.ok(existsSync(path), `Falta recurso de escritorio: ${path}`);
const { devDependencies } = JSON.parse(readFileSync("package.json", "utf8"));
for (const name of ["electron", "electron-builder"])
  assert.match(devDependencies[name], /^\d+\.\d+\.\d+$/);
console.log(
  "Configuración de escritorio válida: perfil estable, paquetes privados y versiones fijadas.",
);
