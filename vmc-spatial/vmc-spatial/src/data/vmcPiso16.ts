// ============================================================================
// PRESET · VMC Piso 16. Núcleo DIAMANTE asimétrico (atrás corto / frente largo).
// Video walls en las 4 caras: PARED maciza hasta el piso + pantallas en banda
// superior (2 filas). Cantidades EXACTAS: 20/30 (frente) · 24/24 (atrás).
// ============================================================================
import type { VmcDocument, Zone } from '../types'

const ANCHO = 62000, ALTO = 40000
const PLATE = [
  { x: 3500, y: 20000 }, { x: 7000, y: 14800 }, { x: 12000, y: 11200 }, { x: 19000, y: 8300 },
  { x: 28000, y: 6900 }, { x: 37000, y: 7300 }, { x: 45000, y: 9300 }, { x: 52000, y: 12600 },
  { x: 57500, y: 16300 }, { x: 60500, y: 20000 }, { x: 57500, y: 23700 }, { x: 52000, y: 27400 },
  { x: 45000, y: 30700 }, { x: 37000, y: 32700 }, { x: 28000, y: 33100 }, { x: 19000, y: 31700 },
  { x: 12000, y: 28800 }, { x: 7000, y: 25200 },
]
const CORE = [
  { x: 24500, y: 20000 }, // Oeste (atrás / fondo)
  { x: 30500, y: 14300 }, // Norte
  { x: 42500, y: 20000 }, // Este (frente / río)
  { x: 30500, y: 25700 }, // Sur
]
const C = {
  ni: '#1f8fff', long: '#12b6c8', nd: '#1657ce', se: '#03c1bd', so: '#17a9a0',
  circ: '#3a6bb0', circ2: '#2f6f7a', wood: '#8a5a2b', sala: '#3b4a6b', oficina: '#2a4a86', core: '#0a1636',
}
const bench = (id: string, nombre: string, cx: number, cy: number, rot: number, pairs: number, color: string, ocu: number, dat: number, nota: string): Zone =>
  ({ id, nombre, kind: 'bench', cx, cy, rot, pairs, color, puestos: pairs * 2, ocupacion: ocu, datalizacion: dat, nota })

