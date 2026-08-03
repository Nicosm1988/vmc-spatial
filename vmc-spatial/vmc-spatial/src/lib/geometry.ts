// ============================================================================
// Helpers de geometría. Todo en milímetros salvo donde se indique.
// ============================================================================
import type { Point, Zone } from '../types'
import { pointInPolygon } from './plate'

export const MM_PER_M = 1000
export const toM = (mm: number) => mm / MM_PER_M

export function areaM2(z: Zone): number {
  return (z.w / MM_PER_M) * (z.h / MM_PER_M)
}

export function densidad(z: Zone): number {
  const a = areaM2(z)
  if (a <= 0) return 0
  return (z.puestos / a) * 10
}

export function center(z: Zone): { cx: number; cy: number } {
  return { cx: z.x + z.w / 2, cy: z.y + z.h / 2 }
}

// Grilla de hot desks dentro de una zona, recortada al contorno de la planta.
// Si se pasa `plate`, sólo devuelve puntos que caen DENTRO de la lente.
export function packDesks(
  z: Zone,
  count: number,
  plate?: Point[],
  deskW = 1400,
  deskH = 800,
  gap = 500,
): Array<{ x: number; y: number }> {
  if (count <= 0) return []
  const margin = 800
  const innerX = z.x + margin
  const innerY = z.y + margin
  const innerW = Math.max(0, z.w - margin * 2)
  const innerH = Math.max(0, z.h - margin * 2)
  const stepX = deskW + gap
  const stepY = deskH + gap
  const cols = Math.max(1, Math.floor(innerW / stepX))
  const rows = Math.max(1, Math.floor(innerH / stepY))
  const points: Array<{ x: number; y: number }> = []
  for (let r = 0; r < rows && points.length < count; r++) {
    for (let c = 0; c < cols && points.length < count; c++) {
      const cx = innerX + c * stepX + deskW / 2
      const cy = innerY + r * stepY + deskH / 2
      if (!plate || pointInPolygon(cx, cy, plate)) {
        points.push({ x: cx, y: cy })
      }
    }
  }
  return points
}

export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

// Heatmap frío→caliente para insights (0..100 → hex).
export function heat(value: number): string {
  const v = clamp(value, 0, 100) / 100
  const stops = [
    { p: 0.0, c: [4, 36, 217] },    // #0424D9 azul profundo
    { p: 0.5, c: [3, 193, 189] },   // #03C1BD teal
    { p: 0.75, c: [210, 153, 34] }, // ámbar
    { p: 1.0, c: [218, 54, 51] },   // rojo
  ]
  let a = stops[0]
  let b = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].p && v <= stops[i + 1].p) {
      a = stops[i]; b = stops[i + 1]; break
    }
  }
  const span = b.p - a.p || 1
  const t = (v - a.p) / span
  const ch = (i: number) => Math.round(a.c[i] + (b.c[i] - a.c[i]) * t)
  const hx = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hx(ch(0))}${hx(ch(1))}${hx(ch(2))}`
}
