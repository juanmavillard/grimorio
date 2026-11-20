import {
  copyFile,
  readFile,
  mkdir,
  readdir,
  rm,
  lstat,
} from "node:fs/promises";
import { resolve, join, extname } from "node:path";
import { spawnSync } from "node:child_process";
import { RELEASE } from "../src/release.js";

const root = resolve(import.meta.dirname, ".."),
  kind = process.argv[2];
if (!["demo", "source"].includes(kind)) throw Error("Indica demo o source.");
const destination = join(
  root,
  "output",
  kind === "demo" ? "demo" : "portfolio-source",
);
const files = [];
if (kind === "demo") {
  files.push(...RELEASE.assets, "sw.js", "THIRD_PARTY_NOTICES.md");
} else {
  files.push(
    "README.md",
    ".github/workflows/pages.yml",
    "THIRD_PARTY_NOTICES.md",
    "CONTRIBUTING.md",
    ".gitattributes",
    ".gitignore",
    ".prettierignore",
    ".nvmrc",
    "package.json",
    "package-lock.json",
    "eslint.config.js",
    "index.html",
    "recuperar.html",
    "icon.svg",
    "manifest.webmanifest",
    "sw.js",
    "release-manifest.js",
  );
  const extensions = new Set([
    ".js",
    ".cjs",
    ".css",
    ".html",
    ".json",
    ".svg",
    ".md",
    ".txt",
    ".py",
    ".ico",
    ".icns",
    ".png",
    ".pdf",
  ]);
  async function walk(directory) {
    for (const item of await readdir(join(root, directory), {
      withFileTypes: true,
    })) {
      if (["portfolio", "__pycache__"].includes(item.name)) continue;
      const path = `${directory}/${item.name}`;
      if (item.isSymbolicLink())
        throw Error(`Enlace simbólico no permitido: ${path}`);
      if (item.isDirectory()) await walk(path);
      else if (extensions.has(extname(item.name)) && !item.name.startsWith("."))
        files.push(path);
    }
  }
  for (const directory of [
    "src",
    "desktop",
    "scripts",
    "test",
    "browser-checks",
    "docs",
  ])
    await walk(directory);
}
for (const path of files) {
  if (!(await lstat(join(root, path))).isFile())
    throw Error(`No es un archivo regular: ${path}`);
}
if (kind === "source") {
  const archive = join(root, "output", "portfolio-source.zip");
  const result = spawnSync(
    "python3",
    [
      "-c",
      `
import json, os, sys, zipfile
from pathlib import Path
config = json.load(sys.stdin)
root, archive = Path(config['root']), Path(config['archive'])
files = sorted(config['files'])
def check(path):
    with zipfile.ZipFile(path) as zipped:
        if sorted(zipped.namelist()) != files:
            raise ValueError('La selección preparada difiere de los archivos esperados.')
        if zipped.testzip() is not None:
            raise ValueError('Archivo ZIP dañado.')
        for name in files:
            if zipped.read(name) != (root / name).read_bytes():
                raise ValueError('Copia desactualizada: ' + name)
if not config['check']:
    archive.parent.mkdir(parents=True, exist_ok=True)
    temporary = archive.with_suffix('.zip.tmp')
    try:
        with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED) as zipped:
            for name in files:
                zipped.write(root / name, name)
        check(temporary)
        os.replace(temporary, archive)
    finally:
        temporary.unlink(missing_ok=True)
check(archive)
print(str(len(files)) + ' archivos comprobados en ' + str(archive) + '. No publicados.')
`,
    ],
    {
      input: JSON.stringify({
        root,
        archive,
        files,
        check: process.argv.includes("--check"),
      }),
      encoding: "utf8",
    },
  );
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
if (process.argv.includes("--check")) {
  async function actualFiles(directory, prefix = "") {
    const result = [];
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const name = prefix + item.name;
      if (item.isSymbolicLink()) throw Error(`Enlace no permitido: ${name}`);
      if (item.isDirectory())
        result.push(
          ...(await actualFiles(join(directory, item.name), `${name}/`)),
        );
      else result.push(name);
    }
    return result;
  }
  const actual = (await actualFiles(destination)).sort();
  const expected = [...files].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw Error(
      "La selección preparada difiere de los archivos esperados. Regenera con portfolio:prepare.",
    );
  for (const path of files) {
    if (
      !(await readFile(join(root, path))).equals(
        await readFile(join(destination, path)),
      )
    )
      throw Error(`Copia desactualizada: ${path}`);
  }
  console.log(
    `${kind}: ${files.length} archivos comprobados; lista y contenido coinciden con las fuentes.`,
  );
  process.exit(0);
}
// Sincronizar resultados sin sustituir la carpeta completa: conservar archivos
// idénticos y retirar únicamente entradas ajenas a la selección generada.
await mkdir(destination, { recursive: true });
if ((await lstat(destination)).isSymbolicLink())
  throw Error("El destino no puede ser un enlace simbólico.");
const expected = new Set(files);
async function prune(directory, prefix = "") {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = prefix + item.name;
    const path = join(directory, item.name);
    if (item.isSymbolicLink())
      throw Error(`Enlace no permitido en el resultado: ${name}`);
    if (item.isDirectory()) {
      await prune(path, `${name}/`);
      if (!(await readdir(path)).length) await rm(path, { recursive: true });
    } else if (!expected.has(name)) await rm(path);
  }
}
await prune(destination);
for (const path of files) {
  const source = await readFile(join(root, path));
  const target = join(destination, path);
  let previous;
  try {
    previous = await readFile(target);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  if (!previous?.equals(source)) {
    await mkdir(resolve(target, ".."), { recursive: true });
    await copyFile(join(root, path), target);
  }
}
console.log(
  `${kind}: ${files.length} archivos preparados en ${destination}. No publicados.`,
);