export const VMC_PISO_16: VmcDocument = {
  schema: 'vmc-spatial/4',
  nombre: 'VMC · Piso 16', piso: 'Torre YPF · Puerto Madero · Piso 16',
  ancho: ANCHO, alto: ALTO, alturaLibre: 2900,
  plate: PLATE, core: CORE, actualizado: new Date().toISOString(),
  zonas: [
    { id: 'core', nombre: 'Núcleo · Diamante (4 paredes)', kind: 'nucleo', cx: 32500, cy: 20000, color: C.core, puestos: 0, ocupacion: 100, datalizacion: 95, nota: 'Diamante asimétrico. Paredes de pantallas en las 4 caras (2 filas), montadas sobre muro macizo.' },
    bench('ni1', 'NI · Isla 1', 30399, 11143, 1.5031, 3, C.ni, 80, 70, 'Norte izquierdo.'),
    bench('ni2', 'NI · Isla 2', 27344, 11134, 1.1797, 3, C.ni, 78, 68, 'Norte izquierdo.'),
    bench('ni_long', 'NI · Larga 5 (paralela)', 23443, 11445, 2.9873, 5, C.long, 85, 72, 'Isla larga de 5 pares, paralela.'),
    bench('ni3', 'NI · Isla 3', 18685, 12155, 0.5672, 3, C.ni, 76, 66, 'Norte izquierdo.'),
    bench('nd1', 'ND · Isla 1', 37381, 11093, 2.1925, 3, C.nd, 82, 70, 'Norte derecho.'),
    bench('nd2', 'ND · Isla 2', 40352, 11636, 2.4119, 3, C.nd, 80, 68, 'Norte derecho.'),
    bench('nd3', 'ND · Isla 3', 43365, 12584, 2.6014, 3, C.nd, 78, 66, 'Norte derecho.'),
    bench('nd4', 'ND · Isla 4', 46188, 13683, 2.7474, 3, C.nd, 76, 64, 'Norte derecho.'),
    bench('se1', 'SE · Isla 1', 37381, 28907, -2.1925, 3, C.se, 80, 68, 'Sudeste.'),
    bench('se2', 'SE · Isla 2', 40352, 28364, -2.4119, 3, C.se, 78, 66, 'Sudeste.'),
    bench('se3', 'SE · Isla 3', 43365, 27416, -2.6014, 3, C.se, 76, 64, 'Sudeste.'),
    bench('se4', 'SE · Isla 4', 46188, 26317, -2.7474, 3, C.se, 74, 62, 'Sudeste.'),
    bench('so1', 'SO · Isla 1', 30399, 28857, -1.5031, 3, C.so, 80, 66, 'Sudoeste.'),
    bench('so2', 'SO · Isla 2', 26892, 28843, -1.1359, 3, C.so, 78, 64, 'Sudoeste.'),
    bench('so3', 'SO · Isla 3', 22462, 28773, -0.7990, 3, C.so, 76, 62, 'Sudoeste.'),
    bench('so4', 'SO · Isla 4', 17901, 27628, -0.5273, 3, C.so, 74, 60, 'Sudoeste.'),
    { id: 'wood-ni', nombre: 'NI · Mesa madera', kind: 'wood', cx: 14598, cy: 13664, w: 2200, h: 1400, color: C.wood, puestos: 0, ocupacion: 30, datalizacion: 10, nota: 'Mesa de madera.' },
    { id: 'wood-nd', nombre: 'ND · Mesa madera', kind: 'wood', cx: 48408, cy: 14613, w: 2200, h: 1400, color: C.wood, puestos: 0, ocupacion: 30, datalizacion: 10, nota: 'Mesa de madera.' },
    { id: 'sala-circ-nw', nombre: 'Sala circular (NO)', kind: 'circular', cx: 10295, cy: 16674, r: 1650, color: C.circ2, puestos: 0, ocupacion: 45, datalizacion: 20, nota: 'Sala circular.' },
    { id: 'oficina-circ-ne', nombre: 'Oficina circular (NE)', kind: 'circular', cx: 51500, cy: 15200, r: 1650, color: C.circ, puestos: 0, ocupacion: 50, datalizacion: 40, nota: 'Oficina/sala circular.' },
    { id: 'sala-1', nombre: 'Sala de Reunión 1', kind: 'sala', cx: 18300, cy: 16700, w: 3600, h: 2900, color: C.sala, puestos: 0, ocupacion: 45, datalizacion: 30, nota: 'Sala vidriada.' },
    { id: 'sala-2', nombre: 'Sala de Reunión 2', kind: 'sala', cx: 18300, cy: 23300, w: 3600, h: 2900, color: C.sala, puestos: 0, ocupacion: 35, datalizacion: 30, nota: 'Sala vidriada.' },
    { id: 'of-central', nombre: 'Oficina Central (Frente)', kind: 'oficina', cx: 54500, cy: 20000, w: 6400, h: 6600, color: C.oficina, puestos: 2, ocupacion: 60, datalizacion: 70, nota: 'Oficina principal del frente.' },
    { id: 'of-norte', nombre: 'Oficina Norte (Frente)', kind: 'oficina', cx: 53000, cy: 15200, w: 3800, h: 2600, color: C.oficina, puestos: 1, ocupacion: 50, datalizacion: 60, nota: 'Oficina chica (N).' },
    { id: 'of-sur', nombre: 'Oficina Sur (Frente)', kind: 'oficina', cx: 53000, cy: 24800, w: 3800, h: 2600, color: C.oficina, puestos: 1, ocupacion: 50, datalizacion: 60, nota: 'Oficina chica (S).' },
  ],
  // 4 paredes. Frente (Este): 30 (N) y 20 (S). Atrás (Oeste): 24 y 24.
  videoWalls: [
    { id: 'vw-ne', nombre: 'Pared Frente-Norte (derecho adelante)', x1: 31460, y1: 14756, x2: 41540, y2: 19544, pantallas: 30 },
    { id: 'vw-se', nombre: 'Pared Frente-Sur (izquierdo adelante)', x1: 41540, y1: 20456, x2: 31460, y2: 25244, pantallas: 20 },
    { id: 'vw-no', nombre: 'Pared Atrás-Norte (izquierda atrás)', x1: 24980, y1: 19544, x2: 30020, y2: 14756, pantallas: 24 },
    { id: 'vw-so', nombre: 'Pared Atrás-Sur (derecha atrás)', x1: 30020, y1: 25244, x2: 24980, y2: 20456, pantallas: 24 },
  ],
  orientacion: [
    { texto: 'N · Bv. Macacha Güemes', x: 31000, y: 4600 },
    { texto: 'S · Manuela Sáenz', x: 31000, y: 35800 },
    { texto: 'FONDO · Oeste (ciudad)', x: 4200, y: 20000, rot: -90 },
    { texto: 'FRENTE · Este (río)', x: 59200, y: 20000, rot: 90 },
  ],
}
