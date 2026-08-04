import type { InsightKey, Zone } from '../types'
import { puestosDe } from './geometry'
export interface InsightDef { key: InsightKey; label: string; desc: string; value: (z: Zone) => number; readout: (z: Zone) => string }
export const INSIGHTS: Record<InsightKey, InsightDef> = {
  none: { key: 'none', label: 'Sin insight', desc: 'Colores base.', value: () => 0, readout: () => '—' },
  ocupacion: { key: 'ocupacion', label: 'Ocupación', desc: 'Ocupación estimada por zona.', value: (z) => z.ocupacion, readout: (z) => `${Math.round(z.ocupacion)} %` },
  densidad: { key: 'densidad', label: 'Densidad', desc: 'Puestos por isla.', value: (z) => Math.min(100, (puestosDe(z) / 10) * 100), readout: (z) => `${puestosDe(z)} p.` },
  capacidad: { key: 'capacidad', label: 'Capacidad', desc: 'Puestos vs máximo.', value: (z) => Math.min(100, (puestosDe(z) / 10) * 100), readout: (z) => `${puestosDe(z)} puestos` },
  datalizacion: { key: 'datalizacion', label: '% Datalización', desc: 'Nivel de datalización.', value: (z) => z.datalizacion, readout: (z) => `${Math.round(z.datalizacion)} %` },
}
export const INSIGHT_ORDER: InsightKey[] = ['none', 'ocupacion', 'densidad', 'capacidad', 'datalizacion']
