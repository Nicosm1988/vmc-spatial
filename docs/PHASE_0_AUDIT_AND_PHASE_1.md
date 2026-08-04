# Auditoría de Fase 0 y plan de Fase 1

Fecha de inspección: 2026-08-04. Este documento registra el punto de partida; no es un certificado del estado actual de producción.

## Resultado ejecutivo

La base es una SPA Vite/React/Three.js funcional y aprovechable. Ya contiene un plano 2D, una escena WebGL 3D, controles de cámara, edición básica, un preset `vmc-spatial/6` y persistencia local. No se recomienda migrar de framework ni reemplazar la aplicación.

La prioridad de Fase 1 es estabilizar la plataforma existente: renderer WebGL, ciclo de vida de cámara/Canvas, presets de calidad, validación de datos, TypeScript estricto y una red de tests/comandos reproducibles. El realismo exterior y la fidelidad interior deben esperar evidencia y assets autorizados.

La escena inspeccionada no proviene de fotos, planos o mediciones aprobadas. Toda geometría, dimensión, inventario y analítica es **DEMO / NO VERIFICADA**.

## Diagnóstico del repositorio

### Stack observado

- React 18 + TypeScript + Vite 5.
- Three.js + `@react-three/fiber` + `@react-three/drei`.
- Postprocesado mediante `@react-three/postprocessing`.
- SPA estática con salida `dist` y rewrite de Vercel a `index.html`.
- Documento de sala `vmc-spatial/6` en memoria y preset TypeScript.
- Persistencia cliente e import/export JSON.

### Funcionalidad que debe preservarse

- modos explorar, editar 2D y editar 3D;
- alternancia entre plano 2D y escena 3D;
- selección y arrastre de zonas/videowalls;
- alta, duplicado, rotación, resize y eliminación;
- configuración de pares de puestos y pantallas/filas;
- día/noche, techo y postprocesado/calidad equivalente;
- cámara entrar/cenital/reset y navegación orbital;
- insights demostrativos;
- autosave, importación, exportación y reset.

### Fortalezas

- 2D y 3D reciben el mismo documento, una base correcta para evitar divergencia.
- La conversión mm→m ya está centralizada para parte del render.
- El mobiliario y el exterior son procedurales: no hay bloqueo inmediato por assets externos.
- La configuración de Vercel es pequeña y compatible con una SPA.
- El producto ya permite validar interacción y composición sin esperar el relevamiento real.

### Brechas iniciales

| Área          | Punto de partida inspeccionado                                     | Necesidad                                             |
| ------------- | ------------------------------------------------------------------ | ----------------------------------------------------- |
| Tipado        | Configuración no estricta y varios valores/eventos débiles         | TypeScript estricto sin errores                       |
| Validación    | La base histórica confiaba principalmente en la etiqueta de schema | Validación completa y común en todos los ingresos     |
| Estado        | Estado de documento y UI concentrado en `App`                      | Separar preferencias/cámara de datos persistibles     |
| Persistencia  | Almacenamiento local, sin repositorio/migraciones                  | Robustecer ahora; Dexie en fase posterior             |
| Cámara        | API imperativa acoplada a controles                                | Intenciones y transiciones cancelables/reduced motion |
| Calidad       | Toggle cinematográfico binario                                     | Perfiles progresivos y fallback                       |
| WebGPU        | No implementado                                                    | Mantenerlo fuera de ruta productiva; flag futuro      |
| Tests         | Sin suite reproducible en el punto de partida                      | Vitest + Testing Library + Playwright                 |
| Lint/formato  | Sin scripts en el punto de partida                                 | ESLint/Prettier y comando agregado `check`            |
| Accesibilidad | Controles visuales y emojis sin cobertura suficiente               | Nombres, teclado, foco y reduced motion               |
| Arquitectura  | Componentes/lib planos                                             | Migración incremental por límites, no rewrite         |
| Fidelidad     | Geometría y métricas demo                                          | Evidencia autorizada y trazable antes de claims       |

### Riesgos técnicos observados

