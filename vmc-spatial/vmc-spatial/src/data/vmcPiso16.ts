// ============================================================================
// PRESET · VMC Piso 16 — Torre YPF, Macacha Güemes 515, Puerto Madero, CABA.
// ----------------------------------------------------------------------------
// Maqueta CONCEPTUAL (no es plano constructivo). La topología y la cantidad de
// puestos salen del Business Case / LAY OUT del VMC. Las COTAS son aproximadas
// y se ajustan contra el plano de Obra Civil (PEP 6400-25-011).
//
// Planta modelada como placa rectangular con 4 alas alrededor de un núcleo
// central que contiene los 4 video walls. Grilla de referencia en mm, origen
// arriba-izquierda (x → derecha, y → abajo).
// ============================================================================
import type { VmcDocument } from '../types'

// Placa total aproximada: 42 m x 30 m.
const ANCHO = 42000
const ALTO = 30000

export const VMC_PISO_16: VmcDocument = {
  schema: 'vmc-spatial/1',
  nombre: 'VMC · Piso 16',
  piso: 'Torre YPF · Puerto Madero · Piso 16',
  ancho: ANCHO,
  alto: ALTO,
  alturaLibre: 2900,
  actualizado: new Date().toISOString(),

  zonas: [
    // ---- NÚCLEO CENTRAL (video walls + cadena de valor) ----
    {
      id: 'nucleo',
      nombre: 'Núcleo · Video Walls',
      kind: 'nucleo',
      x: 16500, y: 11000, w: 9000, h: 8000,
      color: '#0b2a6b',
      puestos: 0, ocupacion: 100, datalizacion: 95,
      nota: '4 Video Walls (+90 pantallas) mostrando la cadena de valor MIDDW.',
    },

    // ---- ALA NORTE (arriba) ----
    {
      id: 'performance',
      nombre: 'Performance',
      kind: 'ala',
      x: 3000, y: 1500, w: 16000, h: 8500,
      color: '#1b5e9c',
      puestos: 10, ocupacion: 82, datalizacion: 70,
      nota: 'Sala Performance. Monitoreo de KPI (BAU · Blue Sky · WC).',
    },
    {
      id: 'margen-integrado',
      nombre: 'Margen Integrado',
      kind: 'ala',
      x: 20000, y: 1500, w: 12500, h: 8500,
      color: '#2166a5',
      puestos: 43, ocupacion: 88, datalizacion: 60,
      nota: 'Sector con mayor dotación de hot desks del piso.',
    },
    {
      id: 'troubleshooting',
      nombre: 'Mesa de Troubleshooting',
      kind: 'troubleshooting',
      x: 33500, y: 1500, w: 5500, h: 8500,
      color: '#c8611f',
      puestos: 0, ocupacion: 90, datalizacion: 80,
      nota: 'Mesa central de resolución de problemas (ticket / quiebres).',
    },

    // ---- ALA SUR (abajo) ----
    {
      id: 'competitividad',
      nombre: 'Competitividad + EO',
      kind: 'ala',
      x: 3000, y: 20000, w: 15000, h: 8500,
      color: '#217a8c',
      puestos: 37, ocupacion: 80, datalizacion: 55,
      nota: 'Competitividad (26) + Excelencia Operacional (11).',
    },
    {
      id: 'planificacion-mid',
      nombre: 'Planificación MID',
      kind: 'ala',
      x: 19000, y: 20000, w: 8500, h: 8500,
      color: '#2a8f6f',
      puestos: 6, ocupacion: 65, datalizacion: 50,
      nota: 'Planificación Midstream.',
    },
    {
      id: 'control-execution-sur',
      nombre: 'Control Execution',
      kind: 'ala',
      x: 28500, y: 20000, w: 10500, h: 8500,
      color: '#2f7fb0',
      puestos: 12, ocupacion: 72, datalizacion: 68,
      nota: 'Control Execution (ala sur).',
    },

    // ---- ALA OESTE (izquierda) ----
    {
      id: 'business-digital-twin',
      nombre: 'Business Digital Twin',
      kind: 'ala',
      x: 3000, y: 11000, w: 6000, h: 8000,
      color: '#3457a6',
      puestos: 8, ocupacion: 60, datalizacion: 85,
      nota: 'Gemelo digital del negocio.',
    },
    {
      id: 'data-info-excellence',
      nombre: 'Data & Information Excellence',
      kind: 'ala',
      x: 9500, y: 11000, w: 6000, h: 8000,
      color: '#3a4fbf',
      puestos: 9, ocupacion: 70, datalizacion: 92,
      nota: 'Excelencia de datos e información. Núcleo de datalización.',
    },

    // ---- ALA ESTE (derecha) ----
    {
      id: 'machine-learning-ai',
      nombre: 'Machine Learning & AI',
      kind: 'ala',
      x: 26500, y: 11000, w: 6000, h: 8000,
      color: '#5b3fb0',
      puestos: 6, ocupacion: 55, datalizacion: 90,
      nota: 'Modelos de ML y agentes de IA.',
    },
    {
      id: 'control-tower',
      nombre: 'Control Tower',
      kind: 'ala',
      x: 33000, y: 11000, w: 6000, h: 8000,
      color: '#7a3fa0',
      puestos: 8, ocupacion: 75, datalizacion: 78,
      nota: 'Torre de control operativa.',
    },

    // ---- SALAS DE REUNIÓN ----
    {
      id: 'sala-1',
      nombre: 'Sala de Reunión 1',
      kind: 'sala',
      x: 19500, y: 11000, w: 6500, h: 3800,
      color: '#586174',
      puestos: 0, ocupacion: 45, datalizacion: 30,
      nota: 'Sala de reunión (contigua al núcleo).',
    },
    {
      id: 'sala-2',
      nombre: 'Sala de Reunión 2',
      kind: 'sala',
      x: 19500, y: 15200, w: 6500, h: 3800,
      color: '#586174',
      puestos: 0, ocupacion: 35, datalizacion: 30,
      nota: 'Sala de reunión (contigua al núcleo).',
    },
  ],

  muros: [
    // Perímetro de la placa.
    { id: 'm-n', x1: 0, y1: 0, x2: ANCHO, y2: 0 },
    { id: 'm-e', x1: ANCHO, y1: 0, x2: ANCHO, y2: ALTO },
    { id: 'm-s', x1: ANCHO, y1: ALTO, x2: 0, y2: ALTO },
    { id: 'm-o', x1: 0, y1: ALTO, x2: 0, y2: 0 },
  ],

  videoWalls: [
    { id: 'vw-n', nombre: 'Video Wall Norte', x1: 16500, y1: 11000, x2: 25500, y2: 11000, pantallas: 24 },
    { id: 'vw-s', nombre: 'Video Wall Sur', x1: 16500, y1: 19000, x2: 25500, y2: 19000, pantallas: 24 },
    { id: 'vw-o', nombre: 'Video Wall Oeste', x1: 16500, y1: 11000, x2: 16500, y2: 19000, pantallas: 21 },
    { id: 'vw-e', nombre: 'Video Wall Este', x1: 25500, y1: 11000, x2: 25500, y2: 19000, pantallas: 21 },
  ],
}
