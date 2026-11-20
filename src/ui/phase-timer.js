export function createPhaseTimer({ notify, render, esc }) {
  let phaseTimer = null;
  function startPhaseTimer(seconds, label) {
    if (!Number.isFinite(seconds) || seconds <= 0 || seconds > 86400)
      return notify(
        "Elige un tiempo válido entre 1 segundo y 24 horas.",
        "error",
      );
    if (phaseTimer) clearInterval(phaseTimer.interval);
    phaseTimer = { label, endsAt: Date.now() + seconds * 1000 };
    phaseTimer.interval = setInterval(() => {
      if (!phaseTimer || Date.now() >= phaseTimer.endsAt) {
        if (phaseTimer) {
          clearInterval(phaseTimer.interval);
          phaseTimer = { label: "Tiempo terminado", endsAt: Date.now() };
          notify("Temporizador terminado", "error");
        }
      }
      document.querySelectorAll(".phase-timer").forEach((element) => {
        const remaining = Math.max(
          0,
          Math.ceil((phaseTimer.endsAt - Date.now()) / 1000),
        );
        element.querySelector("span").textContent = phaseTimer.label;
        element.querySelector("b").textContent =
          `${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}`;
      });
    }, 1000);
    render();
  }

  function stopPhaseTimer() {
    if (phaseTimer) clearInterval(phaseTimer.interval);
    phaseTimer = null;
    render();
  }

  function timerMarkup() {
    if (!phaseTimer) return "";
    const remaining = Math.max(
      0,
      Math.ceil((phaseTimer.endsAt - Date.now()) / 1000),
    );
    return `<div class="phase-timer"><span>${esc(phaseTimer.label)}</span><b>${String(Math.floor(remaining / 60)).padStart(2, "0")}:${String(remaining % 60).padStart(2, "0")}</b><button class="text-btn" data-action="timer-stop">Detener</button></div>`;
  }

  return { startPhaseTimer, stopPhaseTimer, timerMarkup };
}
