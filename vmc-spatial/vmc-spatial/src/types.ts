export interface Point { x: number; y: number }
export type InsightKey = 'none' | 'ocupacion' | 'densidad' | 'capacidad' | 'datalizacion'
export type ZoneKind = 'bench' | 'nucleo' | 'sala' | 'oficina' | 'circular' | 'wood'
export interface Zone {
  id: string; nombre: string; kind: ZoneKind
  cx: number; cy: number
  rot?: number; pairs?: number
  w?: number; h?: number; r?: number
  color: string; puestos: number; ocupacion: number; datalizacion: number; nota?: string
}
export interface VideoWall { id: string; nombre: string; x1: number; y1: number; x2: number; y2: number; pantallas: number; filas?: number }
export interface OrientLabel { texto: string; x: number; y: number; rot?: number }
export interface VmcDocument {
  schema: 'vmc-spatial/4'; nombre: string; piso: string
  ancho: number; alto: number; alturaLibre: number
  plate: Point[]; core: Point[]
  zonas: Zone[]; videoWalls: VideoWall[]; orientacion: OrientLabel[]; actualizado: string
}
export type AppMode = 'explorar' | 'editar2d' | 'editar3d'
export type ViewKind = '2d' | '3d'
