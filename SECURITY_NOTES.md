# Notas de seguridad y privacidad

## Modelo de publicación

La aplicación debe asumirse públicamente accesible cuando se despliega en Vercel. Todo lo incluido en JavaScript, sourcemaps publicados, `public/`, assets, JSON de ejemplo, logs cliente o variables `VITE_*` puede ser obtenido por un visitante.

La escena actual contiene únicamente datos y geometría **DEMO / NO VERIFICADOS**. No se usaron fotos ni planos internos. Esta clasificación debe mantenerse visible para impedir que precisión aparente se interprete como información operacional real.

## Datos que no deben publicarse

- planos internos o medidas precisas no aprobadas;
- accesos, credenciales, lectores, molinetes, cerraduras o patrones de ingreso;
- cámaras, puntos ciegos, alarmas y controles de seguridad;
- rutas operacionales, evacuación no pública o ubicación de infraestructura crítica;
- redes, equipos, direcciones, tokens, endpoints internos o configuraciones técnicas;
- nombres, rostros, matrículas, badges, agendas o información personal;
- contenido de monitores, pizarras, papeles, reflejos o metadata EXIF/GPS;
- datos de ocupación, turnos, presencia o comportamiento reales;
- fotos, CAD/BIM, nubes de puntos o inventarios internos sin aprobación de publicación.

Un dato autorizado para uso interno puede seguir prohibido en producción pública. La aprobación debe distinguir captura, procesamiento, uso interno y publicación.

## Manejo de evidencia

Antes de recibir fotos o medidas se debe definir dueño, propósito, acceso, almacenamiento, retención y destrucción. La captura debe seguir [`docs/PHOTO_MEASUREMENT_CHECKLIST.md`](./docs/PHOTO_MEASUREMENT_CHECKLIST.md).

- No subir evidencia interna al repositorio, issues, PRs, logs ni artefactos de CI.
- No enviarla a IA, OCR, fotogrametría, conversores o almacenamiento externo sin autorización escrita para ese proveedor y propósito.
- Mantener originales en un repositorio aprobado y restringido; trabajar con derivados minimizados cuando sea posible.
- Remover EXIF/GPS y revisar reflejos, pantallas y fondos antes de compartir.
- Registrar valores derivados con incertidumbre y permiso de publicación, sin enlazar una ubicación sensible innecesariamente.
- Aplicar el período de retención acordado y confirmar la eliminación de copias temporales.

Este repositorio no es el lugar de custodia de evidencia interna.

## Secretos y configuración

- No hay secretos legítimos en una SPA pública.
- Nunca colocar credenciales en código, JSON, assets, `localStorage`, `VITE_*` o variables expuestas al cliente.
- Los tokens de GitHub/Vercel pertenecen al entorno seguro del operador o CI y deben tener privilegio mínimo, rotación y alcance limitado.
- Si una futura integración necesita credenciales, usar una función/backend y autorización del lado servidor; el cliente recibe solo datos mínimos permitidos.
- No commitear `.env*` con valores. Proveer nombres/documentación sin secretos cuando sea necesario.

Si se filtra un secreto, eliminarlo del código no basta: revocarlo/rotarlo, revisar logs e historial y documentar el incidente por el canal aprobado.

## Importación JSON

Los archivos importados son entrada no confiable aunque provengan de un usuario conocido.

Controles de esta etapa:

- límite de tamaño antes de parsear;
- parseo JSON sin evaluación de código;
- validación estructural de la versión completa;
- rechazo atómico de valores inválidos, no finitos o fuera de rango;
- IDs y textos tratados como datos, nunca como HTML;
- mensajes de error que no copien el archivo ni datos sensibles;
- ninguna URL remota o asset arbitrario cargado desde el JSON v6.

Riesgos residuales a probar: archivos cerca del límite con arrays excesivos, colisión de IDs, coordenadas extremas, strings grandes, almacenamiento manipulado y presión de GPU por conteos altos. El límite de 5 MB no reemplaza límites por colección/campo.

