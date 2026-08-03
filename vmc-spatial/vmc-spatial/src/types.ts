// ============================================================================
// VMC Spatial Studio · Modelo de datos
// ----------------------------------------------------------------------------
// Todo el "gemelo espacial" del Piso 16 se deriva de UN documento JSON.
// Dimensiones en ENTEROS de milímetros (mm), origen arriba-izquierda
// (x → derecha / Este, y → abajo / Sur).
//
// IMPORTANTE: la planta NO es rectangular. La Torre YPF (César Pelli) tiene
// una huella en forma de LENTE/ALMENDRA de ~1.600 m². Por eso el documento
// incluye `plate`: el polígono real del contorno del piso.
// ============================================================================

export interface Point {
  x: number
  y: number
}

export type InsightKey =
  | 'none'
  | 'ocupacion'
  | 'densidad'
  | 'capacidad'
  | 'datalizacion'

export type ZoneKind =
  | 'cluster'        // cluster de equipo con hot desks
  | 'nucleo'         // núcleo central con video walls
  | 'sala'           // sala de reunión
  | 'troubleshooting'
  | 'servicio'

export interface Zone {
  id: string
  nombre: string
  kind: ZoneKind
  // Rectángulo contenedor en mm (se recorta contra la lente en el plano).
  x: number
  y: number
  w: number
  h: number
  color: string
  puestos: number
  ocupacion: number     // 0..100
  datalizacion: number  // 0..100
  nota?: string
}

export interface VideoWall {
  id: string
  nombre: string
  x1: number
  y1: number
  x2: number
  y2: number
  pantallas: number
}

// Etiqueta de orientación (calles / río / norte).
export interface OrientLabel {
  texto: string
  x: number
  y: number
  rot?: number
}

export interface VmcDocument {
  schema: 'vmc-spatial/2'
  nombre: string
  piso: string
  ancho: number
  alto: number
  alturaLibre: number
  // Contorno real de la planta (lente Pelli), en mm.
  plate: Point[]
  zonas: Zone[]
  videoWalls: VideoWall[]
  orientacion: OrientLabel[]
  actualizado: string
}

export type AppMode = 'explorar' | 'editar2d' | 'editar3d'
export type ViewKind = '2d' | '3d'
