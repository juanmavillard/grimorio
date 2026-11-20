# Guía del programa: qué hace y cómo utilizarlo

Esta guía describe los controles actuales del **Grimorio privado · Base 3, versión 1.0.1**. Es un asistente para una partida presencial: tú diriges la mesa y el programa lleva el registro y ofrece herramientas de resolución. Los jugadores no necesitan instalarlo ni conectarse.

## 1. Orientación: qué pantalla utilizar

| Pantalla o control | Para qué sirve |
| --- | --- |
| Preparación | Elegir guion, nombres, asientos y personajes. |
| Asignación y reparto | Decidir quién tiene cada personaje y, si quieres, enseñarlo en secreto. |
| Grimorio | Ver la mesa completa, consultar jugadores y estados. |
| Noche | Seguir los pasos nocturnos y registrar decisiones e información. |
| Día | Conducir conversación, nominaciones, votos, habilidades diurnas y ejecución. |
| Ayuda | Buscar personajes y reglas; consultar orientación contextual. |
| Historial | Revisar lo registrado y las explicaciones disponibles. |
| Diagnóstico | Revisar avisos de coherencia, almacenamiento y puntos de recuperación. |
| Partidas | Descargar o cargar archivos y gestionar borradores; no es una biblioteca permanente. |
| Plaza pública | Mostrar el estado público sin revelar personajes ni notas. |
| Tapar | Ocultar el contenido privado de la pantalla. |
| Revelación | Mostrar el reparto y explicar la partida después del final confirmado. |

Puedes cambiar entre Grimorio, Ayuda, Historial, Diagnóstico y Partidas sin avanzar la partida. Noche y Día están disponibles cuando corresponde a la fase actual. Abrir una pantalla no resuelve una habilidad: las acciones requieren sus botones de confirmación.

## 2. Empezar o retomar

En Mac abre la aplicación. Si estás utilizando la versión web, abre la dirección habitual del programa. Cada navegador y la aplicación de escritorio tienen su propio almacenamiento: una partida de Safari no aparece automáticamente en Chrome o en la aplicación. Para trasladarla, descarga su JSON y cárgalo en el otro entorno.

Si existe una partida activa, se recupera al abrir. Si no, aparece Preparación. Desde **Partidas → Cargar partida** puedes continuar un archivo. Para empezar otra, utiliza **Nueva partida** en el Grimorio; ofrece guardar una copia, continuar sin guardar o cancelar. La opción Guardar copia descarga el archivo y deja la partida actual: después debes repetir Nueva partida cuando estés preparado para sustituirla.

## 3. Preparar la mesa

1. **Elige el guion:** Trouble Brewing, Bad Moon Rising o Sects & Violets.
2. **Indica el número de jugadores:** el selector admite de 5 a 15. El Narrador no cuenta como jugador.
3. **Pon título y nombres:** introduce a los jugadores en el mismo orden de asientos que tendrán físicamente. El círculo y los cálculos de vecindad usan ese orden.
4. **Elige los personajes:** las casillas permiten selección manual; Reparto aleatorio propone otra combinación. Los contadores comparan la selección con la composición requerida y muestran los errores que debes resolver.
5. **Decide si usar reparto secreto:** lo puedes hacer en el mismo dispositivo o comunicar tú los personajes por otro medio.
6. **Pulsa Crear partida:** continuarás a la asignación y a las decisiones de preparación.

### Formaciones recomendadas

La biblioteca guiada de formaciones está desarrollada para **Trouble Brewing**. Puedes escoger experiencia y estilo, aplicar una recomendación, generar otra variante y modificar después los personajes. Hay tres ejemplos oficiales para ocho jugadores, separados de las recomendaciones propias de la aplicación.

Puedes guardar selecciones como favoritas, eliminarlas y exportar/importar archivos de formaciones. Una formación es una receta de personajes; no es una partida con jugadores o historial. En Bad Moon Rising y Sects & Violets utiliza la selección manual o aleatoria y sus decisiones de preparación; no cuentan con esa misma biblioteca guiada de Trouble Brewing.

### Asignación y decisiones secretas

Revisa qué personaje corresponde a cada asiento. Puedes barajar la asignación o modificarla antes de confirmar. Completa los controles que aparezcan: por ejemplo, personaje que cree ser el Borracho, señuelo de la Adivina, farolillos del Demonio o decisiones propias de los otros guiones. Los farolillos son personajes buenos fuera de juego que el Demonio puede usar como coartada; no son personajes adicionales repartidos.

El programa valida los datos de preparación. Si una elección es inválida o falla el guardado, la acción no debe quedar confirmada a medias.

## 4. Reparto secreto en el dispositivo

