// Utilidades sin dependencias del motor, DOM o almacenamiento.
export const uid = () =>
  globalThis.crypto?.randomUUID?.() ||
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;
export const clone = (value) => structuredClone(value);
