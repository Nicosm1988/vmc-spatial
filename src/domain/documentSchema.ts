import { z } from 'zod'
import type { VmcDocument } from '../types'

const integerMm = z.number().int()
const percentage = z.number().min(0).max(100)

const pointSchema = z.object({
  x: integerMm,
  y: integerMm,
})

const zoneSchema = z
  .object({
    id: z.string().min(1),
    nombre: z.string().min(1),
    kind: z.enum(['bench', 'nucleo', 'oficina', 'circular', 'comedor']),
    cx: integerMm,
    cy: integerMm,
    rot: z.number().optional(),
    pairs: z.number().int().positive().optional(),
    w: integerMm.positive().optional(),
    h: integerMm.positive().optional(),
    r: integerMm.positive().optional(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    puestos: z.number().int().nonnegative(),
    ocupacion: percentage,
    datalizacion: percentage,
    nota: z.string().max(2000).optional(),
  })
  .strict()

const videoWallSchema = z
  .object({
    id: z.string().min(1),
    nombre: z.string().min(1),
    x1: integerMm,
    y1: integerMm,
    x2: integerMm,
    y2: integerMm,
    pantallas: z.number().int().min(1).max(200),
    filas: z.number().int().min(1).max(20).optional(),
    flip: z.boolean().optional(),
  })
  .strict()

const orientLabelSchema = z
  .object({
    texto: z.string(),
    x: integerMm,
    y: integerMm,
    rot: z.number().optional(),
  })
  .strict()

const dimensionalSurveySchema = z
  .object({
    element: z.string().min(1),
    valueMm: integerMm,
    toleranceMm: integerMm.nonnegative(),
    source: z.string().min(1),
    date: z.string().min(1),
  })
  .strict()

export const vmcDocumentSchema = z
  .object({
    schema: z.literal('vmc-spatial/6'),
    nombre: z.string().min(1),
    piso: z.string().min(1),
    ancho: integerMm.positive(),
    alto: integerMm.positive(),
    alturaLibre: integerMm.positive(),
    plate: z.array(pointSchema).min(3),
    core: z.array(pointSchema).min(3),
    zonas: z.array(zoneSchema),
    videoWalls: z.array(videoWallSchema),
    orientacion: z.array(orientLabelSchema),
    relevamiento: z.array(dimensionalSurveySchema).optional(),
    actualizado: z.string(),
  })
  .strict()

export function parseVmcDocument(input: unknown): VmcDocument {
  return vmcDocumentSchema.parse(input) as VmcDocument
}

export function safeParseVmcDocument(input: unknown) {
  return vmcDocumentSchema.safeParse(input)
}
