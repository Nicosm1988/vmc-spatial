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
export function rotatePt(px: number, py: number, cx: number, cy: number, ang: number): Point {
  if (!ang) return { x: px, y: py }
  const c = Math.cos(ang), s = Math.sin(ang)
  const dx = px - cx, dy = py - cy
  return { x: cx + dx * c - dy * s, y: cy + dx * s + dy * c }
}
export function rotatedRect(x: number, y: number, w: number, h: number, ang: number, cx: number, cy: number): Point[] {
  const corners = [ { x, y }, { x: x + w, y }, { x: x + w, y: y + h }, { x, y: y + h } ]
  return corners.map((p) => rotatePt(p.x, p.y, cx, cy, ang))
}
