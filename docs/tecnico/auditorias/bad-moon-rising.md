# Auditoría reglamentaria · Bad Moon Rising

## Estado

**Estable como asistente guiado; auditoría integral abierta.** El guion está disponible, pero la verificación de todos los personajes y sus interacciones sigue pendiente. Los casos revisados aquí no garantizan que los restantes funcionen correctamente.

## Alcance de la auditoría

- Verificar los 25 personajes contra páginas oficiales individuales y el orden nocturno publicado.
- Validar composición, ajuste del Padrino, bluffs, información inicial y el Lunático.
- Comprobar causas de muerte, supervivencias, muertes múltiples, resurrección y disparadores encadenados.
- Documentar cada decisión que el Narrador puede tomar, incluyendo registros e información variable.

## Casos prioritarios ya detectados

- La Abuela solo proporciona información inicial; no debe figurar en noches posteriores.
- El Zombuul solo ataca si nadie murió durante el día y su primera muerte cambia el registro, no su vida real.
- El Pukka envenena al nuevo objetivo y después resuelve la muerte del anterior, que sigue envenenado durante ella; luego retira su veneno. Si el Exorcista impide que Pukka despierte, la muerte anterior todavía se resuelve.
- El Niño Lunar hace su elección pública al conocer su muerte, incluso si está ebrio o envenenado. Se conserva el alineamiento del objetivo al elegir; la embriaguez o el veneno del Niño se comprueban cuando se resuelve la muerte nocturna.
- Shabaloth y Po resuelven las elecciones en orden: si el Matón es elegido después, las muertes ya resueltas no se deshacen. El Asesino puede matar realmente al Zombuul incluso en su primera muerte.
- La Camarera no cuenta como despertares ni el paso de Manitas ni la muerte diferida de un Pukka exorcizado. Mente Maestra mantiene su día adicional aunque durante la noche queden dos vivos.
- Mente Maestra solo se activa si el Demonio muere **por ejecución** y esa muerte habría terminado la partida. El día extra acaba con la derrota del equipo del jugador ejecutado; sin ejecución, gana el Bien.

## Reglas incorporadas

- El orden de noches posteriores ya no vuelve a despertar a la Abuela.
- El ciclo de veneno, muerte y curación del Pukka queda registrado estructuralmente, incluida su suspensión mientras Pukka no tiene habilidad.
- El Zombuul no ataca si hubo una muerte durante el día y su primera muerte pasa a ser un registro de muerte, no un final de partida.
- Mente Maestra crea un único día adicional trazable y resuelve su resultado al cerrarlo.
- El motor guiado cubre los 25 personajes: Abuela, Marinero, Camarera, Exorcista, Posadero, Jugador, Chismoso, Cortesano, Profesor, Juglar, Dama del Té, Pacifista, Tonto, Matón, Lunático, Manitas, Niño Lunar, Padrino, Abogado del Diablo, Asesino, Mente Maestra, Zombuul, Pukka, Shabaloth y Po.
- Las protecciones de BMR se registran por su origen, expiran en su momento correspondiente y las decisiones opcionales (Pacifista, borrachera del Marinero/Posadero, regurgitación) las confirma el Narrador.
- La preparación del Lunático guarda su Demonio aparente, supuestos Esbirros y bluffs, y sus elecciones fingidas quedan disponibles para el Demonio real sin causar muertes.
- Cada personaje tiene ficha estable en la ayuda y entrada propia en el almanaque.

Las pruebas de regresión cubren composición, Padrino, Lunático, protecciones, supervivencias, información, muertes múltiples, efectos diferidos, victoria y privacidad de la Plaza pública. Las decisiones no deterministas siguen siendo explícitas del Narrador.

## Fuentes y cierre

La revisión se apoya en la [guía oficial de Bad Moon Rising](https://wiki.bloodontheclocktower.com/Bad_Moon_Rising), [Abuela](https://wiki.bloodontheclocktower.com/Grandmother), [Pukka](https://wiki.bloodontheclocktower.com/Pukka), [Niño Lunar](https://wiki.bloodontheclocktower.com/Moonchild), [Matón](https://wiki.bloodontheclocktower.com/Goon), [Asesino](https://wiki.bloodontheclocktower.com/Assassin), [Zombuul](https://wiki.bloodontheclocktower.com/Zombuul), [Mente Maestra](https://wiki.bloodontheclocktower.com/Mastermind) y los [recursos publicados](https://release.botc.app/resources/). La prueba `npm run test:browser:bmr` cubre reparto privado, Lunático, Pukka, Exorcista, amanecer, plaza pública, victoria, deshacer/rehacer y exportación/importación. Faltan más recorridos y revisión individual integral antes del cierre.
