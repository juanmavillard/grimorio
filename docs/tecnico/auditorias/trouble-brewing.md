# Auditoría reglamentaria de Trouble Brewing

Última revisión parcial: 31 de octubre de 2026.

Esta auditoría compara el motor y la interfaz con el texto de habilidad y la sección **How to Run** del wiki oficial. La autoridad principal es The Pandemonium Institute; las traducciones comunitarias se usan solo como apoyo terminológico. **La comprobación integral de las interacciones y de todos los recorridos de interfaz sigue pendiente**; la tabla es un inventario de comportamientos revisados, no una certificación de todos los casos.

## Reglas generales verificadas

- Composición oficial para 5–15 jugadores, con un único Demonio y ajuste de `+2 Forasteros` del Barón.
- En partidas de 5–6 no se da información de Esbirros/Demonio ni tres bluffs; Toymaker no está incluido.
- En 7+ los Esbirros conocen al Demonio y a los demás Esbirros; el Demonio conoce Esbirros y tres personajes buenos no jugados.
- El círculo mantiene un orden horario fijo. Los vecinos vivos omiten muertos.
- La muerte elimina inmediatamente la habilidad y sus efectos persistentes, salvo texto que funcione al morir o incluso muerto.
- Borrachera y veneno eliminan la habilidad, pero el Narrador mantiene la simulación y puede dar información verdadera o falsa.
- Un personaje que cambia conserva estados como veneno; los efectos producidos por la habilidad que perdió terminan inmediatamente.
- Cada vivo puede nominar una vez al día y cada jugador puede ser nominado una vez. Los muertos no nominan.
- Los vivos votan cuantas veces quieran; cada muerto conserva un único voto para el resto de la partida.
- Una votación solo pone a alguien en la picota si alcanza al menos la mitad de vivos, redondeada hacia arriba, y supera a los demás. El empate deja a nadie en la picota.
- El orden de voto empieza después del nominado y termina en el nominado.
- Bien gana cuando muere el Demonio; Mal gana cuando quedan dos vivos. Se resuelve primero la condición que sucede primero.

## Personajes

| Personaje | Comportamiento comprobado |
|---|---|
| Lavandera | Primera noche; dos jugadores distintos; uno puede registrar como el Aldeano mostrado. El Espía sano puede cubrir ese registro. |
| Bibliotecario | Primera noche; Forastero verdadero o Espía registrado; puede mostrar `0` únicamente si no hay Forasteros reales. El Borracho se muestra como Borracho. |
| Investigador | Primera noche; Esbirro verdadero o Recluso registrado como el Esbirro mostrado. |
| Chef | Cuenta bordes malvado–malvado del círculo. Espía y Recluso pueden registrar de forma diferente en parejas distintas. |
| Empática | Actúa cada noche después del Demonio y usa sus dos vecinos vivos actuales. Registros de Espía/Recluso se validan. |
| Adivina | Elige dos jugadores distintos, vivos o muertos, incluso a sí misma. Detecta Demonio muerto y señuelo rojo; el Recluso sano puede registrar como Demonio. |
| Enterrador | No actúa la primera noche. Solo recibe información si alguien murió por ejecución; ve Borracho real y permite registros de Espía/Recluso. |
| Monje | Cada noche salvo la primera elige a otro jugador, vivo o muerto. La protección bloquea el ataque del Demonio, termina al amanecer y termina inmediatamente si el Monje pierde la habilidad. |
| Guardián de Cuervos | Si muere de noche, se simula su despertar. La app distingue información real si estaba sano de información arbitraria si estaba envenenado o era el Borracho. |
| Virgen | La primera nominación gasta la habilidad. Un Aldeano o Espía sano registrado como Aldeano se ejecuta antes de votar; no se consumen votos y el día termina. |
| Exterminador | Solo un vivo durante el día. El intento se gasta incluso sin habilidad. Mata al Demonio vivo o a un Recluso sano que registre como Demonio. |
| Soldado | Un Soldado sano no puede morir por la habilidad del Demonio; ejecución y otras fuentes sí pueden matarlo. |
| Alcalde | Con tres vivos y ninguna ejecución, su equipo gana si su habilidad funciona. El Narrador puede redirigir su muerte nocturna a otro jugador, incluso provocando cero muertes. |
| Mayordomo | Cada noche elige a otra persona, viva o muerta. Solo tiene restricción real de voto mientras está vivo, sano y es realmente Mayordomo; los votos accidentales se cuentan. |
| Borracho | Es un Forastero y cree ser un Aldeano fuera de juego. Simula sus despertares y habilidades sin producir efectos reales. |
| Recluso | Puede registrar como malvado y como cualquier Esbirro/Demonio, incluso muerto, pero no envenenado. No obtiene la habilidad registrada. |
| Santo | Si muere por ejecución con su habilidad activa, el Mal gana. Otras muertes o una ejecución estando envenenado no activan la pérdida. |
| Envenenador | Actúa cada noche antes de la información. El objetivo queda envenenado esa noche y el día siguiente, hasta el próximo anochecer. Su efecto termina si muere o cambia de personaje. |
| Espía | Ve el Grimorio cada noche. La vista segura incluye personajes, estados y recordatorios nocturnos. Puede registrar como bueno/Aldeano/Forastero incluso muerto, pero no envenenado. |
| Mujer Escarlata | Con al menos cinco vivos justo antes de la muerte del Demonio, una Mujer Escarlata viva y sana se convierte inmediatamente en Diablillo. Tiene prioridad en el suicidio del Diablillo. |
| Barón | Durante la preparación sustituye exactamente dos Aldeanos por dos Forasteros. No se revierte al morir. |
| Diablillo | Cada noche salvo la primera elige cualquier jugador, incluso muerto o a sí mismo. Soldado, Monje y veneno pueden impedir la muerte. Si se mata, un Esbirro vivo se convierte en Diablillo, aprende el cambio y no vuelve a atacar esa noche. |

