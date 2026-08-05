# Fase 3 — Acceso cinematográfico al piso 16

## Resultado y clasificación

La corrección de Fase 3 implementa un plano secuencia continuo entre `exterior`, `floor16` e `interior`. La cámara recorre una única curva espacial; exterior e interior coexisten durante el cruce y la propiedad de la escena cambia de forma atómica, sin salto de pose. Se eliminaron el portal artificial, el velo opaco de cambio de fase y las pausas de entrega.

Todos los encuadres, duraciones, trayectorias, posiciones, layouts, transformaciones, inventarios y geometrías de esta experiencia permanecen clasificados como **DEMO / NO VERIFICADOS**. El recorrido no representa una ruta física, una abertura real ni un acceso operativo validado.

Esta fase también elimina por completo los edificios circundantes conceptuales del contrato exterior y del renderer. Permanecen suelo/plaza, vegetación, paseo, calle, agua y pérgola, todos igualmente conceptuales y no verificados.

La vista interior de presentación vuelve a derivarse del mismo documento DEMO y conserva su layout y transformaciones originales. Usa geometría procedural e instanciada para sostener el plano secuencia; el modo de edición mantiene el renderer detallado y sus herramientas.

## Contrato de rutas `v2` y unidades

`src/domain/cinematicAccess.ts` declara un contrato inmutable para cada par dirigido de etapas estables. Cada ruta tiene:

- un ID estable con sufijo `v2` y estado `demo-unverified`;
- origen y destino semánticos;
- escena activa de origen y destino;
- duración, progreso de `handoff` y fases ordenadas;
- waypoints con IDs estables, progreso, posición, objetivo de mirada y FOV;
- coordenadas espaciales en milímetros enteros sobre el plano de dominio `x/y`, con `elevation` para altura;
- un único marco de coordenadas `shared-world` para todos los waypoints, incluso cuando cambia el árbol que renderiza la escena.

El dominio no contiene `Vector3`, curvas ni APIs de Three.js. `src/scene/cameraPath.ts` convierte milímetros a metros, mapea `x/y/elevation` a `x/z/y`, calcula las tangentes y muestrea posición, mirada y FOV con Hermite no uniforme y continuidad C1. Los extremos del recorrido frenan de manera controlada; los waypoints internos no introducen una detención por segmento.

Cada intento de navegación recibe un token numérico monotónico. Las actualizaciones de fase, progreso, entrega y finalización sólo se aceptan si conservan ese token; una callback de una transición cancelada o reemplazada no puede confirmar un destino posterior.

## Estado estable, coexistencia y handoff atómico

La navegación separa dos conceptos:

- `stage` es el último destino estable completado (`exterior`, `floor16` o `interior`);
- `activeScene` es el destino operativo del renderer (`exterior` o `interior`).

Durante una transición que toca el interior, `Scene3D` mantiene montados simultáneamente exterior e interior. `CameraDirector` toma todas las muestras de una sola curva `shared-world`; al alcanzar `handoffProgress`, cambia `activeScene` en ese mismo frame y conserva exactamente la pose, la mirada y el FOV ya aplicados. El árbol anterior permanece disponible durante el cruce y se desmonta al finalizar, cuando la escena de destino queda estable.

No existe un componente de portal, un velo DOM opaco ni un hold de `420 ms`/`140 ms`. Los nombres de fase `cover`, `handoff` y `reveal` se conservan como metadatos de progreso y accesibilidad, no como interrupciones temporales ni cambios de sistema de coordenadas.

El punto de entrega exterior → interior del documento DEMO es `{-14000, 14200, 2400} mm` relativo al centro de escena; con el centro actual `[31, 0, 20] m`, la cámara queda en `[17, 2.4, 34.2] m`. Está parametrizado aproximadamente `0,1 m` detrás de la envolvente procedural DEMO. Esa relación no confirma una fachada real. Las pruebas fijan como objetivo matemático que todos los handoffs entre escenas recorran menos de `0,5 m` por frame a 60 Hz; esto no es una garantía de FPS del dispositivo.

## Accesibilidad, cancelación y movimiento reducido

La interfaz conserva visible `DEMO / NO VERIFICADO` y ofrece:

- estado no modal con fase, destino y porcentaje continuo;
- `<progress>` con nombre y valor accesibles;
- anuncio discreto mediante `role="status"` y `aria-live="polite"`;
- botón de cancelación con atajo `Escape` declarado;
- encuadre decorativo que no bloquea la escena ni funciona como cobertura opaca.

`prefers-reduced-motion: reduce` evita el vuelo y resuelve directamente la pose y el destino. Cancelar invalida el token activo, restaura el `stage`/`activeScene` de origen y vuelve a habilitar los controles de cámara. Abrir el plano 2D también cancela cualquier recorrido activo.

## Interior de presentación

