// ============================================================================
// Helpers de geometría. Todo en milímetros salvo donde se indique.
// ============================================================================
import type { Zone } from '../types'

export const MM_PER_M = 1000

// mm -> metros (para 3D y para mostrar cotas legibles).
export const toM = (mm: number) => mm / MM_PER_M

// Área de una zona en m².
export function areaM2(z: Zone): number {
  return (z.w / MM_PER_M) * (z.h / MM_PER_M)
}

// Densidad de puestos por 10 m² (proxy de "qué tan lleno" está un sector).
export function densidad(z: Zone): number {
  const a = areaM2(z)
  if (a <= 0) return 0
  return (z.puestos / a) * 10
}

// Centro de una zona en mm.
export function center(z: Zone): { cx: number; cy: number } {
  return { cx: z.x + z.w / 2, cy: z.y + z.h / 2 }
}

// Genera una grilla de posiciones para los hot desks dentro de una zona.
// Devuelve puntos en mm, dejando un margen interno. Se usa tanto en 2D como 3D.
export function packDesks(
  z: Zone,
  count: number,
  deskW = 1400,
  deskH = 800,
  gap = 500,
): Array<{ x: number; y: number }> {
  if (count <= 0) return []
  const margin = 900
  const innerX = z.x + margin
  const innerY = z.y + margin
  const innerW = Math.max(0, z.w - margin * 2)
  const innerH = Math.max(0, z.h - margin * 2)
  const stepX = deskW + gap
  const stepY = deskH + gap
  const cols = Math.max(1, Math.floor(innerW / stepX))
  const points: Array<{ x: number; y: number }> = []
  let placed = 0
  let row = 0
  while (placed < count) {
    const y = innerY + row * stepY
    if (y + deskH > innerY + innerH) break // no entra otra fila
    for (let c = 0; c < cols && placed < count; c++) {
      const x = innerX + c * stepX
      points.push({ x: x + deskW / 2, y: y + deskH / 2 })
      placed++
    }
    row++
  }
  return points
}

// Clamp utilitario.
export const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v))

// Interpola un color entre "frío" (bajo) y "caliente" (alto) para insights.
// value: 0..100. Devuelve hex.
export function heat(value: number): string {
  const v = clamp(value, 0, 100) / 100
  // Escala: azul (#1f6feb) -> verde (#2ea043) -> amarillo (#d29922) -> rojo (#da3633)
  const stops = [
    { p: 0.0, c: [31, 111, 235] },
    { p: 0.4, c: [46, 160, 67] },
    { p: 0.7, c: [210, 153, 34] },
    { p: 1.0, c: [218, 54, 51] },
  ]
  let a = stops[0]
  let b = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].p && v <= stops[i + 1].p) {
      a = stops[i]
      b = stops[i + 1]
      break
    }
  }
  const span = b.p - a.p || 1
  const t = (v - a.p) / span
  const ch = (i: number) => Math.round(a.c[i] + (b.c[i] - a.c[i]) * t)
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(ch(0))}${hex(ch(1))}${hex(ch(2))}`
}