- Recrear el `Canvas` al cambiar vista/estado puede perder contexto, cámara y recursos; la escena debe mantener un lifecycle estable.
- La torre y el entorno mezclan un origen situado en piso 16 con coordenadas de suelo; cada elemento debe validarse contra un marco común para evitar volúmenes “flotantes”.
- Geometrías/texturas creadas en hooks necesitan ownership y disposal explícitos al desmontar o reemplazar documentos.
- `preserveDrawingBuffer` facilita capturas pero puede costar memoria/rendimiento; debe activarse solo cuando el caso de captura lo justifique.
- Postprocesado, sombras grandes y DPR alto pueden incumplir el objetivo en equipos medios.
- IDs basados en tiempo pueden colisionar y dificultar undo/redo/importaciones.
- Datos visualmente precisos pero no validados pueden confundirse con información real o sensible.

## Estado de repositorio y deploy en la auditoría

Este es un registro histórico del inicio y puede quedar resuelto por el trabajo posterior:

- el código base inspeccionado provenía de `nicosanmarcoypf/vmc-spatial` y estaba anidado en el commit de origen;
- el workspace fue aplanado para que `package.json`, `src/` y `vercel.json` queden en la raíz;
- el destino solicitado es `Nicosm1988/vmc-spatial`;
- el proyecto de Vercel solicitado es `nmarcosan-2648s-projects/vmc-spatial`;
- al auditar, ese proyecto no tenía deployments/alias de producción y el repositorio destino estaba vacío;
- Vercel tenía Root Directory equivalente a `.`, compatible con el árbol aplanado.

Antes de afirmar “en producción” se deben confirmar por separado: commit visible en el repositorio destino, deployment exitoso, alias público y smoke test del alias. El dashboard de Vercel no es la URL pública.

## Árbol de cambios propuesto

La Fase 1 puede crear límites pequeños alrededor de los archivos existentes:

```text
package.json                     # scripts/dependencias de calidad
tsconfig.json                    # strict
eslint.config.*                  # lint
prettier.config.*                # formato
vitest.config.*                  # unit/integration
playwright.config.*              # E2E
src/
  App.tsx                        # composición; preserva capacidades
  types.ts                       # contrato v6 compatible
  domain/
    documentSchema.ts            # Zod + invariantes
  state/
    useExperienceStore.ts        # UI/cámara/calidad, no documento duplicado
  scene/
    cameraTypes.ts
    CameraDirector.tsx
    qualityProfiles.ts
    CinematicEffects.tsx
  components/
    Scene3D.tsx                  # renderer estable y composición
    CameraPanel.tsx              # intenciones de navegación
  lib/
    persistence.ts               # entradas validadas
tests/
  unit/
  integration/
  e2e/
```

Los nombres exactos pueden ajustarse a la implementación, pero deben respetar los límites de [`ARCHITECTURE.md`](../ARCHITECTURE.md). No mover archivos que no se tocan solo para completar un árbol ideal.

## Plan de Fase 1

### 1. Baseline reproducible

Archivos previstos: `package.json`, lockfile, TypeScript, ESLint, Prettier, Vitest y Playwright.

- agregar scripts `typecheck`, `lint`, `test`, `test:watch`, `test:e2e`, `format`, `format:check` y `check`;
- activar strict y corregir tipos sin cambiar comportamiento;
- crear smoke test de aplicación y fixture v6;
- documentar la versión de Node usada en CI/deploy cuando se defina.

Riesgo: reglas nuevas pueden exponer deuda extensa. Resolver por código o excepciones puntuales justificadas; no desactivar strict global para “pasar”.

### 2. Validación y persistencia segura

Archivos previstos: schema de dominio, preset, `src/lib/persistence.ts`, tests.

- definir Zod para la forma completa `vmc-spatial/6` e invariantes cruzadas;
- validar preset, localStorage e importación con la misma función;
- conservar compatibilidad con exportaciones v6 válidas;
- rechazar archivos atómicamente, con límites de tamaño/colección/rangos;
- mantener localStorage en Fase 1 y dejar Dexie fuera del alcance.

Riesgo: datos históricos aceptados de manera laxa pueden fallar. Proveer error/reset claro; no coercionar silenciosamente valores ambiguos.

### 3. Estado de experiencia

Archivos previstos: store de experiencia y `App.tsx`.

