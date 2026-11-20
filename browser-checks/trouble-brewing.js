import { createAppServer } from "./harness.js";
import assert from "node:assert/strict";

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright";

// Contexto y servidor efímeros: nunca se accede al almacenamiento del usuario.
resolve(process.cwd());

const server = createAppServer();
let browser;
try {
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("dialog", (dialog) =>
    dialog.type() === "prompt" ? dialog.accept("S") : dialog.accept(),
  );
  const button = (name) => page.getByRole("button", { name, exact: true });
  const step = () => button("Registrar y seguir →").click();
  const heading = (text) =>
    page.getByRole("heading", { name: text, exact: true }).first().waitFor();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await button("Crear partida →").click();
  await heading("Coloca las fichas.");
  const seatData = await page.locator(".assignment-role").evaluateAll((els) =>
    els.map((el, i) => ({
      id: el.dataset.id,
      role: el.value,
      name: `Jugador ${i + 1}`,
    })),
  );
  const seat = (role) => {
    const found = seatData.find((item) => item.role === role);
    assert.ok(found, `Falta ${role}`);
    return found;
  };
  const drunk = seat("drunk"),
    chef = seat("chef"),
    virgin = seat("virgin"),
    imp = seat("imp"),
    scarlet = seat("scarlet_woman"),
    empath = seat("empath"),
    fortune = seat("fortune_teller");
  await page.locator("#assign-drunk").selectOption("soldier");
  // La formación propuesta usa elecciones válidas; cambiamos cualquier bluff que coincida con el personaje aparente.
  const available = await page
    .locator(".assign-bluff")
    .first()
    .locator("option")
    .evaluateAll((opts) =>
      opts.map((x) => x.value).filter((x) => x !== "soldier"),
    );
  for (let i = 0; i < 3; i++)
    await page.locator(".assign-bluff").nth(i).selectOption(available[i]);
  await button("Confirmar y repartir →").click();
  for (const player of seatData) {
    await button("Ver mi personaje").click();
    if (player.id === drunk.id) {
      await heading("Soldado");
      assert.doesNotMatch(await page.locator("main").innerText(), /Borracho/);
    }
    await button("Ocultar y pasar").click();
  }
  await heading("Noche 1");
  await button("Cerrar los ojos y empezar →").click();
  await step();
  await step(); // Información de Esbirros y Demonio.
  await heading("Chef");
  await step();
  await heading("Empática");
  await step();
  await heading("Adivina");
  await page.locator("#info-player-a").selectOption(imp.id);
  await page.locator("#info-player-b").selectOption(chef.id);
  await page.locator("#info-value").selectOption("yes");
  await step();
  await heading("Resumen del amanecer");
  await button("Abrir los ojos · comenzar día 1").click();
  await button("Plaza pública").click();
  const publicText = await page.locator("main").innerText();
  assert.doesNotMatch(
    publicText,
    /Diablillo|Borracho|Virgen|Escarlata|señuelo|Chef/i,
  );
  await button("Volver a pantalla privada").click();
  await page.getByRole("link", { name: "Día", exact: true }).click();
  await button("Abrir nominaciones →").click();
  await page.locator("#nominator").selectOption(chef.id);
  await page.locator("#nominee").selectOption(virgin.id);
  await button("Abrir acusación →").click();
  await heading("Noche 2"); // La ejecución de Virgen es inmediata.
  assert.match(
    await page.locator("body").innerText(),
    new RegExp(`${chef.name} es ejecutado inmediatamente`),
  );
  await button("Cerrar los ojos y empezar →").click();
  await heading("Diablillo");
  await page.locator("#night-target").selectOption(imp.id);
  await step();
  await heading("Informar al nuevo Diablillo");
  assert.match(
    await page.locator("body").innerText(),
    new RegExp(scarlet.name),
  );
  await step();
  await heading("Empática");
  await step();
  await heading("Adivina");
  await page.locator("#info-player-a").selectOption(imp.id);
  await page.locator("#info-player-b").selectOption(scarlet.id);
  await page.locator("#info-value").selectOption("yes");
  await step();
  await heading("Enterrador");
  await step();
  await heading("Resumen del amanecer");
  assert.match(
    await page.locator("body").innerText(),
    new RegExp(`Muertes para anunciar: ${imp.name}`),
  );
  await button("Abrir los ojos · comenzar día 2").click();
  await page.getByRole("link", { name: "Día", exact: true }).click();
  await button("Abrir nominaciones →").click();
  await page.locator("#nominator").selectOption(empath.id);
  await page.locator("#nominee").selectOption(scarlet.id);
  await button("Abrir acusación →").click();
  await button("Abrir defensa →").click();
  await button("Abrir votación →").click();
  await page.locator(`[data-voter="${chef.id}"]`).check();
  await page.locator(`[data-voter="${empath.id}"]`).check();
  await page.locator(`[data-voter="${fortune.id}"]`).check();
  await button("Registrar resultado →").click();
  await page
    .getByText(`${scarlet.name} · 3 votos`, { exact: false })
    .first()
    .waitFor();
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
  const copy = await download.path();
  assert.ok(copy, "La copia exportada debe existir.");
  const invalid = JSON.parse(await readFile(copy, "utf8"));
  delete invalid.bluffs;
  const beforeInvalid = await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    return JSON.stringify(await s.openActiveStore());
  });
  await page.locator("#import-file").setInputFiles({
    name: "incompleta.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(invalid)),
  });
  await page
    .getByText("falta la lista de farolillos", { exact: false })
    .first()
    .waitFor();
  const afterInvalid = await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    return JSON.stringify(await s.openActiveStore());
  });
  assert.equal(
    afterInvalid,
    beforeInvalid,
    "Un archivo inválido no debe sustituir la partida.",
  );
  await page.locator("#import-file").setInputFiles(copy);
  await page
    .getByRole("dialog", { name: "Sustituir la partida activa" })
    .getByRole("button", { name: "Continuar sin guardar", exact: true })
    .click();
  await page.getByText("Partida importada", { exact: false }).first().waitFor();
  await page.getByRole("link", { name: "Ayuda", exact: true }).click();
  await heading("Ayuda por capas");
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller));
  await context.setOffline(true);
  await page.reload();
  await heading("Ayuda por capas");
  await context.setOffline(false);
  for (const [width, height] of [
    [1440, 900],
    [768, 1024],
    [390, 844],
  ]) {
    await page.setViewportSize({ width, height });
    await page.getByRole("link", { name: "Grimorio", exact: true }).click();
    await heading("Grimorio");
    assert.equal(
      await page
        .locator("body")
        .evaluate((el) => el.scrollWidth <= window.innerWidth),
      true,
      `Desbordamiento horizontal a ${width}px`,
    );
  }
  await page.getByRole("link", { name: "Diagnóstico", exact: true }).click();
  await heading("Puntos de recuperación");
  assert.equal(await page.locator("#diagnostic-anonymous").isChecked(), true);
  const [anonymousDownload] = await Promise.all([
    page.waitForEvent("download"),
    button("Exportar diagnóstico").click(),
  ]);
  const anonymousText = await readFile(await anonymousDownload.path(), "utf8");
  assert.equal(JSON.parse(anonymousText).anonymous, true);
  for (const player of seatData)
    assert.equal(
      anonymousText.includes(player.name),
      false,
      "El diagnóstico anónimo no debe incluir nombres.",
    );
  assert.doesNotMatch(
    anonymousText,
    /Diablillo|Borracho|Virgen|Escarlata|señuelo/i,
  );
  assert.ok(
    (await page.locator('[data-action="restore-checkpoint"]').count()) > 0,
    "Debe haber puntos de recuperación.",
  );
  await page.locator('[data-action="restore-checkpoint"]').first().click();
  await page.getByText("Punto restaurado", { exact: false }).first().waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Recorrido completo: preparación, reparto, noches, Virgen, pase, voto fantasma, victoria, deshacer/rehacer, copia, ayuda, offline, tamaños y recuperación: correcto.",
  );
  await context.close();
} finally {
  if (browser) await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
