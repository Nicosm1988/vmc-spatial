// ============================================================================
// PRESET · VMC Piso 16 — según el mapa dibujado por Nico.
// Lente E-W. Núcleo diamante con PUERTA al frente (Este). En el tip Este:
// PANTALLA GRANDE + 3 oficinas. Tip Oeste: 1 oficina. 2 oficinas circulares en
// los laterales. COMEDORES (mesas largas) intercalados. Islas BENCH en los arcos.
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
// Núcleo pentágono con puerta al frente (Este).
const CORE = [
  { x: 24500, y: 20000 }, { x: 30500, y: 14300 }, { x: 42500, y: 17931 },
  { x: 42500, y: 22069 }, { x: 30500, y: 25700 },
]
const C = {
  ni: '#1f8fff', long: '#12b6c8', nd: '#1657ce', se: '#03c1bd', so: '#17a9a0',
  circ: '#3a6bb0', comedor: '#8a5a2b', oficina: '#2a4a86', core: '#0a1636', pantalla: '#123a7a',
}
const bench = (id: string, nombre: string, cx: number, cy: number, rot: number, pairs: number, color: string, ocu: number, dat: number, nota: string): Zone =>
  ({ id, nombre, kind: 'bench', cx, cy, rot, pairs, color, puestos: pairs * 2, ocupacion: ocu, datalizacion: dat, nota })
const comedor = (id: string, nombre: string, cx: number, cy: number, rot: number, w: number, nota: string): Zone =>
  ({ id, nombre, kind: 'comedor', cx, cy, rot, w, h: 1600, color: C.comedor, puestos: 0, ocupacion: 40, datalizacion: 10, nota })

