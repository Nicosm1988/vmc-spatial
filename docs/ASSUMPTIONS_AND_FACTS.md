# Registro de hechos, supuestos y decisiones

Fecha de corte inicial: 2026-08-04.

Este registro evita que una representación visual convincente se convierta accidentalmente en una afirmación factual. “Confirmado” significa confirmado por el código o la configuración técnica del repositorio, salvo que se indique una fuente física autorizada. En este corte **no hay fuentes físicas internas aprobadas registradas**.

## Cómo actualizar el registro

- Asignar un ID estable nuevo; no reciclar IDs cerrados.
- Distinguir hecho técnico, hecho físico, supuesto, decisión u open question.
- Para confirmar un dato físico, registrar referencia aprobada, fecha, método, incertidumbre, responsable/rol validador y permiso de publicación.
- No adjuntar evidencia restringida a este repositorio. Referenciar un ticket o repositorio seguro aprobado.
- La ausencia de objeciones no cuenta como aprobación.
- Si cambia el alcance de publicación, reevaluar todos los elementos afectados.

## Hechos técnicos confirmados

| ID    | Hecho                                                                                                                                       | Evidencia en el repositorio                                                                 | Alcance                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| F-001 | La aplicación es una SPA React/Vite escrita en TypeScript.                                                                                  | `package.json`, `vite.config.ts`, `src/main.tsx`                                            | Técnico                                                        |
| F-002 | La escena 3D usa Three.js, React Three Fiber, Drei y postprocesado.                                                                         | `package.json`, `src/components/Scene3D.tsx`                                                | Técnico                                                        |
| F-003 | El contrato de documento vigente está etiquetado `vmc-spatial/6`.                                                                           | `src/types.ts`, `src/data/vmcPiso16.ts`                                                     | Técnico                                                        |
| F-004 | Plano 2D, escena 3D, inspector y exportación consumen el mismo `VmcDocument`.                                                               | `src/App.tsx` y props de componentes                                                        | Técnico                                                        |
| F-005 | Las coordenadas configurables se expresan en milímetros y la utilidad de escena divide por 1000.                                            | `src/lib/geometry.ts`                                                                       | Técnico; no confirma escala real                               |
| F-006 | La persistencia de la base inspeccionada usa almacenamiento local y permite JSON import/export.                                             | `src/lib/persistence.ts`                                                                    | Técnico; no es almacenamiento seguro                           |
| F-007 | La configuración de Vercel construye con Vite, sirve `dist` y aplica rewrite de SPA.                                                        | `vercel.json`                                                                               | Técnico                                                        |
| F-008 | WebGL/R3F es el renderer implementado; no existe una ruta WebGPU productiva.                                                                | `src/components/Scene3D.tsx`, dependencias                                                  | Técnico                                                        |
| F-009 | La geometría, los materiales y la textura de alfombra usados por runtime son generados en código; no se importan fotos ni modelos externos. | `src/components/Furniture.tsx`, `src/components/TorreYPF.tsx`, `src/lib/carpet.ts`          | Técnico, corte inicial                                         |
| F-010 | El preset contiene valores de ocupación, datalización, puestos y pantallas.                                                                 | `src/data/vmcPiso16.ts`                                                                     | Existencia técnica; sus valores no están validados físicamente |
| F-011 | La Fase 1 introduce validación Zod para cargas locales/importaciones y Zustand para estado de experiencia.                                  | `src/domain/documentSchema.ts`, `src/lib/persistence.ts`, `src/state/useExperienceStore.ts` | Técnico                                                        |
| F-012 | TypeScript está configurado con `strict` y `noUncheckedIndexedAccess`; la versión mínima declarada de Node es 22.13.0.                      | `tsconfig.json`, `package.json`                                                             | Configuración técnica; el control debe pasar antes de integrar |

## Hechos físicos confirmados

No hay hechos físicos confirmados mediante fotos, planos, mediciones o fuentes internas autorizadas en este corte. El nombre del producto y las etiquetas del preset no son evidencia suficiente.

## Supuestos activos

Todos los elementos de esta tabla se deben representar como **DEMO / NO VERIFICADOS**.

