import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
  resourcePath,
  isAppUrl,
  externalUrl,
  exportRequest,
} from "../desktop/security.js";
import { saveExport } from "../desktop/files.js";

test("el origen de escritorio sirve solo recursos autorizados y no permite escapar del paquete", () => {
  const allowed = new Set(["index.html", "src/app.js"]);
  const root = resolve("desktop-fixture");
  assert.equal(
    resourcePath(root, "grimorio://app/", allowed),
    join(root, "index.html"),
  );
  for (const url of [
    "file:///bundle/index.html",
    "grimorio://evil/index.html",
    "grimorio://app/package.json",
    "grimorio://app/%2e%2e/private.txt",
    "grimorio://app/src%5capp.js",
    "grimorio://app/%00",
  ])
    assert.equal(resourcePath(root, url, allowed), null);
  assert.equal(isAppUrl("grimorio://app.evil/"), false);
  assert.equal(externalUrl("javascript:alert(1)"), null);
  assert.equal(externalUrl("file:///secret"), null);
  assert.equal(externalUrl("https://user:pass@example.org"), null);
  assert.equal(
    externalUrl("https://wiki.bloodontheclocktower.com/Setup"),
    "https://wiki.bloodontheclocktower.com/Setup",
  );
});
test("el puente de exportación valida contenido y no acepta rutas del renderer", () => {
  assert.deepEqual(
    exportRequest({ json: '{"schemaVersion":4}', filename: "partida.json" }),
    { json: '{"schemaVersion":4}', filename: "partida.json" },
  );
  for (const filename of [
    "../partida.json",
    "C:\\secreto.json",
    "archivo.exe",
    "a\n.json",
  ])
    assert.throws(() => exportRequest({ json: "{}", filename }));
  assert.throws(() => exportRequest({ json: "{", filename: "partida.json" }));
});
test("guardar como conserva el archivo anterior ante cancelación, disco lleno o fallo al sustituir", async () => {
  const dir = await mkdtemp(join(tmpdir(), "grimorio-export-")),
    target = join(dir, "partida.json"),
    value = { json: '{"new":true}', filename: "partida.json" };
  try {
    await writeFile(target, "anterior");
    assert.equal(
      (await saveExport(value, async () => null)).status,
      "cancelled",
    );
    assert.equal(await readFile(target, "utf8"), "anterior");
    const diskFull = {
      open: async () => {
        throw Object.assign(Error(), { code: "ENOSPC" });
      },
      unlink: async () => {},
    };
    assert.equal(
      (await saveExport(value, async () => target, diskFull)).status,
      "error",
    );
    assert.equal(await readFile(target, "utf8"), "anterior");
    const fs = await import("node:fs/promises");
    assert.equal(
      (
        await saveExport(value, async () => target, {
          ...fs,
          rename: async () => {
            throw Error("fallo");
          },
        })
      ).status,
      "error",
    );
    assert.deepEqual(await readdir(dir), ["partida.json"]);
    assert.equal(await readFile(target, "utf8"), "anterior");
    assert.equal((await saveExport(value, async () => target)).status, "saved");
    assert.equal(await readFile(target, "utf8"), value.json);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
