# Arquitectura

## Estado y alcance

VMC Spatial es hoy una SPA cliente construida con React + Vite. El árbol existente agrupa la composición en `src/App.tsx`, el render y los controles en `src/components/`, el preset en `src/data/` y utilidades de geometría/persistencia en `src/lib/`.

La Fase 1 evolucionó esa base sin una migración masiva. La Fase 2 agregó un exterior procedural como vertical separado, con LOD, instancing y diagnóstico opt-in. La Fase 3 incorpora rutas de cámara tokenizadas sobre un marco compartido, un cruce continuo con coexistencia temporal de exterior e interior y un LOD interior instanciado para presentación; también elimina el portal artificial y los edificios circundantes del contrato y del renderer. Ninguna de estas fases cambia el contrato importable de la sala. Toda geometría, inventario y dato espacial actual sigue clasificado como **DEMO / NO VERIFICADO**.

## Flujo de ejecución actual

```text
localStorage ───┐
import JSON ────┴─> validación Zod vmc-spatial/6 ─┐
preset TS tipado ─────────────────────────────────┴─> estado de aplicación
                                                      │
                                                      ├─> plano 2D
                                                      ├─> interior WebGL 3D
                                                      ├─> inspector/editor
                                                      └─> export JSON + autosave

EXTERIOR_DEMO_SPEC ──> adaptador mm→m ──> exterior WebGL procedural
       │                                         │
       └─ status demo-unverified                 ├─> LOD de fachada
                                                 ├─> sitio conceptual sin edificios vecinos
                                                 └─> envolvente procedural sin portal

CINEMATIC_ACCESS_ROUTES v2 ──> transición con token ──> adaptador de cámara
       │                              │                         │
       └─ shared-world en mm          ├─> stage estable         ├─> mm→m + Hermite C1
                                      └─> escenas coexistentes  └─> diagnóstico opt-in
```

La validación de carga e importación ya forma parte de Fase 1. El preset está tipado, pero debe cruzar la validación de runtime antes de considerar cerrada la frontera; guardado/exportación reciben hoy el documento controlado por la aplicación y deben validar si en el futuro aceptan otra fuente.

Existe un único `VmcDocument` canónico. Selección, modo, cámara, calidad y otros controles de interfaz son estado efímero y no deben mezclarse con el documento exportable.

`EXTERIOR_DEMO_SPEC` es otro contrato de dominio, deliberadamente separado. Describe massing, jardín, contexto conceptual, anclas DEMO y umbrales de LOD en milímetros enteros. No se serializa dentro de `VmcDocument`, no participa de import/export y no modifica la interpretación de `schema: "vmc-spatial/6"`. Sus parámetros públicos siguen siendo hipótesis visuales, no hechos físicos confirmados.

`CINEMATIC_ACCESS_ROUTES` mantiene la misma separación. Su versión `v2` declara rutas dirigidas DEMO entre etapas estables, con IDs, waypoints, posiciones y objetivos de mirada en milímetros enteros dentro de un único marco `shared-world`. Cada ejecución recibe un token efímero; las callbacks sólo pueden mutar la transición que conserva ese ID. El dominio no conoce Three.js ni curvas: `scene/cameraPath.ts` convierte a metros y muestrea una curva Hermite con continuidad C1.

## Decisiones estructurales

### Unidades y coordenadas

- El dominio almacena posiciones y dimensiones en milímetros enteros.
- El dominio usa `x/y` como plano del piso.
- La escena usa `x/z` como plano horizontal y `y` como altura.
- La conversión `mm / 1000` se ejecuta solo al entrar a la capa `scene`.
- Las rotaciones se almacenan en radianes; no son dimensiones lineales.

Esta frontera evita que un mismo objeto tenga escalas distintas en plano, inspector y escena. Las geometrías procedurales que hoy contienen medidas directamente en metros se consideran detalles de render; los valores configurables deben nacer en dominio y cruzar el adaptador.

### Renderer

WebGL mediante React Three Fiber es la ruta productiva primaria. El postprocesado es opcional y debe poder apagarse según capacidad o preferencia. WebGPU no forma parte de la ruta actual; si se incorpora, será experimental y deberá cumplir este contrato:

1. feature flag explícito, desactivado por defecto;
2. detección de capacidad antes de crear el renderer;
3. manejo de inicialización fallida;
4. fallback a WebGL sin perder documento ni navegación;
5. pruebas separadas, sin convertir WebGPU en requisito del build.

### Persistencia

