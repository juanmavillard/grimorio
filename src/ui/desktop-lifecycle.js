import { exporting, isDesktop, saveJson } from "./platform.js";
export function installDesktopLifecycle({
  busy = () => false,
  flush = async () => {},
  rescue = () => ({}),
} = {}) {
  if (!isDesktop()) return;
  let preparing = false;
  globalThis.grimorioDesktop.onLifecycle(async (request) => {
    if (preparing) return;
    preparing = true;
    try {
      if (request.kind === "export") {
        const result = await saveJson(
          await rescue(),
          `grimorio-rescate-${new Date().toISOString().slice(0, 10)}.json`,
        );
        globalThis.grimorioDesktop.lifecycleResult({
          token: request.token,
          ready: result.status === "saved",
        });
      } else {
        document.body.dataset.desktopClosing = "true";
        const deadline = Date.now() + 20000;
        while (busy() || exporting()) {
          if (Date.now() > deadline)
            throw new Error(
              "Hay una operación sin terminar. Espera o cancela el cierre.",
            );
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
        await flush();
        globalThis.grimorioDesktop.lifecycleResult({
          token: request.token,
          ready: true,
        });
      }
    } catch (error) {
      globalThis.grimorioDesktop.lifecycleResult({
        token: request.token,
        ready: false,
        error: error.message,
      });
    } finally {
      delete document.body.dataset.desktopClosing;
      preparing = false;
    }
  });
}
