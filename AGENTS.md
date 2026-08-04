# Reglas durables de VMC Spatial

Estas reglas aplican a personas y agentes que modifiquen el repositorio. Si una instrucción puntual entra en conflicto con seguridad, privacidad o licencias, se debe detener la publicación y pedir revisión.

## 1. Veracidad y clasificación

- Tratar la geometría, dimensiones, posiciones, inventario, métricas y exterior actuales como **DEMO / NO VERIFICADOS**.
- No describir el prototipo como plano conforme a obra, relevamiento, réplica fiel ni gemelo digital validado hasta que exista evidencia aprobada y trazable.
- No afirmar que datos o assets provienen de YPF, del edificio, de personal interno o de una fuente corporativa si esa procedencia no está documentada y autorizada.
- Mantener actualizado `docs/ASSUMPTIONS_AND_FACTS.md` cuando se confirme, descarte o agregue una hipótesis.
- Toda UI o export público que pueda confundirse con información real debe conservar una marca visible de “DEMO / NO VERIFICADO” hasta la aprobación formal.

## 2. Modelo de dominio y unidades

- El milímetro entero es la unidad de verdad para posiciones, longitudes, alturas, radios y dimensiones del dominio.
- No guardar metros ni números fraccionarios en campos dimensionales. Redondear en el límite de entrada con una regla explícita.
- Convertir milímetros a metros exclusivamente en el adaptador de renderizado, mediante una utilidad central como `toM(mm)`.
- En dominio, el plano horizontal es `x/y`; en Three.js se mapea a `x/z`, reservando `y` para altura.
- Las rotaciones se guardan en radianes. Los porcentajes se limitan a `0..100`.
- Los IDs deben ser estables y únicos dentro del documento. Duplicar un objeto siempre genera un ID nuevo.
- `schema: "vmc-spatial/6"` es el contrato importable vigente. Cualquier cambio incompatible requiere una versión nueva y una migración probada; nunca se reinterpreta silenciosamente una versión existente.
- El mismo documento validado debe alimentar plano 2D, escena 3D, inspector, persistencia e import/export.

## 3. Límites de arquitectura

La migración hacia estos límites es incremental; no se debe reescribir toda la aplicación para conseguirla:

- `domain/`: tipos, schemas, invariantes, migraciones y matemática pura. Sin React, Three.js ni APIs del navegador.
- `scene/`: Canvas, cámaras, luces, materiales y adaptación mm→m. No accede directamente a almacenamiento.
- `editor/`: comandos, selección, transformaciones, catálogo, snap y futuro undo/redo. No contiene geometría Three.js.
- `ui/`: componentes DOM, accesibilidad y composición visual. Consume acciones/selectores; no duplica reglas de dominio.
- `persistence/`: repositorios, autosave, IndexedDB futuro e import/export. Todo dato que entra se valida antes de llegar al estado.
- `assets/`: manifiestos, loaders, procedencia y presupuestos. Ningún asset entra sin licencia y origen documentados.
- `tests/`: unitarios, integración, regresión visual y E2E; los tests pueden cruzar límites, el código productivo no.

Dependencias permitidas: `scene`, `editor`, `ui` y `persistence` pueden depender de `domain`; `ui` compone los demás mediante APIs públicas. `domain` no depende de ninguna capa. Evitar dependencias directas `scene ↔ persistence` y estado duplicado entre 2D/3D.

## 4. Render y rendimiento

- React Three Fiber con `WebGLRenderer` es la ruta primaria y soportada.
- WebGPU solo puede agregarse detrás de un feature flag experimental, apagado por defecto, con detección de capacidad, manejo de error y fallback limpio a WebGL.
- No usar CSG pesado para paredes, puertas o ventanas. Preferir segmentos paramétricos con aberturas.
- Usar instancing para sillas, monitores, luminarias y otros elementos repetidos cuando la selección individual no lo impida.
- Mantener como presupuestos de la escena base: menos de 200 draw calls, menos de 250.000 triángulos visibles y texturas de hasta 2K por defecto. Son objetivos que deben medirse, no afirmaciones de cumplimiento.
- Liberar geometrías, materiales, texturas, listeners y animaciones al desmontar. No aceptar errores nuevos de consola.
- La calidad cinematográfica debe ser progresiva y desactivable; accesibilidad y legibilidad tienen prioridad sobre bloom, profundidad de campo o movimiento.

## 5. Estado, persistencia e importación

- Separar estado persistible de estado efímero de UI/cámara.
- Validar preset, almacenamiento local e importaciones JSON con el mismo schema antes de usarlos.
- Tratar archivos importados como entrada no confiable: aplicar límite de tamaño, schema estricto, rangos razonables y mensajes de error sin filtrar datos.
- La persistencia local no es un repositorio de información confidencial. El usuario debe poder resetearla.
- Dexie/IndexedDB es una evolución planificada; introducirlo con migraciones versionadas y fallback, no como sustitución silenciosa de datos existentes.

## 6. Assets, fotos y seguridad

- Cumplir `ASSET_POLICY.md` y `SECURITY_NOTES.md`.
- No subir al repositorio fotos internas, planos, nubes de puntos, EXIF, credenciales, accesos, cámaras, rutas de seguridad, datos personales ni detalles operacionales reales.
- No enviar evidencia interna a servicios externos —incluidos modelos de IA, conversores o almacenamiento— sin autorización escrita y alcance aprobado.
- No copiar assets, logos, texturas o fotografías por estar disponibles públicamente. Registrar autor, URL, licencia, fecha, hash y transformaciones.
- Los secretos nunca entran en `VITE_*`, el bundle, JSON de sala ni assets públicos.

## 7. Cambios y calidad

- Preservar funcionalidades existentes salvo que el cambio solicitado autorice expresamente una remoción.
- Hacer cambios pequeños, revisables y compatibles con Vercel. Justificar migraciones de stack antes de iniciarlas.
- Antes de integrar: `npm run check` (incluye typecheck, lint, tests y build). Para navegación, cámara, import/export o edición: agregar `npm run test:e2e`.
- Agregar tests a nuevas reglas de dominio, migraciones y bugs corregidos.
- No actualizar snapshots o baselines visuales sin inspeccionar el cambio y documentar por qué es correcto.
- Mantener README, arquitectura, modelo, seguridad y registro de supuestos sincronizados con cambios de comportamiento.

## 8. Criterio para afirmar fidelidad

Una parte puede pasar de “DEMO / NO VERIFICADA” a “confirmada” solo si se registran: elemento, valor o decisión, fuente autorizada, fecha, responsable de validación, tolerancia/incertidumbre y alcance permitido de publicación. La aprobación para usar un dato internamente no implica permiso para publicarlo.
