import { createAppServer } from "./harness.js";
import assert from "node:assert/strict";

import { resolve } from "node:path";
import { chromium } from "playwright";

// Contexto y servidor efímeros: nunca se accede al almacenamiento del usuario.
resolve(process.cwd());

const server = createAppServer();
let browser;
try {
  await new Promise((ok, fail) => {
    server.once("error", fail);
    server.listen(0, "127.0.0.1", ok);
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) =>
    dialog.type() === "prompt" ? dialog.accept("S") : dialog.accept(),
  );
  const button = (name) => page.getByRole("button", { name, exact: true });
  const step = () => button("Registrar y seguir →").click();
  const heading = async (text) => {
    try {
      await page
        .getByRole("heading", { name: text, exact: true })
        .first()
        .waitFor();
    } catch (error) {
      console.error(
        "Pantalla inesperada:",
        (await page.locator("main").innerText()).slice(0, 2500),
      );
      throw error;
    }
  };
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator("#setup-script").selectOption("bad_moon_rising");
  const roles = [
    "exorcist",
    "fool",
    "gambler",
    "chambermaid",
    "lunatic",
    "tinker",
    "godfather",
    "pukka",
  ];
  const roleIds = await page
    .locator("[data-role]")
    .evaluateAll((els) => els.map((el) => el.dataset.role));
  for (const id of roleIds) {
    const input = page.locator(`[data-role="${id}"]`);
    if ((await input.isChecked()) !== roles.includes(id))
      await page.locator(`label:has([data-role="${id}"])`).click();
  }
  await page.locator("#godfather-outsiders").selectOption("1");
  await button("Crear partida →").click();
  await heading("Coloca las fichas.");
  const seats = await page.locator(".assignment-role").evaluateAll((els) =>
    els.map((el, i) => ({
      id: el.dataset.id,
      role: el.value,
      name: `Jugador ${i + 1}`,
    })),
  );
  const seat = (role) => {
    const result = seats.find((p) => p.role === role);
    assert.ok(result, `Falta ${role}`);
    return result;
  };
  const lunatic = seat("lunatic"),
    pukka = seat("pukka"),
    fool = seat("fool"),
    gambler = seat("gambler"),
    exorcist = seat("exorcist"),
    godfather = seat("godfather"),
    tinker = seat("tinker");
  await page.locator("#assign-lunatic-demon").selectOption("pukka");
  await button("Confirmar y repartir →").click();
  for (const player of seats) {
    await button("Ver mi personaje").click();
    if (player.id === lunatic.id) {
      await heading("Pukka");
      assert.match(await page.locator("main").innerText(), /MALVADO/);
      assert.doesNotMatch(await page.locator("main").innerText(), /Lunático/);
    }
    await button("Ocultar y pasar").click();
  }
  await heading("Noche 1");
  await button("Cerrar los ojos y empezar →").click();
  await heading("Información de Esbirros");
  await step();
  await heading("Lunático");
  await page.locator("#night-target").selectOption(gambler.id);
  await step();
  await heading("Información del Demonio");
  await step();
  await heading("Padrino");
  await step();
  await heading("Pukka");
  assert.match(
    await page.locator("main").innerText(),
    new RegExp(lunatic.name),
  );
  await page.locator("#night-target").selectOption(fool.id);
  await step();
  await heading("Camarera");
  await page.locator("#night-target-a").selectOption(exorcist.id);
  await page.locator("#night-target-b").selectOption(godfather.id);
  await page.locator("#info-value").fill("1");
  await step();
  await heading("Resumen del amanecer");
  await button("Abrir los ojos · comenzar día 1").click();
  await page.getByRole("link", { name: "Día", exact: true }).click();
  await button("Cerrar nominaciones y resolver").click();
  await heading("Noche 2");
  await button("Cerrar los ojos y empezar →").click();
  await heading("Jugador");
  await page.locator("#night-target").selectOption(gambler.id);
  await page.locator("#bmr-role").selectOption("gambler");
  await step();
  await heading("Lunático");
  await page.locator("#night-target").selectOption(gambler.id);
  await step();
  await heading("Exorcista");
  await page.locator("#night-target").selectOption(pukka.id);
  await step();
  await heading("Pukka");
  assert.match(
    await page.locator("main").innerText(),
    /sin pedir una nueva elección/,
  );
  assert.match(await page.locator("main").innerText(), /No despiertes/);
  await step();
  await heading("Manitas");
  assert.match(await page.locator("main").innerText(), /No despiertes/);
  await step();
  await heading("Camarera");
  await page.locator("#night-target-a").selectOption(exorcist.id);
  await page.locator("#night-target-b").selectOption(godfather.id);
  await page.locator("#info-value").fill("1");
  await step();
  await heading("Resumen del amanecer");
  assert.match(
    await page.locator("main").innerText(),
    new RegExp(`Muertes para anunciar: ${fool.name}`),
  );
  await button("Abrir los ojos · comenzar día 2").click();
  await button("Plaza pública").click();
  assert.doesNotMatch(
    await page.locator("main").innerText(),
    /Pukka|Lunático|Tonto|Exorcista|Padrino/,
  );
  await button("Volver a pantalla privada").click();
  await page.getByRole("link", { name: "Día", exact: true }).click();
  await button("Abrir nominaciones →").click();
  await page.locator("#nominator").selectOption(exorcist.id);
  await page.locator("#nominee").selectOption(pukka.id);
  await button("Abrir acusación →").click();
  await button("Abrir defensa →").click();
  await button("Abrir votación →").click();
  for (const voter of [exorcist, gambler, lunatic, tinker])
    await page.locator(`[data-voter="${voter.id}"]`).check();
  await button("Registrar resultado →").click();
  await button("Cerrar nominaciones y resolver").click();
  await page.getByText("Victoria del Bien", { exact: false }).first().waitFor();
  await page.locator('[data-action="undo"]').click();
  await heading("Día 2");
  await page.locator('[data-action="redo"]').click();
  await page.getByText("Victoria del Bien", { exact: false }).first().waitFor();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    button("Exportar copia").click(),
  ]);
  await page.locator("#import-file").setInputFiles(await download.path());
  await page
    .getByRole("dialog", { name: "Sustituir la partida activa" })
    .getByRole("button", { name: "Continuar sin guardar", exact: true })
    .click();
  await page.getByText("Partida importada", { exact: false }).first().waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Bad Moon Rising: reparto privado, Lunático, Pukka, Exorcista, muerte diferida, amanecer, privacidad, victoria, deshacer y copia: correcto.",
  );
  await context.close();
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}
