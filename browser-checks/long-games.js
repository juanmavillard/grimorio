import assert from "node:assert/strict";
import { chromium } from "playwright";
import { serve } from "./harness.js";
const host = await serve();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(host.url);
  await page.waitForSelector("#app > *");
  const measurements = await page.evaluate(async () => {
    const E = await import("/src/engine.js"),
      S = await import("/src/core/active-store.js");
    const rows = [];
    for (const count of [1000, 10000]) {
      const roles = E.randomRoleSet(15, () => 0.99, "trouble_brewing");
      let game = E.createGame(
        Array.from({ length: 15 }, (_, i) => `Persona ${i + 1}`),
        roles,
        { random: () => 0.99 },
      );
      E.beginNight(game);
      game.players.forEach((p) => {
        p.notes = "Nota privada extensa. ".repeat(400);
      });
      for (let i = 0; i < count; i++)
        E.addHistory(
          game,
          `Acción ${i}`,
          "Decisión de prueba para medir una partida extensa.",
        );
      const before = performance.now();
      await S.saveGame(game);
      const saveMs = performance.now() - before;
      const commits = [];
      for (let i = 0; i < 3; i++) {
        const started = performance.now();
        game = await S.commit(game, (d) =>
          E.addHistory(d, `Continuación ${i}`),
        );
        commits.push(performance.now() - started);
      }
      const reopen = performance.now();
      const restored = await S.openActiveStore();
      const reopenMs = performance.now() - reopen;
      rows.push({
        actions: count,
        players: 15,
        history: restored.history.length,
        notesIntact: restored.players.every(
          (p) => p.notes === game.players[0].notes,
        ),
        saveMs,
        reopenMs,
        commitMs: commits,
        storage: S.storageMetrics(),
      });
    }
    return rows;
  });
  for (const row of measurements) {
    assert.ok(row.notesIntact);
    assert.equal(row.history, row.actions + 5);
    assert.ok(row.storage.auxiliaryBytes <= row.storage.auxiliaryBudget);
  }
  console.log(JSON.stringify(measurements, null, 2));
  await page.reload();
  await page.getByRole("heading", { name: "Noche 1" }).first().waitFor();
  const started = performance.now();
  await page.getByRole("link", { name: "Historial", exact: true }).click();
  const shown = await page.locator(".timeline article").count();
  assert.equal(shown, 50);
  const renderMs = performance.now() - started;
  await page.getByRole("button", { name: "Anteriores", exact: true }).click();
  assert.equal(await page.locator(".timeline article").count(), 50);
  console.log(
    JSON.stringify(
      {
        historyUI: {
          records: shown,
          renderMs,
          heapBytes: await page.evaluate(
            () => performance.memory?.usedJSHeapSize ?? null,
          ),
        },
      },
      null,
      2,
    ),
  );
  await context.close();
} finally {
  if (browser) await browser.close();
  await host.close();
}
