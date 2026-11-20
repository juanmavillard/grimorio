# Manual del Narrador

Este es el documento principal para preparar y dirigir Trouble Brewing con el Grimorio digital.

## Usar la ayuda de la aplicación

Durante la partida, el panel **Situación de la mesa** resume qué hacer ahora, qué anunciar, estados que requieren revisión y los cambios recientes. Es privado: no lo compartas con jugadores.

La sección **Ayuda** sirve para tres niveles de consulta: una respuesta corta, detalles desplegables y este manual. Busca personajes o palabras como «veneno», «registro», «empate» o «muere el Demonio». Si no sabes por dónde empezar, abre **Resolver una duda**, elige la situación y revisa los jugadores de esta partida que pueden estar implicados.

La aplicación explica y comprueba; tú conservas la última decisión sobre información falsa, registros y redirecciones.

## 1. Tu función

El Narrador no pertenece a ningún equipo. Tu objetivo es:

- aplicar las reglas de forma consistente;
- mantener en secreto la información privada;
- ayudar a todos a entender el juego;
- tomar las decisiones opcionales de forma equilibrada;
- mantener un ritmo que permita conversar, deducir y actuar;
- corregir errores sin revelar información innecesaria.

No debes intentar que gane un equipo concreto. Sí puedes elegir entre resultados legales para mantener una partida interesante y justa.

## 2. Material necesario

- Un ordenador con la aplicación de escritorio o un dispositivo compatible con la versión web.
- Un navegador para consultar los manuales HTML si utilizas la carpeta de entrega.
- Sillas colocadas en círculo con un orden horario claro.
- Una forma pública de recordar quién está vivo y qué muertos conservan su voto, si no quieres enseñar la pantalla privada.
- Opcionalmente, papel para notas o una pantalla pública separada.

La pantalla del Grimorio es privada. Usa **Tapar** antes de dejar el dispositivo o moverlo cerca de los jugadores.

## 3. Abrir el programa

Si utilizas la entrega de escritorio, abre **Grimorio Base 3.app** en Mac. No necesitas terminal, Node ni un servidor. Sigue la [guía de escritorio](../../general/aplicacion-de-escritorio.md) para apertura, actualización y recuperación.

Si ya tienes desplegada la versión web, abre su dirección habitual en el navegador. El servidor de desarrollo pertenece al proyecto técnico; no es necesario para la aplicación de escritorio.

La partida se guarda automáticamente en ese entorno. Descarga una copia JSON si quieres conservarla fuera del almacenamiento local o moverla a otro dispositivo. El almacenamiento de la aplicación y el de cada navegador son independientes.

## 4. Preparación paso a paso

### 4.1 Coloca a los jugadores

Escribe los nombres en el mismo orden horario en el que están sentados. El asiento 1 continúa hacia el 2 y así sucesivamente. Este orden determina:

- vecinos vivos de la Empática;
- parejas del Chef;
- recorrido de las votaciones;
- posición mostrada al Espía.

### 4.2 Elige los personajes

Puedes partir de una formación recomendada, seleccionar manualmente los personajes o pedir un reparto aleatorio. La pantalla distingue siempre entre:

- **ejemplos oficiales**, publicados para ocho jugadores;
- **recomendaciones de la aplicación**, adaptadas al tamaño, experiencia y estilo;
- **favoritas locales**, guardadas por ti en este dispositivo.

Selecciona la experiencia del grupo y el estilo de partida para obtener una propuesta principal. Abre la biblioteca para comparar objetivos, dificultad, personajes y avisos. **Usar formación** aplica la propuesta; después puedes sustituir personajes manualmente y la validación seguirá mostrando la composición necesaria.

**Otra variante** conserva el perfil elegido pero cambia la combinación concreta. **Reparto aleatorio** no aplica criterios didácticos: úsalo cuando prefieras una selección completamente abierta.

Puedes guardar la selección actual con un nombre. Exportar e importar formaciones solo traslada listas de personajes y su personaje aparente recomendado para el Borracho; no incluye jugadores ni secretos de partidas.

Al elegir el reparto, procura combinar:

- al menos una fuente clara de información;
- una fuente continuada de información;
- alguna posibilidad de desinformación;
- habilidades activas y pasivas;
- un nivel de complejidad adecuado al grupo.

Para una primera partida evita acumular demasiados personajes con registros difíciles si los jugadores todavía no comprenden ese concepto.

Los avisos de preparación recuerdan automáticamente el Barón, el Borracho, el señuelo rojo y los bluffs. Siguen siendo decisiones que debes revisar en la pantalla de asignación.