| ID    | Supuesto actual                                                                                  | Riesgo si se interpreta como hecho                                | Evidencia necesaria para resolverlo                                                |
| ----- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| A-001 | La experiencia representa la Torre YPF y una sala del piso 16 en Puerto Madero.                  | Asociación incorrecta de identidad o ubicación.                   | Confirmación de alcance y fuentes públicas/autorizadas aprobadas.                  |
| A-002 | El piso mide `62000 × 40000 mm` y tiene `2900 mm` de altura libre.                               | Escala y encuadre físicamente incorrectos.                        | Medición aprobada o plano autorizado con tolerancia.                               |
| A-003 | El perímetro curvo y el polígono del núcleo se parecen a la planta real.                         | Apariencia de plano interno sensible o falso.                     | Relevamiento/plan autorizado y permiso específico de publicación.                  |
| A-004 | El exterior, cantidad de niveles, proporciones, coronamiento y corte visual son representativos. | Confusión con modelo arquitectónico validado.                     | Fuentes públicas licenciadas + revisión arquitectónica; datos sensibles excluidos. |
| A-005 | Calle, agua, plaza, vegetación y edificios vecinos tienen relación espacial correcta.            | Orientación urbana errónea.                                       | Cartografía pública permitida, relevamiento y sistema de coordenadas documentado.  |
| A-006 | El origen del plano y el “norte” visual corresponden al espacio real.                            | Mediciones/recorridos derivados incorrectos.                      | Dos puntos de control y orientación aprobada.                                      |
| A-007 | Islas, mesas, oficinas, videowalls, sillas y monitores existen con esas cantidades/posiciones.   | Inventario y distribución falsos; posible exposición operacional. | Inventario y relevamiento autorizados, con alcance de publicación.                 |
| A-008 | Colores, materiales, fachada vidriada y señalética se aproximan a los reales.                    | Uso de marca/material engañoso o no autorizado.                   | Especificaciones/licencias y aprobación de marca.                                  |
| A-009 | Ocupación, datalización y capacidad del preset tienen significado operativo.                     | Comunicación de analítica ficticia como real.                     | Definición de métricas, propietario, fuente, fecha y permiso de publicación.       |
| A-010 | Las posiciones de entrada y trayectorias de cámara representan rutas físicas válidas.            | Recorrido engañoso o exposición de accesos.                       | Diseño de experiencia aprobado, sin revelar rutas sensibles.                       |
| A-011 | La escena cumple los presupuestos de FPS, draw calls y triángulos.                               | Expectativas de rendimiento infundadas.                           | Perfil reproducible por dispositivo/navegador/preset.                              |
| A-012 | Existe autorización para capturar fotos/medidas internas o procesarlas externamente.             | Incumplimiento de privacidad, seguridad o contrato.               | Autorización escrita con propósito, acceso, retención y proveedores.               |

## Decisiones vigentes

| ID    | Decisión                                                                     | Motivo                                            | Revisión requerida cuando…                              |
| ----- | ---------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------- |
| D-001 | Milímetros enteros son la verdad del dominio; metros solo en render.         | Evita deriva y diferencias 2D/3D.                 | Cambie el contrato de dominio.                          |
| D-002 | WebGL es primario; WebGPU futuro, experimental y con fallback.               | Compatibilidad y estabilidad web.                 | WebGPU tenga cobertura y métricas suficientes.          |
| D-003 | Mantener `vmc-spatial/6` durante Fase 1.                                     | Compatibilidad con presets/export actuales.       | Se agregue el objeto versionado completo.               |
| D-004 | Mantener geometría procedural y placeholders hasta aprobar evidencia/assets. | Licencias, seguridad y trazabilidad.              | Exista asset con manifiesto y aprobación.               |
| D-005 | Mantener persistencia local en esta etapa; Dexie se difiere.                 | Reducir alcance mientras se estabiliza el modelo. | Se necesiten documentos múltiples, historial o volumen. |
| D-006 | Un documento canónico alimenta 2D, 3D, editor y export.                      | Evita desincronización.                           | No prevista; cualquier excepción requiere ADR.          |
| D-007 | No usar CSG pesado; paredes futuras serán segmentos con aberturas.           | Rendimiento y editabilidad.                       | Un caso medido demuestre necesidad distinta.            |
| D-008 | Los presupuestos de rendimiento son objetivos, no claims.                    | Requieren medición contextual.                    | Se publique un benchmark reproducible.                  |

## Preguntas abiertas para relevamiento

| ID    | Pregunta                                                                   | Quién debe responder                | Bloquea                         |
| ----- | -------------------------------------------------------------------------- | ----------------------------------- | ------------------------------- |
| Q-001 | ¿Cuál es el alcance: demo pública, herramienta interna o ambas?            | Product owner + seguridad/legal     | Clasificación de datos y deploy |
| Q-002 | ¿Qué fuentes públicas pueden citarse y qué usos de marca están aprobados?  | Legal/comunicación                  | Exterior y señalética           |
| Q-003 | ¿Existe autorización para captura interna y cuál es el repositorio seguro? | Seguridad + propietario del espacio | Fidelidad interior              |
| Q-004 | ¿Cuál es el origen, orientación y tolerancia requerida del relevamiento?   | Responsable técnico/arquitectura    | Escala y coordenadas            |
| Q-005 | ¿Qué elementos deben omitirse aun si aparecen en evidencia?                | Seguridad                           | Inventario y fotos              |
| Q-006 | ¿Qué dispositivos/navegadores son objetivo y con qué preset por defecto?   | Producto/QA                         | Presupuesto de rendimiento      |
| Q-007 | ¿Quién puede aprobar el paso de DEMO a publicable?                         | Gobierno del proyecto               | Claims de fidelidad             |

## Registro de validaciones físicas

Todavía vacío. Usar el siguiente formato sin copiar evidencia restringida:

| ID  | Elemento/valor | Estado | Fuente aprobada | Método y tolerancia | Validado por/fecha | Alcance de uso/publicación |
| --- | -------------- | ------ | --------------- | ------------------- | ------------------ | -------------------------- |
| —   | —              | —      | —               | —                   | —                  | —                          |
