import type { Point } from '../types'
export interface LensOpts { cx: number; cy: number; halfL: number; halfW: number; pointiness?: number; steps?: number }
function widthAt(t: number, halfW: number, p: number): number { return halfW * Math.pow(Math.max(0, 1 - t * t), p) }
export function lensPlate(o: LensOpts): Point[] {
  const { cx, cy, halfL, halfW } = o
  const p = o.pointiness ?? 0.62, steps = o.steps ?? 64
  const pts: Point[] = []
  for (let i = 0; i <= steps; i++) { const t = -1 + (2 * i) / steps; pts.push({ x: Math.round(cx + t * halfL), y: Math.round(cy - widthAt(t, halfW, p)) }) }
  for (let i = steps; i >= 0; i--) { const t = -1 + (2 * i) / steps; pts.push({ x: Math.round(cx + t * halfL), y: Math.round(cy + widthAt(t, halfW, p)) }) }
  return pts
}
export function scalePoly(poly: Point[], f: number, cx: number, cy: number): Point[] { return poly.map((p) => ({ x: Math.round(cx + (p.x - cx) * f), y: Math.round(cy + (p.y - cy) * f) })) }
export function toSvgPoints(poly: Point[]): string { return poly.map((p) => `${p.x},${p.y}`).join(' ') }
