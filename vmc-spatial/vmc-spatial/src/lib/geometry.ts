import type { Point, Zone } from '../types'
import { rotatePt } from './plate'
export const MM_PER_M = 1000
export const toM = (mm: number) => mm / MM_PER_M
export function areaM2(z: Zone): number { return (z.w / MM_PER_M) * (z.h / MM_PER_M) }
export function densidad(z: Zone): number { const a = areaM2(z); return a <= 0 ? 0 : (z.puestos / a) * 10 }
export function center(z: Zone): { cx: number; cy: number } { return { cx: z.x + z.w / 2, cy: z.y + z.h / 2 } }

// BENCH: dos filas ENFRENTADAS de escritorios (monitores espalda con espalda).
// Devuelve por escritorio: posición (mm), rotación de la isla, y "side"
// (+1 fila que mira -radial / -1 la opuesta) para orientar el monitor.
export interface DeskSlot { x: number; y: number; rot: number; side: number }
export function benchDesks(z: Zone, deskW = 1550, rowOffset = 1050): DeskSlot[] {
  const pairs = z.pairs || 3
  const cx = z.x + z.w / 2, cy = z.y + z.h / 2, a = z.rot || 0
  const benchLen = pairs * deskW
  const out: DeskSlot[] = []
  for (let i = 0; i < pairs; i++) {
    const lx = -benchLen / 2 + deskW / 2 + i * deskW
    for (const side of [-1, 1]) {
      const p = rotatePt(cx + lx, cy + side * rowOffset, cx, cy, a)
      out.push({ x: p.x, y: p.y, rot: a, side })
    }
  }
  return out
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
