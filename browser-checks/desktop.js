import assert from "node:assert/strict";
import { _electron as electron } from "playwright";
import { mkdtemp, rm, readFile, rename } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawn } from "node:child_process";
const { version } = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const packaged = process.argv.includes("--packaged"),
  profile = await mkdtemp(join(tmpdir(), "grimorio-desktop-profile-")),
  files = await mkdtemp(join(tmpdir(), "grimorio-desktop-files-"));
let executable = packaged
  ? process.platform === "darwin"
    ? resolve(
        "dist/mac-universal/Grimorio Base 3.app/Contents/MacOS/Grimorio Base 3",
      )
    : resolve(`dist/Grimorio-Base3-${version}-Windows.exe`)
  : undefined;
let movedBundle;
const env = { ...process.env, GRIMORIO_DESKTOP_TEST_PROFILE: profile };
delete env.ELECTRON_RUN_AS_NODE;
let app, page;
const errors = [];
async function launch() {
  app = await electron.launch({
    args: packaged ? [] : ["."],
    ...(executable ? { executablePath: executable } : {}),
    env,
    timeout: 30000,
  });
  page = await app.firstWindow();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.waitForSelector("#app > *, #result");
}
async function read() {
  return page.evaluate(async () => {
    const s = await import("/src/core/active-store.js");
    return s.confirmedGame();
  });
}
async function chooser(path) {
  await app.evaluate(({ dialog }, path) => {
    dialog.showSaveDialog = async () =>
      path ? { canceled: false, filePath: path } : { canceled: true };
  }, path);
}
try {
  await launch();
  await page.getByRole("heading", { name: "Prepara la aldea." }).waitFor();
  assert.equal(new URL(page.url()).protocol, "grimorio:");
  assert.equal(await page.evaluate(() => typeof window.require), "undefined");
  assert.equal(
    await page.evaluate(() => navigator.serviceWorker?.controller || null),
    null,
  );
  const beforePid = app.process().pid;
  const binary = await app.evaluate(({ app }) => app.getPath("exe"));
  const second = spawn(binary, packaged ? [] : ["."], { env, stdio: "ignore" });
  await new Promise((ok, fail) => {
    second.on("error", fail);
    second.on("exit", (code) =>
      code === 0 ? ok() : fail(Error("Segunda instancia: " + code)),
    );
  });
  assert.equal(app.process().pid, beforePid);
  // Preparación real, reparto privado y primera noche de Trouble Brewing.
  await page
    .getByRole("button", { name: "Crear partida →", exact: true })
    .click();
  await page.getByRole("heading", { name: "Coloca las fichas." }).waitFor();
  await page.locator("#assign-drunk").selectOption("soldier");
  const available = await page
    .locator(".assign-bluff")
    .first()
    .locator("option")
    .evaluateAll((opts) =>
      opts.map((x) => x.value).filter((x) => x !== "soldier"),
    );
  for (let i = 0; i < 3; i++)
    await page.locator(".assign-bluff").nth(i).selectOption(available[i]);
  await page
    .getByRole("button", { name: "Confirmar y repartir →", exact: true })
    .click();
  for (let i = 0; i < 8; i++) {
    await page
      .getByRole("button", { name: "Ver mi personaje", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Ocultar y pasar", exact: true })
      .click();
  }
  await page.getByRole("heading", { name: "Noche 1" }).first().waitFor();
  await page
    .getByRole("button", { name: "Cerrar los ojos y empezar →", exact: true })
    .click();
  for (let i = 0; i < 4; i++)
    await page
      .getByRole("button", { name: "Registrar y seguir →", exact: true })
      .click();
  const game = await read();
  const demon = game.players.find((p) => p.character === "imp"),
    chef = game.players.find((p) => p.character === "chef");
  await page.locator("#info-player-a").selectOption(demon.id);
  await page.locator("#info-player-b").selectOption(chef.id);
  await page.locator("#info-value").selectOption("yes");
  await page
    .getByRole("button", { name: "Registrar y seguir →", exact: true })
    .click();
  await page
    .getByRole("button", {
      name: "Abrir los ojos · comenzar día 1",
      exact: true,
    })
    .click();
  for (const scriptId of [
    "trouble_brewing",
    "bad_moon_rising",
    "sects_and_violets",
  ]) {
    if (scriptId !== "trouble_brewing") {
      await page.evaluate(async (scriptId) => {
        const e = await import("/src/engine.js"),
          s = await import("/src/core/active-store.js");
        const g = e.createGame(
          Array.from({ length: 8 }, (_, i) => `Persona ${i + 1}`),
          e.randomRoleSet(8, () => 0.99, scriptId),
          { scriptId, random: () => 0.99 },
        );
        e.beginNight(g);
        await s.importGame(g);
      }, scriptId);
      await page.goto("grimorio://app/");
      await page
        .getByRole("button", {
          name: "Cerrar los ojos y empezar →",
          exact: true,
        })
        .click();
    }
    console.log("Verificando escritorio:", scriptId);
    await page.getByRole("link", { name: "Ayuda", exact: true }).click();
    await page
      .locator("#help-search")
      .fill(
        scriptId === "bad_moon_rising"
          ? "Pukka"
          : scriptId === "sects_and_violets"
            ? "Vortox"
            : "Adivina",
      );
    await page.getByRole("link", { name: "Grimorio", exact: true }).click();
    await page
      .getByRole("button", { name: "Plaza pública", exact: true })
      .click();
    assert.doesNotMatch(
      await page.locator("body").innerText(),
      /Diablillo|Pukka|Vortox|Envenenador|señuelo/i,
    );
    await page
      .getByRole("button", { name: "Volver a pantalla privada", exact: true })
      .click();
    await page.locator("[data-player]").first().click();
    await page.locator("#edit-notes").fill("Nota de escritorio " + scriptId);
    await page
      .getByRole("button", { name: "Guardar notas", exact: true })
      .click();
    await page.getByRole("button", { name: "Deshacer", exact: true }).click();
    await page.getByRole("button", { name: "Rehacer", exact: true }).click();
    await page.getByRole("link", { name: "Partidas", exact: true }).click();
    const previous = await read();
    await chooser(null);
    await page
      .getByRole("button", { name: "Descargar partida actual", exact: true })
      .click();
    assert.deepEqual(await read(), previous);
    const path = join(files, scriptId + ".json");
    await chooser(path);
    await page
      .getByRole("button", { name: "Descargar partida actual", exact: true })
      .click();
    await page.getByText("Copia guardada", { exact: true }).waitFor();
    assert.deepEqual(JSON.parse(await readFile(path, "utf8")), previous);
    await page.locator("#import-file").setInputFiles({
      name: "invalida.json",
      mimeType: "application/json",
      buffer: Buffer.from("{"),
    });
    await page.locator("#toast.error").waitFor();
    assert.deepEqual(await read(), previous);
    await page.locator("#import-file").setInputFiles(path);
    await page
      .getByRole("dialog", { name: "Sustituir la partida activa" })
      .getByRole("button", { name: "Continuar sin guardar", exact: true })
      .click();
    await page
      .getByText("Partida importada", { exact: false })
      .first()
      .waitFor();
  }
  // Fallos de disco/IndexedDB: conservar la partida y permitir reintentar.
  await page.getByRole("link", { name: "Partidas", exact: true }).click();
  const beforeFailure = await read();
  await chooser(join(files, "no-existe", "partida.json"));
  await page
    .getByRole("button", { name: "Descargar partida actual", exact: true })
    .click();
  await page
    .getByText("No se pudo guardar el archivo.", { exact: false })
    .first()
    .waitFor();
  assert.deepEqual(await read(), beforeFailure);
  await page.getByRole("link", { name: "Grimorio", exact: true }).click();
  await page.locator("[data-player]").first().click();
  await page.locator("#edit-notes").fill("Esta acción no debe confirmarse");
  await page.evaluate(() => {
    window.originalPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "state")
        throw new DOMException("Cuota simulada", "QuotaExceededError");
      return window.originalPut.apply(this, args);
    };
  });
  await page
    .getByRole("button", { name: "Guardar notas", exact: true })
    .click();
  await page.locator('.save-indicator[data-state="error"]').waitFor();
  assert.deepEqual(await read(), beforeFailure);
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = window.originalPut;
  });
  await page.locator('#player-dialog button[value="cancel"]').last().click();
  // Si el borrador no cabe, cerrar debe permitir cancelar sin perderlo en memoria.
  await page.locator("[data-player]").first().click();
  await page.evaluate(() => {
    window.originalDraftPut = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "drafts")
        throw new DOMException("Cuota del borrador", "QuotaExceededError");
      return window.originalDraftPut.apply(this, args);
    };
  });
  await page.locator("#edit-notes").fill("Borrador todavía sin guardar");
  await app.evaluate(({ dialog, BrowserWindow }) => {
    globalThis.closeWarning = null;
    dialog.showMessageBox = async (_window, options) => {
      globalThis.closeWarning = options.message;
      return { response: 2 };
    };
    BrowserWindow.getAllWindows()[0].close();
  });
  assert.equal(
    await app.evaluate(async () => {
      for (let i = 0; i < 100 && globalThis.closeWarning === null; i++)
        await new Promise((r) => setTimeout(r, 20));
      return globalThis.closeWarning;
    }),
    "No se ha confirmado el guardado.",
  );
  await page.waitForFunction(() => !document.body.dataset.desktopClosing);
  assert.equal(
    await page.locator("#edit-notes").inputValue(),
    "Borrador todavía sin guardar",
  );
  await page.evaluate(() => {
    IDBObjectStore.prototype.put = window.originalDraftPut;
  });
  await page.locator('#player-dialog button[value="cancel"]').last().click();
  await page.getByRole("link", { name: "Diagnóstico", exact: true }).click();
  assert.match(
    await page.locator("main").innerText(),
    new RegExp(`Aplicación ${version.replaceAll(".", "\\.")}.*formato 4`),
  );
  await page.getByRole("link", { name: "Partidas", exact: true }).click();
  await page.getByRole("link", { name: "Abrir recuperación →" }).click();
  await page.getByRole("heading", { name: "Cuida tus partidas." }).waitFor();
  await chooser(join(files, "rescate.json"));
  await page.locator("#backup").click();
  await page.getByText("Copia guardada.", { exact: true }).waitFor();
  assert.equal(
    JSON.parse(await readFile(join(files, "rescate.json"), "utf8")).format,
    "grimorio-rescate",
  );
  await page.getByRole("link", { name: "Volver al Grimorio ←" }).click();
  await page.getByRole("link", { name: "Grimorio", exact: true }).click();
  await page.locator("[data-player]").first().click();
  await page.locator("#edit-notes").fill("Borrador al cerrar la aplicación");
  const closingRescue = join(files, "rescate-del-cierre.json");
  await chooser(closingRescue);
  await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows()[0].webContents.send("grimorio:lifecycle", {
      token: "prueba-rescate-cierre",
      kind: "export",
    }),
  );
  let closingData;
  for (let attempt = 0; attempt < 100 && !closingData; attempt++) {
    try {
      closingData = JSON.parse(await readFile(closingRescue, "utf8"));
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }
  assert.equal(closingData.format, "grimorio-rescate");
  const closingState = JSON.parse(
    closingData.data["grimorio.indexeddb.active"],
  );
  assert.ok(Array.isArray(closingState.undo));
  assert.ok(Array.isArray(closingState.recovery));
  assert.ok(
    closingData.data["grimorio.memory.drafts"].includes(
      "Borrador al cerrar la aplicación",
    ),
  );
  const saved = await read();
  await app.close();
  app = null;
  await launch();
  await page.getByRole("link", { name: "Grimorio", exact: true }).click();
  await page.locator("#edit-notes").waitFor();
  assert.equal(
    await page.locator("#edit-notes").inputValue(),
    "Borrador al cerrar la aplicación",
  );
  assert.deepEqual(await read(), saved);
  // Cerrar mientras la confirmación de una escritura aún está pendiente.
  await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(
      IDBTransaction.prototype,
      "oncomplete",
    );
    Object.defineProperty(IDBTransaction.prototype, "oncomplete", {
      ...descriptor,
      set(callback) {
        descriptor.set.call(this, function (event) {
          setTimeout(() => callback.call(this, event), 400);
        });
      },
    });
  });
  await page.locator("#edit-notes").fill("Nota confirmada antes de salir");
  await page
    .getByRole("button", { name: "Guardar notas", exact: true })
    .click();
  await app.close();
  app = null;
  if (packaged && process.platform === "darwin") {
    const original = resolve("dist/mac-universal/Grimorio Base 3.app"),
      moved = join(files, "Grimorio Movido.app");
    await rename(original, moved);
    movedBundle = { original, moved };
    executable = join(moved, "Contents/MacOS/Grimorio Base 3");
  }
  await launch();
  assert.equal(
    (await read()).players[0].notes,
    "Nota confirmada antes de salir",
  );
  // Cierre forzado: al reabrir no se pierde el último estado confirmado.
  const child = app.process();
  const exited = new Promise((ok) => child.once("exit", ok));
  child.kill("SIGKILL");
  await exited;
  app = null;
  await launch();
  assert.equal(
    (await read()).players[0].notes,
    "Nota confirmada antes de salir",
  );
  await app.close();
  app = null;
  assert.deepEqual(errors, []);
  console.log(
    `Escritorio ${packaged ? "empaquetado" : "desarrollo"} ${process.platform}/${process.arch}: tres guiones, reparto, archivos, privacidad, instancia única, cierre y recuperación correctos.`,
  );
} finally {
  if (app) await app.close().catch(() => {});
  if (movedBundle) await rename(movedBundle.moved, movedBundle.original);
  await rm(profile, { recursive: true, force: true });
  await rm(files, { recursive: true, force: true });
}
