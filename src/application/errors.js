export class ApplicationError extends Error {
  constructor(code, message, cause) {
    super(message, { cause });
    this.name = "ApplicationError";
    this.code = code;
  }
}
export function applicationError(error) {
  if (error instanceof ApplicationError) return error;
  const message = error?.message || "No se pudo completar la acción.";
  const code =
    error?.name === "QuotaExceededError"
      ? "QUOTA"
      : /otra pestaña|partida cambió|partida activa ha cambiado/.test(message)
        ? "CONFLICT"
        : /dañad|Almacén/.test(message)
          ? "CORRUPT"
          : /cancelad/i.test(message)
            ? "CANCELLED"
            : "VALIDATION";
  return new ApplicationError(code, message, error);
}
