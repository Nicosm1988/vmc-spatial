import { VMC_PISO_16 } from '../../data/vmcPiso16'
import {
  buildPerformanceInteriorLayout,
  countPerformanceInstances,
  type PerformanceInstance,
} from './performanceInteriorLayout'

describe('performance interior layout', () => {
  it('batches the presentation inventory while retaining source ownership', () => {
    const layout = buildPerformanceInteriorLayout(VMC_PISO_16, 'none')
    const validOwners = new Set([
      ...VMC_PISO_16.zonas.map((zone) => zone.id),
      ...VMC_PISO_16.videoWalls.map((wall) => wall.id),
      'demo-presentation-envelope',
    ])

    expect(layout.videoWallScreens).toHaveLength(
      VMC_PISO_16.videoWalls.reduce((total, wall) => total + wall.pantallas, 0),
    )
    expect(layout.monitorBodies).toHaveLength(
      VMC_PISO_16.zonas
        .filter((zone) => zone.kind === 'bench')
        .reduce((total, zone) => total + (zone.pairs ?? 3) * 2, 0),
    )
    expect(layout.windowGlass.length).toBeLessThanOrEqual(36)
    expect(layout.chairSeats).toHaveLength(184)
    expect(layout.chairBacks).toHaveLength(184)
    expect(layout.monitorBodies).toHaveLength(130)
    expect(countPerformanceInstances(layout)).toBe(982)

    const ids = Object.values(layout).flatMap((placements) =>
      placements.map((placement: PerformanceInstance) => placement.id),
    )
    expect(new Set(ids).size).toBe(ids.length)

    for (const placements of Object.values(layout)) {
      for (const placement of placements) {
        expect(validOwners.has(placement.ownerId)).toBe(true)
        expect(placement.id.startsWith(`${placement.ownerId}:`)).toBe(true)
      }
    }
  })

  it('produces finite metre transforms without mutating millimetre source data', () => {
    const before = JSON.stringify(VMC_PISO_16)
    const layout = buildPerformanceInteriorLayout(VMC_PISO_16, 'ocupacion')

    for (const placements of Object.values(layout)) {
      for (const placement of placements) {
        expect(
          [...placement.position, ...placement.rotation, ...placement.scale].every(Number.isFinite),
        ).toBe(true)
        expect(placement.scale.every((value: number) => value > 0)).toBe(true)
      }
    }
    expect(JSON.stringify(VMC_PISO_16)).toBe(before)
  })

  it('changes zone accents for insights without changing stable instance IDs', () => {
    const base = buildPerformanceInteriorLayout(VMC_PISO_16, 'none')
    const occupied = buildPerformanceInteriorLayout(VMC_PISO_16, 'ocupacion')

    expect(occupied.accentPads.map((placement) => placement.id)).toEqual(
      base.accentPads.map((placement) => placement.id),
    )
    expect(occupied.accentPads.map((placement) => placement.color)).not.toEqual(
      base.accentPads.map((placement) => placement.color),
    )
  })
})
