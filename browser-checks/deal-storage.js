import { createAppServer } from "./harness.js";
import assert from "node:assert/strict";

import { resolve } from "node:path";
import { chromium } from "playwright";

// Servidor y perfiles aislados; nunca usa partidas personales.
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
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const button = (name) => page.getByRole("button", { name, exact: true });
  const bundle = () =>
    page.evaluate(async () => {
      const db = await new Promise((ok, fail) => {
        const r = indexedDB.open("grimorio-base3-active");
        r.onsuccess = () => ok(r.result);
        r.onerror = () => fail(r.error);
      });
      try {
        return await new Promise((ok, fail) => {
          const r = db.transaction("state").objectStore("state").get("active");
          r.onsuccess = () => ok(JSON.stringify(r.result));
          r.onerror = () => fail(r.error);
        });
      } finally {
        db.close();
      }
    });
  const failWrite = (mode) =>
    page.evaluate((mode) => {
      window.originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        if (mode === "abort") {
          const request = window.originalPut.apply(this, args);
          this.transaction.abort();
          return request;
        }
        throw new DOMException("Cuota agotada de prueba", "QuotaExceededError");
      };
    }, mode);
  const restoreWrite = () =>
    page.evaluate(() => {
      IDBObjectStore.prototype.put = window.originalPut;
      delete window.originalPut;
    });
  async function rejectWrite(label, action, mode = "quota") {
    const before = await bundle();
    await page.evaluate(() => {
      const toast = document.querySelector("#toast");
      if (toast) toast.textContent = "";
    });
    await failWrite(mode);
    await action();
    await page.locator('.save-indicator[data-state="error"]').waitFor();
    await page
      .getByText("No se guardó la acción:", { exact: false })
      .first()
      .waitFor();
    await restoreWrite();
    assert.equal(await bundle(), before, `${label}: guardado inalterado`);
  }
  await rejectWrite("creación", () => button("Crear partida →").click());
  assert.ok(
    await page.getByRole("heading", { name: "Prepara la aldea." }).isVisible(),
  );
  await button("Crear partida →").click();
  await page.getByRole("heading", { name: "Coloca las fichas." }).waitFor();
  await rejectWrite("barajado", () => button("Barajar asignación").click());
  await rejectWrite(
    "transacción interrumpida",
    () => button("Barajar asignación").click(),
    "abort",
  );
  await rejectWrite("volver a selección", () =>
    button("← Volver a selección").click(),
  );
  assert.ok(
    await page.getByRole("heading", { name: "Coloca las fichas." }).isVisible(),
  );
  const firstRole = page.locator(".assignment-role").first();
  const originalRole = await firstRole.inputValue();
  const newRole = await firstRole
    .locator("option")
    .evaluateAll(
      (options, original) =>
        options.find((option) => option.value !== original).value,
      originalRole,
    );
  await rejectWrite("asignación individual", () =>
    firstRole.selectOption(newRole),
  );
  assert.equal(
    await page.locator(".assignment-role").first().inputValue(),
    originalRole,
    "El control vuelve al valor guardado",
  );
  await page.locator(".assignment-role").first().selectOption(newRole);
  await page.locator('.save-indicator[data-state="saved"]').waitFor();
  const duplicateAssignment = await bundle();
  await button("Confirmar y repartir →").click();
  await page
    .getByText(
      "Cada personaje seleccionado debe asignarse exactamente una vez.",
      { exact: true },
    )
    .waitFor();
  assert.equal(
    await bundle(),
    duplicateAssignment,
    "Una asignación duplicada no avanza ni cambia el guardado",
  );
  await page.locator(".assignment-role").first().selectOption(originalRole);
  await page.locator('.save-indicator[data-state="saved"]').waitFor();
  await page.locator("#assign-drunk").selectOption("soldier");
  const choices = await page
    .locator(".assign-bluff")
    .first()
    .locator("option")
    .evaluateAll((options) =>
      options.map((o) => o.value).filter((v) => v !== "soldier"),
    );
  for (let i = 0; i < 3; i++)
    await page.locator(".assign-bluff").nth(i).selectOption(choices[i]);
  await rejectWrite("confirmación", () =>
    button("Confirmar y repartir →").click(),
  );
  assert.ok(
    await page.getByRole("heading", { name: "Coloca las fichas." }).isVisible(),
  );
  // El error vuelve a dibujar el formulario: se reintroducen las decisiones antes de reintentar.
  await page.locator("#assign-drunk").selectOption("soldier");
  for (let i = 0; i < 3; i++)
    await page.locator(".assign-bluff").nth(i).selectOption(choices[i]);
  await button("Confirmar y repartir →").click();
  await button("Ver mi personaje").click();
  await rejectWrite("paso de reparto", () => button("Ocultar y pasar").click());
  assert.ok(
    await button("Ver mi personaje").isVisible(),
    "La identidad vuelve a quedar oculta",
  );
  await button("Ver mi personaje").click();
  await button("Ocultar y pasar").click();
  await page.getByText("Reparto 2 de 8", { exact: true }).waitFor();
  await page.reload();
  assert.match(await page.locator("main").innerText(), /Reparto 2 de 8/i);
  for (let i = 1; i < 7; i++) {
    await button("Ver mi personaje").click();
    await button("Ocultar y pasar").click();
    await page.getByText(`Reparto ${i + 2} de 8`, { exact: true }).waitFor();
  }
  await button("Ver mi personaje").click();
  await rejectWrite("último jugador", () => button("Ocultar y pasar").click());
  assert.match(await page.locator("main").innerText(), /Reparto 8 de 8/i);
  await button("Ver mi personaje").click();
  await button("Ocultar y pasar").click();
  await page.getByRole("heading", { name: "Noche 1" }).first().waitFor();
  await page.reload();
  await page.getByRole("heading", { name: "Noche 1" }).first().waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "Preparación y reparto: cuota agotada, reintentos, privacidad y recarga correctos.",
  );
  await context.close();
} finally {
  if (browser) await browser.close();
  if (server.listening) await new Promise((r) => server.close(r));
}
