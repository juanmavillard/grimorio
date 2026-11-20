import { open, rename, unlink } from "node:fs/promises";
import { dirname, basename, join } from "node:path";
import { randomUUID } from "node:crypto";
import { exportRequest } from "./security.js";

export async function saveExport(
  value,
  choosePath,
  io = { open, rename, unlink },
) {
  const { json, filename } = exportRequest(value);
  const target = await choosePath(filename);
  if (!target) return { status: "cancelled" };
  const temporary = join(
    dirname(target),
    `.${basename(target)}-${randomUUID()}.tmp`,
  );
  let handle;
  try {
    handle = await io.open(temporary, "wx", 0o600);
    await handle.writeFile(json, "utf8");
    await handle.sync();
    await handle.close();
    handle = null;
    await io.rename(temporary, target);
    return { status: "saved" };
  } catch (error) {
    if (handle) await handle.close().catch(() => {});
    await io.unlink(temporary).catch(() => {});
    return {
      status: "error",
      message:
        error.code === "ENOSPC"
          ? "No hay espacio en el disco. La copia anterior se conserva."
          : "No se pudo guardar el archivo. Comprueba el espacio y los permisos.",
    };
  }
}
