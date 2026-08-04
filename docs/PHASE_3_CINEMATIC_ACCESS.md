# Fase 3 — Acceso cinematográfico al piso 16

## Resultado y clasificación

La Fase 3 reemplaza el desplazamiento lineal de cámara por una navegación cinematográfica tokenizada entre `exterior`, `floor16` e `interior`. La aproximación al piso 16 usa una trayectoria curva, el cambio entre los árboles WebGL exterior e interior ocurre bajo una cobertura visual y la interfaz informa fase, destino y progreso sin bloquear el resto de la aplicación.

Toda posición, encuadre, duración, trayectoria, acceso y geometría de esta experiencia permanece clasificada como **DEMO / NO VERIFICADA**. El recorrido no representa una ruta física, una abertura real ni un acceso operativo validado.

Esta fase también elimina por completo los edificios circundantes conceptuales del contrato exterior y del renderer. Permanecen el suelo/plaza, el anillo verde con vegetación, el paseo, la calle, el agua y la pérgola, todos igualmente conceptuales y no verificados.

La inspección E2E detectó además que el renderer interior detallado impedía una entrega fluida en WebGL por software. La vista de presentación ahora usa un LOD procedural con 982 instancias agrupadas; el modo de edición conserva el renderer detallado y sus herramientas existentes.

## Contrato de rutas y unidades

`src/domain/cinematicAccess.ts` declara un contrato inmutable para cada par dirigido de etapas estables. Cada ruta tiene:

- un ID de ruta estable y estado `demo-unverified`;
- origen y destino semánticos;
- árbol de escena de origen y destino;
- duración, punto de `handoff` y fases ordenadas;
- waypoints con IDs estables, progreso, posición, objetivo de mirada y FOV;
- coordenadas espaciales en milímetros enteros sobre el plano de dominio `x/y`, con `elevation` para altura.

El dominio no contiene `Vector3`, curvas ni APIs de Three.js. `src/scene/cameraPath.ts` es el adaptador que convierte milímetros a metros, mapea `x/y/elevation` a `x/z/y` y calcula las muestras curvas para posición y mirada. Al cruzar entre los marcos exterior e interior, el adaptador nunca interpola coordenadas de escenas diferentes.

Cada intento de navegación recibe un token numérico monotónico. Las actualizaciones de fase, progreso, entrega y finalización sólo se aceptan si conservan ese token; por eso una callback de una transición cancelada o reemplazada no puede confirmar un destino posterior.

## Estado estable, escena activa y handoff

La navegación separa dos conceptos:

- `stage` es el último destino estable completado (`exterior`, `floor16` o `interior`);
- `activeScene` es el árbol WebGL montado en ese instante (`exterior` o `interior`).

Durante una entrada, `stage` conserva el origen hasta completar el recorrido. Al alcanzar el punto de entrega, `activeScene` pasa al árbol de destino bajo el velo de `CinematicHandoff`; recién al terminar se confirma el nuevo `stage`. Esto evita presentar una etapa como finalizada mientras la revelación visual todavía está en curso.

El handoff aplica una secuencia `flight → cover → handoff → reveal`. La cobertura DOM oculta el cambio de marco, mientras `CameraDirector` mantiene la cámara en el último pose del origen y luego la inicia en el primer pose del destino. El portal del piso 16 es un marcador procedural conceptual derivado de `EXTERIOR_DEMO_SPEC`; no es una ventana ni una abertura física confirmada.

## Accesibilidad, cancelación y movimiento reducido

La interfaz cinematográfica conserva visible `DEMO / NO VERIFICADO` y ofrece:

- estado no modal con fase, destino y porcentaje;
- `<progress>` con nombre y valor accesibles;
- anuncio discreto mediante `role="status"` y `aria-live="polite"`;
- botón de cancelación con atajo `Escape` declarado;
- indicadores decorativos y velo de handoff ocultos del árbol accesible.

