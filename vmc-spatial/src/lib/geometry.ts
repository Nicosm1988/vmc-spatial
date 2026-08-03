import type { Zone } from '../types'
export const MM_PER_M = 1000
export const toM = (mm: number) => mm / MM_PER_M
export function puestosDe(z: Zone): number { return z.kind === 'bench' ? (z.pairs || 0) * 2 : z.puestos }
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
