export function renderPublicSquare(town, esc) {
  const nominee = town.nomination?.nomineeId
    ? town.players.find((player) => player.id === town.nomination.nomineeId)
    : null;
  return `<main class="private-overlay public-overlay" aria-labelledby="town-title"><div class="overlay-head"><div><p class="eyebrow">Pantalla pública</p><h1 id="town-title">Plaza del pueblo</h1><p>Día/noche ${town.round} · ${town.phase === "night" ? "noche" : town.phase === "day" ? "día" : "partida terminada"}</p></div><button class="primary" data-action="hide-overlay">Volver a pantalla privada</button></div><div class="town-grid">${town.players.map((p) => `<article class="${p.alive ? "" : "dead"}"><span>${p.seat + 1}</span><h2>${esc(p.name)}</h2><p>${p.alive ? "VIVO" : "MUERTO"}${!p.alive ? ` · ${p.ghostVote ? "voto disponible" : "voto gastado"}` : ""}</p></article>`).join("")}</div>${town.nomination ? `<section class="public-status"><h2>${nominee ? `${esc(nominee.name)} está en la picota` : town.nomination.tied ? "Hay empate" : "Nadie está en la picota"}</h2><p>${town.nomination.votes} votos · umbral ${town.nomination.threshold}</p></section>` : ""}</main>`;
}
