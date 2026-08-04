import { describe, expect, it } from 'vitest'
import { VMC_PISO_16 } from '../data/vmcPiso16'
import { importJson } from '../lib/persistence'
import { safeParseVmcDocument } from './documentSchema'

describe('vmc-spatial/6 document validation', () => {
  it('accepts the current Piso 16 demo preset', () => {
    const result = safeParseVmcDocument(VMC_PISO_16)

    expect(result.success).toBe(true)
    if (!result.success) return

    expect(result.data.schema).toBe('vmc-spatial/6')
    expect(result.data.plate.length).toBeGreaterThanOrEqual(3)
    expect(result.data.core.length).toBeGreaterThanOrEqual(3)

    const ids = [...result.data.zonas, ...result.data.videoWalls].map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it.each([
    ['a different schema version', { ...VMC_PISO_16, schema: 'vmc-spatial/5' }],
    ['fractional millimeters', { ...VMC_PISO_16, ancho: 62_000.5 }],
    [
      'an out-of-range percentage',
      {
        ...VMC_PISO_16,
        zonas: [{ ...VMC_PISO_16.zonas[0], ocupacion: 101 }, ...VMC_PISO_16.zonas.slice(1)],
      },
    ],
    ['unknown document properties', { ...VMC_PISO_16, secret: 'not part of the contract' }],
  ])('rejects %s', (_label, input) => {
    expect(safeParseVmcDocument(input).success).toBe(false)
  })

  it('rejects malformed JSON through the public import path', async () => {
    const file = new File(['{not-json'], 'malformed.json', { type: 'application/json' })

    await expect(importJson(file)).rejects.toThrow(
      'La configuración no cumple el schema vmc-spatial/6.',
    )
  })

  it('rejects structurally invalid data through the public import path', async () => {
    const file = new File(
      [JSON.stringify({ ...VMC_PISO_16, alturaLibre: 2.9 })],
      'invalid-document.json',
      { type: 'application/json' },
    )

    await expect(importJson(file)).rejects.toThrow(
      'La configuración no cumple el schema vmc-spatial/6.',
    )
  })
})