`prefers-reduced-motion: reduce` evita el vuelo y resuelve directamente la pose y el destino. Cancelar invalida el token activo, desmonta el feedback transitorio, restaura el `stage`/`activeScene` de origen y vuelve a habilitar los controles de cámara. Abrir el plano 2D también cancela cualquier recorrido activo.

## Exterior sin edificios circundantes

La remoción se hizo en las dos fronteras necesarias:

1. `ExteriorSiteElementSpec['kind']` ya no admite `context-block` y `EXTERIOR_DEMO_SPEC` no publica ese elemento.
2. `UrbanContext` ya no crea ni monta instancias de edificios circundantes.

No quedan placeholders ni costo de render asociado a esos bloques. La decisión no confirma la relación espacial de los elementos restantes: suelo/plaza, vegetación, calle, agua, paseo y pérgola continúan siendo una composición **DEMO / NO VERIFICADA**.

## Árbol de cambios

```text
src/
  App.tsx                              # preferencia de movimiento y handoff DOM
  components/Scene3D.tsx              # activeScene y portal procedural
  domain/
    cinematicAccess.ts                # rutas DEMO, tokens e invariantes en mm
    cinematicAccess.test.ts
    experience.ts                     # stage estable vs activeScene
    exteriorSpec.ts                   # portal; context-block removido
    exteriorSpec.test.ts
  scene/
    CameraDirector.tsx                # ejecución token-safe y diagnóstico opt-in
    cameraPath.ts                     # mm→m y curvas sólo en escena
    cameraPath.test.ts
    exterior/
      AccessPortal.tsx                # marcador procedural conceptual
      UrbanContext.tsx                # sitio restante, sin edificios vecinos
    interior/
      PerformanceInterior.tsx         # LOD instanciado para presentación
      performanceInteriorLayout.ts    # batches desde el documento canónico
      performanceInteriorLayout.test.ts
  state/
    useExperienceStore.ts             # máquina de transición efímera
    useExperienceStore.test.ts
  ui/
    CinematicHandoff.tsx              # cobertura del cambio de árbol WebGL
    ExperienceNav.tsx
    ExperienceNav.test.tsx
    TransitionStatus.tsx
    TransitionStatus.test.tsx
  styles.css                          # encuadre, progreso y reduced motion
tests/e2e/experience.spec.ts          # navegación real, cancelación y métricas
docs/PHASE_3_CINEMATIC_ACCESS.md
README.md
ARCHITECTURE.md
docs/ASSUMPTIONS_AND_FACTS.md
```

## Cobertura de pruebas

Las pruebas agregadas o ampliadas cubren:

- contrato DEMO inmutable, rutas dirigidas completas, IDs únicos, milímetros enteros y `handoff` válido;
- conversión mm→m, muestras curvas finitas, endpoints deterministas y separación de marcos exterior/interior;
- tokens obsoletos, cancelación después del handoff, progreso acotado y exclusión del estado de cámara de la persistencia;
- semántica accesible del estado, progreso, anuncio, cancelación y cobertura visual;
- ausencia de `context-block` en el contrato exterior;
- inventario instanciado del interior de presentación, transforms finitos, IDs derivados estables y reacción a insights;
- E2E serial del recorrido con movimiento real, entrada cubierta, cancelación por `Escape`, fallback de movimiento reducido, plano 2D, fallback WebGL y ausencia de nuevos errores de consola/página.

Antes de integrar se deben ejecutar:

```bash
npm run check
npm run test:e2e
```

El resultado final de esos comandos debe registrarse junto al PR/deployment; esta documentación no los da por aprobados antes de su ejecución.

## Diagnóstico y medición

El diagnóstico sigue siendo opt-in con `?diagnostics=1`:

- `window.__VMC_SCENE_METRICS__` expone el último snapshot del renderer para una etapa estable;
- `window.__VMC_CAMERA_DIAGNOSTICS__` expone token/ruta, fase, progreso, `stage`, `activeScene`, preferencia de movimiento, pose, objetivo y FOV mientras el diagnóstico está habilitado;
- ambas propiedades se retiran al desmontar sus colectores y no se persisten.