### 4.3 Revisa la asignación

Antes de repartir, confirma:

- cada personaje aparece exactamente una vez;
- el Borracho cree ser un Aldeano fuera de juego;
- el señuelo rojo de la Adivina es un jugador bueno y puede ser la propia Adivina;
- los tres bluffs del Demonio son personajes buenos no jugados;
- los nombres coinciden con los asientos físicos.

### 4.4 Reparte los personajes

Puedes utilizar el reparto secreto del dispositivo. Cada jugador debe:

1. tomar el dispositivo sin que nadie mire;
2. revelar su personaje;
3. memorizar personaje y alineamiento;
4. ocultarlo antes de pasar el dispositivo.

El Borracho verá el Aldeano que cree ser, no el personaje Borracho.

### 4.5 Explica las reglas

Lee la [guía para nuevos jugadores](../../general/guia-jugadores-nuevos.md). Demuestra los gestos nocturnos y el recorrido de una votación.

## 5. Primera noche

La aplicación presenta únicamente los pasos aplicables y los ordena correctamente.

### Información de Esbirros — solo con 7+

Despierta juntos a todos los Esbirros. Permite que se reconozcan y señala quién es el Demonio.

### Información del Demonio — solo con 7+

Despierta al Diablillo. Señala a sus Esbirros y muestra los tres personajes buenos no jugados que puede usar como bluffs.

### Envenenador

Elige cualquier jugador. Ese jugador queda envenenado durante esta noche y todo el día siguiente. Si elige al propio Envenenador, el efecto se anula al perder su habilidad.

### Lavandera

Muestra dos jugadores y un personaje Aldeano que pueda registrar en uno de ellos.

### Bibliotecario

Muestra dos jugadores y un personaje Forastero que pueda registrar en uno de ellos. Si no hay Forasteros reales, puedes mostrar cero. Si señalas al Borracho, muestra Borracho, no el Aldeano que cree ser.

### Investigador

Muestra dos jugadores y un Esbirro que pueda registrar en uno de ellos. El Recluso puede ser utilizado para este registro si está sano.

### Chef

Muestra el número de parejas de jugadores que registran como malvados. Cuenta cada borde del círculo por separado. El Espía y el Recluso pueden cambiar el resultado legal.

### Empática

Muestra cuántos de sus dos vecinos vivos registran como malvados. Salta jugadores muertos, aunque en la primera noche normalmente todos estarán vivos.

### Adivina

La Adivina señala dos jugadores distintos. Responde sí si al menos uno es el Demonio, el señuelo rojo o un Recluso que decides registrar como Demonio.

### Mayordomo

Elige a otro jugador como amo. Puede elegir a un muerto, pero nunca a sí mismo.

### Espía

Muestra la vista segura del Grimorio durante el tiempo necesario. Antes de hacerlo, comprueba que nadie más pueda ver la pantalla.

## 6. Comenzar el día

Antes de pedir que abran los ojos:

1. termina todos los pasos nocturnos;
2. comprueba las muertes;
3. verifica si se activó una condición de victoria;
4. oculta el Grimorio;
5. anuncia únicamente quién murió, nunca la causa.

La protección del Monje termina al amanecer. El veneno continúa durante el día.

### Flujo guiado de noche

Antes del primer despertar, la aplicación muestra una lista de comprobación con todos los personajes que podrían actuar y el motivo. Revísala y pulsa «Cerrar los ojos y empezar» cuando estés preparado. No sustituye tu juicio: un personaje sin habilidad por muerte, embriaguez o veneno puede seguir apareciendo como recordatorio para que decidas si simular su actuación o no.

Al terminar los pasos, el resumen del amanecer separa lo que debes anunciar —solo las muertes— de las transformaciones y decisiones privadas. Comprueba ese resumen y las condiciones de victoria antes de abrir los ojos al pueblo.

## 7. Dirigir el día

### Conversaciones

Da tiempo para conversaciones públicas y privadas. En grupos nuevos, anuncia cuánto tiempo aproximado queda antes de abrir nominaciones.

No confirmes ni niegues afirmaciones sobre personajes. Puedes aclarar reglas en privado.

La app ofrece temporizadores opcionales para la conversación, acusación y defensa. Son una ayuda de ritmo: puedes pararlos, ignorarlos o ampliar el tiempo cuando la mesa lo necesite.

### Exterminador

Puede declarar públicamente su disparo en cualquier momento del día. La app registra el objetivo y permite decidir si un Recluso sano registra como Demonio.

