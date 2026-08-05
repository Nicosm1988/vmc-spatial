import * as THREE from 'three'
import { mmToMeters } from '../../domain/units'
import { heat, wallGeom } from '../../lib/geometry'
import { INSIGHTS } from '../../lib/insights'
import { pointInPolygon, scalePoly } from '../../lib/plate'
import type { InsightKey, Point, VmcDocument, Zone } from '../../types'

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
  windowShades: PerformanceInstance[]
  windowShadeCassettes: PerformanceInstance[]
  videoWallShells: PerformanceInstance[]
  videoWallTrims: PerformanceInstance[]
  videoWallBezels: PerformanceInstance[]
  videoWallScreens: PerformanceInstance[]
  entryDoorFrames: PerformanceInstance[]
  entryDoorLeaves: PerformanceInstance[]
  heroScreenFrames: PerformanceInstance[]
  heroScreens: PerformanceInstance[]
  tableTops: PerformanceInstance[]
  tableBases: PerformanceInstance[]
  tableLegs: PerformanceInstance[]
  roundTableTops: PerformanceInstance[]
  roundPedestals: PerformanceInstance[]
  chairSeats: PerformanceInstance[]
  chairBackFrames: PerformanceInstance[]
  chairBackMesh: PerformanceInstance[]
  chairArmrests: PerformanceInstance[]
  chairStems: PerformanceInstance[]
  chairSpokes: PerformanceInstance[]
  chairCasters: PerformanceInstance[]
  monitorFrames: PerformanceInstance[]
  monitorScreens: PerformanceInstance[]
  monitorStems: PerformanceInstance[]
  monitorBases: PerformanceInstance[]
  officeGlass: PerformanceInstance[]
  ceilingPanels: PerformanceInstance[]
  ceilingLights: PerformanceInstance[]
}

export const PRESENTATION_ENVELOPE_ID = 'demo-presentation-envelope'
export const PRESENTATION_CEILING_ID = 'demo-technical-ceiling'
export const PRESENTATION_ENTRY_ID = 'demo-core-entry'
export const PRESENTATION_HERO_SCREEN_ID = 'demo-entry-hero-screen'

const WINDOW_SEGMENTS = 30
const DESK_WIDTH = 1.6
const DESK_DEPTH = 0.86
const DESK_SPINE = 0.06
const DESK_ROW_Z = DESK_DEPTH / 2 + DESK_SPINE / 2

const COLORS = {
  accent: '#2b6cb0',
  caster: '#090a0d',
  chair: '#202229',
  chairFrame: '#101216',
  chairMesh: '#252931',
  ceiling: '#d8d7d2',
  ceilingLight: '#fff3cf',
  dining: '#9a6a34',
  glass: '#b9ddef',
  leg: '#3f3023',
  metal: '#34373d',
  monitorFrame: '#08090d',
  monitorStand: '#181a20',
  office: '#a9deff',
  roundTable: '#2a3350',
  shade: '#d8d3c7',
  shadeCassette: '#9ca3aa',
  table: '#f2f2ee',
  tableBase: '#e6e6e2',
  videoBezel: '#03050a',
  videoScreen: '#ffffff',
  videoShell: '#d8cdbf',
  videoTrim: '#c3b6a4',
  windowFrame: '#8a97a6',
} as const

function emptyLayout(): PerformanceInteriorLayout {
  return {
    accentPads: [],
    windowGlass: [],
    windowFrames: [],
    windowShades: [],
    windowShadeCassettes: [],
    videoWallShells: [],
    videoWallTrims: [],
    videoWallBezels: [],
    videoWallScreens: [],
    entryDoorFrames: [],
    entryDoorLeaves: [],
    heroScreenFrames: [],
    heroScreens: [],
    tableTops: [],
    tableBases: [],
    tableLegs: [],
    roundTableTops: [],
    roundPedestals: [],
    chairSeats: [],
    chairBackFrames: [],
    chairBackMesh: [],
    chairArmrests: [],
    chairStems: [],
    chairSpokes: [],
    chairCasters: [],
    monitorFrames: [],
    monitorScreens: [],
    monitorStems: [],
    monitorBases: [],
    officeGlass: [],
    ceilingPanels: [],
    ceilingLights: [],
  }
}

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
  return insight === 'none' ? zone.color : heat(INSIGHTS[insight].value(zone))
}

/** Mirrors a Three.js Y rotation on the horizontal x/z plane. */
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

function addAtZoneLocal(
  target: PerformanceInstance[],
  zone: Zone,
  role: string,
  index: number,
  zoneRotationY: number,
  localPosition: Vec3,
  scale: Vec3,
  color: string,
  localRotationY = 0,
  rotationX = 0,
  rotationZ = 0,
) {
  const [x, z] = worldFromLocal(
    mmToMeters(zone.cx),
    mmToMeters(zone.cy),
    zoneRotationY,
    localPosition[0],
    localPosition[2],
  )
  target.push(
    instance(
      zone.id,
      role,
      index,
      [x, localPosition[1], z],
      [rotationX, zoneRotationY + localRotationY, rotationZ],
      scale,
      color,
    ),
  )
}

