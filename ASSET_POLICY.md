# Política de assets y referencias

## Estado actual

La escena de esta etapa usa geometría, materiales y texturas procedurales generados en código. **No se usaron fotos internas, planos internos, modelos 3D descargados ni texturas fotográficas externas para derivar la geometría actual.** El exterior de Fase 2 tampoco incorpora assets externos: sus fuentes públicas están registradas como referencia únicamente en [`docs/PHASE_2_EXTERIOR.md`](./docs/PHASE_2_EXTERIOR.md). Por lo tanto, la forma, fachada, entorno, distribución y mobiliario visibles son **DEMO / NO VERIFICADOS**.

Las capturas generadas por pruebas o revisión visual no son assets de runtime ni evidencia de fidelidad. La descarga PNG de la aplicación incrusta visualmente la marca `DEMO · NO VERIFICADO`; esa marca no se debe retirar mientras la escena conserve esta clasificación.

## Registro de referencias de Fase 2

Rige la regla **REFERENCE ONLY / NO ASSET COPIED**:

- las URLs públicas se consultaron para contrastar relaciones visuales y hechos generales;
- no se descargó, copió, calcó, fotogrametrizó, convirtió ni incorporó ninguna foto, textura, plano, modelo, logo o pieza editorial;
- una fotografía con licencia abierta sigue siendo sólo una referencia mientras no exista una decisión explícita de incorporación y un manifiesto completo;
- la licencia de una fotografía no concede automáticamente derechos sobre marcas, logos, arquitectura u otros elementos representados;
- los parámetros de `src/domain/exteriorSpec.ts` son aproximaciones procedurales DEMO y no una extracción métrica de las fuentes.

La matriz de fuentes, fechas de acceso, restricciones e incertidumbres está en [`docs/PHASE_2_EXTERIOR.md`](./docs/PHASE_2_EXTERIOR.md). Como no entró ningún archivo externo al bundle, Fase 2 no agrega entradas al manifiesto de assets.

La corrección de Fase 3 construye el texto `YPF` en runtime mediante trazos volumétricos simples e instanciados. No es un archivo, vector, tipografía corporativa ni asset oficial copiado, por lo que no agrega una entrada de manifiesto. Esta decisión técnica **no resuelve los derechos de marca**: el lettering permanece `demo-unverified`, no implica respaldo y requiere revisión de marca/licencia antes de cualquier uso que pretenda ser oficial. Si esa revisión no lo autoriza, debe sustituirse por un placeholder genérico.

## Principio de admisión

Que una imagen, modelo o marca sea visible en Internet no concede permiso para copiarla, convertirla, entrenar/derivar un asset o redistribuirla. Todo asset nuevo necesita antes de entrar al bundle:

1. una finalidad concreta;
2. una fuente identificable;
3. licencia o autorización compatible con uso, modificación, distribución web y repositorio;
4. clasificación de sensibilidad;
5. registro de procedencia y transformaciones;
6. revisión técnica de tamaño, formato y rendimiento;
7. aprobación adicional cuando contenga marca, interior corporativo o información operativa.

Una referencia puede servir para entender hechos públicos generales sin que la imagen se copie o distribuya.

## Fuentes preferidas

En orden de preferencia:

- geometría y texturas procedurales creadas en el proyecto;
- assets propios creados específicamente para el proyecto, con cesión/autorización documentada;
- assets CC0/dominio público cuya condición pueda verificarse en la fuente original;
- assets con licencia permisiva compatible, cumpliendo atribución y avisos;
- assets comerciales con licencia explícita que cubra el uso web y el modo de almacenamiento elegido.

No asumir que “royalty-free” significa reutilización sin condiciones. La licencia debe conservarse como evidencia.

## Fuentes no admitidas sin autorización específica

- descargas de Google Maps/Street View, redes sociales, prensa o sitios de arquitectura para usarlas como texturas o modelos;
- fotografías con copyright sin licencia de adaptación y redistribución;
- planos, renders, CAD/BIM, nubes de puntos o modelos internos;
- logos, señalética y tipografías de marca sin derechos de uso aprobados;
- rip de videojuegos, catálogos o configuradores de fabricantes;
- assets generados a partir de material restringido enviado a un servicio externo no autorizado;
- archivos sin fuente, autor o términos verificables.

No intentar recrear un asset propietario de forma que conserve elementos expresivos sustanciales del original. Ante duda de licencia o marca, usar un placeholder genérico.

