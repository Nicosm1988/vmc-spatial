# VMC Spatial Studio

Prototipo web 2D/3D para explorar un exterior procedural y editar una representación espacial de una sala identificada en la experiencia como “VMC · Piso 16”. Está construido con React, TypeScript, Vite, Three.js, React Three Fiber y Drei.

> **Estado de los datos:** toda la geometría arquitectónica, las dimensiones, la distribución, el mobiliario, las métricas y la representación exterior incluidas hoy son **DEMO / NO VERIFICADAS**. No constituyen un plano, relevamiento ni gemelo digital validado. No se usaron fotos internas, planos internos ni assets visuales de terceros para construir la escena actual.

## Qué incluye la base actual

- Vista 3D WebGL unificada: torre y piso 16 permanecen en el mismo `Canvas` y marco mundial, con iluminación y postprocesado opcional.
- Exterior procedural con dos volúmenes abstractos, jardín alto y un sitio conceptual sin edificios circundantes; permanecen suelo/plaza, vegetación, paseo, calle, agua y pérgola.
- Plano secuencia tokenizado exterior → piso 16 → interior sobre una curva compartida y continua; el handoff cambia el foco semántico, no el árbol renderizado, y no usa portal, velo opaco ni pausas.
- Interior procedural e instanciado compartido por presentación y edición: 130 puestos, 176 sillas, 130 monitores y 98 pantallas de videowall. El editor agrega proxies de interacción sobre el mismo renderer.
- Entrada central DEMO de dos hojas corredizas, pantalla hero enfrentada y oficina principal de punta con mesa larga; fueron restauradas desde feedback/historial y no constituyen evidencia física.
- Navegación `MapControls`: pan, órbita, zoom al cursor, doble clic/doble toque, `W/A/S/D`, flechas y `Q/E`, además de rutas guiadas y fallback de movimiento reducido.
- Accesos de cámara para entrar a la sala, vista cenital, reinicio y captura PNG local marcada `DEMO · NO VERIFICADO`.
- Perfiles de calidad automático, rendimiento, equilibrado y cinematográfico.
- Instancing para vegetación, paños del jardín, columnas del exterior y otros elementos repetidos.
- Plano 2D y escena 3D derivados del mismo documento `vmc-spatial/6`.
- Selección, alta, movimiento, rotación, duplicado y borrado de zonas de mobiliario.
- Las cuatro paredes de videowall son estructura protegida: se pueden inspeccionar, pero su posición, orientación y 98 pantallas quedan fijas para no romper el acceso.
- Edición de capacidad de islas y tamaño de objetos no estructurales.
- Snap de movimiento, modos explorar/editar y capas analíticas demostrativas.
- Guardado local, reset, importación JSON validada y exportación.

La persistencia de esta etapa usa almacenamiento local del navegador. Dexie/IndexedDB, undo/redo robusto, colisiones, un modo peatonal completo y WebGPU todavía forman parte del roadmap.

## Inicio rápido

Requisitos: Node.js `>=22.13.0` y npm, tal como declara `package.json`. El entorno de desarrollo y el de despliegue deben usar la misma versión mayor de Node para obtener builds reproducibles.

```bash
git clone https://github.com/Nicosm1988/vmc-spatial.git
cd vmc-spatial
npm ci
npm run dev
```

Vite muestra la URL local al iniciar, normalmente `http://localhost:5173`.

## Comandos de calidad y build

```bash
# Comprobación de tipos, sin emitir archivos
npm run typecheck

# Reglas estáticas y formato
npm run lint
npm run format:check

# Pruebas unitarias/integración
npm run test

# Pruebas end-to-end (requieren Chromium de Playwright)
npx playwright install chromium
npm run test:e2e

# Todos los controles rápidos del repositorio
npm run check

# Build de producción y vista previa local
npm run build
npm run preview
```

Para trabajar en modo continuo:

```bash
npm run test:watch
npm run format
```

`npm run build` genera `dist/`. `npm run check` ya incluye typecheck, lint, tests y build. Para cambios de interacción o navegación se debe ejecutar también `npm run test:e2e`.

El diagnóstico se habilita de forma explícita con `?diagnostics=1`. Mientras está activo, publica el último snapshot de draw calls, triángulos, memoria, DPR, viewport, etapa y calidad en `window.__VMC_SCENE_METRICS__`, y el estado efímero de la ruta/cámara en `window.__VMC_CAMERA_DIAGNOSTICS__`. Es una herramienta de medición; su existencia no demuestra por sí sola que se cumplan los presupuestos.

El método de medición reproducible de Fase 3 está registrado en [`docs/PHASE_3_CINEMATIC_ACCESS.md`](./docs/PHASE_3_CINEMATIC_ACCESS.md). El corte de [`docs/benchmarks/phase3-balanced-2026-08-04.json`](./docs/benchmarks/phase3-balanced-2026-08-04.json) corresponde a la composición anterior y se conserva sólo como baseline histórico. El renderer unificado necesita una recaptura antes de afirmar cumplimiento actual de draw calls o triángulos.

## Despliegue en Vercel

La aplicación es una SPA Vite. [`vercel.json`](./vercel.json) define `dist/` como salida y reescribe las rutas a `index.html`.

