// El guion utiliza la preparación común sin decisiones adicionales automatizadas.
export function validateDecisions({ decisions }) {
  return decisions.drunkBelief
    ? ["No debe configurarse personaje aparente si no hay Borracho."]
    : [];
}
