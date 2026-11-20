import { createAppServer } from "./harness.js";
import assert from "node:assert/strict";

import { resolve } from "node:path";
import { createRequire } from "node:module";
import { chromium, webkit } from "playwright";
resolve(process.cwd());
const axePath = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
async function audit(page, name) {
  await page.addScriptTag({ path: axePath });
  const violations = await page.evaluate(() =>
    axe
      .run(document, {
        runOnly: {
          type: "tag",
          values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
        },
      })
      .then((report) =>
        report.violations.map(({ id, nodes }) => ({
          id,
          targets: nodes.map((node) => node.target),
        })),
      ),
  );
  assert.deepEqual(
    violations,
    [],
    `Accesibilidad: ${name}: ${JSON.stringify(violations)}`,
  );
}
const server = createAppServer();
let browser;
try {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const kind = process.env.GRIMORIO_BROWSER || "chromium";
  browser = await { chromium, webkit }[kind].launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.getByRole("heading", { name: "Prepara la aldea." }).waitFor();
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await audit(page, "preparación");
  const roleChoice = page.locator(".role-check input").first();
  await roleChoice.focus();
  assert.equal(
    await roleChoice.evaluate((element) => document.activeElement === element),
    true,
    "La selección de personaje admite teclado",
  );
  assert.notEqual(
    await roleChoice.evaluate(
      (element) => getComputedStyle(element.parentElement).outlineStyle,
    ),
    "none",
    "El foco del personaje es visible",
  );
  const wasChecked = await roleChoice.isChecked();
  await page.keyboard.press("Space");
  assert.equal(
    await page.locator(".role-check input").first().isChecked(),
    !wasChecked,
    "Se puede cambiar la selección con teclado",
  );
  for (const viewport of [
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    const responsiveContext = await browser.newContext({ viewport });
    const responsivePage = await responsiveContext.newPage();
    await responsivePage.goto(`http://127.0.0.1:${server.address().port}/`);
    await responsivePage
      .getByRole("heading", { name: "Prepara la aldea." })
      .waitFor();
    assert.equal(
      await responsivePage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `Inicio sin desbordamiento a ${viewport.width}px`,
    );
    await audit(responsivePage, `preparación ${viewport.width}px`);
    await responsiveContext.close();
  }
  const games = [];
  for (const scriptId of [
    "trouble_brewing",
    "bad_moon_rising",
    "sects_and_violets",
  ]) {
    const gameContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const gamePage = await gameContext.newPage();
    gamePage.on("pageerror", (error) =>
      errors.push(`${scriptId}: ${error.message}`),
    );
    await gamePage.goto(`http://127.0.0.1:${server.address().port}/`);
    await gamePage.evaluate(async (id) => {
      const e = await import("/src/engine.js"),
        s = await import("/src/core/active-store.js");
      const roles = e.randomRoleSet(8, () => 0.99, id);
      const game = e.createGame(
        Array.from({ length: 8 }, (_, i) => `Jugador ${i + 1}`),
        roles,
        { scriptId: id, random: () => 0.99, secretDeal: false },
      );
      e.beginNight(game);
      await s.openActiveStore();
      await s.saveGame(game);
    }, scriptId);
    await gamePage.evaluate(() => navigator.serviceWorker.ready);
    await gamePage.reload();
    await gamePage.waitForFunction(() =>
      Boolean(navigator.serviceWorker.controller),
    );
    await audit(gamePage, `${scriptId}: noche`);
    games.push({ gamePage, gameContext, scriptId });
  }
  await new Promise((r) => server.close(r));
  await page.reload();
  await page.getByRole("heading", { name: "Prepara la aldea." }).waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "Inicio móvil sin desbordamiento",
  );
  await page.getByRole("button", { name: "Partidas", exact: true }).click();
  await page.getByRole("heading", { name: "Partida y archivos" }).waitFor();
  await audit(page, "partidas");
  const upload = page.locator("#import-file");
  await upload.focus();
  assert.equal(
    await upload.evaluate((element) => document.activeElement === element),
    true,
    "La importación debe admitir foco de teclado",
  );
  const outline = await upload.evaluate(
    (element) => getComputedStyle(element.parentElement).outlineStyle,
  );
  assert.notEqual(
    outline,
    "none",
    "El foco del selector de archivos debe ser visible",
  );
  await page.getByRole("link", { name: "Abrir recuperación →" }).click();
  await page.getByRole("heading", { name: "Cuida tus partidas." }).waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Cuida tus partidas." }).waitFor();
  await audit(page, "recuperación");
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "Recuperación móvil sin desbordamiento",
  );
  await page.locator("#import").focus();
  assert.equal(
    await page
      .locator("#import")
      .evaluate((element) => document.activeElement === element),
    true,
  );
  for (const { gamePage, gameContext, scriptId } of games) {
    await gamePage.reload();
    await gamePage.getByRole("heading", { name: "Noche 1" }).first().waitFor();
    assert.equal(
      await gamePage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `${scriptId}: noche móvil sin desbordamiento`,
    );
    await gamePage
      .getByRole("button", { name: /Cerrar los ojos y empezar/ })
      .click();
    await gamePage
      .getByRole("button", { name: /Registrar y seguir/ })
      .waitFor();
    await gamePage.waitForSelector('.save-indicator[data-state="saved"]');
    await gamePage.reload();
    await gamePage
      .getByRole("button", { name: /Registrar y seguir/ })
      .waitFor();
    await gamePage.getByRole("link", { name: "Ayuda", exact: true }).click();
    await gamePage.getByRole("heading", { name: "Ayuda por capas" }).waitFor();
    await audit(gamePage, `${scriptId}: ayuda`);
    assert.equal(
      await gamePage.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      `${scriptId}: ayuda móvil sin desbordamiento`,
    );
    await gameContext.close();
  }
  assert.deepEqual(errors, []);
  console.log(
    `${kind}: inicio y recuperación offline, foco de archivos y tamaños móviles correctos.`,
  );
} finally {
  if (browser) await browser.close();
  if (server.listening) await new Promise((r) => server.close(r));
}
