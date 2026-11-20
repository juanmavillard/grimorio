export function createHelpMarkup({ esc, helpForRole }) {
  function helpButton(query, label = "Ver ayuda") {
    return `<button class="help-link" data-action="open-help-query" data-query="${esc(query)}">? ${esc(label)}</button>`;
  }

  function characterHelpMarkup(roleId, compact = false) {
    const help = helpForRole(roleId);
    if (!help) return "";
    if (compact)
      return `<div class="role-help-brief"><b>${esc(help.title)}</b><p>${esc(help.summary)}</p>${helpButton(help.title, "Abrir ficha completa")}</div>`;
    return `<article class="help-card character-help ${help.team}"><header><span class="formation-source">Personaje</span><h3>${esc(help.title)}</h3><p>${esc(help.summary)}</p></header>
    <details><summary>Cómo dirigirlo</summary><p>${esc(help.guide)}</p></details>
    <details><summary>Información y habilidad</summary><p><b>Con habilidad:</b> ${esc(help.truth)}</p><p><b>Sin habilidad:</b> ${esc(help.inactive)}</p></details>
    <details><summary>Interacciones</summary><ul>${help.interactions.map((item) => `<li>${esc(item)}</li>`).join("")}</ul></details>
    <details><summary>Ejemplo y error habitual</summary><p><b>Ejemplo:</b> ${esc(help.example)}</p><p><b>Evita:</b> ${esc(help.mistake)}</p></details>
    <p class="help-source"><a href="${help.source}" target="_blank" rel="noreferrer">Fuente oficial ↗</a><span> · ${help.auditStatus === "stable" ? "Ficha estable" : "En auditoría: no automatizar"}</span></p>
  </article>`;
  }

  function ruleHelpMarkup(rule) {
    return `<article class="help-card rule-help"><header><span class="formation-source">Regla</span><h3>${esc(rule.title)}</h3><p>${esc(rule.summary)}</p></header><details><summary>Detalle para el Narrador</summary><p>${esc(rule.detail)}</p></details><p class="help-source"><a href="${rule.source}" target="_blank" rel="noreferrer">Fuente oficial ↗</a></p></article>`;
  }

  return { helpButton, characterHelpMarkup, ruleHelpMarkup };
}