`PerformanceInterior` deriva sus batches del mismo `VmcDocument` que alimenta el plano, el editor y la exportación. La corrección restaura las posiciones, rotaciones y relaciones locales del renderer original, mantiene IDs derivados estables y no muta el documento fuente.

El inventario técnico que el preset DEMO produce en este corte es:

| Elemento               | Cantidad |
| ---------------------- | -------: |
| Puestos de trabajo     |      130 |
| Sillas                 |      184 |
| Monitores              |      130 |
| Pantallas de videowall |       98 |

Estas cantidades describen objetos derivados por el software; **no confirman inventario ni disposición física**.

El lenguaje visual del interior se genera proceduralmente en código y puede estar orientado por referencias visuales restringidas. Las fotografías de referencia no se copian, suben ni publican: no entran al repositorio, al bundle ni al despliegue. La existencia de una referencia tampoco transfiere derechos ni convierte el resultado en una réplica fiel.

En presentación se usa el renderer instanciado. En edición 3D se conserva el renderer detallado para selección y transformaciones. Durante el plano secuencia que toca el interior, la coexistencia deliberada es entre las escenas exterior e interior; fuera de la transición se mantiene sólo el árbol correspondiente al estado estable.

## Exterior sin edificios circundantes ni portal

La remoción se hizo en las fronteras de contrato y render:

1. `ExteriorSiteElementSpec['kind']` ya no admite `context-block` y `EXTERIOR_DEMO_SPEC` no publica edificios circundantes ni un portal de acceso.
2. `UrbanContext` ya no crea ni monta instancias de edificios vecinos.
3. `Scene3D` no importa ni monta un `AccessPortal`; la cámara cruza directamente la envolvente procedural DEMO.

No quedan placeholders ni costo de render asociado a esos objetos. La decisión no confirma la relación espacial de los elementos restantes: suelo/plaza, vegetación, calle, agua, paseo y pérgola continúan siendo una composición **DEMO / NO VERIFICADA**.

## Árbol de cambios

```text
src/
  App.tsx                              # composición, movimiento reducido y cancelación
  components/Scene3D.tsx              # coexistencia temporal exterior/interior
  domain/
    cinematicAccess.ts                # rutas v2 DEMO en shared-world y mm
    cinematicAccess.test.ts
    experience.ts                     # stage estable vs activeScene
    exteriorSpec.ts                   # sin context-block ni portal
    exteriorSpec.test.ts
  scene/
    CameraDirector.tsx                # curva continua, handoff atómico y diagnóstico
    cameraPath.ts                     # mm→m y Hermite C1 sólo en escena
    cameraPath.test.ts
    exterior/
      UrbanContext.tsx                # sitio restante, sin edificios vecinos
    interior/
      PerformanceInterior.tsx         # presentación procedural instanciada
      performanceInteriorLayout.ts    # layout desde el documento canónico
      performanceInteriorLayout.test.ts
  state/
    useExperienceStore.ts             # transición tokenizada y efímera
    useExperienceStore.test.ts
  ui/
    ExperienceNav.tsx
    ExperienceNav.test.tsx
    TransitionStatus.tsx              # progreso continuo, no modal
    TransitionStatus.test.tsx
  styles.css                          # encuadre, progreso y reduced motion
tests/e2e/experience.spec.ts          # navegación, coexistencia, cancelación y métricas
docs/PHASE_3_CINEMATIC_ACCESS.md
README.md
ARCHITECTURE.md
docs/ASSUMPTIONS_AND_FACTS.md
```

Los componentes eliminados `AccessPortal` y `CinematicHandoff` no forman parte de la arquitectura vigente.

## Cobertura de pruebas

Las pruebas agregadas o ampliadas cubren:

- contrato DEMO inmutable, rutas dirigidas `v2`, IDs únicos, `shared-world`, milímetros enteros y marcador exacto de `handoff`;
- conversión mm→m, muestras finitas, endpoints deterministas, continuidad de pose y tangente C1, y ausencia de detenciones en waypoints internos;
- distancia menor a `0,5 m` por frame a 60 Hz alrededor de cada handoff entre escenas;
- tokens obsoletos, cancelación, progreso acotado y exclusión del estado de cámara de la persistencia;
- semántica accesible del estado, progreso, anuncio, cancelación y movimiento reducido;
- coexistencia exterior/interior durante el cruce y ausencia de cobertura opaca;
- ausencia de `context-block` y portal en el exterior;
- layout interior instanciado, transformaciones equivalentes al renderer original, IDs derivados estables, documento fuente inmutable y cantidades `130/184/130/98`;
- E2E serial del recorrido, cancelación por `Escape`, fallback de movimiento reducido, plano 2D, fallback WebGL y ausencia de nuevos errores de consola/página.

Antes de integrar se deben ejecutar:

```bash
npm run check
npm run test:e2e
```

El resultado final de esos comandos debe registrarse junto al PR o deployment; esta documentación no los da por aprobados antes de su ejecución.

