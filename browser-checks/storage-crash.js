import { createAppServer } from "./harness.js";
import assert from "node:assert/strict";

import { mkdtemp, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { chromium } from "playwright";
import { execFileSync } from "node:child_process";

resolve(process.cwd());
const profile = await mkdtemp(join(tmpdir(), "grimorio-crash-"));
const server = createAppServer();
let context;
try {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = `http://127.0.0.1:${server.address().port}/`;
  context = await chromium.launchPersistentContext(profile, { headless: true });
  const page = context.pages()[0] || (await context.newPage());
  await page.goto(url);
  const original = await page.evaluate(async () => {
    const s = await import("/src/core/active-store.js"),
      e = await import("/src/engine.js");
    const names = Array.from({ length: 8 }, (_, i) => `Jugador ${i + 1}`);
    const roles = [
      "washerwoman",
      "chef",
      "empath",
      "fortune_teller",
      "monk",
      "butler",
      "poisoner",
      "imp",
    ];
    const game = e.createGame(names, roles, {
      random: () => 0.99,
      title: "Estado confirmado",
    });
    await s.openActiveStore();
    await s.saveGame(game);
    return { id: game.id, title: game.title, history: game.history.length };
  });
  const writeStarted = new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new Error("No comenzó la escritura interrumpida.")),
      8000,
    );
    page.on("console", (message) => {
      if (message.text() === "GRIMORIO_PUT_INICIADO") {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
  const pending = page
    .evaluate(async () => {
      const s = await import("/src/core/active-store.js");
      const e = await import("/src/engine.js");
      const game = await s.openActiveStore();
      const originalPut = IDBObjectStore.prototype.put;
      IDBObjectStore.prototype.put = function (...args) {
        const result = originalPut.apply(this, args);
        console.log("GRIMORIO_PUT_INICIADO");
        // Impide que termine el callback y se confirme la transacción antes del cierre.
        const until = Date.now() + 15000;
        while (Date.now() < until) {}
        return result;
      };
      await s.commit(game, (d) => {
        d.title = "Acción en curso";
        e.addHistory(d, "Acción en curso");
      });
    })
    .catch(() => {});
  await writeStarted;
  const lines = execFileSync("ps", ["-axo", "pid=,command="], {
    encoding: "utf8",
  }).split("\n");
  const main = lines
    .map((line) => line.trim().match(/^(\d+)\s+(.*)$/))
    .find(
      (match) =>
        match &&
        match[2].includes(`--user-data-dir=${profile}`) &&
        !match[2].includes("--type="),
    );
  assert.ok(
    main,
    "Debe encontrarse el proceso del navegador de prueba con su perfil temporal.",
  );
  process.kill(Number(main[1]), "SIGKILL");
  await pending;
  await context.close().catch(() => {});
  context = null;
  context = await chromium.launchPersistentContext(profile, { headless: true });
  const reopened = context.pages()[0] || (await context.newPage());
  await reopened.goto(url);
  const recovered = await reopened.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    const game = await s.openActiveStore();
    return {
      id: game?.id,
      title: game?.title,
      history: game?.history?.length,
      first: game?.history?.[0]?.text,
    };
  });
  assert.equal(recovered.id, original.id);
  assert.equal(
    recovered.title,
    original.title,
    "Una transacción interrumpida antes de confirmarse no debe modificar la partida.",
  );
  assert.equal(recovered.history, original.history);
  console.log(
    `Cierre inesperado real de Chromium: partida íntegra recuperada (${recovered.title}).`,
  );
} finally {
  if (context) await context.close().catch(() => {});
  await new Promise((r) => server.close(r));
  await rm(profile, { recursive: true, force: true });
}
