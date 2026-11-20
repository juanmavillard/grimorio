# Guardado, archivos y recuperación

## Qué se conserva

El dispositivo conserva una partida activa. Los personajes, estados, notas, fases e historial se guardan juntos con las copias auxiliares. Los favoritos de formaciones y los borradores pendientes están separados. Las partidas anteriores solo se conservan como archivos si decides descargarlas.

El indicador «Guardado» confirma la transacción. «Guardando» significa que aún hay una operación pendiente. Si aparece un error, la acción no sustituye el estado confirmado: corrige el problema, reintenta o descarga una copia. No borres los datos del navegador como primer intento de reparación.

## Borradores

Un borrador contiene lo que todavía no has confirmado. Recuperar un nombre o una selección no ejecuta una habilidad. En preparación se recupera también el modelo que se utilizará al crear la partida. Si otra acción ha cambiado la revisión, revisa o descarta el borrador antes de usarlo.

En navegador se asocia a la pestaña; no se promete recuperarlo después de cerrarla definitivamente. En escritorio la ventana única tiene una identidad estable y puede recuperar borradores al volver a abrir. El límite es 256 KiB por pestaña; si no se guarda, permanece en memoria y se avisa.

## Descargar y cargar

Utiliza Partidas para descargar el JSON actual o cargar uno compatible. En escritorio se muestra Guardar como. Cancelar no sustituye la partida. Antes de cargar otra puedes guardar una copia, continuar sin guardarla o cancelar.

Se aceptan partidas compatibles antiguas con migración; se rechazan formatos futuros y archivos dañados sin sustituir la activa. Los límites iniciales son 50 MiB por partida y 200 MiB por rescate. Una exportación mayor se advierte y conserva completa, pero el importador no podrá abrirla hasta revisar ese límite.

## Rescate completo

Recuperación puede abrirse aunque falle el Grimorio principal. Descargar rescate lee los datos actuales, no solo lo que se leyó al abrir la pantalla. Conserva partida, deshacer, rehacer, puntos, originales dañados, preferencias y borradores. El rescate desde el cierre añade también borradores solo presentes en memoria, separados de los datos confirmados.

Al abrir un rescate no se sobrescribe automáticamente la partida activa: revisa las versiones y exporta la que quieras cargar. El archivo contiene secretos y datos personales; guárdalo en un lugar privado.

## Espacio, copias y limpieza

Hay hasta diez acciones por pila de deshacer/rehacer y tres puntos de recuperación, con 2 MiB de presupuesto auxiliar. Una partida larga puede quedarse sin esas copias, pero su historial activo no se recorta. Descargar JSON sigue siendo la copia externa duradera.

La limpieza es explícita y no exige descargar antes todas las versiones. Conserva la partida activa y elimina las copias y datos antiguos que anuncia. Si otra ventana ha escrito desde la lectura, se cancela y debes volver a revisar los datos. Ante corrupción que impida identificar el registro, conserva el rescate antes de decidir una reparación.

## Dos ventanas y cierre

Una pestaña antigua no puede sobrescribir una revisión nueva. Descarga su información o borradores y recarga antes de continuar. En escritorio, otro doble clic lleva a la ventana existente.

Un cierre normal espera las operaciones y los borradores. Si no puede confirmar el guardado, permite reintentar, exportar o cancelar. Un apagado o cierre forzado puede perder lo que todavía no se había confirmado; al reabrir se utiliza el último estado guardado.

Para trasladar datos desde Safari o Chrome a escritorio, utiliza JSON; los perfiles no se leen automáticamente. Consulta la [guía de escritorio](aplicacion-de-escritorio.md).