export const VMC_PISO_16: VmcDocument = {
  schema: 'vmc-spatial/5',
  nombre: 'VMC · Piso 16', piso: 'Torre YPF · Puerto Madero · Piso 16',
  ancho: ANCHO, alto: ALTO, alturaLibre: 2900,
  plate: PLATE, core: CORE, actualizado: new Date().toISOString(),
  zonas: [
    { id: 'core', nombre: 'Núcleo · Diamante (puerta al frente)', kind: 'nucleo', cx: 34000, cy: 20000, color: C.core, puestos: 0, ocupacion: 100, datalizacion: 95, nota: 'Puerta de entrada al frente (Este). Pantallas en las 4 paredes.' },

    // --- FRENTE (Este): PANTALLA GRANDE + 3 oficinas ---
    { id: 'pantalla-grande', nombre: 'PANTALLA GRANDE (frente)', kind: 'pantalla', cx: 50500, cy: 20000, w: 5200, h: 400, color: C.pantalla, puestos: 0, ocupacion: 100, datalizacion: 90, nota: 'Pantalla grande única, en el frente (tip Este).' },
    { id: 'of-central', nombre: 'Oficina Central (Frente)', kind: 'oficina', cx: 55000, cy: 20000, w: 5600, h: 5200, color: C.oficina, puestos: 2, ocupacion: 60, datalizacion: 70, nota: 'Oficina principal del frente.' },
    { id: 'of-norte', nombre: 'Oficina Norte (Frente)', kind: 'oficina', cx: 52500, cy: 15400, w: 3600, h: 2600, color: C.oficina, puestos: 1, ocupacion: 50, datalizacion: 60, nota: 'Oficina chica del frente (N).' },
    { id: 'of-sur', nombre: 'Oficina Sur (Frente)', kind: 'oficina', cx: 52500, cy: 24600, w: 3600, h: 2600, color: C.oficina, puestos: 1, ocupacion: 50, datalizacion: 60, nota: 'Oficina chica del frente (S).' },

    // --- FONDO (Oeste): 1 oficina en la punta ---
    { id: 'of-oeste', nombre: 'Oficina (fondo)', kind: 'oficina', cx: 9800, cy: 20000, w: 4200, h: 4200, color: C.oficina, puestos: 1, ocupacion: 45, datalizacion: 50, nota: 'Oficina en la punta del fondo (Oeste).' },

    // --- 2 OFICINAS CIRCULARES (laterales) ---
    { id: 'of-circ-n', nombre: 'Oficina circular (Norte)', kind: 'circular', cx: 44500, cy: 11200, r: 1650, color: C.circ, puestos: 0, ocupacion: 50, datalizacion: 40, nota: 'Oficina circular lateral Norte.' },
    { id: 'of-circ-s', nombre: 'Oficina circular (Sur)', kind: 'circular', cx: 17500, cy: 26500, r: 1650, color: C.circ, puestos: 0, ocupacion: 50, datalizacion: 40, nota: 'Oficina circular lateral Sur.' },

    // --- COMEDORES (mesas largas con sillas ambos lados) ---
    comedor('comedor-ni', 'Comedor (NO)', 15200, 14000, 1.05, 2600, 'Comedor cerca del fondo-norte.'),
    comedor('comedor-nd', 'Comedor (NE)', 47800, 13600, 2.30, 2600, 'Comedor cerca del frente-norte.'),
    comedor('comedor-se', 'Comedor (SE)', 47800, 26400, -2.30, 2600, 'Comedor cerca del frente-sur.'),
    comedor('comedor-so', 'Comedor (SO)', 15200, 26000, -1.05, 2600, 'Comedor cerca del fondo-sur.'),

    // --- ISLAS BENCH (perpendiculares, en los 4 arcos) ---
    bench('ni1', 'NI · Isla 1', 30399, 11143, 1.5031, 3, C.ni, 80, 70, 'Norte izquierdo.'),
    bench('ni2', 'NI · Isla 2', 27344, 11134, 1.1797, 3, C.ni, 78, 68, 'Norte izquierdo.'),
    bench('ni_long', 'NI · Larga 5 (paralela)', 23443, 11445, 2.9873, 5, C.long, 85, 72, 'Isla larga de 5 pares, paralela.'),
    bench('ni3', 'NI · Isla 3', 18685, 12155, 0.5672, 3, C.ni, 76, 66, 'Norte izquierdo.'),
    bench('nd1', 'ND · Isla 1', 37381, 11093, 2.1925, 3, C.nd, 82, 70, 'Norte derecho.'),
    bench('nd2', 'ND · Isla 2', 40352, 11636, 2.4119, 3, C.nd, 80, 68, 'Norte derecho.'),
    bench('nd3', 'ND · Isla 3', 43365, 12584, 2.6014, 3, C.nd, 78, 66, 'Norte derecho.'),
    bench('se1', 'SE · Isla 1', 37381, 28907, -2.1925, 3, C.se, 80, 68, 'Sudeste.'),
    bench('se2', 'SE · Isla 2', 40352, 28364, -2.4119, 3, C.se, 78, 66, 'Sudeste.'),
    bench('se3', 'SE · Isla 3', 43365, 27416, -2.6014, 3, C.se, 76, 64, 'Sudeste.'),
    bench('so1', 'SO · Isla 1', 30399, 28857, -1.5031, 3, C.so, 80, 66, 'Sudoeste.'),
    bench('so2', 'SO · Isla 2', 26892, 28843, -1.1359, 3, C.so, 78, 64, 'Sudoeste.'),
    bench('so3', 'SO · Isla 3', 22462, 28773, -0.7990, 3, C.so, 76, 62, 'Sudoeste.'),
  ],
  videoWalls: [
    { id: 'vw-ne', nombre: 'Pared Frente-Norte', x1: 30860, y1: 14409, x2: 42140, y2: 17822, pantallas: 20, filas: 2 },
    { id: 'vw-se', nombre: 'Pared Frente-Sur', x1: 42140, y1: 22178, x2: 30860, y2: 25591, pantallas: 30, filas: 3 },
    { id: 'vw-no', nombre: 'Pared Atrás-Norte', x1: 24680, y1: 19829, x2: 30320, y2: 14471, pantallas: 24, filas: 2 },
    { id: 'vw-so', nombre: 'Pared Atrás-Sur', x1: 30320, y1: 25529, x2: 24680, y2: 20171, pantallas: 24, filas: 2 },
  ],
  orientacion: [
    { texto: 'N · Bv. Macacha Güemes', x: 31000, y: 4600 },
    { texto: 'S · Manuela Sáenz', x: 31000, y: 35800 },
    { texto: 'FONDO · Oeste (ciudad)', x: 4200, y: 20000, rot: -90 },
    { texto: 'FRENTE · Este (río · puerta)', x: 59200, y: 20000, rot: 90 },
  ],
}
