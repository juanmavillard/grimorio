let runtime = { kind: "web" };
let pendingExports = 0;
export const isDesktop = () => Boolean(globalThis.grimorioDesktop);
export const runtimeInfo = () => runtime;
export const exporting = () => pendingExports > 0;
export async function initializePlatform() {
  if (isDesktop()) {
    runtime = await globalThis.grimorioDesktop.runtime();
    sessionStorage.setItem("grimorio.tab", "desktop-main");
  }
  return runtime;
}
export async function saveJson(payload, filename) {
  pendingExports++;
  try {
    const json = JSON.stringify(payload, null, 2);
    if (isDesktop()) {
      const result = await globalThis.grimorioDesktop.saveJson({
        json,
        filename,
      });
      if (result.status === "error")
        throw new Error(result.message || "No se pudo guardar la copia.");
      return result;
    }
    const blob = new Blob([json], { type: "application/json" }),
      url = URL.createObjectURL(blob),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    return { status: "requested" };
  } finally {
    pendingExports--;
  }
}
