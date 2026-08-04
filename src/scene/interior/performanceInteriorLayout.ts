import type { InsightKey, Point, VmcDocument, Zone } from '../../types'
import { heat, wallGeom } from '../../lib/geometry'
import { INSIGHTS } from '../../lib/insights'
import { mmToMeters } from '../../domain/units'

export type Vec3 = [number, number, number]

export interface PerformanceInstance {
  id: string
  ownerId: string
  position: Vec3
  rotation: Vec3
  scale: Vec3
  color: string
}

export interface PerformanceInteriorLayout {
  accentPads: PerformanceInstance[]
  windowGlass: PerformanceInstance[]
  windowFrames: PerformanceInstance[]
  videoWallShells: PerformanceInstance[]
  videoWallScreens: PerformanceInstance[]
  tableTops: PerformanceInstance[]
  tableLegs: PerformanceInstance[]
  roundTableTops: PerformanceInstance[]
  roundPedestals: PerformanceInstance[]
  chairSeats: PerformanceInstance[]
  chairBacks: PerformanceInstance[]
  monitorBodies: PerformanceInstance[]
  monitorStands: PerformanceInstance[]
  officeGlass: PerformanceInstance[]
}

const ENVELOPE_ID = 'demo-presentation-envelope'
const MAX_WINDOW_SEGMENTS = 36

const COLORS = {
  accent: '#2b6cb0',
  chair: '#272a32',
  chairBack: '#17191f',
  dining: '#9a6a34',
  glass: '#9bd7f5',
  leg: '#30343b',
  monitor: '#27e0ff',
  monitorStand: '#20242e',
  office: '#a9deff',
  roundTable: '#2a3350',
  table: '#d8dce2',
  videoShell: '#d8cdbf',
  windowFrame: '#7f8d9b',
} as const

function instance(
  ownerId: string,
  role: string,
  index: number,
  position: Vec3,
  rotation: Vec3,
  scale: Vec3,
  color: string,
): PerformanceInstance {
  return {
    id: `${ownerId}:${role}:${index}`,
    ownerId,
    position,
    rotation,
    scale,
    color,
  }
}

function zoneColor(zone: Zone, insight: InsightKey) {
  if (insight === 'none') return zone.color
  return heat(INSIGHTS[insight].value(zone))
}

function worldFromLocal(
  centerX: number,
  centerZ: number,
  rotationY: number,
  localX: number,
  localZ: number,
): [number, number] {
  const cosine = Math.cos(rotationY)
  const sine = Math.sin(rotationY)
  return [centerX + localX * cosine + localZ * sine, centerZ - localX * sine + localZ * cosine]
}

function addBoxAtLocal(
  target: PerformanceInstance[],
  zone: Zone,
  role: string,
  index: number,
  rotationY: number,
  localPosition: Vec3,
  scale: Vec3,
  color: string,
  rotationOffset = 0,
) {
  const [x, z] = worldFromLocal(
    mmToMeters(zone.cx),
    mmToMeters(zone.cy),
    rotationY,
    localPosition[0],
    localPosition[2],
  )
  target.push(
    instance(
      zone.id,
      role,
      index,
      [x, localPosition[1], z],
      [0, rotationY + rotationOffset, 0],
      scale,
      color,
    ),
  )
}

function addChair(
  layout: PerformanceInteriorLayout,
  zone: Zone,
  index: number,
  rotationY: number,
  localX: number,
  localZ: number,
  outwardX: number,
  outwardZ: number,
) {
  addBoxAtLocal(
    layout.chairSeats,
    zone,
    'chair-seat',
    index,
    rotationY,
    [localX, 0.48, localZ],
    [0.5, 0.09, 0.48],
    COLORS.chair,
  )
  addBoxAtLocal(
    layout.chairBacks,
    zone,
    'chair-back',
    index,
    rotationY,
    [localX + outwardX * 0.2, 0.83, localZ + outwardZ * 0.2],
    [0.52, 0.64, 0.08],
    COLORS.chairBack,
  )
}

function emptyLayout(): PerformanceInteriorLayout {
  return {
    accentPads: [],
    windowGlass: [],
    windowFrames: [],
    videoWallShells: [],
    videoWallScreens: [],
    tableTops: [],
    tableLegs: [],
    roundTableTops: [],
    roundPedestals: [],
    chairSeats: [],
    chairBacks: [],
    monitorBodies: [],
    monitorStands: [],
    officeGlass: [],
  }
}

