// ============================================================================
// Mapas de insights. Cada key devuelve un valor 0..100 por zona + etiqueta.
// ============================================================================
import type { InsightKey, Zone } from '../types'
import { densidad } from './geometry'

export interface InsightDef {
  key: InsightKey
  label: string
  desc: string
  value: (z: Zone) => number
  readout: (z: Zone) => string
}

const densidadPct = (z: Zone) => Math.min(100, (densidad(z) / 3.5) * 100)

export const INSIGHTS: Record<InsightKey, InsightDef> = {
  none: {
    key: 'none',
    label: 'Sin insight',
    desc: 'Muestra los colores base de cada cluster.',
    value: () => 0,
    readout: () => '—',
  },
  ocupacion: {
    key: 'ocupacion',
    label: 'Ocupación',
    desc: 'Porcentaje de ocupación estimada por cluster.',
    value: (z) => z.ocupacion,
    readout: (z) => `${Math.round(z.ocupacion)} %`,
  },
  densidad: {
    key: 'densidad',
    label: 'Densidad de puestos',
    desc: 'Puestos cada 10 m². Detecta clusters más cargados.',
    value: densidadPct,
    readout: (z) => `${densidad(z).toFixed(1)} p/10m²`,
  },
  capacidad: {
    key: 'capacidad',
    label: 'Capacidad (puestos)',
    desc: 'Cantidad de puestos por cluster, relativo al máximo.',
    value: (z) => Math.min(100, (z.puestos / 45) * 100),
    readout: (z) => `${z.puestos} puestos`,
  },
  datalizacion: {
    key: 'datalizacion',
    label: '% Datalización',
    desc: 'Nivel de datalización del cluster (enganchable a tu star schema).',
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
