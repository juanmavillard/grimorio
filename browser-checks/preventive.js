import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";
import { serve, seed, readBundle } from "./harness.js";
const host = await serve();
let browser;
try {
  browser = await chromium.launch({ headless: true });
  // Una escritura directa puede estar en curso cuando el servicio crea la partida.
  {
    const context = await browser.newContext(),
      page = await context.newPage();
    await page.goto(host.url);
    await page.getByRole("heading", { name: "Prepara la aldea." }).waitFor();
    const creation = await page.evaluate(async () => {
      const store = await import("/src/core/active-store.js"),
        { createApplicationService } = await import(
          "/src/application/service.js"
        ),
        app = createApplicationService(),
        before = store.currentRevision(),
        input = {
          names: [
            "Persona 1",
            "Persona 2",
            "Persona 3",
            "Persona 4",
            "Persona 5",
          ],
          roles: ["washerwoman", "chef", "empath", "poisoner", "imp"],
          options: { title: "Creación de prueba", random: () => 0.99 },
        },
        outcomes = await Promise.allSettled([
          store.clearGame(),
          app.dispatch({ type: "game.create", input }),
        ]);
      const afterConflict = store.currentRevision(),
        gameAfterConflict = store.confirmedGame(),
        valid =
          outcomes[1].status === "rejected"
            ? await app.dispatch({ type: "game.create", input })
            : null;
      return {
        statuses: outcomes.map((result) => result.status),
        error: outcomes[1].reason?.message,
        before,
        afterConflict,
        gameAfterConflict,
        afterRetry: store.currentRevision(),
        title: valid?.title,
      };
    });
    assert.deepEqual(creation.statuses, ["fulfilled", "rejected"]);
    assert.match(creation.error, /cambió/);
    assert.equal(creation.afterConflict, creation.before + 1);
    assert.equal(creation.gameAfterConflict, null);
    assert.equal(creation.afterRetry, creation.before + 2);
    assert.equal(creation.title, "Creación de prueba");
    await context.close();
    console.log(
      "Creación: revisión obsoleta rechazada y reintento válido guardado.",
    );
  }
  for (const script of [
    "trouble_brewing",
    "bad_moon_rising",
    "sects_and_violets",
  ]) {
    const context = await browser.newContext(),
      page = await context.newPage();
    await page.goto(host.url);
    await page.getByRole("heading", { name: "Prepara la aldea." }).waitFor();
    if (script !== "trouble_brewing")
      await page.locator("#setup-script").selectOption(script);
    if (await page.locator("#godfather-outsiders").count())
      await page.locator("#godfather-outsiders").selectOption("1");
    await page.locator(".player-name").first().fill("Nombre recuperado");
    await page.locator("#setup-title").fill("Título recuperado");
    const selected = await page
      .locator("[data-role]:checked")
      .evaluateAll((els) => els.map((el) => el.dataset.role).sort());
    await page.evaluate(async () => {
      const s = await import("/src/core/active-store.js");
      await s.draftAccess("readonly", (store) => store.getAll());
    });
    await page.reload();
    assert.equal(
      await page.locator(".player-name").first().inputValue(),
      "Nombre recuperado",
    );
    assert.equal(await page.locator("#setup-script").inputValue(), script);
    await page
      .getByRole("button", { name: "Crear partida →", exact: true })
      .click();
    await page.getByRole("heading", { name: "Coloca las fichas." }).waitFor();
    const { game } = await readBundle(page);
    assert.equal(game.title, "Título recuperado");
    assert.equal(game.players[0].name, "Nombre recuperado");
    assert.equal(game.scriptId, script);
    assert.deepEqual(game.selectedRoles.slice().sort(), selected);
    await context.close();
  }
  const context = await browser.newContext(),
    page = await context.newPage();
  page.on("dialog", (d) => d.accept());
  await page.goto(host.url);
  await seed(page);
  await page.reload();
  const mixed = await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js"),
      e = await import("/src/engine.js"),
      { createApplicationService } = await import(
        "/src/application/service.js"
      );
    const g = s.confirmedGame(),
      before = s.currentRevision(),
      app = createApplicationService();
    const outcomes = await Promise.allSettled([
      s.commit(g, (d) => e.addHistory(d, "Escritura de fachada")),
      app.dispatch({
        type: "player.notes",
        playerId: g.players[0].id,
        values: { notes: "No debe guardarse" },
      }),
    ]);
    return {
      statuses: outcomes.map((r) => r.status),
      before,
      after: s.currentRevision(),
      note: s.confirmedGame().players[0].notes,
    };
  });
  assert.deepEqual(mixed.statuses, ["fulfilled", "rejected"]);
  assert.equal(mixed.after, mixed.before + 1);
  assert.notEqual(mixed.note, "No debe guardarse");
  await page.reload();
  await page.getByRole("link", { name: "Grimorio", exact: true }).click();
  await page.evaluate(async () => {
    const { chooseDialog } = await import("/src/ui/dialogs.js");
    window.privateChoice = chooseDialog({
      title: "Decisión privada",
      message: "SECRETO-FUERA-DEL-GRIMORIO",
      choices: [{ value: "cancel", label: "Cancelar" }],
    });
  });
  await page.keyboard.press("t");
  await page.getByRole("heading", { name: "Plaza del pueblo" }).waitFor();
  assert.doesNotMatch(await page.content(), /SECRETO-FUERA-DEL-GRIMORIO/);
  assert.equal(
    (await page.evaluate(() => window.privateChoice)).choice,
    "cancel",
  );
  await page.getByRole("button", { name: "Volver a pantalla privada" }).click();
  const timerFocus = await page.evaluate(async () => {
    const { createPhaseTimer } = await import("/src/ui/phase-timer.js");
    const container = document.createElement("div");
    document.body.append(container);
    const timer = createPhaseTimer({
      notify: () => {},
      esc: String,
      render: () => {
        container.innerHTML = timer.timerMarkup();
      },
    });
    timer.startPhaseTimer(5, "Prueba de foco");
    const button = container.querySelector("button");
    button.focus();
    await new Promise((resolve) => setTimeout(resolve, 2100));
    const preserved = document.activeElement === button;
    timer.stopPhaseTimer();
    container.remove();
    return preserved;
  });
  assert.equal(
    timerFocus,
    true,
    "El contador no sustituye el botón que tiene el foco",
  );
  const recovery = await context.newPage();
  recovery.on("dialog", (d) => d.accept());
  await recovery.goto(host.url + "recuperar.html");
  await recovery
    .getByRole("heading", { name: "Cuida tus partidas." })
    .waitFor();
  await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js"),
      e = await import("/src/engine.js");
    await s.commit(s.confirmedGame(), (g) => {
      g.title = "Cambio posterior a abrir recuperación";
      e.addHistory(g, "Reciente");
    });
    localStorage.setItem("grimorio.base3.formations.v1", "[]");
    await s.draftAccess("readwrite", (store) =>
      store.put({ records: {}, damaged: [] }, "otra-pestana"),
    );
  });
  const [download] = await Promise.all([
    recovery.waitForEvent("download"),
    recovery.locator("#backup").click(),
  ]);
  const rescue = JSON.parse(await readFile(await download.path(), "utf8")),
    bundle = JSON.parse(rescue.data["grimorio.indexeddb.active"]);
  assert.equal(bundle.game.title, "Cambio posterior a abrir recuperación");
  assert.ok(bundle.undo.length);
  assert.ok(bundle.recovery.length);
  assert.ok(rescue.data["grimorio.indexeddb.drafts"].includes("otra-pestana"));
  assert.equal(rescue.data["grimorio.base3.formations.v1"], "[]");
  await page.evaluate(async () => {
    const db = await new Promise((resolve) => {
      const r = indexedDB.open("grimorio-base3-active");
      r.onsuccess = () => resolve(r.result);
    });
    await new Promise((resolve) => {
      const tx = db.transaction("state", "readwrite"),
        store = tx.objectStore("state"),
        r = store.get("active");
      r.onsuccess = () => {
        const raw = r.result;
        raw.damaged = [
          {
            kind: "original",
            raw: { secret: "Original que debe conservarse" },
          },
        ];
        raw.game.history[0].text = false;
        store.put(raw, "active");
      };
      tx.oncomplete = resolve;
    });
    db.close();
  });
  const damagedBefore = await readBundle(page);
  const stale = await page.evaluate(async () => {
    const { cleanupRecoveryData } = await import("/src/core/recovery-store.js");
    try {
      await cleanupRecoveryData({ expectedRevision: 0 });
      return false;
    } catch {
      return true;
    }
  });
  assert.equal(stale, true);
  assert.deepEqual(await readBundle(page), damagedBefore);
  const withMemory = await page.evaluate(async () => {
    const { readRescueSnapshot } = await import("/src/core/recovery-store.js");
    return readRescueSnapshot({ memoryDrafts: { unsaved: "Solo en memoria" } });
  });
  assert.ok(
    withMemory.data["grimorio.memory.drafts"].includes("Solo en memoria"),
  );
  const rescuedRaw = JSON.parse(withMemory.data["grimorio.indexeddb.active"]);
  assert.equal(rescuedRaw.game.history[0].text, false);
  assert.equal(
    rescuedRaw.damaged[0].raw.secret,
    "Original que debe conservarse",
  );
  await recovery.locator("#cleanup").click();
  await recovery
    .getByText("Datos antiguos borrados. Se conserva la partida activa.", {
      exact: true,
    })
    .waitFor();
  assert.equal((await readBundle(recovery)).game.title, bundle.game.title);
  await context.close();
  console.log(
    "PREV-01/02/03/04: borradores, concurrencia, rescates actuales y privacidad verificados.",
  );
} finally {
  if (browser) await browser.close();
  await host.close();
}