La implementación de esta etapa mantiene almacenamiento local del navegador e import/export JSON. Los datos se validan contra `vmc-spatial/6` al ingresar. La clave histórica de almacenamiento es una decisión de infraestructura, no la versión del documento.

Dexie/IndexedDB se difiere hasta que existan necesidades reales de historial, catálogos o documentos múltiples. Su incorporación deberá usar repositorios, migraciones y pruebas; la UI no debe importar Dexie directamente.

### Assets y evidencia

La escena actual se construye con geometría, materiales y texturas procedurales generados en código. La investigación de Fase 2 se registró en [`docs/PHASE_2_EXTERIOR.md`](./docs/PHASE_2_EXTERIOR.md) bajo la regla `REFERENCE ONLY / NO ASSET COPIED`: no se incorporaron fotos, modelos, planos, logos ni texturas externas. El lenguaje visual procedural del interior puede orientarse con referencias restringidas sin copiar sus archivos: ninguna fotografía entra al repositorio, al bundle o al despliegue. En fases posteriores, los assets solo cruzarán la frontera de `assets/` si tienen procedencia, licencia y aprobación documentadas. Las fotos de relevamiento son evidencia restringida, no assets públicos por defecto.

## Límites objetivo

Los directorios siguientes son límites de responsabilidad. El árbol actual se migrará gradualmente cuando una funcionalidad lo justifique.

| Límite         | Responsabilidad                                                   | Puede depender de                              | No debe contener                                 |
| -------------- | ----------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------ |
| `domain/`      | Tipos, schemas, IDs, invariantes, migraciones, matemática pura    | Ninguna capa de aplicación                     | React, Three.js, DOM, localStorage               |
| `scene/`       | Canvas, cámaras, luces, materiales, loaders, mm→m                 | `domain/`, contratos de assets                 | Persistencia, reglas de importación, paneles DOM |
| `editor/`      | Store/comandos, selección, catálogo, snap, undo/redo              | `domain/`, interfaces de persistencia          | Meshes, materiales, acceso directo a IndexedDB   |
| `ui/`          | Controles DOM, accesibilidad, layout, feedback                    | APIs públicas de `editor/` y composición       | Reglas geométricas duplicadas, loaders de Three  |
| `persistence/` | Validación de entrada, repositorios, migraciones, import/export   | `domain/`                                      | React, cámara, objetos Three.js                  |
| `assets/`      | Manifiestos, licencias, presets de materiales, carga/optimización | Contratos puros del dominio cuando corresponda | Evidencia no aprobada, secretos                  |
| `tests/`       | Unitarios, integración, E2E y regresión visual                    | Todas las APIs públicas bajo prueba            | Datos sensibles o snapshots sin revisión         |

Dirección esperada:

```text
                 ┌──────────── ui ─────────────┐
                 │                            │
domain <──── editor                         scene <──── assets
   ▲             │                            │
   └──── persistence ─────────────────────────┘ (solo vía composición)
```

`domain` no conoce ninguna otra capa. La línea entre `scene` y `persistence` representa composición en la raíz de la aplicación, no una dependencia directa.

## Árbol incremental propuesto

```text
src/
  app/                    # composición y providers
  domain/
    room/                 # tipos, schema e invariantes
    exterior/             # contrato DEMO separado; no forma parte de vmc-spatial/6
    geometry/             # matemática pura en mm
  scene/
    cameras/
    environment/
    exterior/             # massing, fachada, contexto, LOD e instancing
    room/
    rendering/            # WebGL y calidad; WebGPU experimental futuro
  editor/
    commands/
    store/
    catalog/
  ui/
    controls/
    panels/
  persistence/
    local/
    import-export/
    migrations/
  assets/
    manifests/
  data/                   # presets demo validados
tests/
  unit/
  integration/
  e2e/
```

No es un mandato para mover archivos sin beneficio. La regla es que todo código nuevo se ubique en su límite natural y que los componentes existentes se extraigan al ser modificados sustancialmente.

## Estado y comandos

### Estado persistible

- `VmcDocument` validado y su `actualizado`.
- Preferencia de calidad y modo día/noche, en un storage de experiencia versionado separado.

### Estado efímero

- objeto seleccionado;
- modo explorar/editar y vista 2D/3D;
- pose y transición de cámara;
- token, fase y progreso del recorrido, y árbol WebGL activo durante el handoff;
- calidad resuelta automáticamente, techo y estado del postprocesado;
- drag activo, hover, mensajes y progreso de carga.

