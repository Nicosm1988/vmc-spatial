# Fase 3 — Escena espacial unificada y acceso cinematográfico

## Resultado y clasificación

La corrección vigente de Fase 3 usa un único `Canvas` WebGL y un único marco mundial para la torre, el sitio conceptual y el piso 16. `TowerExterior` y `PerformanceInterior` permanecen montados durante toda la experiencia; cambiar entre `exterior`, `floor16` e `interior` modifica el foco y la pose de cámara, no reemplaza árboles de escena ni cambia de renderer.

Todos los encuadres, duraciones, trayectorias, posiciones, layouts, transformaciones, inventarios y geometrías continúan clasificados como **DEMO / NO VERIFICADOS**. En particular, ubicar el piso 16 dentro de la torre es una decisión técnica de composición y no demuestra elevación, orientación, planta, acceso ni relación física con el edificio real.

Los edificios circundantes conceptuales permanecen eliminados. Se conservan suelo/plaza, vegetación, paseo, calle, agua y pérgola como contexto procedural igualmente no verificado.

## Marco mundial único

`src/scene/spatialFrame.ts` adapta la planta local al mundo Three.js usando valores del contrato `EXTERIOR_DEMO_SPEC`:

- centro horizontal de la planta: `originMm`, convertido a metros;
- elevación: `floor16ElevationMm`, usada como datum técnico;
- rotación: `rotationRad`, actualmente `π/4`;
- planta local `x/y` → mundo `x/z`, con `y` reservado para altura.

`floorLocalToWorld()` y `worldToFloorLocal()` forman el par de transformación directa/inversa. La inversa permite que el drag del editor siga escribiendo coordenadas locales en milímetros aunque el piso esté rotado dentro del mundo.

El valor actual `floor16ElevationMm = 0` no significa planta baja ni cota arquitectónica real: la base procedural de la torre está desplazada en el mismo contrato. Ambos valores son parámetros **DEMO / NO VERIFICADOS** y no deben convertirse en una afirmación sobre niveles del edificio.

Las rutas `CINEMATIC_ACCESS_ROUTES v3` conservan IDs estables, estado `demo-unverified`, waypoints en milímetros enteros y el marco `shared-world`. `scene/cameraPath.ts` sigue siendo la única frontera que convierte mm→m y muestrea posición, mirada y FOV mediante curvas Hermite con continuidad C1.

## Composición y renderer compartido

La composición estable es:

```text
Canvas WebGL único
├─ entorno procedural y sitio sin edificios vecinos
├─ TorreYPF / TowerExterior
├─ floor16-shared-world-frame
│  ├─ PerformanceInterior
│  └─ editor-selection-layer, sólo cuando se edita
├─ MapControls
└─ CameraDirector
```

Presentación y edición consumen el mismo `PerformanceInterior` derivado del `VmcDocument`. El modo de edición agrega proxies transparentes de selección y drag sobre esa geometría; no monta una segunda versión detallada del mobiliario. Así, una corrección visual del interior se ve en ambos modos y no puede divergir por mantener dos renderers.

`stage` continúa representando el destino estable completado. `activeScene` se conserva como metadato efímero de compatibilidad y diagnóstico de la transición, pero ya no decide qué geometría se monta. El `handoff` tokenizado sigue confirmando el avance semántico de una ruta; no entrega propiedad entre dos escenas ni desmonta contenido.

No existe portal artificial, velo DOM opaco ni hold temporal para ocultar el cruce. La cámara atraviesa una composición procedural continua; eso no confirma una abertura, puerta exterior ni ruta operativa real.

## Navegación espacial

La navegación libre usa `MapControls`:

- arrastre primario: desplazamiento lateral;
- botón derecho: órbita;
- rueda o gesto de dos dedos: zoom, con `zoomToCursor`;
- doble clic o doble toque: acercamiento al primer punto visible alcanzado por raycast;
- `Shift` + doble clic: retroceso respecto de la vista;
- `W/A/S/D` o flechas: avance, retroceso y desplazamiento lateral;
- `Q/E`: descenso y ascenso cuando la cámara no está limitada a escala interior;
- `Shift`: mayor velocidad de teclado.

Los botones del panel llaman a las mismas intenciones de avance, retroceso y desplazamiento. Un gesto manual cancela el tween libre y, si corresponde, invalida la transición cinematográfica activa. El doble clic de navegación se deshabilita durante edición para no competir con selección y drag.

`prefers-reduced-motion: reduce` conserva el fallback directo a la pose de destino. La transición guiada mantiene token monotónico, progreso accesible, cancelación por botón/Escape y rechazo de callbacks obsoletas.

## Interior DEMO restaurado

La corrección restaura elementos solicitados mediante feedback de producto e historial del repositorio. Ese origen explica la decisión de diseño, pero **no es evidencia física**:

- una entrada central demostrativa con dos hojas corredizas sobre el borde este del núcleo;
- una pantalla hero horizontal enfrentada a esa entrada;
- la oficina principal `of-central` en la punta este, de `5600 × 5200 mm` en el preset DEMO, con mesa larga de reunión y ocho sillas.

La puerta y la pantalla hero son geometría derivada de presentación; no agregan campos incompatibles a `vmc-spatial/6`. La oficina sí se representa como una zona `oficina` del documento canónico. Sus nombres, medidas, ubicación y función no describen una oficina o acceso real verificado.

El inventario técnico derivado por el corte actual es:

| Elemento               | Cantidad |
| ---------------------- | -------: |
| Puestos de trabajo     |      130 |
| Sillas                 |      176 |
| Monitores de puestos   |      130 |
| Pantallas de videowall |       98 |
| Hojas de entrada DEMO  |        2 |
| Pantallas hero DEMO    |        1 |

