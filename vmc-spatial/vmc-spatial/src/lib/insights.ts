import type { InsightKey, Zone } from '../types'
import { densidad } from './geometry'
export interface InsightDef { key: InsightKey; label: string; desc: string; value: (z: Zone) => number; readout: (z: Zone) => string }
const densidadPct = (z: Zone) => Math.min(100, (densidad(z) / 3.5) * 100)
export const INSIGHTS: Record<InsightKey, InsightDef> = {
  none: { key: 'none', label: 'Sin insight', desc: 'Colores base de cada cluster.', value: () => 0, readout: () => '—' },
  ocupacion: { key: 'ocupacion', label: 'Ocupación', desc: 'Ocupación estimada por cluster.', value: (z) => z.ocupacion, readout: (z) => `${Math.round(z.ocupacion)} %` },
  densidad: { key: 'densidad', label: 'Densidad de puestos', desc: 'Puestos cada 10 m².', value: densidadPct, readout: (z) => `${densidad(z).toFixed(1)} p/10m²` },
  capacidad: { key: 'capacidad', label: 'Capacidad (puestos)', desc: 'Puestos por cluster vs máximo.', value: (z) => Math.min(100, (z.puestos / 45) * 100), readout: (z) => `${z.puestos} puestos` },
  datalizacion: { key: 'datalizacion', label: '% Datalización', desc: 'Nivel de datalización (enganchable a tu star schema).', value: (z) => z.datalizacion, readout: (z) => `${Math.round(z.datalizacion)} %` },
}
export const INSIGHT_ORDER: InsightKey[] = ['none', 'ocupacion', 'densidad', 'capacidad', 'datalizacion']
