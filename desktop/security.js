import { resolve, sep } from "node:path";

export const APP_ID = "local.grimorio.base3";
export const APP_ORIGIN = "grimorio://app";
export const PROFILE_NAME = "Grimorio-Base3";
export const CSP =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'; form-action 'self'";

export function isAppUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "grimorio:" &&
      url.host === "app" &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function externalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}
export function resourcePath(root, value, allowed) {
  if (!isAppUrl(value)) return null;
  try {
    const path = decodeURIComponent(new URL(value).pathname);
    const name = path === "/" ? "index.html" : path.slice(1);
    if (name.includes("\\") || name.includes("\0") || !allowed.has(name))
      return null;
    const file = resolve(root, name);
    return file.startsWith(resolve(root) + sep) ? file : null;
  } catch {
    return null;
  }
}
export function exportRequest(value) {
  if (
    !value ||
    typeof value.json !== "string" ||
    typeof value.filename !== "string" ||
    !/^[^/\\\x00-\x1f<>:"|?*]{1,160}\.json$/i.test(value.filename)
  )
    throw new Error("Exportación no válida.");
  JSON.parse(value.json);
  return { json: value.json, filename: value.filename };
}
