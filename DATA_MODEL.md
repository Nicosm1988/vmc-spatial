# Modelo de datos

## Contrato vigente

La versión importable vigente es `vmc-spatial/6`. El modelo representa una planta en un plano 2D y contiene zonas paramétricas y paredes de pantallas. Es un contrato de compatibilidad del prototipo, no un modelo BIM ni un relevamiento validado.

Todo valor de ejemplo actual se clasifica como **DEMO / NO VERIFICADO**. El archivo mínimo de referencia está en [`examples/room.demo.vmc-spatial-6.json`](./examples/room.demo.vmc-spatial-6.json).

## Unidades y sistema de coordenadas

| Concepto         | Dominio                                    | Render Three.js                                  |
| ---------------- | ------------------------------------------ | ------------------------------------------------ |
| Unidad lineal    | milímetro entero                           | metro                                            |
| Plano horizontal | `x`, `y`                                   | `x`, `z`                                         |
| Altura           | campo explícito, por ejemplo `alturaLibre` | eje `y`                                          |
| Rotación         | radianes                                   | radianes, adaptando signo/eje cuando corresponda |
| Porcentaje       | número entre 0 y 100                       | no aplica                                        |

La conversión lineal autorizada es:

```ts
const MM_PER_M = 1000
const toM = (mm: number) => mm / MM_PER_M
```

No se deben escribir metros dentro de un `VmcDocument`. Las posiciones, longitudes, radios, anchos y alturas deben ser números enteros. La conversión no se realiza al editar, persistir o exportar: solo al renderizar.

## Estructura TypeScript actual

La forma conceptual vigente es:

```ts
interface Point {
  x: number
  y: number
}

type ZoneKind = 'bench' | 'nucleo' | 'oficina' | 'circular' | 'comedor'

interface Zone {
  id: string
  nombre: string
  kind: ZoneKind
  cx: number
  cy: number
  rot?: number
  pairs?: number
  w?: number
  h?: number
  r?: number
  color: string
  puestos: number
  ocupacion: number
  datalizacion: number
  nota?: string
}

interface VideoWall {
  id: string
  nombre: string
  x1: number
  y1: number
  x2: number
  y2: number
  pantallas: number
  filas?: number
  flip?: boolean
}

interface OrientLabel {
  texto: string
  x: number
  y: number
  rot?: number
}

interface VmcDocument {
  schema: 'vmc-spatial/6'
  nombre: string
  piso: string
  ancho: number
  alto: number
  alturaLibre: number
  plate: Point[]
  core: Point[]
  zonas: Zone[]
  videoWalls: VideoWall[]
  orientacion: OrientLabel[]
  actualizado: string
}
```

El schema ejecutable es la autoridad; esta copia sirve para explicar el contrato y debe mantenerse sincronizada.

## Semántica de campos

### Documento

| Campo           | Significado                            | Invariante                                     |
| --------------- | -------------------------------------- | ---------------------------------------------- |
| `schema`        | versión del formato                    | exactamente `vmc-spatial/6`                    |
| `nombre`        | nombre de la configuración             | texto no vacío, sin implicar validación física |
| `piso`          | etiqueta descriptiva                   | texto; no es una referencia catastral          |
| `ancho`, `alto` | caja de trabajo del plano              | mm enteros positivos                           |
| `alturaLibre`   | altura libre usada por la escena       | mm entero positivo; demo hasta ser relevada    |
| `plate`         | perímetro de la planta                 | polígono de puntos mm                          |
| `core`          | polígono del núcleo representado       | puntos mm; demo, no mapa de seguridad          |
| `zonas`         | objetos paramétricos actuales          | IDs únicos                                     |
| `videoWalls`    | segmentos con composición de pantallas | IDs únicos junto con `zonas`                   |
| `orientacion`   | etiquetas de orientación               | no confiar como norte real sin relevamiento    |
| `actualizado`   | última modificación lógica             | fecha/hora ISO 8601 válida                     |

### Zonas

Todos los tipos usan `cx/cy` como centro. Los campos de tamaño dependen de `kind`:

| `kind`     | Campos geométricos relevantes  | Interpretación actual            |
| ---------- | ------------------------------ | -------------------------------- |
| `bench`    | `pairs`, `rot`                 | isla con dos puestos por par     |
| `circular` | `r`                            | radio de zona/mesa en mm         |
| `comedor`  | `w`, `h`, `rot`                | mesa/zona rectangular            |
| `oficina`  | `w`, `h`, `rot`                | volumen rectangular simplificado |
| `nucleo`   | centro; forma tomada de `core` | marcador del núcleo común        |

`color` es hoy un parámetro visual simple, no un material PBR versionado. `ocupacion` y `datalizacion` son métricas demostrativas; no deben presentarse como telemetría real. `puestos` puede ser derivado para `bench` y descriptivo en otros tipos.

