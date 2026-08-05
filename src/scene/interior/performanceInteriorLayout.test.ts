import { ENTRY_CORE_EDGE_INDEX, VMC_PISO_16 } from '../../data/vmcPiso16'
import { wallGeom } from '../../lib/geometry'
import type { Zone } from '../../types'
import * as THREE from 'three'
import {
  buildPerformanceInteriorLayout,
  countPerformanceInstances,
  PRESENTATION_CEILING_ID,
  PRESENTATION_ENTRY_ID,
  PRESENTATION_ENVELOPE_ID,
  PRESENTATION_HERO_SCREEN_ID,
  resolveVideoWallArchitecture,
  type PerformanceInstance,
} from './performanceInteriorLayout'

function worldFromZone(zone: Zone, localX: number, localZ: number) {
  const rotation = -(zone.rot ?? 0)
  const cosine = Math.cos(rotation)
  const sine = Math.sin(rotation)
  return [
    zone.cx / 1000 + localX * cosine + localZ * sine,
    zone.cy / 1000 - localX * sine + localZ * cosine,
  ] as const
}

function expectPosition(
  placement: PerformanceInstance | undefined,
  expected: readonly [number, number, number],
) {
  expect(placement).toBeDefined()
  placement?.position.forEach((value, index) => {
    expect(value).toBeCloseTo(expected[index]!, 6)
  })
}

function expectRotationEquivalent(placement: PerformanceInstance | undefined, rotationY: number) {
  expect(placement).toBeDefined()
  if (!placement) return
  const actual = new THREE.Quaternion().setFromEuler(new THREE.Euler(...placement.rotation))
  const expected = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, rotationY, 0))
  expect(Math.abs(actual.dot(expected))).toBeCloseTo(1, 8)
}

