import type { Point, Zone } from '../types'
import { pointInPolygon } from './plate'
export const MM_PER_M = 1000
export const toM = (mm: number) => mm / MM_PER_M
export function areaM2(z: Zone): number { return (z.w / MM_PER_M) * (z.h / MM_PER_M) }
export function densidad(z: Zone): number { const a = areaM2(z); return a <= 0 ? 0 : (z.puestos / a) * 10 }
export function center(z: Zone): { cx: number; cy: number } { return { cx: z.x + z.w / 2, cy: z.y + z.h / 2 } }
export function packDesks(z: Zone, count: number, plate?: Point[], deskW = 1500, deskH = 1450, gap = 300): Array<{ x: number; y: number }> {
  if (count <= 0) return []
  const margin = 650
  const innerX = z.x + margin, innerY = z.y + margin
  const innerW = Math.max(0, z.w - margin * 2), innerH = Math.max(0, z.h - margin * 2)
  const stepX = deskW + gap, stepY = deskH + gap
  const cols = Math.max(1, Math.floor(innerW / stepX))
  const rows = Math.max(1, Math.floor(innerH / stepY))
  const points: Array<{ x: number; y: number }> = []
  for (let r = 0; r < rows && points.length < count; r++) {
    for (let c = 0; c < cols && points.length < count; c++) {
      const cx = innerX + c * stepX + deskW / 2
      const cy = innerY + r * stepY + deskH / 2
      if (!plate || pointInPolygon(cx, cy, plate)) points.push({ x: cx, y: cy })
    }
  }
  return points
}
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))
export function heat(value: number): string {
  const v = clamp(value, 0, 100) / 100
  const stops = [ { p: 0.0, c: [4, 36, 217] }, { p: 0.5, c: [3, 193, 189] }, { p: 0.75, c: [210, 153, 34] }, { p: 1.0, c: [218, 54, 51] } ]
  let a = stops[0], b = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) { if (v >= stops[i].p && v <= stops[i + 1].p) { a = stops[i]; b = stops[i + 1]; break } }
  const span = b.p - a.p || 1
  const t = (v - a.p) / span
  const ch = (i: number) => Math.round(a.c[i] + (b.c[i] - a.c[i]) * t)
  const hx = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hx(ch(0))}${hx(ch(1))}${hx(ch(2))}`
}