function addAtNestedLocal(
  target: PerformanceInstance[],
  zone: Zone,
  role: string,
  index: number,
  zoneRotationY: number,
  groupX: number,
  groupZ: number,
  groupRotationY: number,
  partPosition: Vec3,
  scale: Vec3,
  color: string,
  partRotationY = 0,
  rotationX = 0,
  rotationZ = 0,
) {
  const [offsetX, offsetZ] = worldFromLocal(0, 0, groupRotationY, partPosition[0], partPosition[2])
  const [x, z] = worldFromLocal(
    mmToMeters(zone.cx),
    mmToMeters(zone.cy),
    zoneRotationY,
    groupX + offsetX,
    groupZ + offsetZ,
  )
  const parent = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0, zoneRotationY + groupRotationY + partRotationY, 0),
  )
  const local = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotationX, 0, rotationZ))
  const composed = new THREE.Euler().setFromQuaternion(parent.multiply(local), 'XYZ')
  target.push(
    instance(
      zone.id,
      role,
      index,
      [x, partPosition[1], z],
      [composed.x, composed.y, composed.z],
      scale,
      color,
    ),
  )
}

function resampleLikeDetailedRenderer(points: readonly Point[], length: number): Point[] {
  const output: Point[] = []
  for (let index = 0; index < length; index += 1) {
    const sourceIndex = Math.round((index * (points.length - 1)) / length)
    const point = points[sourceIndex]
    if (point) output.push(point)
  }
  return output
}

function addEnvelope(layout: PerformanceInteriorLayout, doc: VmcDocument) {
  const inset = scalePoly(doc.plate, 0.985, Math.round(doc.ancho / 2), Math.round(doc.alto / 2))
  const points = resampleLikeDetailedRenderer(inset, WINDOW_SEGMENTS)

  points.forEach((point, segmentIndex) => {
    const next = points[(segmentIndex + 1) % points.length]
    if (!next) return
    const x1 = mmToMeters(point.x)
    const z1 = mmToMeters(point.y)
    const x2 = mmToMeters(next.x)
    const z2 = mmToMeters(next.y)
    const segmentLength = Math.hypot(x2 - x1, z2 - z1)
    if (segmentLength < 0.3) return

    const length = segmentLength + 0.05
    const centerX = (x1 + x2) / 2
    const centerZ = (z1 + z2) / 2
    const rotationY = Math.atan2(-(z2 - z1), x2 - x1)
    layout.windowGlass.push(
      instance(
        PRESENTATION_ENVELOPE_ID,
        'glass',
        segmentIndex,
        [centerX, 1.55, centerZ],
        [0, rotationY, 0],
        [length, 2.9, 0.04],
        COLORS.glass,
      ),
    )

    const posts = Math.max(2, Math.round(length / 1.6))
    for (let postIndex = 0; postIndex <= posts; postIndex += 1) {
      const localX = -length / 2 + (length / posts) * postIndex
      const [postX, postZ] = worldFromLocal(centerX, centerZ, rotationY, localX, 0)
      layout.windowFrames.push(
        instance(
          PRESENTATION_ENVELOPE_ID,
          'mullion',
          segmentIndex * 100 + postIndex,
          [postX, 1.55, postZ],
          [0, rotationY, 0],
          [0.06, 2.9, 0.09],
          COLORS.windowFrame,
        ),
      )
    }
    layout.windowFrames.push(
      instance(
        PRESENTATION_ENVELOPE_ID,
        'rail-bottom',
        segmentIndex,
        [centerX, 0.13, centerZ],
        [0, rotationY, 0],
        [length, 0.09, 0.1],
        COLORS.windowFrame,
      ),
      instance(
        PRESENTATION_ENVELOPE_ID,
        'rail-top',
        segmentIndex,
        [centerX, 2.97, centerZ],
        [0, rotationY, 0],
        [length, 0.09, 0.1],
        COLORS.windowFrame,
      ),
    )

    const shadeHeight = [0.18, 1.46, 2.24, 0.72, 1.78, 0.34][segmentIndex % 6]!
    const [shadeX, shadeZ] = worldFromLocal(centerX, centerZ, rotationY, 0, 0.075)
    layout.windowShades.push(
      instance(
        PRESENTATION_ENVELOPE_ID,
        'roller-shade',
        segmentIndex,
        [shadeX, 2.9 - shadeHeight / 2, shadeZ],
        [0, rotationY, 0],
        [length * 0.96, shadeHeight, 0.018],
        COLORS.shade,
      ),
    )
    layout.windowShadeCassettes.push(
      instance(
        PRESENTATION_ENVELOPE_ID,
        'roller-cassette',
        segmentIndex,
        [shadeX, 2.92, shadeZ],
        [0, rotationY, 0],
        [length, 0.12, 0.12],
        COLORS.shadeCassette,
      ),
    )
  })
}