## Diagnóstico y benchmark reproducible

El diagnóstico sigue siendo opt-in con `?diagnostics=1`:

- `window.__VMC_SCENE_METRICS__` expone el último snapshot del renderer;
- `window.__VMC_CAMERA_DIAGNOSTICS__` expone token/ruta, fase, progreso, `stage`, `activeScene`, preferencia de movimiento, pose, objetivo y FOV;
- el evento efímero `vmc-camera-diagnostics` entrega ese snapshot en cada frame renderizado para medir continuidad sin polling;
- ambas propiedades se retiran al desmontar sus colectores y no se persisten.

Los objetivos de la escena base continúan siendo menos de 200 draw calls, menos de 250.000 triángulos visibles y texturas de hasta 2K por defecto. Son presupuestos, no claims.

Método usado para la medición final:

1. registrar commit/artefacto, hardware, navegador, viewport, DPR, preset, modo día/noche y estado del techo;
2. abrir `/?diagnostics=1` y estabilizar cada destino, sin mezclar muestras del renderer detallado de edición;
3. capturar `__VMC_SCENE_METRICS__` en `exterior`, `floor16` e `interior` cuando `stage` coincida y el frame sea válido;
4. medir por separado el intervalo de coexistencia exterior/interior, porque tiene un costo transitorio distinto;
5. adjuntar el JSON generado y comparar llamadas, triángulos, geometrías y texturas sin extrapolar FPS ni fidelidad física.

El artefacto [`benchmarks/phase3-balanced-2026-08-04.json`](./benchmarks/phase3-balanced-2026-08-04.json) registra Chromium 151, GPU AMD Radeon integrada mediante ANGLE, viewport CSS 921×886, DPR 1, perfil equilibrado, día y techo activo. En ese contexto:

- exterior estable: 28 llamadas y 12.234 triángulos;
- piso 16 estable: 22 llamadas y 11.546 triángulos;
- interior estable: 55 llamadas y 171.640 triángulos;
- máximo durante exterior→piso 16: 28 llamadas y 12.234 triángulos;
- máximo durante piso 16→interior: 64 llamadas y 172.942 triángulos.

Los estados estables y ambas rutas cumplen los presupuestos de llamadas y triángulos en ese perfil medido. El horneado único de sombras de contacto, posterior a la llegada estable, alcanzó transitoriamente 111 llamadas y 342.354 triángulos internos por sus pases offscreen de profundidad y blur; no es geometría visible ni ocurrió dentro del plano secuencia. No se extrapolan FPS ni resultados a otro hardware, navegador, viewport o preset.

## Riesgos, mitigaciones y rollback

| Riesgo                                                      | Mitigación incluida                                                     | Señal de rollback                                                      |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Una callback tardía completa un recorrido cancelado         | Tokens monotónicos y validación del ID en cada mutación                 | El destino cambia después de cancelar o reemplazar una ruta            |
| El cambio exterior/interior produce un salto visible        | Marco compartido, curva C1, coexistencia y handoff en la misma muestra  | Discontinuidad visible o distancia mayor al objetivo por frame         |
| La coexistencia aumenta demasiado el costo durante el cruce | Ambos árboles se mantienen sólo mientras la transición toca el interior | Pérdida reproducible de fluidez o memoria fuera del presupuesto medido |
| El vuelo provoca mareo o pérdida de orientación             | `prefers-reduced-motion`, botón/Escape y UI no modal                    | El fallback no termina rápido o el usuario queda sin control           |
| La curva atraviesa geometría procedural                     | Waypoints DEMO versionados y pruebas de continuidad/endpoints           | Clipping reproducible en el viewport objetivo                          |
| El interior instanciado deriva del layout original          | Pruebas de transforms, IDs, cantidades y no mutación del documento      | Muebles corridos, rotados o ausentes respecto del preset               |
| Una referencia visual termina publicada como asset          | Lenguaje procedural y prohibición de copiar fotos al repo/bundle/deploy | Aparece una foto o archivo sin manifiesto, licencia y aprobación       |
| La remoción de edificios deja referencias huérfanas         | Eliminación conjunta del contrato, renderer, tests y documentación      | Reaparece `context-block` o una instancia de edificios circundantes    |

Rollback recomendado, sin modificar `vmc-spatial/6` ni los documentos de sala:

1. deshabilitar la navegación cinematográfica y volver temporalmente a poses estables directas;
2. conservar la UI de progreso sólo si sigue alimentada por una transición válida;
3. mantener la remoción de portal, velo opaco, pausas y edificios circundantes: no son mecanismos de fallback;
4. conservar el interior derivado del documento o aislarlo detrás del modo de presentación sin cambiar sus datos;
5. ejecutar nuevamente `npm run check` y `npm run test:e2e` antes de publicar el rollback.

No se deben reintroducir edificios circundantes, un portal artificial ni una cobertura negra como parte de un rollback de cámara.