Las `130` posiciones de trabajo y las `98` pantallas murales se preservan respecto del preset anterior. Todas las cantidades describen objetos generados por software; **no confirman inventario ni disposición física**.

Para impedir que edición y presentación vuelvan a divergir, las cuatro paredes canónicas se normalizan al preset y son estructura protegida en la UI. Siguen siendo seleccionables para consulta, pero no se pueden desplazar, redimensionar, duplicar o borrar; así la quinta arista permanece reservada para la puerta y no cambia el total de pantallas.

## Investigación pública de la Torre YPF

Las fuentes se usan como `REFERENCE ONLY / NO ASSET COPIED`:

| Fuente                                                                                                                                                                      | Procedencia                                   | Aporte permitido                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| [Pelli Clarke & Partners](https://pcparch.com/work/type/headquarters-and-office)                                                                                            | Sitio oficial del estudio                     | Autoría, tipología, ciudad y año del proyecto.                                                 |
| [CTBUH / Skyscraper Center](https://www.skyscrapercenter.com/building/id/3358)                                                                                              | Base institucional de edificios en altura     | Altura publicada de 160 m, 36 niveles, dos volúmenes intertrabados y jardín alto.              |
| [CRIBA](https://www.criba.com.ar/obras-emblematicas/7-sede-corporativa-ypf)                                                                                                 | Sitio oficial del constructor                 | Altura, superficie publicada, autoría y presencia del Sky Garden.                              |
| [ZinCo](https://zinco-greenroof.com/references/torre-ypf-buenos-aires)                                                                                                      | Ficha técnica del proveedor de cubierta verde | Plataforma ajardinada sobre estacionamiento y jardineras tras la esquina vidriada.             |
| [La Nación, 2021](https://www.lanacion.com.ar/propiedades/construccion-y-diseno/torre-ypf-como-es-el-edificio-que-construyo-cesar-pelli-y-ahora-esta-en-venta-nid06012021/) | Síntesis periodística de arquitectura         | Corroboración secundaria de altura, niveles, orientación de los dos prismas, jardín y pérgola. |

La lectura consolidada admite una abstracción con un volumen triangular curvo hacia el río, otro cuadrado hacia la ciudad, pieles contrastantes, jardín próximo al remate, planos de coronamiento opuestos y basamento verde. Las proporciones horizontales, modulación, orientación exacta, especies, accesos y relación con el piso DEMO no están verificadas.

### Cartel de fachada

El texto `YPF` visible en la fachada es lettering procedural generado en runtime con trazos volumétricos simples e instanciados. No se descargó, vectorizó, calcó ni embebió un asset oficial de YPF, y tampoco se copiaron fotos o texturas de las fuentes.

Su tamaño, material, luminosidad y posición se guardan como parámetros `demo-unverified` de `EXTERIOR_DEMO_SPEC`. El lettering no implica aprobación, patrocinio ni reproducción autorizada de identidad corporativa. Antes de una publicación que pretenda usar la marca de forma oficial se requiere revisión de marca/licencia; hasta entonces debe conservar la etiqueta **DEMO / NO VERIFICADO**.

## Cobertura y validación

La cobertura unitaria incorporada comprueba:

- centro, elevación, rotación y round-trip del marco `floor16`;
- milímetros enteros, IDs y estado `demo-unverified` de la señalética procedural;
- dos hojas de entrada, pantalla hero, oficina principal con mesa larga y ocho sillas;
- preservación de `130` puestos/monitores y `98` pantallas de videowall;
- IDs derivados estables, transforms finitas y ausencia de mutación del documento fuente.

La validación E2E debe confirmar además: un solo elemento `<canvas>`, identidad estable de torre e interior durante todo el recorrido, `MapControls`, doble clic/doble toque, teclado, cancelación por gesto, arbitraje con edición y ausencia de errores nuevos de consola.

Antes de integrar:

```bash
npm run check
npm run test:e2e
```

## Benchmark pendiente de recaptura

El archivo [`benchmarks/phase3-balanced-2026-08-04.json`](./benchmarks/phase3-balanced-2026-08-04.json) corresponde a la composición anterior, que alternaba estados estables y coexistía sólo durante el handoff. Se conserva como baseline histórico, pero **no demuestra** el costo del renderer unificado actual.

La nueva medición debe registrar hardware, navegador, viewport, DPR, preset, modo día/noche y techo, y capturar al menos torre completa, aproximación al piso 16, interior, edición y cinco ciclos de ida/vuelta. Debe informar draw calls, triángulos visibles, frame time p95 y estabilidad de memoria sin presentar los presupuestos como claims hasta medirlos.

## Riesgos y rollback

| Riesgo                                                   | Mitigación o control                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Torre e interior permanentes elevan el costo base        | LOD por distancia, instancing y benchmark nuevo.                                     |
| Escalas exterior/interior producen z-fighting o clipping | Marco único probado, `near/far` revisables y regresión visual.                       |
| La edición diverge de presentación                       | Un renderer compartido con proxies de interacción.                                   |
| Doble clic compite con selección                         | Navegación por doble clic deshabilitada al editar.                                   |
| Feedback histórico se interpreta como evidencia real     | Registro explícito DEMO y validación física separada.                                |
| Lettering se interpreta como logo oficial                | Sin asset oficial, metadata `demo-unverified` y revisión de marca antes de publicar. |

El rollback recomendado puede deshabilitar transiciones guiadas, doble clic o navegación de teclado por separado. No debe volver a separar los renderers, reintroducir edificios vecinos, portal artificial o cobertura opaca, ni cambiar `vmc-spatial/6` sin una migración explícita.