Despliegue automático:

1. Vincular el proyecto de Vercel al repositorio `Nicosm1988/vmc-spatial`.
2. Mantener el Root Directory en `.` porque el proyecto está en la raíz.
3. Usar `npm run build` como Build Command y `dist` como Output Directory.
4. Integrar a la rama productiva configurada y comprobar el deployment en el [proyecto Vercel](https://vercel.com/nmarcosan-2648s-projects/vmc-spatial).

Despliegue manual, si se necesita una preview controlada:

```bash
npx vercel link --project vmc-spatial --scope nmarcosan-2648s-projects
npx vercel

# Solo cuando la preview fue validada
npx vercel --prod
```

Después del despliegue se debe comprobar: carga directa, refresh de la ruta, escena 2D y 3D, import/export, persistencia local, consola sin errores y fallback cuando WebGL no está disponible. El dashboard no es una URL pública de la aplicación; se debe registrar el alias de producción una vez creado.

## Datos, escala y precisión

- La unidad de verdad del dominio es el **milímetro entero**.
- La conversión a metros ocurre únicamente al preparar valores para Three.js/R3F.
- Las rotaciones se expresan en radianes; porcentajes como ocupación se mantienen entre 0 y 100.
- Las posiciones usan el plano de dominio `x/y`; el renderer las proyecta al plano Three.js `x/z` y reserva `y` para altura.
- El ejemplo importable está en [`examples/room.demo.vmc-spatial-6.json`](./examples/room.demo.vmc-spatial-6.json).

El exterior no forma parte del documento importable. Su contrato DEMO vive separado en `src/domain/exteriorSpec.ts`, no cambia ni amplía silenciosamente `vmc-spatial/6` y no se guarda en las exportaciones de sala. `src/scene/spatialFrame.ts` usa el origen, rotación y cota DEMO de ese contrato para ubicar la planta dentro del mundo y volver a coordenadas locales al editar. Las rutas viven en `src/domain/cinematicAccess.ts`: la versión `v3` guarda posiciones y objetivos en milímetros enteros dentro de `shared-world`; el adaptador de escena convierte a metros y resuelve una curva Hermite C1. Sus medidas y relaciones no están validadas físicamente.

La forma, orientación, escala y contenido de la escena demo no deben reutilizarse como evidencia del espacio real. Ver [`DATA_MODEL.md`](./DATA_MODEL.md) y el [registro de supuestos y hechos](./docs/ASSUMPTIONS_AND_FACTS.md).

## Documentación

- [`ARCHITECTURE.md`](./ARCHITECTURE.md): estado actual, límites de módulos y evolución incremental.
- [`DATA_MODEL.md`](./DATA_MODEL.md): contrato `vmc-spatial/6`, unidades e invariantes.
- [`ASSET_POLICY.md`](./ASSET_POLICY.md): licencias, procedencia, fotos y presupuesto de assets.
- [`SECURITY_NOTES.md`](./SECURITY_NOTES.md): privacidad, datos sensibles y riesgos de publicación.
- [`docs/PHOTO_MEASUREMENT_CHECKLIST.md`](./docs/PHOTO_MEASUREMENT_CHECKLIST.md): captura autorizada de evidencia y medidas.
- [`docs/ASSUMPTIONS_AND_FACTS.md`](./docs/ASSUMPTIONS_AND_FACTS.md): hechos confirmados, supuestos y pendientes.
- [`docs/PHASE_0_AUDIT_AND_PHASE_1.md`](./docs/PHASE_0_AUDIT_AND_PHASE_1.md): diagnóstico, árbol propuesto y plan de Fase 1.
- [`docs/PHASE_2_EXTERIOR.md`](./docs/PHASE_2_EXTERIOR.md): matriz de fuentes públicas, restricciones e incertidumbres del exterior procedural.
- [`docs/PHASE_3_CINEMATIC_ACCESS.md`](./docs/PHASE_3_CINEMATIC_ACCESS.md): escena unificada, world frame, renderer compartido, navegación, interior DEMO, fuentes y método de medición.

## Principios del proyecto

- Una sola fuente de datos alimenta 2D, 3D, inspector e import/export.
- WebGL es la ruta productiva primaria. WebGPU será experimental, opt-in y siempre tendrá fallback limpio a WebGL.
- No se publican fotos, planos, accesos, cámaras, credenciales ni detalles operacionales internos sin revisión y autorización explícitas.
- Las referencias visuales sirven como evidencia de diseño; no transfieren automáticamente derechos para copiarlas o redistribuirlas.
- El lenguaje visual del interior es procedural y puede orientarse con referencias restringidas; las fotografías no se incorporan al repositorio, al bundle ni a la publicación.
- Las fuentes exteriores son `REFERENCE ONLY / NO ASSET COPIED`: el runtime usa geometría y materiales creados en código. El texto `YPF` es lettering procedural DEMO, no un asset oficial ni una aprobación de marca.
- La UI y las capturas conservan una marca visible `DEMO · NO VERIFICADO` mientras no exista validación formal.
- Cada afirmación de fidelidad debe estar respaldada por una fuente aprobada y quedar registrada.