interface CoreEdge {
  index: number
  centerX: number
  centerZ: number
  length: number
  rotationY: number
}

export interface ResolvedVideoWallStructure {
  readonly ownerId: string
  readonly centerX: number
  readonly centerZ: number
  readonly length: number
  readonly rotationY: number
}

export interface ResolvedVideoWallArchitecture {
  readonly walls: readonly ResolvedVideoWallStructure[]
  readonly entry: ResolvedVideoWallStructure | null
}

function coreEdges(doc: VmcDocument): CoreEdge[] {
  return doc.core.map((point, index) => {
    const next = doc.core[(index + 1) % doc.core.length]!
    const x1 = mmToMeters(point.x)
    const z1 = mmToMeters(point.y)
    const x2 = mmToMeters(next.x)
    const z2 = mmToMeters(next.y)
    return {
      index,
      centerX: (x1 + x2) / 2,
      centerZ: (z1 + z2) / 2,
      length: Math.hypot(x2 - x1, z2 - z1),
      rotationY: Math.atan2(-(z2 - z1), x2 - x1),
    }
  })
}

function faceAwayFromCore(edge: CoreEdge, coreX: number, coreZ: number) {
  let rotationY = edge.rotationY
  const normalX = Math.sin(rotationY)
  const normalZ = Math.cos(rotationY)
  if (normalX * (edge.centerX - coreX) + normalZ * (edge.centerZ - coreZ) < 0) {
    rotationY += Math.PI
  }
  return rotationY
}

/**
 * Consumes the four authored videowall segments without replacing their
 * geometry and reserves the nearest unused core edge for the entrance. The
 * canonical preset already stores exact core-edge endpoints, so document,
 * plan, inspector, presentation and editor all expose the same structure.
 */
export function resolveVideoWallArchitecture(doc: VmcDocument): ResolvedVideoWallArchitecture {
  const coreX = mmToMeters(doc.core.reduce((sum, point) => sum + point.x, 0) / doc.core.length)
  const coreZ = mmToMeters(doc.core.reduce((sum, point) => sum + point.y, 0) / doc.core.length)
  const edges = coreEdges(doc)
  const usedEdges = new Set<number>()
  const walls = doc.videoWalls.flatMap((wall) => {
    const geometry = wallGeom(wall)
    const wallCenterX = mmToMeters(geometry.cx)
    const wallCenterZ = mmToMeters(geometry.cy)
    const edge = edges
      .filter((candidate) => !usedEdges.has(candidate.index))
      .sort(
        (left, right) =>
          Math.hypot(left.centerX - wallCenterX, left.centerZ - wallCenterZ) -
          Math.hypot(right.centerX - wallCenterX, right.centerZ - wallCenterZ),
      )[0]
    if (!edge) return []
    usedEdges.add(edge.index)

    const authoredEdge: CoreEdge = {
      index: edge.index,
      centerX: wallCenterX,
      centerZ: wallCenterZ,
      length: mmToMeters(geometry.len),
      rotationY: -geometry.ang,
    }
    return [
      {
        ownerId: wall.id,
        centerX: authoredEdge.centerX,
        centerZ: authoredEdge.centerZ,
        length: authoredEdge.length,
        // Legacy documents mark the corrected/outward side as flip=true.
        // Undefined preset values also use the safe physical default.
        rotationY:
          faceAwayFromCore(authoredEdge, coreX, coreZ) + (wall.flip === false ? Math.PI : 0),
      },
    ]
  })
  const entryEdge = edges.find((edge) => !usedEdges.has(edge.index))

  return {
    walls,
    entry: entryEdge
      ? {
          ownerId: PRESENTATION_ENTRY_ID,
          centerX: entryEdge.centerX,
          centerZ: entryEdge.centerZ,
          length: entryEdge.length,
          rotationY: faceAwayFromCore(entryEdge, coreX, coreZ),
        }
      : null,
  }
}