function sampledPolygon(points: readonly Point[], maximum: number) {
  const count = Math.min(points.length, maximum)
  if (count < 2) return []
  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = Math.floor((index * points.length) / count)
    return points[sourceIndex]!
  })
}

function addEnvelope(layout: PerformanceInteriorLayout, doc: VmcDocument) {
  const centerX = doc.plate.reduce((sum, point) => sum + point.x, 0) / doc.plate.length
  const centerY = doc.plate.reduce((sum, point) => sum + point.y, 0) / doc.plate.length
  const inset = doc.plate.map((point) => ({
    x: Math.round(centerX + (point.x - centerX) * 0.985),
    y: Math.round(centerY + (point.y - centerY) * 0.985),
  }))
  const points = sampledPolygon(inset, MAX_WINDOW_SEGMENTS)

  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length]
    if (!next) return
    const x1 = mmToMeters(point.x)
    const z1 = mmToMeters(point.y)
    const x2 = mmToMeters(next.x)
    const z2 = mmToMeters(next.y)
    const length = Math.hypot(x2 - x1, z2 - z1)
    if (length < 0.05) return
    const rotationY = Math.atan2(-(z2 - z1), x2 - x1)
    const position: Vec3 = [(x1 + x2) / 2, 1.45, (z1 + z2) / 2]

    layout.windowGlass.push(
      instance(
        ENVELOPE_ID,
        'glass',
        index,
        position,
        [0, rotationY, 0],
        [length + 0.04, 2.9, 0.035],
        COLORS.glass,
      ),
    )
    layout.windowFrames.push(
      instance(
        ENVELOPE_ID,
        'mullion',
        index,
        [x1, 1.45, z1],
        [0, rotationY, 0],
        [0.055, 2.9, 0.075],
        COLORS.windowFrame,
      ),
      instance(
        ENVELOPE_ID,
        'rail-bottom',
        index,
        [position[0], 0.045, position[2]],
        [0, rotationY, 0],
        [length + 0.05, 0.09, 0.085],
        COLORS.windowFrame,
      ),
      instance(
        ENVELOPE_ID,
        'rail-top',
        index,
        [position[0], 2.855, position[2]],
        [0, rotationY, 0],
        [length + 0.05, 0.09, 0.085],
        COLORS.windowFrame,
      ),
    )
  })
}

function addVideoWalls(layout: PerformanceInteriorLayout, doc: VmcDocument) {
  const coreX = doc.core.reduce((sum, point) => sum + point.x, 0) / doc.core.length
  const coreY = doc.core.reduce((sum, point) => sum + point.y, 0) / doc.core.length

  doc.videoWalls.forEach((wall) => {
    const geometry = wallGeom(wall)
    const length = mmToMeters(geometry.len)
    let rotationY = Math.atan2(-(wall.y2 - wall.y1), wall.x2 - wall.x1)
    let flip = wall.flip
    if (flip === undefined) {
      const normalX = Math.sin(rotationY)
      const normalZ = Math.cos(rotationY)
      flip = normalX * (geometry.cx - coreX) + normalZ * (geometry.cy - coreY) < 0
    }
    if (flip) rotationY += Math.PI

    const centerX = mmToMeters(geometry.cx)
    const centerZ = mmToMeters(geometry.cy)
    layout.videoWallShells.push(
      instance(
        wall.id,
        'video-shell',
        0,
        [centerX, 1.3, centerZ],
        [0, rotationY, 0],
        [length, 2.6, 0.14],
        COLORS.videoShell,
      ),
    )

    const rows = Math.max(1, Math.round(wall.filas ?? 2))
    const columns = Math.max(1, Math.ceil(wall.pantallas / rows))
    const screenWidth = Math.max(0.18, (length - 0.42) / columns)
    const screenHeight = Math.max(0.18, 2.18 / rows)
    for (let screenIndex = 0; screenIndex < wall.pantallas; screenIndex += 1) {
      const column = screenIndex % columns
      const row = Math.floor(screenIndex / columns)
      const localX = -length / 2 + 0.21 + screenWidth * (column + 0.5)
      const localY = 0.21 + screenHeight * (row + 0.5)
      const [x, z] = worldFromLocal(centerX, centerZ, rotationY, localX, 0.09)
      layout.videoWallScreens.push(
        instance(
          wall.id,
          'video-screen',
          screenIndex,
          [x, localY, z],
          [0, rotationY, 0],
          [screenWidth * 0.9, screenHeight * 0.88, 0.025],
          screenIndex % 3 === 0 ? '#8b5cf6' : screenIndex % 2 === 0 ? '#0ea5e9' : '#27e0ff',
        ),
      )
    }
  })
}

