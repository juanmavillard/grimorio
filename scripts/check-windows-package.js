import assert from "node:assert/strict";
import { openSync, readSync, closeSync, statSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const { version } = JSON.parse(readFileSync("package.json", "utf8"));
function header(path) {
  const file = openSync(path, "r");
  try {
    const dos = Buffer.alloc(64);
    assert.equal(readSync(file, dos, 0, dos.length, 0), dos.length);
    assert.equal(dos.toString("ascii", 0, 2), "MZ", path);
    const offset = dos.readUInt32LE(60),
      pe = Buffer.alloc(264);
    assert.ok(offset >= 64 && offset + pe.length <= statSync(path).size);
    assert.equal(readSync(file, pe, 0, pe.length, offset), pe.length);
    assert.equal(pe.readUInt32LE(0), 0x4550, path);
    const magic = pe.readUInt16LE(24);
    assert.ok([0x10b, 0x20b].includes(magic));
    assert.equal(
      pe.readUInt16LE(24 + 68),
      2,
      "Debe ser una aplicación gráfica",
    );
    const security = 24 + (magic === 0x20b ? 112 : 96) + 4 * 8;
    assert.equal(
      pe.readUInt32LE(security),
      0,
      "No se anuncia una firma inexistente",
    );
    assert.equal(pe.readUInt32LE(security + 4), 0);
    return { machine: pe.readUInt16LE(4), magic };
  } finally {
    closeSync(file);
  }
}
const app = header(resolve("dist/win-unpacked/Grimorio Base 3.exe"));
assert.equal(app.machine, 0x8664, "La aplicación interna debe ser Windows x64");
assert.equal(app.magic, 0x20b);
const portablePath = resolve(`dist/Grimorio-Base3-${version}-Windows.exe`);
assert.ok(statSync(portablePath).size > 10 * 1024 * 1024);
const portable = header(portablePath);
assert.ok([0x14c, 0x8664].includes(portable.machine));
console.log(
  "Windows: aplicación PE x64 y lanzador portátil gráfico comprobados, sin firma comercial. La ejecución en Windows requiere una prueba real.",
);

// Verifica el payload real del lanzador, además de la carpeta de construcción.
const { getPath7za } = await import("app-builder-lib/out/toolsets/7zip.js");
const { execFileSync } = await import("node:child_process");
const { mkdtemp, readdir, rm } = await import("node:fs/promises");
const { tmpdir } = await import("node:os");
const { join, relative } = await import("node:path");
const { createHash } = await import("node:crypto");
const { createReadStream } = await import("node:fs");
const temporary = await mkdtemp(join(tmpdir(), "grimorio-windows-payload-"));
const digest = async (path) => {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path)) hash.update(chunk);
  return hash.digest("hex");
};
const walk = async (directory) =>
  (
    await Promise.all(
      (await readdir(directory, { withFileTypes: true })).map((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
      }),
    )
  ).flat();
try {
  const sevenZip = await getPath7za(),
    outer = join(temporary, "outer"),
    inner = join(temporary, "inner");
  execFileSync(sevenZip, ["x", "-y", portablePath, `-o${outer}`]);
  execFileSync(sevenZip, [
    "x",
    "-y",
    join(outer, "$PLUGINSDIR", "app-64.7z"),
    `-o${inner}`,
  ]);
  const original = resolve("dist/win-unpacked"),
    files = await walk(original);
  assert.equal((await walk(inner)).length, files.length);
  for (const path of files) {
    const name = relative(original, path);
    assert.equal(await digest(join(inner, name)), await digest(path), name);
  }
  console.log(
    `Payload Windows: ${files.length} archivos extraídos del EXE coinciden byte a byte con el paquete verificado.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
