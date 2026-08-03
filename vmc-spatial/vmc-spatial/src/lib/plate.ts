// ============================================================================
// Generación del contorno de la planta (huella) del Piso 16.
// La Torre YPF (Pelli) tiene planta en forma de LENTE/ALMENDRA de ~1.600 m²,
// eje largo Este–Oeste. Generamos el polígono con un perfil de ancho suave y
// puntas en los extremos (Oeste = ciudad, Este = río).
// ============================================================================
import type { Point } from '../types'

export interface LensOpts {
  cx: number
  cy: number
  halfL: number // medio largo (Este-Oeste) en mm
  halfW: number // medio ancho (Norte-Sur) en mm
  pointiness?: number // 0.5 (romo) .. 0.8 (puntiagudo)
  steps?: number
}

// Perfil de medio-ancho en función de t ∈ [-1, 1].
function widthAt(t: number, halfW: number, p: number): number {
  const base = Math.pow(Math.max(0, 1 - t * t), p)
  return halfW * base
}

// Genera el polígono de la lente (borde superior O→E, luego inferior E→O).
export function lensPlate(o: LensOpts): Point[] {
  const { cx, cy, halfL, halfW } = o
  const p = o.pointiness ?? 0.62
  const steps = o.steps ?? 64
  const pts: Point[] = []
  // Borde NORTE (arriba), de Oeste (-1) a Este (+1)
  for (let i = 0; i <= steps; i++) {
    const t = -1 + (2 * i) / steps
    const x = cx + t * halfL
    pts.push({ x: Math.round(x), y: Math.round(cy - widthAt(t, halfW, p)) })
  }
  // Borde SUR (abajo), de Este (+1) a Oeste (-1)
  for (let i = steps; i >= 0; i--) {
    const t = -1 + (2 * i) / steps
    const x = cx + t * halfL
    pts.push({ x: Math.round(x), y: Math.round(cy + widthAt(t, halfW, p)) })
  }
  return pts
}

// ¿El punto (px,py) está dentro del polígono? (ray casting)
export function pointInPolygon(px: number, py: number, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, yi = poly[i].y
    const xj = poly[j].x, yj = poly[j].y
    const intersect =
      yi > py !== yj > py &&
      px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Convierte el polígono a un atributo `points` para SVG <polygon>.
export function toSvgPoints(poly: Point[]): string {
  return poly.map((p) => `${p.x},${p.y}`).join(' ')
}