function addBench(layout: PerformanceInteriorLayout, zone: Zone, insight: InsightKey) {
  const pairs = Math.max(1, Math.round(zone.pairs ?? 3))
  const length = pairs * 1.6 + 0.6
  const rotationY = -(zone.rot ?? 0)
  const color = zoneColor(zone, insight)

  addBoxAtLocal(
    layout.accentPads,
    zone,
    'accent',
    0,
    rotationY,
    [0, 0.075, 0],
    [length + 0.25, 0.035, 3.2],
    color,
  )
  addBoxAtLocal(
    layout.tableTops,
    zone,
    'bench-top',
    0,
    rotationY,
    [0, 0.74, 0],
    [length, 0.085, 1.38],
    COLORS.table,
  )

  const legX = Math.max(0.25, length / 2 - 0.28)
  ;[-1, 1].forEach((xSide, xIndex) => {
    ;[-1, 1].forEach((zSide, zIndex) => {
      addBoxAtLocal(
        layout.tableLegs,
        zone,
        'bench-leg',
        xIndex * 2 + zIndex,
        rotationY,
        [xSide * legX, 0.37, zSide * 0.46],
        [0.075, 0.7, 0.075],
        COLORS.leg,
      )
    })
  })

  for (let pairIndex = 0; pairIndex < pairs; pairIndex += 1) {
    const x = (pairIndex - (pairs - 1) / 2) * 1.6
    ;[-1, 1].forEach((side, sideIndex) => {
      const index = pairIndex * 2 + sideIndex
      addChair(layout, zone, index, rotationY, x, side * 1.03, 0, side)
      addBoxAtLocal(
        layout.monitorBodies,
        zone,
        'monitor',
        index,
        rotationY,
        [x, 1.17, side * 0.31],
        [0.58, 0.36, 0.045],
        color,
      )
      addBoxAtLocal(
        layout.monitorStands,
        zone,
        'monitor-stand',
        index,
        rotationY,
        [x, 0.93, side * 0.31],
        [0.06, 0.28, 0.06],
        COLORS.monitorStand,
      )
    })
  }
}

function addRoundTable(layout: PerformanceInteriorLayout, zone: Zone, insight: InsightKey) {
  const radius = mmToMeters(zone.r ?? 1650)
  const tableRadius = radius * 0.55
  const color = zoneColor(zone, insight)
  const centerX = mmToMeters(zone.cx)
  const centerZ = mmToMeters(zone.cy)

  layout.accentPads.push(
    instance(
      zone.id,
      'accent',
      0,
      [centerX, 0.075, centerZ],
      [0, 0, 0],
      [radius * 2.15, 0.035, radius * 2.15],
      color,
    ),
  )
  layout.roundTableTops.push(
    instance(
      zone.id,
      'round-top',
      0,
      [centerX, 0.74, centerZ],
      [0, 0, 0],
      [tableRadius * 2, 0.08, tableRadius * 2],
      COLORS.roundTable,
    ),
  )
  layout.roundPedestals.push(
    instance(
      zone.id,
      'round-pedestal',
      0,
      [centerX, 0.37, centerZ],
      [0, 0, 0],
      [0.22, 0.7, 0.22],
      COLORS.leg,
    ),
  )

  const seats = 5
  for (let index = 0; index < seats; index += 1) {
    const angle = (index / seats) * Math.PI * 2
    const localX = Math.cos(angle) * radius * 0.85
    const localZ = Math.sin(angle) * radius * 0.85
    addChair(layout, zone, index, 0, localX, localZ, Math.cos(angle), Math.sin(angle))
  }
}

