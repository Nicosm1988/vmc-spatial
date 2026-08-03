// ============================================================================
// PRESET · VMC Piso 16 — Torre YPF, Puerto Madero, CABA.
// Distribución según plano CAD. Planta LENTE (Pelli).
// FRENTE = punta ESTE (derecha, río): 3 OFICINAS (centro grande + 2 chicas).
// FONDO = punta OESTE (izquierda, ciudad). LADOS = Norte / Sur.
// Islas de escritorios en el perímetro; núcleo central en cruz con 4 Video Walls.
// ============================================================================
import type { VmcDocument } from '../types'
import { lensPlate } from '../lib/plate'

const ANCHO = 62000
const ALTO = 40000
const PLATE = lensPlate({ cx: ANCHO / 2, cy: ALTO / 2, halfL: 29000, halfW: 16500, pointiness: 0.6, steps: 72 })

const C = {
  data: '#0e9bc4', ml: '#5b6cf0', perf: '#1657ce', tower: '#1a73c6',
  opex: '#17a9a0', ctrlE: '#03c1bd', ctrlW: '#10a5b8', bdt: '#3457a6',
  core: '#0a1636', sala: '#3b4a6b', oficina: '#2a4a86', pod: '#2f6f7a',
}

export const VMC_PISO_16: VmcDocument = {
  schema: 'vmc-spatial/2',
  nombre: 'VMC · Piso 16',
  piso: 'Torre YPF · Puerto Madero · Piso 16',
  ancho: ANCHO, alto: ALTO, alturaLibre: 2900,
  plate: PLATE,
  actualizado: new Date().toISOString(),
  zonas: [
    { id: 'core', nombre: 'Núcleo de servicio', kind: 'nucleo', x: 24000, y: 13500, w: 14000, h: 13000, color: C.core, puestos: 0, ocupacion: 100, datalizacion: 95, nota: 'Núcleo central en cruz (ascensores/escaleras). 4 Video Walls en sus caras.' },

    // ---- LADO NORTE (arriba), Oeste -> Este ----
    { id: 'data-info', nombre: 'Data & Information Excellence', kind: 'cluster', x: 8000, y: 9000, w: 9000, h: 6000, color: C.data, puestos: 12, ocupacion: 70, datalizacion: 92, nota: 'Excelencia de datos e información (lado Norte-Oeste).' },
    { id: 'ml-ai', nombre: 'Machine Learning & AI', kind: 'cluster', x: 20000, y: 6500, w: 8000, h: 5000, color: C.ml, puestos: 8, ocupacion: 55, datalizacion: 90, nota: 'Modelos de ML y agentes de IA (lado Norte).' },
    { id: 'performance', nombre: 'Performance', kind: 'cluster', x: 30000, y: 6500, w: 8000, h: 5000, color: C.perf, puestos: 10, ocupacion: 82, datalizacion: 70, nota: 'Monitoreo de KPI (lado Norte).' },
    { id: 'control-tower', nombre: 'Control Tower', kind: 'cluster', x: 41000, y: 9000, w: 9000, h: 6000, color: C.tower, puestos: 10, ocupacion: 75, datalizacion: 78, nota: 'Torre de control (lado Norte-Este).' },

    // ---- LADO SUR (abajo), Este -> Oeste ----
    { id: 'opex', nombre: 'Operational License & Excellence', kind: 'cluster', x: 41000, y: 25000, w: 9000, h: 6000, color: C.opex, puestos: 12, ocupacion: 78, datalizacion: 60, nota: 'Licencia y excelencia operacional (lado Sur-Este).' },
    { id: 'control-exec-e', nombre: 'Control Execution', kind: 'cluster', x: 30000, y: 28500, w: 8000, h: 5000, color: C.ctrlE, puestos: 12, ocupacion: 80, datalizacion: 68, nota: 'Control Execution (lado Sur).' },
    { id: 'control-exec-w', nombre: 'Control Execution', kind: 'cluster', x: 20000, y: 28500, w: 8000, h: 5000, color: C.ctrlW, puestos: 12, ocupacion: 80, datalizacion: 66, nota: 'Control Execution (lado Sur).' },
    { id: 'business-digital-twin', nombre: 'Business Digital Twin', kind: 'cluster', x: 8000, y: 25000, w: 9000, h: 6000, color: C.bdt, puestos: 10, ocupacion: 60, datalizacion: 85, nota: 'Gemelo digital del negocio (lado Sur-Oeste).' },

    // ---- FRENTE (punta ESTE): 3 oficinas — centro grande + 2 chicas ----
    { id: 'oficina-centro', nombre: 'Oficina Central (Frente)', kind: 'oficina', x: 48500, y: 16200, w: 8500, h: 7600, color: C.oficina, puestos: 2, ocupacion: 60, datalizacion: 70, nota: 'Oficina principal del frente (la más grande, punta Este / río).' },
    { id: 'oficina-norte', nombre: 'Oficina Norte (Frente)', kind: 'oficina', x: 48000, y: 12200, w: 6200, h: 4200, color: C.oficina, puestos: 1, ocupacion: 50, datalizacion: 60, nota: 'Oficina chica del frente (lado Norte).' },
    { id: 'oficina-sur', nombre: 'Oficina Sur (Frente)', kind: 'oficina', x: 48000, y: 23600, w: 6200, h: 4200, color: C.oficina, puestos: 1, ocupacion: 50, datalizacion: 60, nota: 'Oficina chica del frente (lado Sur).' },

    // ---- Salas de reunión (Oeste del núcleo) ----
    { id: 'sala-1', nombre: 'Sala de Reunión 1', kind: 'sala', x: 17800, y: 14000, w: 4800, h: 4200, color: C.sala, puestos: 0, ocupacion: 45, datalizacion: 30, nota: 'Sala de reunión vidriada.' },
    { id: 'sala-2', nombre: 'Sala de Reunión 2', kind: 'sala', x: 17800, y: 21800, w: 4800, h: 4200, color: C.sala, puestos: 0, ocupacion: 35, datalizacion: 30, nota: 'Sala de reunión vidriada.' },

    // ---- Pods de reunión redondos (esquinas) ----
    { id: 'pod-no', nombre: 'Pod reunión NO', kind: 'servicio', x: 11500, y: 9500, w: 4200, h: 4200, color: C.pod, puestos: 0, ocupacion: 40, datalizacion: 20, nota: 'Pod de reunión redondo (esquina NO).' },
    { id: 'pod-so', nombre: 'Pod reunión SO', kind: 'servicio', x: 11500, y: 26300, w: 4200, h: 4200, color: C.pod, puestos: 0, ocupacion: 40, datalizacion: 20, nota: 'Pod de reunión redondo (esquina SO).' },
  ],
  videoWalls: [
    { id: 'vw-n', nombre: 'Video Wall Norte', x1: 26000, y1: 13500, x2: 36000, y2: 13500, pantallas: 24 },
    { id: 'vw-s', nombre: 'Video Wall Sur', x1: 26000, y1: 26500, x2: 36000, y2: 26500, pantallas: 24 },
    { id: 'vw-o', nombre: 'Video Wall Oeste (Fondo)', x1: 24000, y1: 15500, x2: 24000, y2: 24500, pantallas: 21 },
    { id: 'vw-e', nombre: 'Video Wall Este (Frente)', x1: 38000, y1: 15500, x2: 38000, y2: 24500, pantallas: 21 },
  ],
  orientacion: [
    { texto: 'N · Bv. Macacha Güemes', x: 31000, y: 2600 },
    { texto: 'S · Manuela Sáenz', x: 31000, y: 37800 },
    { texto: 'FONDO · Juana Manso (Oeste)', x: 5200, y: 20000, rot: -90 },
    { texto: 'FRENTE · Río de la Plata (Este)', x: 58200, y: 20000, rot: 90 },
  ],
}
