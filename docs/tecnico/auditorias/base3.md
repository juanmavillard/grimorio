# Auditoría transversal · Base 3

## Resultado

Los tres guiones Base 3 están disponibles como asistentes guiados privados: Trouble Brewing, Bad Moon Rising y Sects & Violets. Preparación, reparto, Grimorio, conducción de día/noche, historial, recuperación, exportación, ayuda y Plaza pública comparten el mismo contrato; las pruebas verifican las reglas mecánicas que cubren, no todas las combinaciones posibles.

No significa que el programa sustituya al Narrador. Información falsa, registros, sanciones por locura, objetivos elegidos por el Narrador y casos deliberadamente arbitrarios siempre se presentan como una decisión privada y explicable.

## Matriz de comprobación

| Sistema | Trouble Brewing | Bad Moon Rising | Sects & Violets |
| --- | --- | --- | --- |
| Catálogo y composición 5–15 | Sí, incluido Barón | Sí, incluido Padrino | Sí, incluido Fang Gu y Vigormortis |
| Primera noche y orden guiado | Sí | Sí | Sí |
| Estados y muertes | Veneno, protección, cambios de Demonio | Causas, supervivencias, muertes múltiples | Veneno, cambios, efectos pendientes |
| Día, votos y victoria | Sí | Sí, incluido Mente Maestra | Sí, incluido Bruja, Gemelo y Vortox |
| Ayuda y manuales | 22 fichas | 25 fichas | 25 fichas |
| Persistencia y migración | Sí | Sí | Sí |
| Plaza pública sin secretos | Sí | Sí | Sí |

## Revisión reglamentaria reciente

- No Dashii y Vigormortis localizan al Aldeano más cercano en cada sentido, saltando otros equipos e incluyendo muertos cuando corresponde.
- Fang Gu solo salta cuando mata realmente a su primer Forastero.
- Filósofo y Cerenovus pueden seleccionar personajes buenos, incluidos Forasteros; el Filósofo despierta con la habilidad ganada cuando esa habilidad actúa de noche.
- Soñador no puede elegir a sí mismo; Pit-Hag que elige un personaje ya presente no produce cambio.
- Enamoradizo, Barbero y Sabio Ermitaño son disparadores de muerte, no despertares nocturnos ordinarios; Costurera y Malabarista respetan sus usos temporales.
- El panel privado permite resolver Enamoradizo, Barbero, Sabio Ermitaño, Patoso y la elección vecinal de Vigormortis; Sabio, Artista y Malabarista tienen controles diurnos propios.
- Si Pit-Hag crea varios Demonios, el Bien solo gana cuando no queda ningún Demonio vivo.
- Los cambios de personaje crean avisos privados, reinician los usos del personaje nuevo y las noches de creación de Demonio permiten elegir libremente las muertes de Pit-Hag.
- Los personajes muertos normales no reaparecen en noches futuras; se mantienen las excepciones reglamentarias y los pasos ya completados de la noche actual.
- El amanecer usa los eventos de muerte nocturna y el registro especial de Zombuul, no solo ataques demoníacos. Los usos opcionales de Cortesano, Profesor, Asesino y Costurera pueden esperar.
- Las decisiones pendientes se bloquean según el momento; Patoso espera al día cuando muere de noche. Una validación rechazada no modifica las pilas de deshacer ni rehacer.
- Po conserva la carga aunque elija a nadie estando ebrio o envenenado y, en su siguiente actuación, debe elegir tres jugadores.
- El Filósofo puede esperar para elegir; su personaje elegido también queda ebrio si entra en juego más adelante. El aviso de Encantador identifica correctamente al Filósofo cuando intercambia su personaje.
- Un paso nocturno ya registrado se consulta sin volver a aplicar su efecto; la interfaz exige revisar los pasos anteriores antes de avanzar al amanecer.

## Puerta de calidad

`npm run check` valida sintaxis, los documentos Markdown y sus enlaces locales, que los tres almanaques coincidan con la ayuda estructurada, el grafo offline de recursos y la suite de reglas. La suite incluye un recorrido transversal que crea una partida legal de cada guion, entra en su primera noche, restaura la partida serializada y comprueba que la Plaza no contiene datos secretos.

La apertura y el acceso a Ayuda se han comprobado en navegador. Siguen pendientes recorridos completos de interfaz para cada guion, comprobación real de instalación y uso sin conexión y pruebas responsive; el análisis del grafo offline no sustituye esas pruebas.

Fuentes reglamentarias: [Trouble Brewing](https://wiki.bloodontheclocktower.com/Trouble_Brewing), [Bad Moon Rising](https://wiki.bloodontheclocktower.com/Bad_Moon_Rising) y [Sects & Violets](https://wiki.bloodontheclocktower.com/Sects_%26_Violets).
