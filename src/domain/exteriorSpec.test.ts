import { describe, expect, it } from 'vitest'
import {
  EXTERIOR_DEMO_SPEC,
  resolveExteriorDetail,
  validateExteriorSpec,
  type ExteriorDemoSpec,
} from './exteriorSpec'

function collectIds(spec: ExteriorDemoSpec): string[] {
  return [
    spec.id,
    spec.demoEntryPortal.id,
    ...spec.massing.map((volume) => volume.id),
    spec.garden.id,
    ...spec.garden.modules.map((module) => module.id),
    spec.site.id,
    ...spec.site.elements.map((element) => element.id),
  ]
}

function collectMillimeterValues(value: unknown, inheritedMm = false): number[] {
  if (typeof value === 'number') return inheritedMm ? [value] : []
  if (value === null || typeof value !== 'object') return []

  return Object.entries(value).flatMap(([key, child]) => {
    const usesMillimeters = inheritedMm || key.endsWith('Mm')
    return collectMillimeterValues(child, usesMillimeters)
  })
}

describe('exterior demo specification', () => {
  it('is deterministic and deeply immutable', () => {
    const first = JSON.stringify(EXTERIOR_DEMO_SPEC)
    const second = JSON.stringify(EXTERIOR_DEMO_SPEC)

    expect(second).toBe(first)
    expect(Object.isFrozen(EXTERIOR_DEMO_SPEC)).toBe(true)
    expect(Object.isFrozen(EXTERIOR_DEMO_SPEC.demoEntryPortal)).toBe(true)
    expect(Object.isFrozen(EXTERIOR_DEMO_SPEC.massing)).toBe(true)
    expect(Object.isFrozen(EXTERIOR_DEMO_SPEC.garden.modules[0])).toBe(true)
  })

  it('keeps the required demo classification and structural invariants', () => {
    expect(validateExteriorSpec(EXTERIOR_DEMO_SPEC)).toEqual([])
    expect(EXTERIOR_DEMO_SPEC.status).toBe('demo-unverified')
    expect(EXTERIOR_DEMO_SPEC.heightMm).toBe(160_000)
    expect(EXTERIOR_DEMO_SPEC.floorCount).toBe(36)
    expect(EXTERIOR_DEMO_SPEC.floor16ElevationMm).toBe(0)
    expect(EXTERIOR_DEMO_SPEC.massing.map((volume) => volume.kind)).toEqual([
      'city-square',
      'river-prow',
    ])
    expect(EXTERIOR_DEMO_SPEC.garden.placement).toBe('near-top')
    expect(EXTERIOR_DEMO_SPEC.garden.modules).toHaveLength(6)
    expect(EXTERIOR_DEMO_SPEC.site.classification).toBe('conceptual')
    expect(EXTERIOR_DEMO_SPEC.demoEntryPortal.classification).toBe('conceptual')
    expect(EXTERIOR_DEMO_SPEC.demoEntryPortal.sizeMm).toEqual({
      width: 4_200,
      depth: 160,
      height: 2_800,
    })
    expect(EXTERIOR_DEMO_SPEC.site.elements.map((element) => element.kind)).toEqual([
      'ground',
      'green-ring',
      'promenade',
      'street',
      'water',
    ])
    expect(EXTERIOR_DEMO_SPEC.lod).toEqual({
      nearMaxDistanceMm: 110_000,
      midMaxDistanceMm: 360_000,
    })
  })

  it('uses unique stable ids and integer millimeters for every spatial value', () => {
    const ids = collectIds(EXTERIOR_DEMO_SPEC)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids.every((id) => id.length > 0)).toBe(true)

    const millimeterValues = collectMillimeterValues(EXTERIOR_DEMO_SPEC)
    expect(millimeterValues.length).toBeGreaterThan(0)
    expect(millimeterValues.every(Number.isInteger)).toBe(true)
  })

  it('rejects a portal frame that closes its conceptual opening', () => {
    const invalidPortalSpec: ExteriorDemoSpec = {
      ...EXTERIOR_DEMO_SPEC,
      demoEntryPortal: {
        ...EXTERIOR_DEMO_SPEC.demoEntryPortal,
        frameThicknessMm: 1_400,
      },
    }

    expect(validateExteriorSpec(invalidPortalSpec)).toContain(
      'demoEntryPortal.frameThicknessMm must leave a positive inner opening',
    )
  })
})

describe('exterior detail resolution', () => {
  it('selects near, mid and far details at deterministic thresholds', () => {
    expect(resolveExteriorDetail(0, 'near')).toBe('near')
    expect(resolveExteriorDetail(109_999, 'near')).toBe('near')
    expect(resolveExteriorDetail(110_000, 'near')).toBe('mid')
    expect(resolveExteriorDetail(359_999, 'near')).toBe('mid')
    expect(resolveExteriorDetail(360_000, 'near')).toBe('far')
  })

  it('caps geometric detail to the active quality profile', () => {
    expect(resolveExteriorDetail(50_000, 'far')).toBe('far')
    expect(resolveExteriorDetail(50_000, 'mid')).toBe('mid')
    expect(resolveExteriorDetail(200_000, 'mid')).toBe('mid')
    expect(resolveExteriorDetail(500_000, 'near')).toBe('far')
  })
})
