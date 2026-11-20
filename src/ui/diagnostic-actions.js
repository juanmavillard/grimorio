export async function handleDiagnosticAction(
  action,
  target,
  { game, diagnoseGame, diagnosticPayload, downloadJson, notify, dispatch },
) {
  if (action === "export-diagnostics") {
    const anonymous =
      document.querySelector("#diagnostic-anonymous")?.checked !== false;
    const result = await downloadJson(
      diagnosticPayload(game, diagnoseGame(game), !anonymous),
      `diagnostico-${game.scriptId}-${new Date().toISOString().slice(0, 10)}.json`,
    );
    if (result.status !== "cancelled")
      notify(
        anonymous
          ? "Diagnóstico sin nombres preparado"
          : "Diagnóstico preparado",
      );
    return;
  }
  if (action === "apply-diagnostic-fix") {
    const issues = diagnoseGame(game);
    const issue = issues.find((item) => item.fixId === target.dataset.fix);
    if (
      !issue ||
      !confirm(
        `¿Aplicar esta corrección?\n\n${issue.title}\n${issue.detail}\n\nQuedará registrada en el historial y podrás deshacerla.`,
      )
    )
      return;
    await dispatch(
      { type: "diagnostic.fix", fixId: target.dataset.fix },
      "Corrección aplicada",
    );
    return;
  }
}
