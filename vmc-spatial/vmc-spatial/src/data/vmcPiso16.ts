// ============================================================================
// PRESET · VMC Piso 16 — Torre YPF, Puerto Madero, CABA.
// Planta tipo LENTE (Pelli), eje largo Este–Oeste. Clusters según VMC 10.12.25.
// Maqueta conceptual; cotas aproximadas (ajustar contra Obra Civil 6400-25-011).
// ============================================================================
import type { VmcDocument } from '../types'
import { lensPlate } from '../lib/plate'

const ANCHO = 62000
const ALTO = 40000

const PLATE = lensPlate({
  cx: ANCHO / 2, cy: ALTO / 2,
  halfL: 29000, halfW: 16500, pointiness: 0.6, steps: 72,
})

// Paleta oficial VMC (Look & Feel): #0424D9 → #03C1BD.
const C = {
  margen: '#1a3fd6', performance: '#1657ce', midstream: '#1a73c6', proy: '#0e9bc4',
  competitividad: '#03c1bd', planif: '#17a9a0', nucleo: '#0a1636', sala: '#3b4a6b', trouble: '#e8a33d',
}

export const VMC_PISO_16: VmcDocument = {
  schema: 'vmc-spatial/2',
  nombre: 'VMC · Piso 16',
  piso: 'Torre YPF · Puerto Madero · Piso 16',
  ancho: ANCHO, alto: ALTO, alturaLibre: 2900,
  plate: PLATE,
  actualizado: new Date().toISOString(),

  zonas: [
    { id: 'nucleo', nombre: 'Núcleo · Video Walls', kind: 'nucleo', x: 25000, y: 15500, w: 12000, h: 9000, color: C.nucleo, puestos: 0, ocupacion: 100, datalizacion: 95, nota: '4 Video Walls (+90 pantallas) con la cadena de valor MIDDW.' },
    { id: 'margen-integrado', nombre: 'Margen Integrado', kind: 'cluster', x: 6500, y: 12000, w: 17000, h: 16000, color: C.margen, puestos: 43, ocupacion: 88, datalizacion: 60, nota: 'Cluster más grande (43 puestos).' },
    { id: 'competitividad-eo', nombre: 'Competitividad + EO', kind: 'cluster', x: 22000, y: 26500, w: 18000, h: 8500, color: C.competitividad, puestos: 37, ocupacion: 80, datalizacion: 55, nota: 'Competitividad (26) + Excelencia Operacional (11).' },
    { id: 'performance', nombre: 'Performance', kind: 'cluster', x: 24000, y: 6000, w: 15000, h: 8000, color: C.performance, puestos: 10, ocupacion: 82, datalizacion: 70, nota: 'Analítica y Performance, Soluciones Transversales.' },
    { id: 'midstream', nombre: 'Midstream', kind: 'cluster', x: 39000, y: 15500, w: 10000, h: 9000, color: C.midstream, puestos: 8, ocupacion: 70, datalizacion: 62, nota: 'Planificación y gestión Midstream.' },
    { id: 'proy-especiales', nombre: 'Proyectos Especiales', kind: 'cluster', x: 48500, y: 17000, w: 8500, h: 6000, color: C.proy, puestos: 6, ocupacion: 60, datalizacion: 72, nota: 'Proyectos especiales (punta Este, vista al río).' },
    { id: 'planificacion-mid', nombre: 'Planificación MID', kind: 'cluster', x: 22000, y: 12000, w: 9000, h: 3500, color: C.planif, puestos: 6, ocupacion: 65, datalizacion: 50, nota: 'Planificación Midstream.' },
    { id: 'troubleshooting', nombre: 'Mesa de Troubleshooting', kind: 'troubleshooting', x: 25000, y: 11500, w: 12000, h: 3500, color: C.trouble, puestos: 0, ocupacion: 90, datalizacion: 80, nota: 'Mesa central de resolución de problemas.' },
    { id: 'sala-1', nombre: 'Sala de Reunión 1', kind: 'sala', x: 25000, y: 25000, w: 5700, h: 4200, color: C.sala, puestos: 0, ocupacion: 45, datalizacion: 30, nota: 'Sala de reunión.' },
    { id: 'sala-2', nombre: 'Sala de Reunión 2', kind: 'sala', x: 31300, y: 25000, w: 5700, h: 4200, color: C.sala, puestos: 0, ocupacion: 35, datalizacion: 30, nota: 'Sala de reunión.' },
  ],

  videoWalls: [
    { id: 'vw-n', nombre: 'Video Wall Norte', x1: 25000, y1: 15500, x2: 37000, y2: 15500, pantallas: 24 },
    { id: 'vw-s', nombre: 'Video Wall Sur', x1: 25000, y1: 24500, x2: 37000, y2: 24500, pantallas: 24 },
    { id: 'vw-o', nombre: 'Video Wall Oeste', x1: 25000, y1: 15500, x2: 25000, y2: 24500, pantallas: 21 },
    { id: 'vw-e', nombre: 'Video Wall Este', x1: 37000, y1: 15500, x2: 37000, y2: 24500, pantallas: 21 },
  ],

  orientacion: [
    { texto: 'Bv. Macacha Güemes  ·  N', x: 31000, y: 2600 },
    { texto: 'Manuela Sáenz  ·  S', x: 31000, y: 37800 },
    { texto: 'Juana Manso  ·  O', x: 5200, y: 20000, rot: -90 },
    { texto: 'Río de la Plata  ·  E', x: 57200, y: 20000, rot: 90 },
  ],
}
