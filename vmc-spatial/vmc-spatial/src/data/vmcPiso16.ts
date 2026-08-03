// ============================================================================
// PRESET · VMC Piso 16 — Torre YPF, Puerto Madero, CABA.
// Distribución basada en el PLANO CAD real (lente Pelli). Nombres del LAY OUT:
// perímetro con Data & Information Excellence, Machine Learning & AI, Performance,
// Control Tower, Troubleshooting (punta Este), Operational License & Excellence,
// Control Execution (x2), Business Digital Twin. Núcleo de servicio central con
// 4 video walls (grilla de pantallas sobre credenzas). Cotas aproximadas.
// ============================================================================
import type { VmcDocument } from '../types'
import { lensPlate } from '../lib/plate'

const ANCHO = 62000
const ALTO = 40000
const PLATE = lensPlate({ cx: ANCHO / 2, cy: ALTO / 2, halfL: 29000, halfW: 16500, pointiness: 0.6, steps: 72 })

const C = {
  data: '#0e9bc4', ml: '#5b6cf0', perf: '#1657ce', tower: '#1a73c6',
  trouble: '#e8a33d', opex: '#17a9a0', ctrlE: '#03c1bd', ctrlW: '#10a5b8',
  bdt: '#3457a6', core: '#0a1636', sala: '#3b4a6b',
}

export const VMC_PISO_16: VmcDocument = {
  schema: 'vmc-spatial/2',
  nombre: 'VMC · Piso 16',
  piso: 'Torre YPF · Puerto Madero · Piso 16',
  ancho: ANCHO, alto: ALTO, alturaLibre: 2900,
  plate: PLATE,
  actualizado: new Date().toISOString(),
  zonas: [
    { id: 'core', nombre: 'Núcleo de servicio', kind: 'nucleo', x: 24000, y: 13500, w: 14000, h: 13000, color: C.core, puestos: 0, ocupacion: 100, datalizacion: 95, nota: 'Núcleo central (ascensores/escaleras). 4 Video Walls en sus caras.' },
    // NORTE (Macacha Güemes), Oeste -> Este
    { id: 'data-info', nombre: 'Data & Information Excellence', kind: 'cluster', x: 8000, y: 9000, w: 9000, h: 6000, color: C.data, puestos: 12, ocupacion: 70, datalizacion: 92, nota: 'Excelencia de datos e información (NO).' },
    { id: 'ml-ai', nombre: 'Machine Learning & AI', kind: 'cluster', x: 20000, y: 6500, w: 8000, h: 5000, color: C.ml, puestos: 8, ocupacion: 55, datalizacion: 90, nota: 'Modelos de ML y agentes de IA (N).' },
    { id: 'performance', nombre: 'Performance', kind: 'cluster', x: 30000, y: 6500, w: 8000, h: 5000, color: C.perf, puestos: 10, ocupacion: 82, datalizacion: 70, nota: 'Monitoreo de KPI (N).' },
    { id: 'control-tower', nombre: 'Control Tower', kind: 'cluster', x: 41000, y: 9000, w: 9000, h: 6000, color: C.tower, puestos: 10, ocupacion: 75, datalizacion: 78, nota: 'Torre de control (NE).' },
    // ESTE (río): Troubleshooting
    { id: 'troubleshooting', nombre: 'Troubleshooting', kind: 'troubleshooting', x: 51000, y: 16000, w: 7000, h: 8000, color: C.trouble, puestos: 0, ocupacion: 90, datalizacion: 80, nota: 'Mesa de resolución de problemas (punta Este).' },
    // SUR (Manuela Sáenz), Este -> Oeste
    { id: 'opex', nombre: 'Operational License & Excellence', kind: 'cluster', x: 41000, y: 25000, w: 9000, h: 6000, color: C.opex, puestos: 12, ocupacion: 78, datalizacion: 60, nota: 'Licencia y excelencia operacional (SE).' },
    { id: 'control-exec-e', nombre: 'Control Execution', kind: 'cluster', x: 30000, y: 28500, w: 8000, h: 5000, color: C.ctrlE, puestos: 12, ocupacion: 80, datalizacion: 68, nota: 'Control Execution (S).' },
    { id: 'control-exec-w', nombre: 'Control Execution', kind: 'cluster', x: 20000, y: 28500, w: 8000, h: 5000, color: C.ctrlW, puestos: 12, ocupacion: 80, datalizacion: 66, nota: 'Control Execution (S).' },
    { id: 'business-digital-twin', nombre: 'Business Digital Twin', kind: 'cluster', x: 8000, y: 25000, w: 9000, h: 6000, color: C.bdt, puestos: 10, ocupacion: 60, datalizacion: 85, nota: 'Gemelo digital del negocio (SO).' },
    // Salas de reunión (Oeste del núcleo)
    { id: 'sala-1', nombre: 'Sala de Reunión 1', kind: 'sala', x: 17800, y: 14000, w: 4800, h: 4200, color: C.sala, puestos: 0, ocupacion: 45, datalizacion: 30, nota: 'Sala de reunión vidriada.' },
    { id: 'sala-2', nombre: 'Sala de Reunión 2', kind: 'sala', x: 17800, y: 21800, w: 4800, h: 4200, color: C.sala, puestos: 0, ocupacion: 35, datalizacion: 30, nota: 'Sala de reunión vidriada.' },
  ],
  videoWalls: [
    { id: 'vw-n', nombre: 'Video Wall Norte', x1: 26000, y1: 13500, x2: 36000, y2: 13500, pantallas: 24 },
    { id: 'vw-s', nombre: 'Video Wall Sur', x1: 26000, y1: 26500, x2: 36000, y2: 26500, pantallas: 24 },
    { id: 'vw-o', nombre: 'Video Wall Oeste', x1: 24000, y1: 15500, x2: 24000, y2: 24500, pantallas: 21 },
    { id: 'vw-e', nombre: 'Video Wall Este', x1: 38000, y1: 15500, x2: 38000, y2: 24500, pantallas: 21 },
  ],
  orientacion: [
    { texto: 'Bv. Macacha Güemes  ·  N', x: 31000, y: 2600 },
    { texto: 'Manuela Sáenz  ·  S', x: 31000, y: 37800 },
    { texto: 'Juana Manso  ·  O', x: 5200, y: 20000, rot: -90 },
    { texto: 'Río de la Plata  ·  E', x: 57200, y: 20000, rot: 90 },
  ],
}