Las actualizaciones de dominio deben expresarse como operaciones deterministas. El futuro undo/redo guardará comandos o patches de documento, nunca referencias mutables a objetos Three.js.

## Cámara y navegación

La API de navegación expone intenciones (`exterior`, `piso16`, `interior`, `cenital`, `reset`) en lugar de coordenadas desde la UI. La capa de cámara resuelve poses y transiciones, invalida una transición anterior al iniciar otra y respeta `prefers-reduced-motion`.

`stage` representa el último destino estable completado. `activeScene` representa el destino operativo de la navegación. Durante una transición que toca el interior, `Scene3D` mantiene montados simultáneamente los árboles exterior e interior; fuera del cruce conserva sólo el árbol estable. El handoff cambia `activeScene` de forma atómica sobre la misma muestra de cámara y el mismo frame, sin portal, velo opaco ni pausas artificiales.

Las rutas `v2` y sus waypoints viven en `domain/cinematicAccess.ts`, clasificados `demo-unverified` y expresados en milímetros enteros dentro del marco `shared-world`. La conversión a metros, el cálculo previo de tangentes y las curvas Hermite con continuidad C1 para posición/objetivo viven sólo en `scene/cameraPath.ts`. Las tangentes nulas se reservan para los extremos del recorrido, sin introducir detenciones en los waypoints internos. `CameraDirector` conserva la transición activa en refs durante cada frame y publica al store únicamente cambios discretos de fase/progreso.

El handoff exterior → interior está parametrizado alrededor de `100 mm` detrás de la envolvente procedural DEMO. Las pruebas de muestreo fijan como objetivo técnico que ningún cruce entre escenas exceda `0,5 m` por frame a 60 Hz. Ambas cifras describen el prototipo y su validación matemática; no prueban la ubicación de una fachada real ni garantizan FPS en un dispositivo.

Las tres experiencias objetivo son:

1. recorrido exterior cinematográfico;
2. vuelo libre exterior → piso 16;
3. navegación interior en primera persona.

La Fase 1 ofrece cámara orbital y atajos cenital/reset. La Fase 2 monta el recorrido sobre el exterior procedural y marca toda captura PNG con `DEMO · NO VERIFICADO`. La Fase 3 entrega la aproximación cinematográfica al piso 16 y el cruce continuo hacia el interior, con cancelación token-safe y un fallback directo de movimiento reducido. Vuelo libre, primera persona y colisiones siguen pendientes; no deben documentarse como terminados.

No existe un objeto de portal o acceso artificial en fachada. La cámara cruza la envolvente procedural DEMO; su posición, forma y transitabilidad no describen una ventana, abertura ni ruta física confirmada.

## Iluminación y calidad

Los presets deben separar al menos `baja`, `equilibrada` y `cinematográfica`. Cada preset controla resolución, sombras, environment, DPR y postprocesado, pero no altera el documento espacial. La detección automática puede sugerir un preset; el usuario conserva el control.

Presupuestos deseados para la escena base:

- 60 FPS en laptop moderna de gama media y más de 30 FPS en equipos razonables;
- menos de 200 draw calls en la vista por defecto;
- menos de 250.000 triángulos visibles;
- texturas de hasta 2K por defecto;
- assets pesados lazy-loaded y repetidos mediante instancing.

Son objetivos de aceptación. Solo se puede declarar cumplimiento después de registrar dispositivo, navegador, resolución, preset, escena y medición.

### LOD, instancing y diagnóstico