function addEntryArchitecture(
  layout: PerformanceInteriorLayout,
  doorEdge: ResolvedVideoWallStructure,
) {
  const rotationY = doorEdge.rotationY
  const wallHeight = 3.1
  const doorHeight = 2.48
  const openingWidth = Math.min(2.2, doorEdge.length - 0.6)
  const sideReturnWidth = (doorEdge.length - openingWidth) / 2
  const leafWidth = openingWidth / 2

  const addFrame = (role: string, index: number, localX: number, y: number, scale: Vec3) => {
    const [x, z] = worldFromLocal(doorEdge.centerX, doorEdge.centerZ, rotationY, localX, 0)
    layout.entryDoorFrames.push(
      instance(
        PRESENTATION_ENTRY_ID,
        role,
        index,
        [x, y, z],
        [0, rotationY, 0],
        scale,
        COLORS.videoShell,
      ),
    )
  }

  addFrame('door-header', 0, 0, doorHeight + (wallHeight - doorHeight) / 2, [
    doorEdge.length,
    wallHeight - doorHeight,
    0.18,
  ])
  addFrame('door-side-return', 0, -(openingWidth + sideReturnWidth) / 2, doorHeight / 2, [
    sideReturnWidth,
    doorHeight,
    0.18,
  ])
  addFrame('door-side-return', 1, (openingWidth + sideReturnWidth) / 2, doorHeight / 2, [
    sideReturnWidth,
    doorHeight,
    0.18,
  ])
  addFrame('door-track', 0, 0, 0.035, [openingWidth, 0.035, 0.15])

  ;[-1, 1].forEach((side, index) => {
    const localX = side * (leafWidth / 2)
    const [x, z] = worldFromLocal(doorEdge.centerX, doorEdge.centerZ, rotationY, localX, 0.035)
    layout.entryDoorLeaves.push(
      instance(
        PRESENTATION_ENTRY_ID,
        'sliding-door-leaf',
        index,
        [x, doorHeight / 2, z],
        [0, rotationY, 0],
        [leafWidth - 0.025, doorHeight - 0.06, 0.055],
        '#9fc9d8',
      ),
    )
  })

  const outwardX = Math.sin(rotationY)
  const outwardZ = Math.cos(rotationY)
  const heroX = doorEdge.centerX + outwardX * 8
  const heroZ = doorEdge.centerZ + outwardZ * 8
  layout.heroScreenFrames.push(
    instance(
      PRESENTATION_HERO_SCREEN_ID,
      'hero-screen-frame',
      0,
      [heroX, 1.42, heroZ],
      [0, rotationY + Math.PI, 0],
      [4.34, 2.54, 0.14],
      COLORS.monitorFrame,
    ),
  )
  layout.heroScreens.push(
    instance(
      PRESENTATION_HERO_SCREEN_ID,
      'hero-screen',
      0,
      [heroX - outwardX * 0.078, 1.42, heroZ - outwardZ * 0.078],
      [0, rotationY + Math.PI, 0],
      [4.16, 2.34, 0.018],
      COLORS.videoScreen,
    ),
  )
}

function addVideoWalls(layout: PerformanceInteriorLayout, doc: VmcDocument) {
  const architecture = resolveVideoWallArchitecture(doc)
  const wallStructures = new Map(
    architecture.walls.map((structure) => [structure.ownerId, structure]),
  )

  doc.videoWalls.forEach((wall) => {
    const edge = wallStructures.get(wall.id)
    if (!edge) return

    const length = edge.length
    const rotationY = edge.rotationY
    layout.videoWallShells.push(
      instance(
        wall.id,
        'video-shell',
        0,
        [edge.centerX, 1.55, edge.centerZ],
        [0, rotationY, 0],
        [length, 3.1, 0.14],
        COLORS.videoShell,
      ),
    )

    ;[
      { y: 0.08, role: 'video-trim-bottom' },
      { y: 3.02, role: 'video-trim-top' },
    ].forEach((trim, trimIndex) => {
      const [x, z] = worldFromLocal(edge.centerX, edge.centerZ, rotationY, 0, 0.075)
      layout.videoWallTrims.push(
        instance(
          wall.id,
          trim.role,
          trimIndex,
          [x, trim.y, z],
          [0, rotationY, 0],
          [length, 0.16, 0.02],
          COLORS.videoTrim,
        ),
      )
    })

    const wallHeight = 3.1
    const rows = Math.max(1, wall.filas ?? 2)
    const columns = Math.max(1, Math.ceil(wall.pantallas / rows))
    const gap = 0.03
    const bandBottom = 0.74
    const bandTop = wallHeight - 0.2
    const availableHeight = bandTop - bandBottom
    const maximumWidth = (length - 0.4 - (columns - 1) * gap) / columns
    const maximumHeight = (availableHeight - (rows - 1) * gap) / rows
    const screenWidth = Math.min(maximumWidth, (maximumHeight * 16) / 9)
    const screenHeight = (screenWidth * 9) / 16
    const yBottom =
      bandBottom +
      (availableHeight - (rows * screenHeight + (rows - 1) * gap)) / 2 +
      screenHeight / 2

    for (let screenIndex = 0; screenIndex < wall.pantallas; screenIndex += 1) {
      const row = Math.floor(screenIndex / columns)
      const column = screenIndex % columns
      const localX = -((columns - 1) * (screenWidth + gap)) / 2 + column * (screenWidth + gap)
      const localY = yBottom + row * (screenHeight + gap)
      const [bezelX, bezelZ] = worldFromLocal(edge.centerX, edge.centerZ, rotationY, localX, 0.08)
      const [screenX, screenZ] = worldFromLocal(
        edge.centerX,
        edge.centerZ,
        rotationY,
        localX,
        0.095,
      )
      layout.videoWallBezels.push(
        instance(
          wall.id,
          'video-bezel',
          screenIndex,
          [bezelX, localY, bezelZ],
          [0, rotationY, 0],
          [screenWidth, screenHeight, 0.018],
          COLORS.videoBezel,
        ),
      )
      layout.videoWallScreens.push(
        instance(
          wall.id,
          'video-screen',
          screenIndex,
          [screenX, localY, screenZ],
          [0, rotationY, 0],
          [
            Math.max(0.05, screenWidth - 0.02),
            Math.max(0.05, ((screenWidth - 0.02) * 9) / 16),
            0.012,
          ],
          COLORS.videoScreen,
        ),
      )
    }
  })

  if (architecture.entry) addEntryArchitecture(layout, architecture.entry)
}