### Videowalls

Un videowall se define por sus extremos `(x1,y1)` y `(x2,y2)` en mm. Su centro, longitud y ángulo se derivan; al editar deben redondearse nuevamente los extremos a mm enteros.

- `pantallas`: cantidad total entera positiva.
- `filas`: cantidad de filas entera positiva; las columnas se derivan para render.
- `flip`: elige el lado visible. Si falta en un documento histórico, puede normalizarse una vez y persistirse de forma explícita.

## Validación y fronteras de confianza

En Fase 1, la carga desde almacenamiento local y la importación de archivo usan el schema Zod `vmc-spatial/6`. El preset está tipado en TypeScript; la frontera objetivo exige validarlo también en runtime antes de usarlo. Un valor con la etiqueta de schema correcta pero estructura inválida no debe llegar al estado ni a Three.js.

El schema actual comprueba una raíz estricta, objetos de zona/videowall/orientación estrictos, campos requeridos, versión, enteros dimensionales, polígonos mínimos, enum de zona, colores hexadecimales, porcentajes y rangos básicos de cantidades. Los puntos exigen `x/y`, aunque todavía no rechazan explícitamente propiedades adicionales. Antes de considerar el ingreso completamente endurecido debe comprobar además:

- fecha ISO válida;
- longitudes máximas consistentes para todos los textos;
- rangos espaciales razonables y colecciones acotadas;
- campos condicionales obligatorios por `kind`;
- IDs únicos entre zonas y videowalls;
- geometría degenerada, por ejemplo un videowall de longitud cero.

La importación aplica además un límite de 5 MB antes de leer el archivo. Este límite no sustituye los límites por campo o colección.

Una importación inválida falla de forma atómica: no mezcla datos parciales con el documento activo. Los mensajes no deben incluir el contenido completo del archivo.

## Persistencia y round-trip

El almacenamiento de esta etapa es local al perfil del navegador y no está cifrado. La exportación produce JSON legible; una importación válida debe preservar todos los campos vigentes al exportarse de nuevo.

Reglas:

1. guardar solo documentos ya validados;
2. validar de nuevo al cargar porque el almacenamiento puede ser manipulado;
3. usar debounce para autosave, sin convertir una falla de cuota en caída de la escena;
4. resetear elimina el documento local y restaura un preset validado;
5. no almacenar fotos, secretos ni evidencia restringida en el documento.

Dexie/IndexedDB está planificado para una fase posterior. Su primera versión debe migrar el documento local vigente o conservar un fallback explícito.

## Identidad y actualizaciones

- Los IDs son opacos; no codificar coordenadas, nombres de personas ni información sensible en ellos.
- Mover, rotar o redimensionar no cambia el ID.
- Duplicar crea un ID nuevo antes de insertar.
- `actualizado` cambia cuando se modifica el documento, no por cambios de cámara o UI.
- Los IDs no deben basarse únicamente en `Date.now()` cuando exista posibilidad de concurrencia; la evolución recomendada es UUID/ULID generado localmente y probado.

## Limitaciones del formato actual

`vmc-spatial/6` no satisface todavía el modelo de objeto completo requerido para un editor escalable. En particular, no contiene en cada objeto:

- versión propia de schema;
- transformación uniforme (`position`, `rotation`, `scale`);
- dimensiones discriminadas y completas;
- material estructurado;
- metadata tipada;
- reglas de configuración/catálogo;
- visibilidad/capa y relaciones padre-hijo.

Tampoco representa paredes paramétricas con aberturas, puertas, ventanas, luminarias o assets por manifiesto. Estas carencias son deuda conocida, no campos implícitos.

## Evolución prevista, no implementada

La siguiente forma ilustra la dirección de una versión futura; **no es importable como `vmc-spatial/6`**:

```ts
interface SpatialObjectVNext {
  schemaVersion: number
  id: string
  type: string
  name: string
  positionMm: { x: number; y: number; z: number }
  rotationRad: { x: number; y: number; z: number }
  scale: { x: number; y: number; z: number }
  dimensionsMm: { width: number; depth: number; height: number }
  material: { id: string; overrides?: Record<string, unknown> }
  metadata: Record<string, string | number | boolean>
  configuration: Record<string, unknown>
}
```

Antes de adoptarla se debe diseñar una versión de documento nueva, discriminantes estrictos por objeto, migración desde v6, export/import, fixtures y tests de pérdida cero. No se agregan campos incompatibles manteniendo artificialmente la etiqueta v6.

## Criterio de confirmación física

Un valor dimensional solo deja de ser demo cuando el registro de evidencia incluye fuente autorizada, método de medición, fecha, incertidumbre/tolerancia, responsable de validación y permiso de uso/publicación. La precisión numérica del JSON no equivale a exactitud física.
