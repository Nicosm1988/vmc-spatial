// PRESET · VMC Piso 16 — contorno TRAZADO del plano CAD (ojo facetado).
// Islas = BENCH de escritorios ENFRENTADOS (pairs = pares de puestos por lado).
import type { Point, VmcDocument } from '../types'

const ANCHO = 62000, ALTO = 40000

const PLATE: Point[] = [
  { x: 3500, y: 20000 }, { x: 7000, y: 14800 }, { x: 12000, y: 11200 }, { x: 19000, y: 8300 },
  { x: 28000, y: 6900 }, { x: 37000, y: 7300 }, { x: 45000, y: 9300 }, { x: 52000, y: 12600 },
  { x: 57500, y: 16300 }, { x: 60500, y: 20000 }, { x: 57500, y: 23700 }, { x: 52000, y: 27400 },
  { x: 45000, y: 30700 }, { x: 37000, y: 32700 }, { x: 28000, y: 33100 }, { x: 19000, y: 31700 },
  { x: 12000, y: 28800 }, { x: 7000, y: 25200 },
]
const CORE: Point[] = [
  { x: 31000, y: 12500 }, { x: 40500, y: 20000 }, { x: 31000, y: 27500 }, { x: 21500, y: 20000 },
]
const COLUMNS: Point[] = [
  { x: 42500, y: 18300 }, { x: 42500, y: 21700 }, { x: 45000, y: 18300 },
  { x: 45000, y: 21700 }, { x: 47500, y: 18300 }, { x: 47500, y: 21700 },
]
const C = {
  data: '#0e9bc4', ml: '#5b6cf0', perf: '#1657ce', tower: '#1a73c6',
  opex: '#17a9a0', ctrlE: '#03c1bd', ctrlW: '#10a5b8', bdt: '#3457a6',
  sala: '#3b4a6b', oficina: '#2a4a86', larga: '#c8611f', pod: '#2f6f7a',
}
const D = (deg: number) => (deg * Math.PI) / 180
const zc = (id: string, nombre: string, kind: any, cx: number, cy: number, w: number, h: number, rotDeg: number, color: string, puestos: number, ocu: number, dat: number, pairs: number, nota: string) =>
  ({ id, nombre, kind, x: cx - w / 2, y: cy - h / 2, w, h, rot: D(rotDeg), pairs, color, puestos, ocupacion: ocu, datalizacion: dat, nota })

export const VMC_PISO_16: VmcDocument = {
  schema: 'vmc-spatial/3',
  nombre: 'VMC · Piso 16',
  piso: 'Torre YPF · Puerto Madero · Piso 16',
  ancho: ANCHO, alto: ALTO, alturaLibre: 2900,
  plate: PLATE, core: CORE, columns: COLUMNS,
  actualizado: new Date().toISOString(),
  zonas: [
    // LADO NORTE (O→E) — benches enfrentados de 3 pares
    zc('data-info', 'Data & Information Excellence', 'cluster', 15500, 13800, 8500, 5200, -28, C.data, 12, 70, 92, 3, 'Excelencia de datos e información (NO).'),
    zc('ml-ai', 'Machine Learning & AI', 'cluster', 25000, 10900, 7000, 4300, -14, C.ml, 8, 55, 90, 3, 'Modelos de ML y agentes de IA (N).'),
    zc('performance', 'Performance', 'cluster', 35000, 10400, 7000, 4300, 7, C.perf, 10, 82, 70, 3, 'Monitoreo de KPI (N).'),
    zc('control-tower', 'Control Tower', 'cluster', 44300, 12780, 7500, 4800, 29, C.tower, 10, 75, 78, 3, 'Torre de control (NE).'),
    // LADO SUR (O→E)
    zc('business-digital-twin', 'Business Digital Twin', 'cluster', 15500, 26200, 8500, 5200, 28, C.bdt, 12, 60, 85, 3, 'Gemelo digital del negocio (SO).'),
    zc('control-exec-w', 'Control Execution', 'cluster', 25000, 29100, 7000, 4300, 14, C.ctrlW, 8, 80, 66, 3, 'Control Execution (S).'),
    zc('control-exec-e', 'Control Execution', 'cluster', 35000, 29600, 7000, 4300, -7, C.ctrlE, 12, 80, 68, 3, 'Control Execution (S).'),
    zc('opex', 'Operational License & Excellence', 'cluster', 44300, 27220, 7500, 4800, -29, C.opex, 12, 78, 60, 3, 'Licencia y excelencia operacional (SE).'),
    // FRENTE (Este): sala alargada + 3 oficinas
    zc('sala-larga', 'Sala Troubleshooting (frente)', 'salalarga', 44500, 20000, 7000, 4200, 0, C.larga, 0, 90, 80, 0, 'Mesa larga de resolución de problemas (pasillo del frente).'),
    zc('oficina-centro', 'Oficina Central (Frente)', 'oficina', 52500, 20000, 7500, 8000, 0, C.oficina, 2, 60, 70, 0, 'Oficina principal del frente (la más grande, punta Este / río).'),
    zc('oficina-norte', 'Oficina Norte (Frente)', 'oficina', 47750, 13500, 5400, 3240, 0, C.oficina, 1, 50, 60, 0, 'Oficina chica del frente (Norte).'),
    zc('oficina-sur', 'Oficina Sur (Frente)', 'oficina', 47750, 26500, 5400, 3240, 0, C.oficina, 1, 50, 60, 0, 'Oficina chica del frente (Sur).'),
    // Salas de reunión (Oeste del núcleo)
    zc('sala-1', 'Sala de Reunión 1', 'sala', 17000, 15500, 4800, 4200, 0, C.sala, 0, 45, 30, 0, 'Sala de reunión vidriada.'),
    zc('sala-2', 'Sala de Reunión 2', 'sala', 17000, 24500, 4800, 4200, 0, C.sala, 0, 35, 30, 0, 'Sala de reunión vidriada.'),
    // Pods redondos (Oeste)
    zc('pod-no', 'Pod reunión NO', 'pod', 13500, 13800, 3600, 3600, 0, C.pod, 0, 40, 20, 0, 'Pod de reunión redondo (esquina NO).'),
    zc('pod-so', 'Pod reunión SO', 'pod', 13500, 26200, 3600, 3600, 0, C.pod, 0, 40, 20, 0, 'Pod de reunión redondo (esquina SO).'),
  ],
  videoWalls: [
    { id: 'vw-nw', nombre: 'Video Wall NO', x1: 22000, y1: 19700, x2: 30500, y2: 13000, pantallas: 21 },
    { id: 'vw-ne', nombre: 'Video Wall NE', x1: 31500, y1: 13000, x2: 40000, y2: 19700, pantallas: 24 },
    { id: 'vw-se', nombre: 'Video Wall SE', x1: 40000, y1: 20300, x2: 31500, y2: 27000, pantallas: 24 },
    { id: 'vw-sw', nombre: 'Video Wall SO', x1: 30500, y1: 27000, x2: 22000, y2: 20300, pantallas: 21 },
  ],
  orientacion: [
    { texto: 'N · Bv. Macacha Güemes', x: 31000, y: 2600 },
    { texto: 'S · Manuela Sáenz', x: 31000, y: 37800 },
    { texto: 'FONDO · Oeste (ciudad)', x: 5000, y: 20000, rot: -90 },
    { texto: 'FRENTE · Este (río)', x: 58500, y: 20000, rot: 90 },
  ],
}