function addChair(
  layout: PerformanceInteriorLayout,
  zone: Zone,
  chairIndex: number,
  zoneRotationY: number,
  chairX: number,
  chairZ: number,
  chairRotationY: number,
) {
  addAtNestedLocal(
    layout.chairSeats,
    zone,
    'chair-seat',
    chairIndex,
    zoneRotationY,
    chairX,
    chairZ,
    chairRotationY,
    [0, 0.49, 0.02],
    [0.5, 0.09, 0.48],
    COLORS.chair,
  )

  const backBars: ReadonlyArray<{ position: Vec3; scale: Vec3 }> = [
    { position: [-0.245, 0.9, -0.21], scale: [0.055, 0.7, 0.07] },
    { position: [0.245, 0.9, -0.21], scale: [0.055, 0.7, 0.07] },
    { position: [0, 1.23, -0.21], scale: [0.54, 0.055, 0.07] },
    { position: [0, 0.57, -0.21], scale: [0.54, 0.055, 0.07] },
  ]
  backBars.forEach((bar, barIndex) => {
    addAtNestedLocal(
      layout.chairBackFrames,
      zone,
      'chair-back-frame',
      chairIndex * backBars.length + barIndex,
      zoneRotationY,
      chairX,
      chairZ,
      chairRotationY,
      bar.position,
      bar.scale,
      COLORS.chairFrame,
      0,
      -0.12,
    )
  })
  const lumbarBars: ReadonlyArray<{ position: Vec3; scale: Vec3; rotationZ: number }> = [
    { position: [0, 0.76, -0.23], scale: [0.055, 0.3, 0.06], rotationZ: 0 },
    { position: [-0.1, 0.95, -0.23], scale: [0.05, 0.31, 0.06], rotationZ: -0.58 },
    { position: [0.1, 0.95, -0.23], scale: [0.05, 0.31, 0.06], rotationZ: 0.58 },
  ]
  lumbarBars.forEach((bar, barIndex) => {
    addAtNestedLocal(
      layout.chairBackFrames,
      zone,
      'chair-lumbar-support',
      chairIndex * lumbarBars.length + barIndex,
      zoneRotationY,
      chairX,
      chairZ,
      chairRotationY,
      bar.position,
      bar.scale,
      COLORS.chairFrame,
      0,
      -0.12,
      bar.rotationZ,
    )
  })
  addAtNestedLocal(
    layout.chairBackMesh,
    zone,
    'chair-back-mesh',
    chairIndex,
    zoneRotationY,
    chairX,
    chairZ,
    chairRotationY,
    [0, 0.9, -0.195],
    [0.43, 0.61, 1],
    COLORS.chairMesh,
    0,
    -0.12,
  )

  ;[-1, 1].forEach((side, sideIndex) => {
    addAtNestedLocal(
      layout.chairArmrests,
      zone,
      'chair-arm-pad',
      chairIndex * 4 + sideIndex,
      zoneRotationY,
      chairX,
      chairZ,
      chairRotationY,
      [side * 0.29, 0.76, 0],
      [0.08, 0.05, 0.22],
      COLORS.chairFrame,
    )
    addAtNestedLocal(
      layout.chairArmrests,
      zone,
      'chair-arm-support',
      chairIndex * 4 + 2 + sideIndex,
      zoneRotationY,
      chairX,
      chairZ,
      chairRotationY,
      [side * 0.29, 0.63, 0.06],
      [0.045, 0.26, 0.045],
      COLORS.metal,
    )
  })

  addAtNestedLocal(
    layout.chairStems,
    zone,
    'chair-stem',
    chairIndex,
    zoneRotationY,
    chairX,
    chairZ,
    chairRotationY,
    [0, 0.28, 0],
    [0.09, 0.4, 0.09],
    COLORS.metal,
  )

  for (let spokeIndex = 0; spokeIndex < 5; spokeIndex += 1) {
    const angle = (spokeIndex / 5) * Math.PI * 2
    const casterX = Math.sin(angle) * 0.28
    const casterZ = Math.cos(angle) * 0.28
    addAtNestedLocal(
      layout.chairSpokes,
      zone,
      'chair-spoke',
      chairIndex * 5 + spokeIndex,
      zoneRotationY,
      chairX,
      chairZ,
      chairRotationY,
      [casterX * 0.5, 0.06, casterZ * 0.5],
      [0.06, 0.04, 0.34],
      COLORS.chairFrame,
      -angle,
    )
    addAtNestedLocal(
      layout.chairCasters,
      zone,
      'chair-caster',
      chairIndex * 5 + spokeIndex,
      zoneRotationY,
      chairX,
      chairZ,
      chairRotationY,
      [casterX, 0.035, casterZ],
      [0.07, 0.055, 0.07],
      COLORS.caster,
    )
  }
}

