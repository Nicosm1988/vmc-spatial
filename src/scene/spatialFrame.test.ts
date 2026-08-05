import { describe, expect, it } from 'vitest'
import { EXTERIOR_DEMO_SPEC } from '../domain/exteriorSpec'
import { mmToMeters } from '../domain/units'
import {
  FLOOR16_WORLD_FRAME,
  floorLocalToWorld,
  worldToFloorLocal,
  type FloorPointMeters,
} from './spatialFrame'

describe('floor 16 spatial frame', () => {
  it('derives its center, elevation and rotation from the exterior demo contract', () => {
    expect(FLOOR16_WORLD_FRAME).toEqual({
      centerXM: 31,
      centerYM: 20,
      elevationM: mmToMeters(EXTERIOR_DEMO_SPEC.floor16ElevationMm),
      rotationRad: EXTERIOR_DEMO_SPEC.rotationRad,
    })
  })

  it('keeps the floor center fixed and adds the floor 16 elevation', () => {
    const world = floorLocalToWorld({ x: 31, y: 20, elevation: 2.4 })

    expect(world).toEqual({
      x: 31,
      y: mmToMeters(EXTERIOR_DEMO_SPEC.floor16ElevationMm) + 2.4,
      z: 20,
    })
  })

  it('rotates local floor axes around the 31/20 meter center', () => {
    const world = floorLocalToWorld({ x: 41, y: 20, elevation: 1.2 })
    const rotation = EXTERIOR_DEMO_SPEC.rotationRad

    expect(world.x).toBeCloseTo(31 + Math.cos(rotation) * 10)
    expect(world.y).toBeCloseTo(mmToMeters(EXTERIOR_DEMO_SPEC.floor16ElevationMm) + 1.2)
    expect(world.z).toBeCloseTo(20 - Math.sin(rotation) * 10)
  })

  it('round-trips arbitrary floor points without mutating the input', () => {
    const local: FloorPointMeters = { x: 12.345, y: 36.789, elevation: 2.73 }
    const snapshot = { ...local }
    const restored = worldToFloorLocal(floorLocalToWorld(local))

    expect(local).toEqual(snapshot)
    expect(restored.x).toBeCloseTo(local.x, 10)
    expect(restored.y).toBeCloseTo(local.y, 10)
    expect(restored.elevation).toBeCloseTo(local.elevation, 10)
  })

  it('keeps imported floor dimensions centered on the same tower world anchor', () => {
    const importedCenter = { x: 42, y: 27 }
    const importedPoint: FloorPointMeters = { x: 52, y: 30, elevation: 1.7 }
    const worldCenter = floorLocalToWorld(
      { x: importedCenter.x, y: importedCenter.y, elevation: 0 },
      importedCenter,
    )
    const restored = worldToFloorLocal(
      floorLocalToWorld(importedPoint, importedCenter),
      importedCenter,
    )

    expect(worldCenter.x).toBe(FLOOR16_WORLD_FRAME.centerXM)
    expect(worldCenter.z).toBe(FLOOR16_WORLD_FRAME.centerYM)
    expect(restored.x).toBeCloseTo(importedPoint.x, 10)
    expect(restored.y).toBeCloseTo(importedPoint.y, 10)
    expect(restored.elevation).toBeCloseTo(importedPoint.elevation, 10)
  })
})