Si lo activaste, cada persona consulta su personaje y vuelve a ocultarlo antes de pasar el dispositivo. Tú sigues controlando físicamente quién lo recibe: no hay identificación por contraseña ni envío automático a móviles.

El personaje mostrado puede ser aparente, como sucede con el Borracho o el Lunático. El reparto no sustituye las reuniones e información inicial del equipo malvado que correspondan durante la primera noche. Sigue después el asistente nocturno.

## 5. Grimorio: tu vista privada de toda la mesa

El círculo muestra nombre, asiento, personaje y marcadores de cada jugador. El centro indica vivos y umbral de votos. Los filtros **Todos, Actúa ahora, Con estado, Malvados y Relaciones** destacan la información pertinente sin cambiar los datos.

Los paneles laterales muestran la situación, la siguiente acción, estados, equipo malvado y farolillos. Las relaciones pueden señalar quién actúa, vecinos y objetivos relacionados. Es una ayuda visual; para el detalle abre la ficha o el paso nocturno.

### Ficha de jugador

Pulsa un asiento para consultar su personaje, ayuda, relaciones e historial relevante. La ficha reúne controles de personaje real y aparente, alineamiento, vida, voto de muerto, usos y estados, además de notas privadas.

Distingue sus tres operaciones:

- **Guardar notas:** conserva la anotación; no resuelve una muerte ni una habilidad.
- **Resolver cambio:** tramita el cambio reglamentario con las consecuencias que el motor contempla. Usa antes el control específico de la habilidad cuando esté disponible.
- **Corrección avanzada:** ajusta deliberadamente el registro, exige un motivo y deja constancia. No activa ni limpia automáticamente todas las habilidades relacionadas. Debes revisar estados, efectos pendientes y victoria.

Cambiar una casilla y resolver una habilidad no son operaciones equivalentes. Si te equivocas al registrar una acción, suele ser más claro usar Deshacer y volver a registrarla.

## 6. Noche guiada

Al entrar verás la **Lista de la noche**. Revísala y pulsa **Cerrar los ojos y empezar**. El asistente ordena los pasos según guion, personajes, estados, usos y efectos.

En cada paso:

1. Lee quién actúa y si debes despertarlo o resolver un efecto sin despertarlo.
2. Recoge la elección del jugador, cuando corresponda.
3. Completa objetivo, respuesta, personaje mostrado o decisión del Narrador.
4. Consulta **Ayuda para este paso** si lo necesitas.
5. Añade una nota opcional y pulsa **Registrar y seguir**.

Hay cálculos de apoyo, como vecinos de la Empática o respuestas mecánicas de información. Algunos ofrecen alternativas legales por registros; otros necesitan que tú determines la información. El programa advierte sobre habilidad inactiva, borrachera o veneno: debes mantener la simulación cuando corresponda, aunque el efecto real no se aplique.

Puedes revisar pasos anteriores. Volver a un paso ya completado no lo ejecuta otra vez; para corregir lo registrado utiliza Deshacer. Las decisiones pendientes que afecten al siguiente paso deben resolverse cuando el programa lo solicite.

Al terminar aparece el **Resumen del amanecer**, con muertes para anunciar y cambios privados. Revisa el resumen, oculta la información privada y anuncia lo que corresponda. Después pulsa **Abrir los ojos · comenzar día**. El programa registra; tú despiertas a los jugadores y hablas a la mesa.

## 7. Día, nominaciones y votos

El día empieza en **Conversación**. Puedes dejar hablar al grupo y usar temporizadores de 1, 3 o 5 minutos; son avisos orientativos, no ejecutan ni cierran fases por sí solos. Se pueden detener. No son un reloj histórico de la partida ni se garantiza continuar su cuenta tras recargar.

Cuando quieras, pulsa **Abrir nominaciones**:

1. Selecciona quién nomina y a quién.
2. Pulsa **Abrir acusación**.
3. Escucha la acusación, pasa a **Defensa** y después a **Votación**.
4. Marca las manos levantadas. La lista sigue el orden horario y termina en el nominado.
5. Pulsa **Registrar resultado** y revisa la picota.

La aplicación controla nominaciones disponibles, umbral, votos registrados, empates y votos de muerto. Tú observas las manos y marcas quién votó: no hay votación remota. El vivo puede votar en distintas nominaciones; el voto único de un muerto se consume cuando se registra su voto. Hay controles para decisiones como el registro del Espía ante la Virgen.

La **Picota** indica quién sería ejecutado si cerraras ahora o si existe empate. Cuando termines, pulsa **Cerrar nominaciones y resolver**: el motor tramita la ejecución o su ausencia, los efectos correspondientes y el paso siguiente. Una nominación en curso debe terminarse o cancelarse antes.

