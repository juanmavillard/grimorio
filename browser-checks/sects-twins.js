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
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  const button = (name) => page.getByRole("button", { name, exact: true });
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
  const step = () => button("Registrar y seguir →").click();
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await page.locator("#setup-script").selectOption("sects_and_violets");
  const roles = [
    "clockmaker",
    "dreamer",
    "snake_charmer",
    "savant",
    "artist",
    "mutant",
    "evil_twin",
    "vortox",
  ];
  const ids = await page
    .locator("[data-role]")
    .evaluateAll((els) => els.map((el) => el.dataset.role));
  for (const id of ids) {
    const input = page.locator(`[data-role="${id}"]`);
    if ((await input.isChecked()) !== roles.includes(id))
      await page.locator(`label:has([data-role="${id}"])`).click();
  }
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
    const p = seats.find((x) => x.role === role);
    assert.ok(p, `Falta ${role}`);
    return p;
  };
  const clock = seat("clockmaker"),
    dreamer = seat("dreamer"),
    snake = seat("snake_charmer"),
    savant = seat("savant"),
    artist = seat("artist"),
    twin = seat("evil_twin"),
    demon = seat("vortox");
  await button("Confirmar y repartir →").click();
  for (const _player of seats) {
    await button("Ver mi personaje").click();
    await button("Ocultar y pasar").click();
  }
  await heading("Noche 1");
  await button("Cerrar los ojos y empezar →").click();
  await heading("Encantador de Serpientes");
  await page.locator("#night-target").selectOption(savant.id);
  await step();
  await heading("Información de Esbirros");
  await step();
  await heading("Información del Demonio");
  await step();
  await heading("Gemelo Malvado");
  await page.locator("#night-target").selectOption(artist.id);
  await step();
  await heading("Relojero");
  const base = Number(await page.locator("#info-value").inputValue());
  await page.locator("#info-value").fill(String(base + 1));
  await step();
  await heading("Soñador");
  await page.locator("#night-target").selectOption(twin.id);
  await page.locator("#snv-role-good").selectOption("clockmaker");
  await page.locator("#snv-role-evil").selectOption("vortox");
  await step();
  await heading("Resumen del amanecer");
  await button("Abrir los ojos · comenzar día 1").click();
  await page.getByRole("link", { name: "Día", exact: true }).click();
  await button("Abrir nominaciones →").click();
  await page.locator("#nominator").selectOption(clock.id);
  await page.locator("#nominee").selectOption(demon.id);
  await button("Abrir acusación →").click();
  await button("Abrir defensa →").click();
  await button("Abrir votación →").click();
  for (const p of [clock, dreamer, snake, savant])
    await page.locator(`[data-voter="${p.id}"]`).check();
  await button("Registrar resultado →").click();
  await button("Cerrar nominaciones y resolver").click();
  await heading("Noche 2");
  assert.match(
    await page.locator("main").innerText(),
    /Victoria del Bien aplazada/,
  );
  await button("Cerrar los ojos y empezar →").click();
  await heading("Encantador de Serpientes");
  await page.locator("#night-target").selectOption(savant.id);
  await step();
  await heading("Soñador");
  await page.locator("#night-target").selectOption(twin.id);
  await page.locator("#snv-role-good").selectOption("clockmaker");
  await page.locator("#snv-role-evil").selectOption("evil_twin");
  await step();
  await heading("Resumen del amanecer");
  await button("Abrir los ojos · comenzar día 2").click();
  await page.getByRole("link", { name: "Día", exact: true }).click();
  await button("Abrir nominaciones →").click();
  await page.locator("#nominator").selectOption(clock.id);
  await page.locator("#nominee").selectOption(twin.id);
  await button("Abrir acusación →").click();
  await button("Abrir defensa →").click();
  await button("Abrir votación →").click();
  for (const p of [clock, dreamer, snake, savant])
    await page.locator(`[data-voter="${p.id}"]`).check();
  await button("Registrar resultado →").click();
  await button("Cerrar nominaciones y resolver").click();
  await page.getByText("Victoria del Bien", { exact: false }).first().waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Sects & Violets: Vortox, Demonio muerto, Gemelo y victoria aplazada: correcto.",
  );
  await context.close();
} finally {
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}