Un intento se gasta aunque el Exterminador esté borracho o envenenado. Un jugador muerto ya no posee esta habilidad.

### Nominaciones

Para cada nominación:

1. confirma que quien nomina está vivo y no ha nominado hoy;
2. confirma que el objetivo no ha sido nominado hoy;
3. repite públicamente la nominación;
4. permite una acusación breve;
5. permite una defensa breve;
6. resuelve primero una posible Virgen;
7. si el día continúa, inicia la votación.

El flujo de la aplicación conserva esa secuencia: primero eliges nominador y nominado; después registra la acusación, la defensa y, por último, las manos. Hasta cerrar la votación puedes cancelar la nominación para corregir un error sin convertirla en una nominación realizada.

### Virgen

La primera vez que se nomina a la Virgen:

- marca su habilidad como usada;
- si el nominador es un Aldeano —o un Espía sano que decides registrar como Aldeano—, ejecuta inmediatamente al nominador;
- no realices la votación;
- termina las nominaciones y pasa a la noche.

Si la Virgen está borracha o envenenada, o el nominador no registra como Aldeano, no ocurre la ejecución y se vota normalmente.

### Votación

Selecciona al nominador y al nominado en la aplicación. El orden de manos aparecerá empezando después del nominado y terminando en él.

- Cuenta todas las manos levantadas.
- Marca quién utilizó voto de muerto.
- Anuncia el total.
- Informa de quién está en la picota o de si hay empate.

No rechaces un voto accidentalmente ilegal del Mayordomo: cuéntalo y habla con el jugador en privado después.

### Cerrar el día

Cuando ya no aceptes más nominaciones:

1. anuncia el cierre;
2. ejecuta a la persona en la picota, si existe;
3. resuelve Santo, Demonio y Mujer Escarlata inmediatamente;
4. si nadie fue ejecutado y quedan exactamente tres vivos, comprueba al Alcalde;
5. si la partida continúa, inicia la noche siguiente.

### Plaza pública y ayuda rápida

«Plaza pública» es una pantalla opcional que puede ver el grupo: muestra únicamente nombres, vida o muerte, voto fantasma disponible y el estado público de la nominación. No enseña personajes, equipos, estados, notas ni objetivos nocturnos: al abrirla, la aplicación sustituye por completo el Grimorio privado hasta que vuelves a la vista del Narrador.

El panel «¿Qué hago ahora?» propone el siguiente paso de la fase actual. La búsqueda de ayuda sirve para encontrar reglas y personajes sin abandonar la partida. Los atajos, siempre que el foco no esté dentro de un campo de texto, son: `G` Grimorio, `N` noche, `D` día, `H` ayuda, `T` Plaza pública y `Esc` ocultar una vista superpuesta.

### Diagnóstico y recuperación

La pestaña «Diagnóstico» revisa la composición, el Diablillo vivo, señuelo rojo, votos fantasma, estados temporales, fase y pasos nocturnos. Un aviso no sustituye una decisión del Narrador: simplemente señala algo que conviene revisar. Las correcciones propuestas requieren tu confirmación, quedan en el historial y se pueden deshacer.

El guardado es automático. «Partidas» conserva una biblioteca local y «Diagnóstico» muestra puntos de recuperación recientes. Restaurar uno recupera exactamente el estado guardado; la partida que abandonas queda, a su vez, en la recuperación local. Archivar una partida no la elimina.

## 7.1 Final de partida

Cuando el motor declare un ganador, abre «Revelación». La pantalla reúne el reparto real, la línea de tiempo relevante y las decisiones registradas. Puedes mostrar su versión pública al grupo cuando hayas terminado de explicar la partida; no reemplaza una conversación final sobre las decisiones y el disfrute de la mesa.

## 8. Noches posteriores

### Envenenador

Al anochecer termina el veneno anterior. Después el Envenenador elige el nuevo objetivo.

### Monje

Elige a otro jugador. Ese jugador queda protegido contra la habilidad del Demonio durante esta noche.

### Diablillo

Elige cualquier jugador, vivo o muerto, incluido él mismo.

Antes de aplicar la muerte, revisa:

- si el Diablillo está envenenado;
- si el objetivo está protegido por el Monje;
- si es un Soldado sano;
- si es un Alcalde sano y deseas redirigir la muerte;
- si el objetivo ya estaba muerto.