describe('performance interior layout', () => {
  it('retains the detailed renderer inventory with stable source ownership', () => {
    const layout = buildPerformanceInteriorLayout(VMC_PISO_16, 'none')
    const validOwners = new Set([
      ...VMC_PISO_16.zonas.map((zone) => zone.id),
      ...VMC_PISO_16.videoWalls.map((wall) => wall.id),
      PRESENTATION_ENVELOPE_ID,
      PRESENTATION_CEILING_ID,
      PRESENTATION_ENTRY_ID,
      PRESENTATION_HERO_SCREEN_ID,
    ])
    const benches = VMC_PISO_16.zonas.filter((zone) => zone.kind === 'bench')
    const roundTables = VMC_PISO_16.zonas.filter((zone) => zone.kind === 'circular')
    const diningTables = VMC_PISO_16.zonas.filter((zone) => zone.kind === 'comedor')
    const offices = VMC_PISO_16.zonas.filter((zone) => zone.kind === 'oficina')
    const workstationCount = benches.reduce((total, zone) => total + (zone.pairs ?? 3) * 2, 0)
    const meetingOffices = offices.filter(
      (zone) => (zone.w ?? 3800) >= 5000 && (zone.h ?? 2600) >= 4500,
    )
    const chairCount =
      workstationCount +
      roundTables.length * 5 +
      diningTables.length * 8 +
      meetingOffices.length * 8 +
      (offices.length - meetingOffices.length)
    const videoScreenCount = VMC_PISO_16.videoWalls.reduce(
      (total, wall) => total + wall.pantallas,
      0,
    )

    expect(workstationCount).toBe(130)
    expect(videoScreenCount).toBe(98)
    expect(chairCount).toBe(176)
    expect(layout.windowGlass).toHaveLength(30)
    expect(layout.windowShades).toHaveLength(30)
    expect(layout.windowShadeCassettes).toHaveLength(30)
    expect(layout.videoWallShells).toHaveLength(VMC_PISO_16.videoWalls.length)
    expect(layout.videoWallScreens).toHaveLength(videoScreenCount)
    expect(layout.videoWallBezels).toHaveLength(videoScreenCount)
    expect(layout.entryDoorFrames).toHaveLength(4)
    expect(layout.entryDoorLeaves).toHaveLength(2)
    expect(layout.heroScreenFrames).toHaveLength(1)
    expect(layout.heroScreens).toHaveLength(1)
    expect(layout.tableTops).toHaveLength(benches.length * 2 + diningTables.length + offices.length)
    expect(layout.tableBases).toHaveLength(benches.length * 2)
    expect(layout.tableLegs).toHaveLength(diningTables.length * 4 + meetingOffices.length * 2)
    expect(layout.monitorFrames).toHaveLength(workstationCount)
    expect(layout.monitorScreens).toHaveLength(workstationCount)
    expect(layout.chairSeats).toHaveLength(chairCount)
    expect(layout.chairBackMesh).toHaveLength(chairCount)
    expect(layout.chairBackFrames).toHaveLength(chairCount * 7)
    expect(layout.chairArmrests).toHaveLength(chairCount * 4)
    expect(layout.chairSpokes).toHaveLength(chairCount * 5)
    expect(layout.chairCasters).toHaveLength(chairCount * 5)
    expect(layout.ceilingPanels.length).toBeGreaterThan(0)
    expect(layout.ceilingLights.length).toBeGreaterThan(0)
    expect(countPerformanceInstances(layout)).toBeGreaterThan(982)

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

  it('reproduces DeskBench side offsets and orientations from the detailed renderer', () => {
    const layout = buildPerformanceInteriorLayout(VMC_PISO_16, 'none')
    const zone = VMC_PISO_16.zonas.find((candidate) => candidate.id === 'cl1')!
    const rotation = -(zone.rot ?? 0)
    const benchLength = (zone.pairs ?? 3) * 1.6
    const firstX = -benchLength / 2 + 0.8
    const [negativeTopX, negativeTopZ] = worldFromZone(zone, 0, -0.46)
    const [positiveTopX, positiveTopZ] = worldFromZone(zone, 0, 0.46)
    const negativeTop = layout.tableTops.find((item) => item.id === 'cl1:bench-top:0')
    const positiveTop = layout.tableTops.find((item) => item.id === 'cl1:bench-top:1')

    expectPosition(negativeTop, [negativeTopX, 0.74, negativeTopZ])
    expectPosition(positiveTop, [positiveTopX, 0.74, positiveTopZ])
    expect(negativeTop?.scale).toEqual([benchLength, 0.05, 0.86])
    expect(negativeTop?.rotation[1]).toBeCloseTo(rotation, 8)

    const [negativeMonitorX, negativeMonitorZ] = worldFromZone(zone, firstX, -0.21)
    const [positiveMonitorX, positiveMonitorZ] = worldFromZone(zone, firstX, 0.21)
    const negativeMonitor = layout.monitorFrames.find((item) => item.id === 'cl1:monitor-frame:0')
    const positiveMonitor = layout.monitorFrames.find((item) => item.id === 'cl1:monitor-frame:1')
    expectPosition(negativeMonitor, [negativeMonitorX, 1.02, negativeMonitorZ])
    expectPosition(positiveMonitor, [positiveMonitorX, 1.02, positiveMonitorZ])
    expect(negativeMonitor?.rotation[1]).toBeCloseTo(rotation + Math.PI, 8)
    expect(positiveMonitor?.rotation[1]).toBeCloseTo(rotation, 8)

    // Seat centers include the chair-local z=0.02 offset after each side rotation.
    const [negativeChairX, negativeChairZ] = worldFromZone(zone, firstX, -1.32)
    const [positiveChairX, positiveChairZ] = worldFromZone(zone, firstX, 1.32)
    const negativeChair = layout.chairSeats.find((item) => item.id === 'cl1:chair-seat:0')
    const positiveChair = layout.chairSeats.find((item) => item.id === 'cl1:chair-seat:1')
    expectPosition(negativeChair, [negativeChairX, 0.49, negativeChairZ])
    expectPosition(positiveChair, [positiveChairX, 0.49, positiveChairZ])
    expectRotationEquivalent(negativeChair, rotation)
    expectRotationEquivalent(positiveChair, rotation + Math.PI)
  })

  it('closes the four structural videowall edges and keeps every screen horizontal', () => {
    const layout = buildPerformanceInteriorLayout(VMC_PISO_16, 'none')
    const edgeByWallId = new Map([
      ['vw-no', 0],
      ['vw-ne', 1],
      ['vw-se', 3],
      ['vw-so', 4],
    ])
    for (const wall of VMC_PISO_16.videoWalls) {
      const shell = layout.videoWallShells.find((item) => item.ownerId === wall.id)
      const edgeIndex = edgeByWallId.get(wall.id)
      expect(edgeIndex).toBeDefined()
      const start = VMC_PISO_16.core[edgeIndex!]
      const end = VMC_PISO_16.core[(edgeIndex! + 1) % VMC_PISO_16.core.length]
      expect(start).toBeDefined()
      expect(end).toBeDefined()
      expect([wall.x1, wall.y1, wall.x2, wall.y2]).toEqual([start!.x, start!.y, end!.x, end!.y])
      const expectedLength = Math.hypot(end!.x - start!.x, end!.y - start!.y) / 1000
      expect(shell?.position[0]).toBeCloseTo((start!.x + end!.x) / 2000, 8)
      expect(shell?.position[1]).toBe(1.55)
      expect(shell?.position[2]).toBeCloseTo((start!.y + end!.y) / 2000, 8)
      expect(shell?.scale[0]).toBeCloseTo(expectedLength, 8)
      const authored = wallGeom(wall)
      expect(shell?.position[0]).toBeCloseTo(authored.cx / 1000, 8)
      expect(shell?.position[2]).toBeCloseTo(authored.cy / 1000, 8)
      expect(shell?.scale[0]).toBeCloseTo(authored.len / 1000, 8)
      expect(shell?.scale.slice(1)).toEqual([3.1, 0.14])
      const screens = layout.videoWallScreens.filter((item) => item.ownerId === wall.id)
      expect(screens).toHaveLength(wall.pantallas)
      expect(screens.every((screen) => screen.scale[0] > screen.scale[1])).toBe(true)
      screens.forEach((screen) => expect(screen.scale[0] / screen.scale[1]).toBeCloseTo(16 / 9, 8))
    }

    const architecture = resolveVideoWallArchitecture(VMC_PISO_16)
    expect(architecture.entry).not.toBeNull()
    const entryStart = VMC_PISO_16.core[ENTRY_CORE_EDGE_INDEX]!
    const entryEnd = VMC_PISO_16.core[(ENTRY_CORE_EDGE_INDEX + 1) % VMC_PISO_16.core.length]!
    expect(architecture.entry?.centerX).toBeCloseTo((entryStart.x + entryEnd.x) / 2000, 8)
    expect(architecture.entry?.centerZ).toBeCloseTo((entryStart.y + entryEnd.y) / 2000, 8)
    expect(architecture.entry?.length).toBeCloseTo(
      Math.hypot(entryEnd.x - entryStart.x, entryEnd.y - entryStart.y) / 1000,
      8,
    )
    architecture.walls.forEach((structure) => {
      const shell = layout.videoWallShells.find((item) => item.ownerId === structure.ownerId)
      expect(shell?.position).toEqual([structure.centerX, 1.55, structure.centerZ])
      expect(shell?.scale[0]).toBe(structure.length)
      expect(shell?.rotation[1]).toBe(structure.rotationY)
    })
  })

  it('keeps migrated videowall displays on the room-facing side', () => {
    const migrated = {
      ...VMC_PISO_16,
      videoWalls: VMC_PISO_16.videoWalls.map((wall) => ({ ...wall, flip: true })),
    }
    const layout = buildPerformanceInteriorLayout(migrated, 'none')

    layout.videoWallShells.forEach((shell) => {
      const screen = layout.videoWallScreens.find((item) => item.ownerId === shell.ownerId)
      expect(screen).toBeDefined()
      const normalX = Math.sin(shell.rotation[1])
      const normalZ = Math.cos(shell.rotation[1])
      const signedOffset =
        (screen!.position[0] - shell.position[0]) * normalX +
        (screen!.position[2] - shell.position[2]) * normalZ
      expect(signedOffset).toBeGreaterThan(0.09)
    })
  })

  it('restores the two-leaf entrance, the facing hero display and the tip meeting office', () => {
    const layout = buildPerformanceInteriorLayout(VMC_PISO_16, 'none')
    const office = VMC_PISO_16.zonas.find((zone) => zone.id === 'of-central')
    expect(office?.kind).toBe('oficina')
    expect(office?.w).toBe(5600)
    expect(office?.h).toBe(5200)
    expect(layout.entryDoorLeaves).toHaveLength(2)
    expect(
      layout.entryDoorFrames.filter((item) => item.id.includes('door-side-return')),
    ).toHaveLength(2)
    const heroScreen = layout.heroScreens[0]
    expect(heroScreen).toBeDefined()
    expect(heroScreen!.scale[0] / heroScreen!.scale[1]).toBeCloseTo(16 / 9, 8)
    expect(
      layout.tableTops.find((item) => item.id === 'of-central:office-meeting-table:0')?.scale[0],
    ).toBeGreaterThan(4)
    expect(layout.chairSeats.filter((item) => item.ownerId === 'of-central')).toHaveLength(8)
    const officeGlass = layout.officeGlass.filter((item) => item.ownerId === 'of-central')
    expect(officeGlass).toHaveLength(5)
    expect(officeGlass.filter((item) => item.id.includes('office-glass-north-'))).toHaveLength(2)
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

  it('changes insight accents and screens without changing stable instance IDs', () => {
    const base = buildPerformanceInteriorLayout(VMC_PISO_16, 'none')
    const occupied = buildPerformanceInteriorLayout(VMC_PISO_16, 'ocupacion')

    expect(occupied.accentPads.map((placement) => placement.id)).toEqual(
      base.accentPads.map((placement) => placement.id),
    )
    expect(occupied.monitorScreens.map((placement) => placement.id)).toEqual(
      base.monitorScreens.map((placement) => placement.id),
    )
    expect(occupied.accentPads.map((placement) => placement.color)).not.toEqual(
      base.accentPads.map((placement) => placement.color),
    )
  })
})
