import { clone, uid } from "./utils.js";

export function addHistory(state, text, detail = "", event = {}) {
  const record = {
    id: uid(),
    at: new Date().toISOString(),
    phase: state.phase,
    round: state.round,
    text,
    detail,
    event: {
      action: event.action || "note",
      actorId: event.actorId || null,
      targetId: event.targetId || null,
      automatic: Boolean(event.automatic),
      rule: event.rule || null,
      before: event.before ?? null,
      after: event.after ?? null,
    },
  };
  state.history.unshift(record);
  (state.events ||= []).unshift(clone(record));
  state.updatedAt = new Date().toISOString();
}
