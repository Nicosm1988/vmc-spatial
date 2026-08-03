export interface Point { x: number; y: number }
export type InsightKey = 'none' | 'ocupacion' | 'densidad' | 'capacidad' | 'datalizacion'
export type ZoneKind = 'cluster' | 'nucleo' | 'sala' | 'oficina' | 'salalarga' | 'pod'
export interface Zone {
  id: string; nombre: string; kind: ZoneKind
  x: number; y: number; w: number; h: number
  rot?: number
  pairs?: number          // pares de escritorios enfrentados por isla (bench)
  color: string; puestos: number; ocupacion: number; datalizacion: number; nota?: string
}
export interface VideoWall { id: string; nombre: string; x1: number; y1: number; x2: number; y2: number; pantallas: number }
export interface OrientLabel { texto: string; x: number; y: number; rot?: number }
export interface VmcDocument {
  schema: 'vmc-spatial/3'; nombre: string; piso: string
  ancho: number; alto: number; alturaLibre: number
  plate: Point[]; core: Point[]; columns: Point[]
  zonas: Zone[]; videoWalls: VideoWall[]; orientacion: OrientLabel[]; actualizado: string
}
export type AppMode = 'explorar' | 'editar2d' | 'editar3d'
export type ViewKind = '2d' | '3d'
