import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { renderedCharacterManuals } from "./generate-character-manuals.js";

const ROOT = resolve(import.meta.dirname, "..");
const roots = [
  join(ROOT, "README.md"),
  join(ROOT, "CONTRIBUTING.md"),
  join(ROOT, "THIRD_PARTY_NOTICES.md"),
  join(ROOT, "docs"),
];

function markdownFiles(path) {
  if (extname(path) === ".md") return [path];
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = join(path, entry.name);
    return entry.isDirectory()
      ? markdownFiles(child)
      : extname(child) === ".md"
        ? [child]
        : [];
  });
}

const files = roots.flatMap(markdownFiles);
const errors = [];

for (const [path, expected] of Object.entries(renderedCharacterManuals())) {
  const actual = readFileSync(join(ROOT, path), "utf8");
  if (actual !== expected)
    errors.push(
      `${path}: no coincide con la ayuda estructurada; ejecuta npm run docs:generate`,
    );
}

for (const file of files) {
  const label = relative(ROOT, file);
  const source = readFileSync(file, "utf8");
  const lines = source.split("\n");
  const h1Count = lines.filter((line) => /^# [^#]/.test(line)).length;
  const fenceCount = lines.filter((line) => /^```/.test(line)).length;

  if (h1Count !== 1)
    errors.push(
      `${label}: debe contener exactamente un título H1 (hay ${h1Count})`,
    );
  if (fenceCount % 2 !== 0)
    errors.push(`${label}: hay un bloque de código sin cerrar`);

  lines.forEach((line, index) => {
    if (/[ \t]+$/.test(line))
      errors.push(`${label}:${index + 1}: espacio sobrante al final`);
  });

  for (const match of source.matchAll(/(?<!!)\[[^\]]*\]\(([^)]+)\)/g)) {
    const rawTarget = match[1].trim().replace(/^<|>$/g, "");
    if (/^(https?:|mailto:)/i.test(rawTarget)) continue;

    const pathPart = decodeURIComponent(rawTarget.split("#")[0]);
    const target = pathPart ? resolve(dirname(file), pathPart) : file;
    if (!existsSync(target))
      errors.push(`${label}: enlace local roto → ${rawTarget}`);
    else if (rawTarget.includes("#")) {
      const anchor = decodeURIComponent(
        rawTarget.split("#").slice(1).join("#"),
      );
      const content = readFileSync(target, "utf8");
      if (/^L\d+$/.test(anchor)) {
        if (Number(anchor.slice(1)) > content.split("\n").length)
          errors.push(`${label}: línea inexistente → ${rawTarget}`);
      } else if (extname(target) === ".md") {
        const anchors = new Set(
          [...content.matchAll(/^#{1,6} (.+)$/gm)].map((match) =>
            match[1]
              .toLowerCase()
              .replace(/<[^>]*>/g, "")
              .replace(/[^\p{L}\p{N}_\s-]/gu, "")
              .trim()
              .replace(/\s/g, "-"),
          ),
        );
        if (!anchors.has(anchor))
          errors.push(`${label}: ancla inexistente → ${rawTarget}`);
      }
    }
  }
  for (const match of source.matchAll(
    /<!-- (test|symbol)-ref: (.+?) :: (.+?) -->/g,
  )) {
    const target = resolve(dirname(file), match[2]);
    if (!existsSync(target)) {
      errors.push(`${label}: referencia técnica inexistente → ${match[2]}`);
      continue;
    }
    const content = readFileSync(target, "utf8"),
      name = match[3];
    if (
      match[1] === "test"
        ? !content.includes(JSON.stringify(name)) &&
          !content.includes(`'${name}'`)
        : !new RegExp(`\\b${name}\\b`).test(content)
    )
      errors.push(`${label}: ${match[1]} inexistente → ${name}`);
  }
}

if (errors.length) {
  console.error(
    `Documentación no válida (${errors.length} problema${errors.length === 1 ? "" : "s"}):`,
  );
  errors.forEach((error) => console.error(`- ${error}`));
  process.exitCode = 1;
} else {
  console.log(
    `Documentación válida: ${files.length} archivos Markdown y todos los enlaces locales comprobados.`,
  );
}