## Orden nocturno

Primera noche:

1. Información de Esbirros (solo 7+)
2. Información del Demonio (solo 7+)
3. Envenenador
4. Lavandera
5. Bibliotecario
6. Investigador
7. Chef
8. Empática
9. Adivina
10. Mayordomo
11. Espía

Noches posteriores:

1. Envenenador
2. Monje
3. Diablillo
4. Guardián de Cuervos, si murió esa noche
5. Empática
6. Adivina
7. Enterrador, si una ejecución causó una muerte
8. Mayordomo
9. Espía

Los avisos de cambio de personaje se insertan en la primera oportunidad apropiada sin conceder un segundo ataque al nuevo Diablillo.

## Cobertura automatizada

La suite cubre el catálogo, composiciones, orden nocturno y casos de información, registros, estados, ataques, transformaciones, nominaciones, votos y victorias. También valida los ejemplos oficiales de preparación, perfiles de 5 a 15 jugadores, Borracho, señuelo y bluffs. Una prueba aislada no demuestra cobertura de todas las interacciones; los pendientes se resumen en el [seguimiento reglamentario](../estado-de-cobertura.md#seguimiento-reglamentario). Se ejecuta con `npm test`.

El recorrido automatizado `npm run test:browser` ejecuta una partida aislada: reparto secreto con Borracho, primera noche, plaza pública, ejecución inmediata de la Virgen, pase a Mujer Escarlata, Enterrador, amanecer, voto fantasma, victoria, deshacer/rehacer, exportación, importación, recarga sin conexión y restauración de un punto de recuperación. También verifica que el Grimorio no tenga desbordamiento horizontal en tres anchos de pantalla. Se corrigieron dos fallos de interfaz descubiertos: la Virgen se resolvía tarde y faltaba conectar el ataque del Diablillo con el motor. Quedan pendientes recorridos para otros personajes, una auditoría completa de accesibilidad e interacciones no incluidas en esa partida.

## Límites deliberados

Esta auditoría cubre exclusivamente Trouble Brewing, sin Viajeros ni Fabled. Bad Moon Rising y Sects & Violets tienen auditorías separadas y estables como asistentes guiados.