- mover stage de navegación, noche y perfil de calidad a Zustand;
- conservar `VmcDocument` como fuente única y separada;
- no persistir pose de cámara o selección por accidente;
- usar selectores pequeños para evitar renders globales.

Riesgo: dos fuentes de verdad durante la extracción. Eliminar la antigua en el mismo cambio o crear un adaptador temporal explícito y testeado.

### 4. Renderer, iluminación y calidad

Archivos previstos: `Scene3D`, efectos y perfiles de calidad.

- mantener un Canvas WebGL estable entre transiciones;
- lazy-load de postprocesado y desactivación por perfil;
- acotar DPR, sombras y efectos;
- liberar recursos y listeners;
- conservar un modo legible sin efectos;
- dejar WebGPU solo documentado como flag futuro.

Riesgo: cambio visual regresivo o pérdida de contexto. Comparar capturas revisadas y consola, y no aprobar baselines automáticamente.

### 5. Cámara y navegación mínima

Archivos previstos: director de cámara, tipos y panel.

- exponer acciones exterior, ir a piso 16, entrar, cenital y reset;
- interpolar poses sin remonte de Canvas;
- cancelar una transición cuando comienza otra o el usuario toma control;
- respetar reduced motion;
- conservar OrbitControls y edición existentes.

Riesgo: mareo, clipping y conflicto con drag. Acotar duración/easing, near/far y bloquear solo el control necesario durante la transición.

### 6. Verificación y deploy de preview

- ejecutar controles locales;
- probar el flujo crítico en Chromium;
- generar build de producción;
- desplegar preview al proyecto solicitado;
- hacer smoke test de la URL real y luego promover a producción solo si cumple.

## Criterios de aceptación de Fase 1

- [ ] `npm ci` reproducible desde la raíz.
- [ ] `npm run typecheck` pasa con strict.
- [ ] `npm run lint`, `npm run format:check` y `npm run test` pasan.
- [ ] `npm run test:e2e` cubre carga y navegación mínima.
- [ ] `npm run build` genera `dist` sin errores.
- [ ] El mismo documento v6 sigue alimentando 2D/3D/editor/export.
- [ ] Preset, localStorage e import se validan; JSON inválido no rompe la app.
- [ ] Se preservan selección, edición, persistencia y controles existentes.
- [ ] WebGL es primario y la escena tiene fallback/estado de error digno.
- [ ] La cámara llega a exterior, piso 16 e interior sin recrear el Canvas.
- [ ] Reduced motion evita transiciones cinematográficas largas.
- [ ] Perfiles de calidad reducen efectos, DPR y sombras de forma predecible.
- [ ] No hay errores nuevos en consola ni recursos obvios sin liberar.
- [ ] Toda geometría/dato demo permanece identificado como no verificado.
- [ ] El commit existe en `Nicosm1988/vmc-spatial` y la URL pública fue smoke-tested antes de llamarla producción.

## Matriz de verificación

Completar con salida real al cerrar la fase; no marcar por expectativa.

| Control          | Comando                | Resultado requerido      |
| ---------------- | ---------------------- | ------------------------ |
| Instalación      | `npm ci`               | exit 0                   |
| Tipos            | `npm run typecheck`    | exit 0, sin errores      |
| Lint             | `npm run lint`         | exit 0                   |
| Formato          | `npm run format:check` | exit 0                   |
| Unit/integration | `npm run test`         | exit 0                   |
| E2E              | `npm run test:e2e`     | exit 0                   |
| Build            | `npm run build`        | exit 0, `dist/` generado |
| Preview          | `npm run preview`      | smoke test manual/E2E    |
| Vercel           | deployment y alias     | Ready + smoke test URL   |

## Fuera de alcance de Fase 1

- declarar fidelidad arquitectónica;
- incorporar fotos, planos o assets sin autorización;
- reconstruir exterior final;
- navegación primera persona completa y colisiones físicas;
- editor de objetos vNext, undo/redo robusto y catálogo final;
- Dexie/IndexedDB;
- WebGPU productivo;
- cumplir métricas de performance sin medición formal.

Estas capacidades pertenecen a fases posteriores y no deben adelantarse mediante datos inventados.