function addDiningTable(layout: PerformanceInteriorLayout, zone: Zone, insight: InsightKey) {
  const width = mmToMeters(zone.w ?? 3600)
  const depth = mmToMeters(zone.h ?? 1600) * 0.69
  const rotationY = -(zone.rot ?? 0)
  const color = zoneColor(zone, insight)

  addBoxAtLocal(
    layout.accentPads,
    zone,
    'accent',
    0,
    rotationY,
    [0, 0.075, 0],
    [width + 0.45, 0.035, depth + 1.1],
    color,
  )
  addBoxAtLocal(
    layout.tableTops,
    zone,
    'dining-top',
    0,
    rotationY,
    [0, 0.75, 0],
    [width, 0.08, depth],
    COLORS.dining,
  )

  ;[-1, 1].forEach((xSide, xIndex) => {
    ;[-1, 1].forEach((zSide, zIndex) => {
      addBoxAtLocal(
        layout.tableLegs,
        zone,
        'dining-leg',
        xIndex * 2 + zIndex,
        rotationY,
        [xSide * (width / 2 - 0.18), 0.37, zSide * (depth / 2 - 0.16)],
        [0.07, 0.7, 0.07],
        COLORS.leg,
      )
    })
  })

  const seatsPerSide = 4
  for (let index = 0; index < seatsPerSide; index += 1) {
    const x = -width / 2 + (width / (seatsPerSide + 1)) * (index + 1)
    addChair(layout, zone, index * 2, rotationY, x, depth / 2 + 0.45, 0, 1)
    addChair(layout, zone, index * 2 + 1, rotationY, x, -depth / 2 - 0.45, 0, -1)
  }
}

function addOffice(layout: PerformanceInteriorLayout, zone: Zone, insight: InsightKey) {
  const width = mmToMeters(zone.w ?? 3800)
  const depth = mmToMeters(zone.h ?? 2600)
  const rotationY = -(zone.rot ?? 0)
  const color = zoneColor(zone, insight)

  addBoxAtLocal(
    layout.officeGlass,
    zone,
    'office-glass',
    0,
    rotationY,
    [0, 1.4, 0],
    [width, 2.8, depth],
    COLORS.office,
  )
  addBoxAtLocal(
    layout.accentPads,
    zone,
    'accent',
    0,
    rotationY,
    [0, 0.075, 0],
    [width, 0.035, depth],
    color,
  )
  addBoxAtLocal(
    layout.tableTops,
    zone,
    'office-desk',
    0,
    rotationY,
    [0, 0.74, 0.1],
    [Math.min(1.6, width * 0.62), 0.065, Math.min(0.85, depth * 0.48)],
    COLORS.table,
  )
  addBoxAtLocal(
    layout.monitorBodies,
    zone,
    'office-monitor',
    0,
    rotationY,
    [0, 1.17, -0.05],
    [0.58, 0.36, 0.045],
    color,
  )
  addBoxAtLocal(
    layout.monitorStands,
    zone,
    'office-monitor-stand',
    0,
    rotationY,
    [0, 0.93, -0.05],
    [0.06, 0.28, 0.06],
    COLORS.monitorStand,
  )
  addChair(layout, zone, 0, rotationY, 0, 0.82, 0, 1)
}

/**
 * Converts the validated document's integer millimetres into a compact set of
 * render-only metre transforms. Generated IDs are deterministic and retain the
 * source object's stable ID as ownerId.
 */
export function buildPerformanceInteriorLayout(
  doc: VmcDocument,
  insight: InsightKey,
): PerformanceInteriorLayout {
  const layout = emptyLayout()
  addEnvelope(layout, doc)
  addVideoWalls(layout, doc)

  doc.zonas.forEach((zone) => {
    if (zone.kind === 'bench') addBench(layout, zone, insight)
    else if (zone.kind === 'circular') addRoundTable(layout, zone, insight)
    else if (zone.kind === 'comedor') addDiningTable(layout, zone, insight)
    else if (zone.kind === 'oficina') addOffice(layout, zone, insight)
  })

  return layout
}

export function countPerformanceInstances(layout: PerformanceInteriorLayout) {
  return Object.values(layout).reduce((total, placements) => total + placements.length, 0)
}