Si se ataca a sí mismo y muere, selecciona un Esbirro vivo como nuevo Diablillo. Una Mujer Escarlata sana tiene prioridad si se cumplen sus condiciones. Informa al nuevo Diablillo, pero no permitas que ataque otra vez esa noche.

### Guardián de Cuervos

Si murió esa noche, despiértalo inmediatamente después de la muerte y deja que elija a cualquier jugador. Muestra un personaje que el objetivo pueda registrar.

Si el Guardián estaba envenenado o es en realidad el Borracho, simula el despertar y puedes mostrar información verdadera o falsa.

### Empática y Adivina

Resuélvelas usando el estado posterior a la muerte del Demonio. La Empática usa vecinos vivos al amanecer.

### Enterrador

Solo despierta si una ejecución causó una muerte durante el día anterior. Muestra el personaje verdadero del ejecutado, sujeto a registros de Espía/Recluso y a posible información falsa si el Enterrador no tiene habilidad.

### Mayordomo y Espía

El Mayordomo elige amo para el día siguiente. El Espía ve el Grimorio al final de la secuencia.

## 9. Cómo decidir información falsa

Cuando un personaje informativo está borracho o envenenado, no estás obligado a mentir. Puedes dar información verdadera o falsa.

Una buena información falsa:

- crea dudas sin resolver automáticamente la partida;
- apoya bluffs plausibles del equipo malvado;
- no contradice de forma absurda información pública inmediata;
- puede descubrirse mediante comparación y conversación;
- no castiga repetidamente al mismo jugador sin motivo.

Nunca mientas sobre las reglas ni sobre el personaje o alineamiento actual que un jugador debe conocer.

## 10. Espía y Recluso

Decide cada registro en el instante en que una habilidad lo consulta.

### El Espía puede registrar como

- bueno;
- cualquier Aldeano;
- cualquier Forastero;
- su personaje real, Espía.

### El Recluso puede registrar como

- malvado;
- cualquier Esbirro;
- cualquier Demonio;
- su personaje real, Recluso.

Pueden registrar de modo diferente ante dos comprobaciones de la misma noche. Si están envenenados, solo registran normalmente como lo que realmente son.

## 11. Condiciones de victoria: lista de control

Comprueba inmediatamente después de cada muerte o final de día:

- ¿Murió el Demonio?
- ¿Había Mujer Escarlata válida con cinco o más vivos justo antes de esa muerte?
- ¿Quedan solo dos vivos?
- ¿Murió el Santo por ejecución con habilidad activa?
- ¿Terminó el día con exactamente tres vivos, sin ejecución y con Alcalde activo?

La aplicación detecta estas condiciones y pide confirmación antes de cerrar la partida.

## 12. Uso del historial y deshacer

- Registra las decisiones importantes y la información mostrada.
- Usa **Deshacer** inmediatamente si cometiste una entrada equivocada.
- No alteres manualmente personajes o estados durante una partida salvo para corregir el Grimorio.
- Exporta una copia antes de cerrar una partida importante.

## 13. Cómo corregir errores

### Error detectado inmediatamente

Deshaz la acción, corrígela y continúa. Si un jugador recibió información incorrecta por accidente, corrígela en privado si puedes hacerlo sin revelar nada más.

### Error detectado tarde

Valora qué opción revela menos:

- corregir al jugador en privado;
- anunciar una corrección reglamentaria general;
- continuar con el estado actual;
- terminar la partida solo si el error la vuelve imposible o injusta.

Explica los detalles completos después de la partida, no durante ella.

## 14. Final y explicación

Cuando termine la partida:

1. anuncia el equipo ganador;
2. revela el Demonio y los Esbirros;
3. revela al Borracho y su personaje aparente;
4. explica el señuelo rojo;
5. repasa los venenos, registros y redirecciones importantes;
6. permite preguntas;
7. exporta o borra la partida según prefieras.

## 15. Lista rápida antes de empezar

- [ ] Asientos en orden horario.
- [ ] Composición válida.
- [ ] Personajes adecuados para la experiencia del grupo.
- [ ] Borracho configurado correctamente.
- [ ] Señuelo rojo elegido si hay Adivina.
- [ ] Tres bluffs válidos si hay 7+.
- [ ] Gestos nocturnos explicados.
- [ ] Privacidad de la pantalla comprobada.
- [ ] Agua, pausas y duración aproximada acordadas.

Durante la partida, mantén abierta la [referencia rápida de mesa](referencia-rapida.md). Para interacciones concretas, consulta [Preguntas frecuentes](preguntas-frecuentes.md) y [Personajes y habilidades](personajes.md).