### Habilidades y decisiones diurnas

Los controles dependen del guion y de quién puede actuar:

- **Trouble Brewing:** disparo del Exterminador y resolución de Virgen dentro del flujo de nominación.
- **Bad Moon Rising:** elección pública del Niño Lunar, muerte del Manitas y decisión del Pacifista cuando sea aplicable.
- **Sects & Violets:** visita del Sabio, pregunta del Artista, conjeturas del Malabarista y ejecución por locura cuando corresponda.

La locura exige tu valoración: el programa no escucha conversaciones ni determina por sí solo si alguien incumplió una condición. Registra la decisión que adoptes.

## 8. Situación de la mesa y decisiones pendientes

Este panel resume **Ahora, Anuncia, Revisar** y cambios recientes. Es útil para retomar el hilo sin repasar todo el historial.

Cuando una habilidad deja una elección para después, aparecen **Decisiones pendientes**, con los controles que correspondan: por ejemplo, embriaguez del Enamoradizo, elección del Patoso, información del Sabio Ermitaño, intercambio del Barbero o selección relacionada con Vigormortis. Pit-Hag puede mostrar controles adicionales de muertes y supervivencias cuando su regla lo permita.

No todas las decisiones deben resolverse en el mismo momento. Sigue la instrucción del efecto: algunas deben esperar al día o a que una persona conozca su muerte. Los bloqueos del asistente intentan evitar avanzar cuando una decisión necesaria sigue sin resolverse.

## 9. Ayuda: dónde consultar una duda

**Ayuda** contiene buscador, fichas y orientación por situaciones. Puedes buscar “veneno”, “Virgen”, “registro”, “empate” o un personaje. Las fichas presentan resumen, dirección, información, interacciones, ejemplo, error habitual y enlaces de referencia. Los detalles se despliegan para evitar leer todo de golpe.

**Resolver una duda** permite partir de una situación, como información, muerte, veneno/borrachera, nominación o cambio de personaje. Muestra orientación y jugadores relacionados. También puedes llegar a la ayuda desde una ficha o un paso de noche.

El contenido incluido funciona sin red; abrir una fuente oficial externa sí requiere conexión. Los almanaques Markdown del proyecto amplían la explicación. Las hojas de jugadores son públicas y breves: no sustituyen esos almanaques privados.

## 10. Historial, deshacer y diagnóstico

**Historial** conserva acciones y notas por ronda y fase. Muestra 50 registros por página, empezando por los recientes; Anteriores permite seguir consultando. La exportación mantiene el historial completo. Los eventos con **¿Por qué?** muestran los datos explicativos disponibles: actor, objetivo, origen o regla. No todos los registros antiguos contienen ese detalle.

Las flechas de cabecera permiten **Deshacer** y **Rehacer** acciones confirmadas. Se conservan hasta diez instantáneas, sujetas al presupuesto de copias auxiliares; no son ilimitadas. Después de deshacer, comprueba que el registro digital coincide con lo que has comunicado físicamente: deshacer no retira información que un jugador ya escuchó.

**Diagnóstico** revisa incoherencias conocidas y ofrece correcciones confirmables, información de versión y medidas de almacenamiento. “Todo parece coherente” significa que esas comprobaciones no detectan problemas; no certifica todas las reglas de una partida. Los avisos pueden requerir una decisión manual legítima.

Los diagnósticos se exportan de forma anónima por defecto, excluyendo nombres y textos privados libres. Puedes desmarcar la opción anónima para incluir información identificable. El diagnóstico sirve para investigar problemas; no es una copia completa para continuar jugando.

## 11. Plaza pública, Tapar y Espía

- **Plaza pública:** muestra nombres, vida/muerte, votos de muerto y datos públicos de nominaciones/votos. No incluye personajes, notas ni estados secretos. Es una vista en el mismo dispositivo, no una sala compartida por Internet.
- **Tapar:** sustituye la pantalla por una cubierta privada. No pausa ni cambia las reglas de la partida. Toca para volver.
- **Vista del Espía:** se abre desde su paso nocturno y muestra los datos del Grimorio que necesita consultar. Contiene secretos por diseño; no la confundas con la Plaza pública.

Al entrar en una vista pública o tapada se retiran avisos y diálogos privados. Aun así, tú controlas cuándo devuelves el dispositivo a tu vista del Narrador.

## 12. Guardado, archivos, borradores y recuperación

### Qué se guarda automáticamente

Se mantiene **una partida activa por entorno**, con jugadores, roles, estados, notas, historial y fase. El indicador muestra Guardando, Guardado o Error. Una acción se publica como confirmada después de guardarse; un fallo no debe sustituir la última partida confirmada. Espera a ver Guardado antes de cerrar.

