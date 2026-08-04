# Arquitectura

## Estado y alcance

VMC Spatial es hoy una SPA cliente construida con React + Vite. El árbol existente agrupa la composición en `src/App.tsx`, el render y los controles en `src/components/`, el preset en `src/data/` y utilidades de geometría/persistencia en `src/lib/`.

La Fase 1 evolucionó esa base sin una migración masiva. La Fase 2 agrega un exterior procedural como vertical separado, con LOD, instancing y diagnóstico opt-in, sin cambiar el contrato importable de la sala. Toda geometría y dato espacial actual sigue clasificado como **DEMO / NO VERIFICADO**.

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
                                                 ├─> contexto conceptual
                                                 └─> diagnóstico opt-in
```

La validación de carga e importación ya forma parte de Fase 1. El preset está tipado, pero debe cruzar la validación de runtime antes de considerar cerrada la frontera; guardado/exportación reciben hoy el documento controlado por la aplicación y deben validar si en el futuro aceptan otra fuente.

Existe un único `VmcDocument` canónico. Selección, modo, cámara, calidad y otros controles de interfaz son estado efímero y no deben mezclarse con el documento exportable.

`EXTERIOR_DEMO_SPEC` es otro contrato de dominio, deliberadamente separado. Describe massing, jardín, contexto conceptual, anclas DEMO y umbrales de LOD en milímetros enteros. No se serializa dentro de `VmcDocument`, no participa de import/export y no modifica la interpretación de `schema: "vmc-spatial/6"`. Sus parámetros públicos siguen siendo hipótesis visuales, no hechos físicos confirmados.

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

La escena actual se construye con geometría, materiales y texturas procedurales generados en código. La investigación de Fase 2 se registró en [`docs/PHASE_2_EXTERIOR.md`](./docs/PHASE_2_EXTERIOR.md) bajo la regla `REFERENCE ONLY / NO ASSET COPIED`: no se incorporaron fotos, modelos, planos, logos ni texturas externas. En fases posteriores, los assets solo cruzarán la frontera de `assets/` si tienen procedencia, licencia y aprobación documentadas. Las fotos de relevamiento son evidencia restringida, no assets públicos por defecto.

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
- calidad resuelta automáticamente, techo y estado del postprocesado;
- drag activo, hover, mensajes y progreso de carga.

Las actualizaciones de dominio deben expresarse como operaciones deterministas. El futuro undo/redo guardará comandos o patches de documento, nunca referencias mutables a objetos Three.js.

## Cámara y navegación

La API de navegación debe exponer intenciones (`exterior`, `piso16`, `interior`, `cenital`, `reset`) en lugar de coordenadas desde la UI. La capa de cámara resuelve poses y transiciones, cancela una transición anterior al iniciar otra y respeta `prefers-reduced-motion`.

Las tres experiencias objetivo son:

1. recorrido exterior cinematográfico;
2. vuelo libre exterior → piso 16;
3. navegación interior en primera persona.

La Fase 1 ofrece cámara orbital, transición guiada exterior → piso 16 → interior y atajos cenital/reset. La Fase 2 conserva ese recorrido sobre el nuevo exterior procedural y marca toda captura PNG con `DEMO · NO VERIFICADO`. Vuelo libre, primera persona y colisiones siguen pendientes; no deben documentarse como terminados.

## Iluminación y calidad

Los presets deben separar al menos `baja`, `equilibrada` y `cinematográfica`. Cada preset controla resolución, sombras, environment, DPR y postprocesado, pero no altera el documento espacial. La detección automática puede sugerir un preset; el usuario conserva el control.

Presupuestos deseados para la escena base:

- 60 FPS en laptop moderna de gama media y más de 30 FPS en equipos razonables;
- menos de 200 draw calls en la vista por defecto;
- menos de 250.000 triángulos visibles;
- texturas de hasta 2K por defecto;
- assets pesados lazy-loaded y repetidos mediante instancing.

Son objetivos de aceptación. Solo se puede declarar cumplimiento después de registrar dispositivo, navegador, resolución, preset, escena y medición.

### LOD, instancing y diagnóstico exterior

- La calidad resuelta fija un techo de detalle exterior: rendimiento usa detalle medio; equilibrada y cinematográfica habilitan detalle cercano.
- La fachada usa niveles cercano, medio y lejano; al aumentar la distancia reduce bandas y líneas hasta conservar sólo el massing.
- La densidad del contexto conceptual también se reduce por nivel de detalle.
- Vegetación, paños del jardín, bloques de contexto y columnas repetidas usan `InstancedMesh` y geometrías compartidas.
- `?diagnostics=1` monta el colector de métricas y expone `window.__VMC_SCENE_METRICS__` con draw calls, triángulos, líneas, puntos, geometrías, texturas, programas, DPR, viewport, etapa y calidad.
- El colector es opt-in, se desmonta de forma limpia y no convierte los presupuestos objetivo en afirmaciones de cumplimiento.

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

- `domain`: schema de sala, contrato exterior separado, invariantes, conversión de unidades, geometría pura y migraciones.
- `persistence`: localStorage corrupto/ausente, límite de archivo, import/export round-trip.
- `editor`: comandos, snap, IDs, duplicado, borrado y futuro undo/redo.
- `scene`: geometría procedural exterior, LOD, smoke tests, creación/destrucción, selección y fallback; perfiles de rendimiento fuera de unit tests.
- `ui`: teclado, nombres accesibles, foco, reduced motion y estados de carga/error.
- E2E: carga, cambio 2D/3D, entrada a sala, edición, persistencia, reset e import/export.

## Roadmap de arquitectura

- **Fase 1:** renderer WebGL, cámara, iluminación, navegación mínima, validación y herramientas de calidad.
- **Fase 2 (actual):** exterior procedural estilizado, contrato separado, referencias públicas documentadas, LOD, instancing, diagnóstico y capturas marcadas; continúa DEMO.
- **Fase 3:** transición cinematográfica hacia piso 16 con fallback de movimiento reducido.
- **Fase 4:** catálogo paramétrico, edición avanzada, objetos versionados e instancing.
- **Fase 5:** Dexie/IndexedDB, migraciones, undo/redo, import/export ampliado y plano 2D consolidado.
- **Fase 6:** presupuestos medidos, accesibilidad, pruebas, auditoría de assets, hardening y deploy.

Las fases pueden entregar verticales pequeños; ninguna autoriza publicar datos internos o declarar fidelidad sin evidencia.