## Fotos y mediciones internas

Las fotos y mediciones son evidencia restringida por defecto, no assets publicables.

- Obtener autorización antes de capturar, transferir o procesar.
- Definir quién puede verlas, dónde se almacenan, retención y propósito.
- Evitar personas, credenciales, pantallas, documentos, pizarras, cámaras, accesos y controles de seguridad.
- Eliminar EXIF/GPS y revisar reflejos antes de compartir.
- No subirlas al repositorio ni a servicios de IA, fotogrametría, conversión o almacenamiento externos sin autorización escrita específica.
- Derivar solo los parámetros mínimos necesarios y registrar incertidumbre.
- Una medida aprobada para modelado interno no queda automáticamente autorizada para un deployment público.

El procedimiento de captura está en [`docs/PHOTO_MEASUREMENT_CHECKLIST.md`](./docs/PHOTO_MEASUREMENT_CHECKLIST.md).

## Manifiesto de procedencia

Cuando se incorporen archivos en `assets/`, cada uno debe tener una entrada de manifiesto versionada. Campos mínimos:

```json
{
  "id": "asset-id-estable",
  "file": "ruta/relativa.glb",
  "kind": "model",
  "sourceUrl": "https://fuente-original.example/item",
  "author": "Autor o entidad",
  "license": "SPDX-o-identificador-documentado",
  "licenseUrl": "https://fuente-original.example/license",
  "acquiredAt": "AAAA-MM-DD",
  "sha256": "hash-del-archivo-original-o-ingresado",
  "modifications": ["escala normalizada", "materiales consolidados"],
  "attribution": "Texto requerido, si aplica",
  "sensitivity": "public",
  "approvedBy": "rol-o-ticket-de-aprobacion",
  "approvedAt": "AAAA-MM-DD"
}
```

No usar `approvedBy` con nombres personales si el manifiesto será público; preferir rol o referencia de ticket. Si la licencia exige conservar archivos adicionales, incluirlos de forma visible en distribución y repositorio.

## Presupuesto técnico

Valores por defecto para runtime web:

- texturas de hasta 2048×2048; usar menor resolución cuando la densidad de texel lo permita;
- formatos comprimidos y mipmaps apropiados; KTX2/Basis para texturas cuando el pipeline esté disponible;
- glTF/GLB como formato 3D preferido, con compresión probada y fallback cuando corresponda;
- LOD para exterior y elementos lejanos;
- instancing para geometrías/materiales repetidos;
- lazy loading de assets no necesarios para la primera vista;
- ninguna textura, mesh o material queda vivo después de que su dueño se desmonta.

Los presupuestos globales objetivo son menos de 200 draw calls y menos de 250.000 triángulos visibles en la escena base. El ingreso de cada asset debe acompañarse con medición antes/después, no solo tamaño en disco.

El exterior procedural reduce detalle de fachada y densidad de contexto mediante LOD, y agrupa elementos repetidos con instancing. Para medir el runtime se puede habilitar `?diagnostics=1` y leer `window.__VMC_SCENE_METRICS__`. Estos datos deben registrarse con dispositivo, navegador, viewport, etapa y calidad; no se debe inferir cumplimiento a partir de una sola captura o de la existencia del diagnóstico.

## Materiales y realismo

- Preferir parámetros PBR plausibles y consistentes a efectos llamativos.
- No usar bloom o emisión para simular iluminación que debería provenir de luces/materiales físicos.
- Evitar logos o textos de marca como sustitutos de fidelidad arquitectónica.
- Documentar escala, orientación, origen y unidades de modelos importados.
- Mantener placeholders claramente distinguibles de assets aprobados.

## Proceso de revisión

Antes de integrar un asset:

- [ ] fuente original y licencia verificadas;
- [ ] uso web, modificación y redistribución permitidos;
- [ ] atribución/avisos preparados;
- [ ] clasificación pública aprobada;
- [ ] EXIF, metadata y contenido visible revisados;
- [ ] hash y transformaciones registrados;
- [ ] escala y unidades comprobadas;
- [ ] tamaño, triángulos, draw calls y memoria medidos;
- [ ] fallback y carga fallida probados;
- [ ] `docs/ASSUMPTIONS_AND_FACTS.md` actualizado si el asset respalda una afirmación.

La ausencia de cualquiera de estos puntos mantiene el asset fuera del bundle público.
