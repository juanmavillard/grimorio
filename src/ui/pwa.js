import { RELEASE } from "../release.js";
import { isDesktop } from "./platform.js";
export async function initializePwa({ canUpdate, available, notify }) {
  if (isDesktop()) {
    document.documentElement.dataset.release = RELEASE.version;
    return {
      update: () =>
        notify(
          "Para actualizar, cierra el Grimorio y sustituye la aplicación por la versión nueva.",
        ),
    };
  }
  if (!("serviceWorker" in navigator))
    return {
      update: () =>
        notify(
          "Este navegador no permite instalar la versión offline.",
          "error",
        ),
    };
  document.documentElement.dataset.release = RELEASE.version;
  const initialController = navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("message", (event) => {
    if (event.data?.type === "UPDATE_READY")
      event.ports[0]?.postMessage({
        ready: canUpdate(),
        version: RELEASE.version,
      });
    if (event.data?.type === "CLIENT_RELEASE")
      event.ports[0]?.postMessage({ version: RELEASE.version });
  });
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (
      initialController &&
      navigator.serviceWorker.controller !== initialController &&
      !reloading
    ) {
      reloading = true;
      location.reload();
    }
  });
  try {
    const registration = await navigator.serviceWorker.register("sw.js", {
      updateViaCache: "none",
    });
    if (registration.waiting) available();
    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      worker?.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller)
          available();
      });
    });
    navigator.serviceWorker.ready.then(() =>
      navigator.serviceWorker.controller?.postMessage({
        type: "PRUNE_RELEASES",
      }),
    );
    return {
      update: async () => {
        if (!registration.waiting) {
          await registration.update();
          notify("Se está comprobando si hay una versión nueva.");
          return;
        }
        if (!canUpdate())
          return notify(
            "Termina la operación y revisa o descarta los borradores antes de actualizar.",
            "error",
          );
        const channel = new MessageChannel();
        const response = await new Promise((resolve) => {
          const timeout = setTimeout(
            () =>
              resolve({
                ok: false,
                message:
                  "Otra pestaña no ha respondido. Ciérrala o inténtalo de nuevo.",
              }),
            7000,
          );
          channel.port1.onmessage = (event) => {
            clearTimeout(timeout);
            channel.port1.close();
            resolve(event.data);
          };
          registration.waiting.postMessage({ type: "REQUEST_UPDATE" }, [
            channel.port2,
          ]);
        });
        if (!response.ok) notify(response.message, "error");
      },
    };
  } catch (error) {
    notify(
      `No se pudo preparar la instalación offline: ${error.message}`,
      "error",
    );
    return { update: () => location.reload() };
  }
}
export const effectiveVersion = RELEASE.version;
