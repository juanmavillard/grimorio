# Aplicación de escritorio

El Grimorio de escritorio abre una ventana propia y funciona sin Internet desde el primer inicio. No necesitas Python, Node, terminal ni un servidor localhost.

Esta guía se aplica a un ejecutable construido y verificado para tu plataforma. El repositorio y la demo web no incluyen por sí mismos ese ejecutable. La validación reciente corresponde a Electron desde fuentes; las pruebas históricas de paquetes se distinguen en la [matriz de escritorio del repositorio](https://github.com/juanmavillard/grimorio/blob/main/docs/tecnico/escritorio.md).

## Abrir

- Windows 10/11 de 64 bits: abre `Grimorio-Base3-1.0.1-Windows.exe`, portátil y sin instalación ni permisos de administrador. El contenido se comprueba al generarlo; su ejecución real en Windows todavía está pendiente. Utiliza la entrega Windows: el ZIP de Mac no contiene este ejecutable.
- Mac con macOS 13 o posterior: descomprime el ZIP y abre `Grimorio Base 3.app`. Puedes moverla a Aplicaciones. El paquete universal incluye Intel y Apple Silicon.

La primera versión no tiene un certificado comercial ni notarización. Windows o macOS pueden mostrar avisos o bloquear su apertura. Autoriza individualmente la aplicación solo si conoces su procedencia; no desactives las protecciones globales. En macOS consulta Ajustes del Sistema → Privacidad y seguridad; en Windows revisa el aviso de SmartScreen y su editor desconocido. Una política administrada de tu ordenador puede impedir la apertura.

## Partidas y copias

La partida activa se guarda automáticamente en el perfil del usuario del ordenador, separado del ejecutable. Compartir el ejecutable no comparte tus partidas. Copiarlo a otro ordenador tampoco transporta la partida: utiliza Descargar partida actual y Cargar partida.

En escritorio, los botones de descarga muestran Guardar como. Cancelar conserva los datos. Los archivos JSON son privados: incluyen personajes, nombres, notas e historial. La recuperación admite los archivos antiguos compatibles. Si vienes de Safari o Chrome, exporta desde ese navegador y carga el JSON aquí; la aplicación no lee sus perfiles.

Los límites siguen siendo diez acciones para deshacer y tres puntos de recuperación dentro de un presupuesto auxiliar de 2 MiB. Una partida demasiado grande puede no conservar copias auxiliares, pero nunca se recorta la partida activa. Importación: 50 MiB por partida y 200 MiB por rescate. Se avisa al exportar una copia mayor.

## Cerrar y recuperar

Cierra la ventana o utiliza Grimorio → Salir. La aplicación espera las operaciones y los borradores pendientes. Si no puede confirmar el guardado, permite reintentar, exportar un rescate o cancelar. Una salida normal termina sus procesos; no queda un servidor en funcionamiento.

Un apagado o cierre forzado puede interrumpir una acción todavía sin confirmar. Al abrir se recupera el último estado confirmado. Usa Grimorio → Recuperar partidas si falla la pantalla principal; no borres el perfil para resolver un error de arranque.

## Actualizar

Guarda una copia JSON, cierra el programa y sustituye el `.exe` o la `.app` por la versión nueva. La ubicación y el nombre del ejecutable pueden cambiar; los datos del usuario siguen en su perfil. No hay actualizador automático ni servicio en segundo plano.

El diagnóstico muestra versión de aplicación, versión de recursos y formato de partida. Actualizar la aplicación no implica cambiar el formato JSON 4.

## Alcance

No se instala en iPhone/iPad ni Android. El ejecutable Windows inicial es x64; no hay una entrega nativa para Windows ARM. Las arquitecturas solo se consideran verificadas cuando constan en la matriz técnica de pruebas reales.

El empaquetado no concede permiso de distribución del contenido de Blood on the Clocktower. Antes de compartir una copia con otras personas, resuelve el permiso indicado en las condiciones de The Pandemonium Institute. El escritorio no incorpora un actualizador automático. El flujo de GitHub Pages publica únicamente la demo web.

Los archivos y límites se explican en [Guardado y recuperación](guardado-y-recuperacion.md).