Los objetivos de la escena base continúan siendo menos de 200 draw calls, menos de 250.000 triángulos visibles y texturas de hasta 2K por defecto.

Método para la medición final:

1. ejecutar Chromium con viewport, DPR, preset de calidad y modo día/noche registrados;
2. abrir `/?diagnostics=1` con `prefers-reduced-motion: reduce` para estabilizar cada destino sin introducir el vuelo en el muestreo;
3. capturar `__VMC_SCENE_METRICS__` en `exterior`, `floor16` e `interior` sólo cuando `stage` coincida y el frame sea válido;
4. adjuntar el JSON generado por Playwright y registrar hardware, navegador y resolución;
5. comparar llamadas y triángulos con los presupuestos sin extrapolar FPS ni fidelidad física.

Medición local del 2026-08-04: Chromium headless controlado por Playwright, viewport `1600 × 832`, DPR efectivo `1`, perfil explícito `balanced`, modo día y destinos estabilizados con movimiento reducido. Los valores son snapshots del renderer, no una medición de FPS ni una garantía para otros dispositivos, perfiles o el renderer detallado de edición.

| Etapa estable | Draw calls | Triángulos | Geometrías | Texturas |
| ------------- | ---------: | ---------: | ---------: | -------: |
| `exterior`    |         28 |     12.234 |         19 |        1 |
| `floor16`     |         29 |     12.262 |         21 |        1 |
| `interior`    |         19 |     13.540 |         17 |        1 |

En este contexto reproducible las tres escenas de presentación quedan por debajo de los objetivos de draw calls y triángulos. El resultado no se extrapola a FPS, modo noche, perfil cinematográfico, edición 3D detallada ni hardware distinto.

## Riesgos, mitigaciones y rollback

| Riesgo                                                     | Mitigación incluida                                                  | Señal de rollback                                                   |
| ---------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Una callback tardía completa un recorrido cancelado        | Tokens monotónicos y validación del ID en cada mutación              | El destino cambia después de cancelar o reemplazar una ruta         |
| El cambio exterior/interior produce un salto visible       | `cover`, handoff explícito, velo DOM y poses separadas por marco     | Flash del árbol incorrecto o cámara interpolada entre marcos        |
| El vuelo provoca mareo o pérdida de orientación            | `prefers-reduced-motion`, cancelación por botón/Escape y UI no modal | El fallback no termina rápido o el usuario queda sin control        |
| La curva atraviesa geometría o encuadra fuera del portal   | Waypoints DEMO versionados y pruebas de muestras finitas/endpoints   | Clipping reproducible en viewport objetivo                          |
| La UI cinematográfica tapa controles en pantallas pequeñas | Capas decorativas sin interacción y reglas responsive/reduced motion | Navegación principal o clasificación DEMO dejan de ser operables    |
| La remoción de edificios deja referencias huérfanas        | Eliminación conjunta del contrato, renderer, tests y documentación   | Reaparece `context-block` o una instancia de edificios circundantes |
| El interior detallado bloquea el handoff en equipos lentos | LOD instanciado sólo en presentación; edición conserva su renderer   | La presentación vuelve a montar miles de geometrías individuales    |

Rollback recomendado, sin modificar `vmc-spatial/6` ni los documentos de sala:

1. deshabilitar la navegación cinematográfica en la composición y volver a poses estables directas;
2. retirar `CinematicHandoff` y `TransitionStatus` sólo junto con la máquina de transición que los alimenta;
3. conservar `EXTERIOR_DEMO_SPEC`, el portal procedural y la remoción de edificios como cambios independientes, salvo decisión explícita distinta;
4. ejecutar nuevamente `npm run check` y `npm run test:e2e` antes de publicar el rollback.

No se deben reintroducir edificios circundantes como parte de un rollback de cámara: su remoción fue un requisito funcional separado de esta fase.