function addMonitor(
  layout: PerformanceInteriorLayout,
  zone: Zone,
  monitorIndex: number,
  zoneRotationY: number,
  monitorX: number,
  monitorZ: number,
  direction: -1 | 1,
  screenColor: string,
) {
  const screenRotation = direction < 0 ? Math.PI : 0
  addAtZoneLocal(
    layout.monitorFrames,
    zone,
    'monitor-frame',
    monitorIndex,
    zoneRotationY,
    [monitorX, 1.02, monitorZ],
    [1, 1, 1],
    COLORS.monitorFrame,
    screenRotation,
  )
  addAtZoneLocal(
    layout.monitorScreens,
    zone,
    'monitor-screen',
    monitorIndex,
    zoneRotationY,
    [monitorX, 1.02, monitorZ],
    [1, 1, 1],
    screenColor,
    screenRotation,
  )

  const supportZ = monitorZ - direction * 0.1
  addAtZoneLocal(
    layout.monitorStems,
    zone,
    'monitor-stem',
    monitorIndex,
    zoneRotationY,
    [monitorX, 0.85, supportZ],
    [0.05, 0.22, 0.04],
    COLORS.monitorStand,
  )
  addAtZoneLocal(
    layout.monitorBases,
    zone,
    'monitor-base',
    monitorIndex,
    zoneRotationY,
    [monitorX, 0.76, supportZ],
    [0.32, 0.03, 0.18],
    COLORS.monitorStand,
  )
}

function addBench(layout: PerformanceInteriorLayout, zone: Zone, insight: InsightKey) {
  const pairs = Math.max(1, Math.round(zone.pairs ?? 3))
  const benchLength = pairs * DESK_WIDTH
  const zoneRotationY = -(zone.rot ?? 0)
  const screenColor = insight === 'none' ? '#ffffff' : zoneColor(zone, insight)

  addAtZoneLocal(
    layout.accentPads,
    zone,
    'accent',
    0,
    zoneRotationY,
    [0, 0.03, 0],
    [benchLength + 0.6, 0.05, 3.3],
    screenColor,
  )
  ;[-1, 1].forEach((side, sideIndex) => {
    addAtZoneLocal(
      layout.tableTops,
      zone,
      'bench-top',
      sideIndex,
      zoneRotationY,
      [0, 0.74, side * DESK_ROW_Z],
      [benchLength, 0.05, DESK_DEPTH],
      COLORS.table,
    )
    addAtZoneLocal(
      layout.tableBases,
      zone,
      'bench-base',
      sideIndex,
      zoneRotationY,
      [0, 0.37, side * DESK_ROW_Z],
      [benchLength * 0.96, 0.72, DESK_DEPTH * 0.5],
      COLORS.tableBase,
    )
  })

  for (let pairIndex = 0; pairIndex < pairs; pairIndex += 1) {
    const x = -benchLength / 2 + DESK_WIDTH / 2 + pairIndex * DESK_WIDTH
    const negativeIndex = pairIndex * 2
    const positiveIndex = pairIndex * 2 + 1
    addMonitor(
      layout,
      zone,
      negativeIndex,
      zoneRotationY,
      x,
      -DESK_ROW_Z + (DESK_DEPTH / 2 - 0.18),
      -1,
      screenColor,
    )
    addChair(
      layout,
      zone,
      negativeIndex,
      zoneRotationY,
      x,
      -(DESK_ROW_Z + DESK_DEPTH / 2 + 0.45),
      0,
    )
    addMonitor(
      layout,
      zone,
      positiveIndex,
      zoneRotationY,
      x,
      DESK_ROW_Z - (DESK_DEPTH / 2 - 0.18),
      1,
      screenColor,
    )
    addChair(
      layout,
      zone,
      positiveIndex,
      zoneRotationY,
      x,
      DESK_ROW_Z + DESK_DEPTH / 2 + 0.45,
      Math.PI,
    )
  }
}

