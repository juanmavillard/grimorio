# Auditoría reglamentaria · Sects & Violets

## Estado

**Estable como asistente guiado; auditoría integral abierta.** Hay pruebas de los mecanismos principales, pero no una verificación completa de los 25 personajes y todas sus interacciones. Las sanciones de locura y otras decisiones del Narrador siguen siendo manuales.

## Áreas implementadas con cobertura parcial

- Los 25 personajes, distribución y los modificadores de Fang Gu (+1 Forastero) y Vigormortis (−1 Forastero).
- Primera noche y noches posteriores, incluido el despertar recurrente del Soñador.
- Cambios de personaje/alineamiento: Encantador de Serpientes, Fang Gu, Pit-Hag y Barbero.
- Condiciones y disparadores: Gemelo Malvado, Bruja, Patoso, Vortox, No Dashii y Vigormortis.
- Efectos pendientes privados: Enamoradizo, Barbero, Sabio Ermitaño, Patoso y elección vecinal de Vigormortis.
- Herramientas diurnas: visita del Sabio, pregunta del Artista, conjeturas del Malabarista y ejecución opcional por locura de Mutante o Cerenovus.
- Información mecánica comprobable: Relojero, Soñador, Florista, Pregonero, Oráculo y Costurera; Vortox invierte la validación y las decisiones narrativas siguen siendo manuales.
- Ayuda contextual de los 25 personajes, manual, referencia rápida, persistencia de estado y Plaza pública sin secretos.

## Decisiones reglamentarias implementadas

- El Soñador actúa cada noche; la aplicación permite registrar el personaje bueno y malvado mostrados.
- El Filósofo que usa su elección sin habilidad la gasta y conserva una simulación sin efecto real. Si obtiene al Relojero en una noche posterior, recibe su información esa misma noche.
- Si No Dashii o Vigormortis envenenan al Filósofo, deja de embriagar al jugador con la habilidad copiada; el estado se recalcula cuando cambia el envenenamiento.
- El Encantador intercambia personaje y alineamiento únicamente al elegir un Demonio con habilidad; el nuevo Encantador queda envenenado de forma continua.
- El salto de Fang Gu exige que su primer objetivo Forastero sea realmente matado: protección o un objetivo ya muerto no consumen el salto. El nuevo Fang Gu no vuelve a actuar esa noche.
- Vigormortis conserva solamente la habilidad de los Esbirros que él mató y cada uno envenena a un único vecino Aldeano; una elección entre vecinos queda pendiente para el Narrador.
- No Dashii envenena a los Aldeanos más cercanos en ambos sentidos, saltando otros tipos y sin saltarse Aldeanos muertos; el efecto es continuo y se recalcula también tras cambios de personaje.
- La Bruja mata al nominador maldito de inmediato sin cancelar la nominación; con tres o menos vivos su maldición se retira.
- El Artista hace su pregunta en privado y puede recibir «no lo sé»; una pregunta efectuada sin habilidad se registra como simulada y consume el uso.
- Si ejecutan al gemelo bueno, gana el Mal, incluso si es quien posee el personaje Gemelo Malvado. Mientras ambos Gemelos viven y la habilidad está activa, la muerte del último Demonio aplaza la victoria del Bien; si después desaparece el bloqueo, se resuelve la victoria pendiente.
- Si el Sabio Ermitaño muere a manos del Demonio mientras está borracho o envenenado, se conserva su despertar simulado y el Narrador puede registrar información arbitraria.
- Si el Patoso elige a un jugador malvado, pierde el equipo del Patoso; su elección se registra una sola vez tras su muerte.
- Pit-Hag exige un personaje fuera de juego y anota que al crear un Demonio las muertes nocturnas pasan a ser decisión del Narrador.
- Si Pit-Hag crea varios Demonios, la muerte de uno no concede la victoria al Bien mientras quede otro vivo.
- El Barbero permite que el Demonio intercambie dos personajes sin cambiar sus alineamientos; uno de los dos puede ser el propio Demonio, pero no otro Demonio.
- Los cambios de Encantador, Fang Gu, Pit-Hag y Barbero reinician los usos del personaje nuevo y crean avisos privados para comunicarlo.
- Si Pit-Hag crea un Demonio, incluso al cambiar un Demonio por otro, el asistente registra la elección demoníaca y permite al Narrador seleccionar cero o más muertes arbitrarias; el panel privado permite registrar decisiones adicionales durante esa noche.
- Los muertos normales desaparecen del orden nocturno; solo permanecen los disparadores inmediatos y las excepciones que conservan habilidad.
- Con Vortox sano, la interfaz recuerda que toda información de Aldeano debe ser falsa y el cierre diurno revisa su victoria por ausencia de ejecución.

## Límites deliberados

La aplicación no decide qué información falsa es mejor, cómo registra un personaje ante una consulta, si ejecutas por locura ni las muertes arbitrarias de Pit-Hag. Señala el contexto, conserva la decisión y deja trazabilidad en el historial; esa es la frontera intencionada de un asistente de Narrador.

## Fuentes y cierre

La revisión usa la [guía oficial de Sects & Violets](https://wiki.bloodontheclocktower.com/Sects_%26_Violets), y las páginas oficiales de [Filósofo](https://wiki.bloodontheclocktower.com/Philosopher), [Artista](https://wiki.bloodontheclocktower.com/Artist), [Encantador de Serpientes](https://wiki.bloodontheclocktower.com/Snake_Charmer), [Fang Gu](https://wiki.bloodontheclocktower.com/Fang_Gu), [Bruja](https://wiki.bloodontheclocktower.com/Witch), [Vigormortis](https://wiki.bloodontheclocktower.com/Vigormortis), [No Dashii](https://wiki.bloodontheclocktower.com/No_Dashii), [Gemelo Malvado](https://wiki.bloodontheclocktower.com/Evil_Twin), [Sabio Ermitaño](https://wiki.bloodontheclocktower.com/Sage), [Patoso](https://wiki.bloodontheclocktower.com/Klutz) y [Vortox](https://wiki.bloodontheclocktower.com/Vortox). `npm run test:browser:snv` prueba partidas aisladas hasta la victoria con Bruja y Fang Gu, y con la victoria aplazada por el Gemelo. Quedan pendientes recorridos e interacciones del resto de personajes antes de cerrar la auditoría.
