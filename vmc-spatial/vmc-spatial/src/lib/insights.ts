// ============================================================================
// Mapas de insights. Cada key devuelve un valor 0..100 por zona y una etiqueta.
// ============================================================================
import type { InsightKey, Zone } from '../types'
import { densidad } from './geometry'

export interface InsightDef {
  key: InsightKey
  label: string
  desc: string
  // valor 0..100 para pintar el heatmap
  value: (z: Zone) => number
  // texto que se muestra en el chip / inspector
  readout: (z: Zone) => string
}

// Normaliza densidad (0..~4 puestos por 10m²) a 0..100.
const densidadPct = (z: Zone) => Math.min(100, (densidad(z) / 3.5) * 100)

export const INSIGHTS: Record<InsightKey, InsightDef> = {
  none: {
    key: 'none',
    label: 'Sin insight',
    desc: 'Muestra los colores base de cada zona.',
    value: () => 0,
    readout: () => '—',
  },
  ocupacion: {
    key: 'ocupacion',
    label: 'Ocupación',
    desc: 'Porcentaje de ocupación estimada por sector.',
    value: (z) => z.ocupacion,
    readout: (z) => `${Math.round(z.ocupacion)} %`,
  },
  densidad: {
    key: 'densidad',
    label: 'Densidad de puestos',
    desc: 'Puestos cada 10 m². Detecta alas más cargadas.',
    value: densidadPct,
    readout: (z) => `${densidad(z).toFixed(1)} p/10m²`,
  },
  capacidad: {
    key: 'capacidad',
    label: 'Capacidad (puestos)',
    desc: 'Cantidad de puestos por zona, relativo al máximo.',
    value: (z) => Math.min(100, (z.puestos / 45) * 100),
    readout: (z) => `${z.puestos} puestos`,
  },
  datalizacion: {
    key: 'datalizacion',
    label: '% Datalización',
    desc: 'Nivel de datalización del sector (enganchable a tu star schema).',
    value: (z) => z.datalizacion,
    readout: (z) => `${Math.round(z.datalizacion)} %`,
  },
}

export const INSIGHT_ORDER: InsightKey[] = [
  'none',
  'ocupacion',
  'densidad',
  'capacidad',
  'datalizacion',
]