- La calidad resuelta fija un techo de detalle exterior: rendimiento usa detalle medio; equilibrada y cinematográfica habilitan detalle cercano.
- La fachada usa niveles cercano, medio y lejano; al aumentar la distancia reduce bandas y líneas hasta conservar sólo el massing.
- Los edificios circundantes se eliminaron tanto de `EXTERIOR_DEMO_SPEC` como de `UrbanContext`; no existe un nivel de detalle que vuelva a montarlos.
- Permanecen suelo/plaza, paseo, vegetación, calle, agua y pérgola conceptuales. Vegetación, paños del jardín y columnas repetidas usan `InstancedMesh` y geometrías compartidas cuando corresponde.
- `?diagnostics=1` monta el colector de métricas y expone `window.__VMC_SCENE_METRICS__` con draw calls, triángulos, líneas, puntos, geometrías, texturas, programas, DPR, viewport, etapa y calidad.
- El mismo opt-in habilita `window.__VMC_CAMERA_DIAGNOSTICS__` con token/ruta, fase, progreso, `stage`, `activeScene`, movimiento reducido, pose, objetivo y FOV.
- Con ese opt-in, `vmc-camera-diagnostics` emite cada pose desde el mismo frame que la produjo; las pruebas de continuidad no dependen de un intervalo de polling.
- Los colectores se desmontan de forma limpia y no convierten los presupuestos objetivo en afirmaciones de cumplimiento.
- En presentación, el interior deriva geometría instanciada del mismo `VmcDocument` y preserva el layout y las transformaciones originales: 130 puestos, 184 sillas, 130 monitores y 98 pantallas de videowall en el documento DEMO. Estas cantidades son inventario técnico del preset, no hechos físicos.
- En estados estables se monta sólo la escena activa. Durante un cruce que toca el interior, exterior e interior coexisten intencionalmente hasta completar la entrega; edición 3D conserva condicionalmente el renderer detallado.
- El benchmark equilibrado contextual está en `docs/benchmarks/phase3-balanced-2026-08-04.json`: estados estables y rutas continuas quedan bajo 200 llamadas y 250.000 triángulos en el hardware/viewport registrados. El horneado offscreen único de sombras de contacto se informa por separado y el renderer detallado de edición conserva otro presupuesto.

## Paredes, aberturas y repetición

- Paredes: segmentos paramétricos con aberturas declarativas; evitar CSG pesado.
- Puertas/ventanas: entidades o aberturas referenciadas por segmento, con medidas en mm.
- Sillas, monitores y luminarias: instancing cuando comparten geometría/material.
- Selección individual de instancias: mapear `instanceId` a ID de dominio estable.
- 2D y 3D: derivar ambos del mismo segmento/objeto, sin mantener copias geométricas.

## Manejo de errores y fallback

- Si la validación del preset falla, mostrar un estado de error seguro; no renderizar datos parcialmente interpretados.
- Si el almacenamiento local está corrupto, ignorarlo de manera explícita y ofrecer reset, conservando el preset validado.
- Si WebGL no está disponible o el contexto se pierde, mostrar una explicación y mantener, cuando sea posible, el plano 2D.
- Si falla un asset opcional, usar un placeholder aprobado y registrar el error; la escena mínima no debe depender de assets pesados.
- Los errores de importación no deben imprimir contenido potencialmente sensible en consola o telemetría.

## Pruebas por límite

- `domain`: schema de sala, contratos exterior/cinematográfico separados, IDs, milímetros enteros, rutas `v2` en `shared-world`, handoff, invariantes, geometría pura y migraciones.
- `persistence`: localStorage corrupto/ausente, límite de archivo, import/export round-trip.
- `editor`: comandos, snap, IDs, duplicado, borrado y futuro undo/redo.
- `scene`: geometría procedural exterior, ausencia de edificios circundantes y portal, adaptación mm→m, curva Hermite finita y C1, continuidad menor a `0,5 m/frame` a 60 Hz en handoffs, coexistencia temporal, LOD, creación/destrucción, selección y fallback; perfiles de rendimiento fuera de unit tests.
- `ui`: teclado, nombres accesibles, foco, progreso/anuncios continuos de transición, cancelación, reduced motion y estados de carga/error, sin velo de fase opaco.
- E2E: carga, cambio 2D/3D, recorrido cinematográfico real, cruce continuo con ambos árboles montados, cancelación sin callback tardía, movimiento reducido, métricas opt-in, edición, persistencia, reset e import/export.

## Roadmap de arquitectura

- **Fase 1:** renderer WebGL, cámara, iluminación, navegación mínima, validación y herramientas de calidad.
- **Fase 2 (entregada):** exterior procedural estilizado, contrato separado, referencias públicas documentadas, LOD, instancing, diagnóstico y capturas marcadas; continúa DEMO.
- **Fase 3 (actual):** rutas cinematográficas DEMO `v2` en `shared-world`, Hermite C1, handoff atómico con coexistencia temporal, UI accesible sin portal ni velo opaco, cancelación segura, fallback de movimiento reducido, interior instanciado derivado del documento y exterior sin edificios circundantes.
- **Fase 4:** catálogo paramétrico, edición avanzada, objetos versionados e instancing.
- **Fase 5:** Dexie/IndexedDB, migraciones, undo/redo, import/export ampliado y plano 2D consolidado.
- **Fase 6:** presupuestos medidos, accesibilidad, pruebas, auditoría de assets, hardening y deploy.

Las fases pueden entregar verticales pequeños; ninguna autoriza publicar datos internos o declarar fidelidad sin evidencia.