Las copias auxiliares tienen hasta diez instantáneas de deshacer/rehacer y tres puntos de recuperación, con un presupuesto conjunto de 2 MiB. Se retiran auxiliares antiguos cuando es necesario; nunca se recorta la partida activa ni su historial para cumplir ese presupuesto.

Los favoritos de formaciones son datos separados. Los formularios no confirmados son **borradores**, no acciones de juego: se pueden recuperar al recargar la misma pestaña si coinciden partida y revisión. Si la revisión cambia, debes revisarlos o descartarlos. No se garantiza recuperarlos tras cerrar definitivamente una pestaña.

### Conservar o trasladar una partida

**Descargar partida actual / Exportar copia** crea un JSON privado para continuar después. En escritorio abre Guardar como; en navegador solicita una descarga. Cargar partida valida el archivo, muestra sus datos y pide confirmar la sustitución. Un archivo inválido no debe reemplazar la partida actual.

El JSON no es un PDF ni un resumen para jugadores: contiene secretos. Las partidas anteriores solo quedan conservadas si descargas sus archivos. Los archivos guardados fuera de la aplicación no ocupan su biblioteca interna.

### Si algo falla

1. Conserva el estado disponible y descarga una copia si puedes.
2. Entra en **Diagnóstico** para revisar avisos y restaurar un punto disponible.
3. Si no arranca la pantalla principal, utiliza **Recuperar partidas** desde Partidas o desde el menú de escritorio.
4. Descarga una versión individual o un rescate completo. El rescate conserva también datos dañados y auxiliares para investigar; no es el archivo de partida habitual.
5. Un rescate se abre en Recuperación para extraer una versión individual; no se instala automáticamente sobre la partida activa.

La recuperación lee los datos actuales y permite limpiar copias y datos antiguos sin exigir descargarlos antes. La limpieza conserva la partida activa cuando existe. Versiones con el mismo nombre pueden ser puntos de distintos momentos: compara fase y fecha.

Si aparece error de cuota, sigue disponible la exportación del estado confirmado. No se promete almacenamiento ilimitado. Si otra pestaña cambia la partida, se bloquea la escritura obsoleta; descarga datos/borradores necesarios y recarga. Evita dirigir la misma partida desde varias pestañas.

## 13. Final de partida

El programa comprueba las condiciones que contempla y solicita confirmar el final detectado. Con el resultado confirmado aparece **Revelación**: puedes revisar reparto, alineamientos y momentos destacados, y después **Mostrar al grupo**. La revelación no está disponible como atajo durante una partida abierta.

Exporta el JSON si quieres conservarla. Para jugar otra, utiliza Nueva partida y repite la preparación.

## 14. Atajos y límites prácticos

Fuera de campos de texto y sin teclas modificadoras:

| Tecla | Acción |
| --- | --- |
| G | Grimorio |
| N | Noche, cuando esté disponible |
| D | Día, cuando esté disponible |
| H o ? | Ayuda |
| T | Plaza pública |
| Escape | Salir de la cubierta o vista superpuesta |

El programa incluye los 72 personajes de los tres guiones Base 3. No incluye Viajeros, Fábulas, guiones personalizados, cuentas, sincronización, partidas multijugador remotas, notificaciones a móviles ni un árbitro con IA. Hay entregas separadas para Mac y Windows x64. El ejecutable Windows se ha generado y su contenido se ha comprobado desde Mac; falta probar su ejecución en Windows. La aplicación Mac se ha probado en Apple Silicon; la matriz técnica distingue lo pendiente.

Las auditorías reglamentarias siguen abiertas. Las herramientas y pruebas existentes ayudan a dirigir; no demuestran que toda combinación imaginable esté automatizada. Ante una situación no cubierta, consulta la regla y registra conscientemente la decisión mediante los controles adecuados.

## 15. Recorrido mínimo para tu próxima sesión

1. Envía a los jugadores la hoja pública del guion y explica las reglas comunes.
2. Prepara nombres en orden de asientos y selecciona un reparto válido.
3. Revisa asignación, decisiones secretas y reparto.
4. Sigue Noche hasta el resumen y abre Día.
5. Conduce conversación, nominaciones y votos; cierra el día.
6. Alterna Noche/Día, consultando Grimorio y Ayuda cuando lo necesites.
7. Ante un error de registro, usa Deshacer antes de recurrir a correcciones avanzadas.
8. Al finalizar, confirma resultado, muestra la revelación y descarga la partida si quieres conservarla.

Consulta también [Guardado y recuperación](guardado-y-recuperacion.md), [Aplicación de escritorio](aplicacion-de-escritorio.md) y el [índice de manuales](../README.md).