## Persistencia del navegador

El almacenamiento local no está cifrado y es accesible a scripts del mismo origen, extensiones y usuarios del perfil. Por eso:

- guardar solo configuración publicable/no sensible;
- validar al leer, no confiar en lo guardado previamente;
- ofrecer reset y tolerar cuota/almacenamiento deshabilitado;
- no usarlo para identidad, autorización, auditoría ni custodia de evidencia;
- mantener la clave/versionado separado del schema de documento y planificar migraciones.

La futura adopción de IndexedDB/Dexie mejora capacidad y transacciones, no confidencialidad.

## Riesgos web y del renderer

La configuración productiva en `vercel.json` aplica CSP limitada al mismo origen, bloqueo de framing, `nosniff`, política de referer y permisos del navegador restringidos. El build público no genera sourcemaps. Si se agrega telemetría, una API o un origen de assets, estos controles se deben revisar de forma explícita antes de ampliar la CSP.

- Mantener dependencias actualizadas mediante PRs revisados; no ejecutar scripts de paquetes desconocidos sin evaluación.
- Evitar `dangerouslySetInnerHTML` para nombres/notas importados.
- Restringir URLs de assets a manifiestos aprobados; no aceptar URLs arbitrarias del documento.
- Tratar pérdida de contexto WebGL y errores de shader/asset sin loops ni datos en consola.
- Limitar DPR, conteos y calidad para reducir denegación de servicio local por GPU/memoria.
- Liberar listeners, timers y recursos Three.js al desmontar.
- Mantener la Content Security Policy sin `unsafe-inline` ni `unsafe-eval`; ampliar orígenes solo con una necesidad revisada.
- Mantener los sourcemaps fuera del despliegue público; no confiar en ello para ocultar secretos.

## Telemetría y capturas

No se incorpora telemetría de uso real por defecto. Antes de agregarla se requiere definir finalidad, base legal/consentimiento cuando aplique, eventos permitidos, retención, acceso y proveedor. No registrar contenido del documento, nombres importados, ubicación, fotos ni pose exacta de navegación si puede revelar comportamiento.

La captura de escena actual genera y descarga un PNG localmente, sin upload automático. Debe conservar estas reglas:

- advertir que puede incluir información visible;
- funcionar localmente sin upload automático;
- no adjuntar EXIF/ubicación;
- requerir acción explícita para guardar/compartir.

## Etiquetas y gobernanza

Estados recomendados para datos/elementos:

1. `DEMO / NO VERIFICADO` — creado para el prototipo, sin evidencia aprobada;
2. `EVIDENCIA RESTRINGIDA` — recibido con autorización limitada, no publicable;
3. `VALIDADO PARA USO INTERNO` — valor confirmado, alcance interno;
4. `APROBADO PARA PUBLICACIÓN` — revisión específica y trazable.

No saltar estados por semejanza visual. El registro en `docs/ASSUMPTIONS_AND_FACTS.md` debe indicar evidencia, fecha, validador, incertidumbre y alcance sin exponer la evidencia restringida.

## Checklist previo a producción

- [ ] no hay secretos en bundle, historial, `.env`, assets o sourcemaps;
- [ ] geometría y datos visibles tienen clasificación y aprobación de publicación;
- [ ] la marca “DEMO / NO VERIFICADO” permanece donde corresponda;
- [ ] manifest/licencias de assets están completos;
- [ ] fotos, EXIF, planos y artefactos restringidos están ausentes;
- [ ] imports inválidos y almacenamiento corrupto se rechazan de forma segura;
- [ ] consola, logs y telemetría no contienen documento ni datos personales;
- [ ] dependencias, headers y configuración de Vercel fueron revisados;
- [ ] fallback 2D/WebGL y pérdida de contexto fueron probados;
- [ ] existe responsable y procedimiento para retirar una publicación incorrecta.

Ante incertidumbre sobre sensibilidad, no desplegar ese dato o asset y solicitar revisión del propietario de la información y de seguridad/legal.
