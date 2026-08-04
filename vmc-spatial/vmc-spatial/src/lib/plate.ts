import type { Point } from '../types'
export function pointInPolygon(px: number, py: number, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y
    const it = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (it) inside = !inside
  }
  return inside
}
export function toSvgPoints(poly: Point[]): string { return poly.map((p) => `${p.x},${p.y}`).join(' ') }
