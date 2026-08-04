import { describe, expect, it } from 'vitest'
import {
  createCurvedProwShape,
  createFacadeLineGeometry,
  createMassingGeometry,
  createRoundedSquareShape,
  geometryHasFinitePositions,
} from './exteriorGeometry'

describe('procedural exterior geometry', () => {
  it('creates finite massing with the requested vertical bounds', () => {
    const shape = createRoundedSquareShape(38_000, 36_000)
    const geometry = createMassingGeometry(shape, 160_000, -66_660, 1_200, -800)

    expect(geometryHasFinitePositions(geometry)).toBe(true)
    expect(geometry.boundingBox?.min.y).toBeCloseTo(-66.66, 2)
    expect(geometry.boundingBox?.max.y).toBeCloseTo(93.34, 2)

    geometry.dispose()
  })

  it('keeps the prow deterministic and produces more near than mid facade detail', () => {
    const shape = createCurvedProwShape(48_000, 42_000)
    const near = createFacadeLineGeometry(shape, {
      baseElevationMm: -66_660,
      heightMm: 160_000,
      horizontalBands: 36,
      verticalEvery: 2,
    })
    const mid = createFacadeLineGeometry(shape, {
      baseElevationMm: -66_660,
      heightMm: 160_000,
      horizontalBands: 12,
      verticalEvery: 6,
      contourSegments: 18,
    })

    expect(geometryHasFinitePositions(near)).toBe(true)
    expect(near.getAttribute('position').count).toBeGreaterThan(mid.getAttribute('position').count)

    near.dispose()
    mid.dispose()
  })
})
