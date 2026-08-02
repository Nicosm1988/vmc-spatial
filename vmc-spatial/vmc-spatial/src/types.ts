// ============================================================================
// VMC Spatial Studio · Modelo de datos
// ----------------------------------------------------------------------------
// Todo el "gemelo espacial" del Piso 16 se deriva de UN solo documento JSON.
// Las dimensiones se almacenan como ENTEROS en milímetros (mm), igual que en
// Senda. El plano 2D, la escena 3D y los insights se calculan a partir de acá.
// ============================================================================

// Métricas conceptuales que se pueden mapear como "insights" sobre el plano.
export type InsightKey =
  | 'none'
  | 'ocupacion'
  | 'densidad'
  | 'capacidad'
  | 'datalizacion'

// Tipo funcional de cada espacio del piso.
export type ZoneKind =
  | 'ala'          // ala operativa con hot desks
  | 'nucleo'       // núcleo central con video walls
  | 'sala'         // sala de reunión / sala interna
  | 'troubleshooting'
  | 'servicio'     // circulación, office, etc.

export interface Zone {
  id: string
  nombre: string
  kind: ZoneKind
  // Rectángulo en mm (origen arriba-izquierda, x→derecha, y→abajo).
  x: number
  y: number
  w: number
  h: number
  // Color base de la zona (hex).
  color: string
  // Cantidad de puestos / hot desks (0 si no aplica).
  puestos: number
  // Valores 0..100 para los mapas de insights.
  ocupacion: number     // % de ocupación estimada
  datalizacion: number  // % de datalización del sector
  // Texto libre para el inspector.
  nota?: string
}

// Muro simple entre dos puntos (mm).
export interface Wall {
  id: string
  x1: number
  y1: number
  x2: number
  y2: number
}

// Video wall (pantallas del núcleo). Se dibuja como un segmento resaltado.
export interface VideoWall {
  id: string
  nombre: string
  x1: number
  y1: number
  x2: number
  y2: number
  pantallas: number
}

// Documento raíz. Es lo único que se persiste, importa y exporta.
export interface VmcDocument {
  schema: 'vmc-spatial/1'
  nombre: string
  piso: string
  // Dimensiones totales de la planta en mm.
  ancho: number
  alto: number
  // Altura libre del piso en mm (para la extrusión 3D).
  alturaLibre: number
  zonas: Zone[]
  muros: Wall[]
  videoWalls: VideoWall[]
  // Sello de la última edición.
  actualizado: string
}

// Modos de la aplicación (igual espíritu que Senda: Explorar / Editar 2D / 3D).
export type AppMode = 'explorar' | 'editar2d' | 'editar3d'
export type ViewKind = '2d' | '3d'
