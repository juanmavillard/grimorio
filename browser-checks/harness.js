import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
export function createAppServer(override = async () => null) {
  const root = resolve(process.cwd());
  const server = createServer(async (req, res) => {
    try {
      const path = decodeURIComponent(
          new URL(req.url, "http://localhost").pathname,
        ),
        file = resolve(root, `.${path === "/" ? "/index.html" : path}`);
      if (!file.startsWith(root + sep)) throw Error("Ruta inválida");
      const custom = await override(path);
      const body = custom?.body ?? (await readFile(file));
      const mime = {
        ".js": "text/javascript",
        ".html": "text/html",
        ".css": "text/css",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
      };
      res.writeHead(custom?.status ?? 200, {
        "Content-Type": mime[extname(file)] || "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  return server;
}
export async function serve(override = async () => null) {
  const server = createAppServer(override);
  await new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", ok);
  });
  return {
    server,
    url: `http://127.0.0.1:${server.address().port}/`,
    close: () => new Promise((ok) => server.close(ok)),
  };
}
export async function seed(page, scriptId = "trouble_brewing") {
  await page.waitForSelector("#app > *");
  return page.evaluate(async (scriptId) => {
    const e = await import("/src/engine.js"),
      s = await import("/src/core/active-store.js");
    const roles = e.randomRoleSet(8, () => 0.99, scriptId);
    const game = e.createGame(
      Array.from({ length: 8 }, (_, i) => `Persona ${i + 1}`),
      roles,
      { scriptId, random: () => 0.99 },
    );
    e.beginNight(game);
    await s.saveGame(game);
    return game.id;
  }, scriptId);
}
export async function readBundle(page) {
  return page.evaluate(async () => {
    const db = await new Promise((ok, fail) => {
      const r = indexedDB.open("grimorio-base3-active");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => fail(r.error);
    });
    try {
      return await new Promise((ok, fail) => {
        const r = db.transaction("state").objectStore("state").get("active");
        r.onsuccess = () => ok(r.result);
        r.onerror = () => fail(r.error);
      });
    } finally {
      db.close();
    }
  });
}