function addRoundTable(layout: PerformanceInteriorLayout, zone: Zone) {
  const radius = mmToMeters(zone.r ?? 1650)
  const centerX = mmToMeters(zone.cx)
  const centerZ = mmToMeters(zone.cy)
  layout.roundTableTops.push(
    instance(
      zone.id,
      'round-top',
      0,
      [centerX, 0.74, centerZ],
      [0, 0, 0],
      [radius * 1.1, 0.06, radius * 1.1],
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
      [0.21, 0.72, 0.21],
      COLORS.monitorStand,
    ),
  )

  for (let chairIndex = 0; chairIndex < 5; chairIndex += 1) {
    const angle = (chairIndex / 5) * Math.PI * 2
    addChair(
      layout,
      zone,
      chairIndex,
      0,
      Math.cos(angle) * radius * 0.85,
      Math.sin(angle) * radius * 0.85,
      -angle - Math.PI / 2,
    )
  }
}

function addDiningTable(layout: PerformanceInteriorLayout, zone: Zone) {
  const width = mmToMeters(zone.w ?? 3600)
  const depth = 1.1
  const zoneRotationY = -(zone.rot ?? 0)
  addAtZoneLocal(
    layout.tableTops,
    zone,
    'dining-top',
    0,
    zoneRotationY,
    [0, 0.75, 0],
    [width, 0.07, depth],
    COLORS.dining,
  )
  ;[-1, 1].forEach((xSide, xIndex) => {
    ;[-1, 1].forEach((zSide, zIndex) => {
      addAtZoneLocal(
        layout.tableLegs,
        zone,
        'dining-leg',
        xIndex * 2 + zIndex,
        zoneRotationY,
        [xSide * (width / 2 - 0.15), 0.37, zSide * (depth / 2 - 0.15)],
        [0.1, 0.72, 0.1],
        COLORS.leg,
      )
    })
  })

  const seatsPerSide = 4
  for (let index = 0; index < seatsPerSide; index += 1) {
    const x = -width / 2 + (width / (seatsPerSide + 1)) * (index + 1)
    addChair(layout, zone, index * 2, zoneRotationY, x, depth / 2 + 0.35, Math.PI)
    addChair(layout, zone, index * 2 + 1, zoneRotationY, x, -depth / 2 - 0.35, 0)
  }
}

function addOffice(layout: PerformanceInteriorLayout, zone: Zone, insight: InsightKey) {
  const width = mmToMeters(zone.w ?? 3800)
  const depth = mmToMeters(zone.h ?? 2600)
  const zoneRotationY = -(zone.rot ?? 0)
  const screenColor = zoneColor(zone, insight)
  const wallThickness = 0.055
  const isMeetingOffice = width >= 5 && depth >= 4.5
  const northPanels = isMeetingOffice
    ? (() => {
        const openingWidth = 1.15
        const panelWidth = (width - openingWidth) / 2
        return [-1, 1].map((side, index) => ({
          role: `office-glass-north-${index}`,
          position: [side * (openingWidth / 2 + panelWidth / 2), 1.4, -depth / 2] as Vec3,
          scale: [panelWidth, 2.8, wallThickness] as Vec3,
        }))
      })()
    : [
        {
          role: 'office-glass-north',
          position: [0, 1.4, -depth / 2] as Vec3,
          scale: [width, 2.8, wallThickness] as Vec3,
        },
      ]
  ;[
    ...northPanels,
    {
      role: 'office-glass-south',
      position: [0, 1.4, depth / 2] as Vec3,
      scale: [width, 2.8, wallThickness] as Vec3,
    },
    {
      role: 'office-glass-west',
      position: [-width / 2, 1.4, 0] as Vec3,
      scale: [wallThickness, 2.8, depth] as Vec3,
    },
    {
      role: 'office-glass-east',
      position: [width / 2, 1.4, 0] as Vec3,
      scale: [wallThickness, 2.8, depth] as Vec3,
    },
  ].forEach((panel, index) => {
    addAtZoneLocal(
      layout.officeGlass,
      zone,
      panel.role,
      index,
      zoneRotationY,
      panel.position,
      panel.scale,
      COLORS.office,
    )
  })
  addAtZoneLocal(
    layout.accentPads,
    zone,
    'office-floor',
    0,
    zoneRotationY,
    [0, 0.04, 0],
    [width, 0.06, depth],
    screenColor,
  )
  if (isMeetingOffice) {
    const tableLength = Math.min(width - 1.2, 4.8)
    const tableDepth = 1.18
    addAtZoneLocal(
      layout.tableTops,
      zone,
      'office-meeting-table',
      0,
      zoneRotationY,
      [0, 0.75, 0],
      [tableLength, 0.07, tableDepth],
      COLORS.table,
    )
    ;[-1, 1].forEach((xSide, index) => {
      addAtZoneLocal(
        layout.tableLegs,
        zone,
        'office-table-pedestal',
        index,
        zoneRotationY,
        [xSide * (tableLength / 2 - 0.6), 0.37, 0],
        [0.16, 0.72, 0.5],
        COLORS.monitorStand,
      )
    })
    for (let index = 0; index < 3; index += 1) {
      const x = -tableLength / 2 + (tableLength / 4) * (index + 1)
      addChair(layout, zone, index * 2, zoneRotationY, x, tableDepth / 2 + 0.62, Math.PI)
      addChair(layout, zone, index * 2 + 1, zoneRotationY, x, -tableDepth / 2 - 0.62, 0)
    }
    addChair(layout, zone, 6, zoneRotationY, tableLength / 2 + 0.62, 0, -Math.PI / 2)
    addChair(layout, zone, 7, zoneRotationY, -tableLength / 2 - 0.62, 0, Math.PI / 2)
  } else {
    addAtZoneLocal(
      layout.tableTops,
      zone,
      'office-desk',
      0,
      zoneRotationY,
      [0, 0.74, 0.1],
      [1.6, 0.05, 0.85],
      COLORS.table,
    )
    addMonitor(layout, zone, 0, zoneRotationY, 0, 0.1, 1, screenColor)
    addChair(layout, zone, 0, zoneRotationY, 0, 0.85, Math.PI)
  }
}

