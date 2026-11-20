import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createServer } from "node:http";
import { join, resolve, extname } from "node:path";
import { chromium } from "playwright";
import { RELEASE } from "../src/release.js";

const root = resolve("output/demo"),
  prefix = "/grimorio/",
  allowed = new Set([...RELEASE.assets, "sw.js", "THIRD_PARTY_NOTICES.md"]);
async function preparedFiles(directory = "") {
  const files = [];
  for (const entry of await readdir(join(root, directory), {
    withFileTypes: true,
  })) {
    const path = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await preparedFiles(path)));
    else files.push(path);
  }
  return files;
}
assert.deepEqual((await preparedFiles()).sort(), [...allowed].sort());
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (!url.pathname.startsWith(prefix)) throw Error("Fuera de la demo");
    const path =
      decodeURIComponent(url.pathname.slice(prefix.length)) || "index.html";
    if (!allowed.has(path)) throw Error("Recurso no permitido");
    const mime = {
      ".js": "text/javascript",
      ".html": "text/html",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".webmanifest": "application/manifest+json",
    };
    response.writeHead(200, {
      "Content-Type": mime[extname(path)] || "text/plain",
    });
    response.end(await readFile(join(root, path)));
  } catch {
    response.writeHead(404);
    response.end();
  }
});
let browser;
try {
  await new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", ok);
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true }),
    page = await context.newPage(),
    url = `http://127.0.0.1:${server.address().port}${prefix}`,
    errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url);
  await page.getByRole("heading", { name: "Prepara la aldea." }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  for (const scriptId of [
    "trouble_brewing",
    "bad_moon_rising",
    "sects_and_violets",
  ]) {
    const result = await page.evaluate(async (scriptId) => {
      const engine = await import("./src/engine.js"),
        store = await import("./src/core/active-store.js"),
        { createApplicationService } = await import(
          "./src/application/service.js"
        );
      await store.clearGame();
      const app = createApplicationService();
      const game = await app.dispatch({
        type: "game.create",
        input: {
          names: Array.from({ length: 8 }, (_, i) => `Persona ${i + 1}`),
          roles: engine.randomRoleSet(8, () => 0.99, scriptId),
          options: { scriptId, title: "Demo ficticia", random: () => 0.99 },
        },
      });
      await store.commit(game, (draft) => engine.beginNight(draft));
      return { scriptId: game.scriptId, count: game.players.length };
    }, scriptId);
    assert.deepEqual(result, { scriptId, count: 8 });
  }
  await page.reload();
  assert.equal(
    await page.evaluate(
      async () =>
        (await import("./src/core/active-store.js")).confirmedGame().title,
    ),
    "Demo ficticia",
  );
  await page.getByRole("link", { name: "Diagnóstico", exact: true }).click();
  assert.equal(await page.locator("#diagnostic-anonymous").isChecked(), true);
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Exportar diagnóstico", exact: true })
      .click(),
  ]);
  assert.equal(
    JSON.parse(await readFile(await download.path(), "utf8")).anonymous,
    true,
  );
  await context.setOffline(true);
  await page.reload();
  await page.waitForSelector("#app > *");
  assert.equal(
    await page.evaluate(
      async () =>
        (await import("./src/core/active-store.js")).confirmedGame().title,
    ),
    "Demo ficticia",
  );
  await page.goto(new URL("recuperar.html", url).href);
  await page.waitForSelector("#result");
  assert.deepEqual(errors, []);
  const other = await browser.newContext(),
    otherPage = await other.newPage();
  await otherPage.goto(url);
  await otherPage.getByRole("heading", { name: "Prepara la aldea." }).waitFor();
  assert.equal(
    await otherPage.evaluate(async () =>
      (await import("./src/core/active-store.js")).confirmedGame(),
    ),
    null,
  );
  assert.equal((await readdir(root)).includes("package.json"), false);
  await other.close();
  await context.close();
  console.log(
    "Demo aislada: subruta, tres guiones, persistencia, diagnóstico anónimo, recuperación offline y visitantes separados correctos.",
  );
} finally {
  if (browser) await browser.close();
  if (server.listening) await new Promise((ok) => server.close(ok));
}