function addTechnicalCeiling(layout: PerformanceInteriorLayout, doc: VmcDocument) {
  const stepMm = 2400
  const halfPanelMm = 1160
  const minX = Math.min(...doc.plate.map((point) => point.x))
  const maxX = Math.max(...doc.plate.map((point) => point.x))
  const minY = Math.min(...doc.plate.map((point) => point.y))
  const maxY = Math.max(...doc.plate.map((point) => point.y))
  const elevation = mmToMeters(doc.alturaLibre)
  let panelIndex = 0
  let lightIndex = 0

  for (let y = minY + stepMm / 2, row = 0; y <= maxY - stepMm / 2; y += stepMm, row += 1) {
    for (let x = minX + stepMm / 2, column = 0; x <= maxX - stepMm / 2; x += stepMm, column += 1) {
      const cornersInside = [
        pointInPolygon(x - halfPanelMm, y - halfPanelMm, doc.plate),
        pointInPolygon(x + halfPanelMm, y - halfPanelMm, doc.plate),
        pointInPolygon(x - halfPanelMm, y + halfPanelMm, doc.plate),
        pointInPolygon(x + halfPanelMm, y + halfPanelMm, doc.plate),
      ].filter(Boolean).length
      if (cornersInside < 3) continue

      layout.ceilingPanels.push(
        instance(
          PRESENTATION_CEILING_ID,
          'ceiling-panel',
          panelIndex,
          [mmToMeters(x), elevation - 0.055, mmToMeters(y)],
          [0, 0, 0],
          [2.32, 0.045, 2.32],
          (row + column) % 2 === 0 ? COLORS.ceiling : '#c9cac7',
        ),
      )
      panelIndex += 1

      if ((row * 3 + column) % 5 === 0) {
        layout.ceilingLights.push(
          instance(
            PRESENTATION_CEILING_ID,
            'ceiling-light',
            lightIndex,
            [mmToMeters(x), elevation - 0.082, mmToMeters(y)],
            [0, 0, 0],
            [1.18, 0.025, 0.34],
            COLORS.ceilingLight,
          ),
        )
        lightIndex += 1
      }
    }
  }
}

/**
 * Render-only adapter that preserves the source document's stable owners and
 * the detailed renderer's object centers/orientations. Dimensional truth stays
 * in integer millimetres until transforms are produced here for Three.js.
 */
export function buildPerformanceInteriorLayout(
  doc: VmcDocument,
  insight: InsightKey,
): PerformanceInteriorLayout {
  const layout = emptyLayout()
  addEnvelope(layout, doc)
  addVideoWalls(layout, doc)
  addTechnicalCeiling(layout, doc)

  doc.zonas.forEach((zone) => {
    if (zone.kind === 'bench') addBench(layout, zone, insight)
    else if (zone.kind === 'circular') addRoundTable(layout, zone)
    else if (zone.kind === 'comedor') addDiningTable(layout, zone)
    else if (zone.kind === 'oficina') addOffice(layout, zone, insight)
  })

  return layout
}

export function countPerformanceInstances(layout: PerformanceInteriorLayout) {
  return Object.values(layout).reduce((total, placements) => total + placements.length, 0)
}
