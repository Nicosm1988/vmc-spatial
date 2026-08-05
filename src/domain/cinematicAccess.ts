import type { ActiveScene, StableSceneStage } from './experience'

export type CinematicTransitionPhase = 'flight' | 'cover' | 'handoff' | 'reveal'

/** Camera geometry lives in the same world as both the tower and floor 16. */
export type CinematicCoordinateFrame = 'shared-world'

export type CinematicRouteId =
  | 'cinematic-exterior-floor16-v3'
  | 'cinematic-floor16-exterior-v3'
  | 'cinematic-floor16-interior-v3'
  | 'cinematic-interior-floor16-v3'
  | 'cinematic-interior-exterior-v3'
  | 'cinematic-exterior-interior-v3'

export interface CinematicPoint3Mm {
  readonly x: number
  readonly y: number
  readonly elevation: number
}

export interface CinematicWaypointSpec {
  readonly id: string
  readonly frame: CinematicCoordinateFrame
  readonly scene: ActiveScene
  /** Normalized position in the route timeline. */
  readonly progress: number
  readonly phase: CinematicTransitionPhase
  readonly positionMm: CinematicPoint3Mm
  readonly lookAtMm: CinematicPoint3Mm
  readonly fovDeg: number
}

export interface CinematicRouteSpec {
  readonly id: CinematicRouteId
  readonly status: 'demo-unverified'
  readonly from: StableSceneStage
  readonly to: StableSceneStage
  readonly fromActiveScene: ActiveScene
  readonly toActiveScene: ActiveScene
  readonly durationMs: number
  readonly reducedMotionDurationMs: number
  /** Timeline point at which the destination experience state takes ownership. */
  readonly handoffProgress: number
  readonly waypoints: readonly CinematicWaypointSpec[]
}

export const CINEMATIC_PHASE_LABELS: Record<CinematicTransitionPhase, string> = {
  flight: 'Vuelo continuo al piso 16',
  cover: 'Aproximación a la fachada',
  handoff: 'Continuidad espacial',
  reveal: 'Llegada a la escena',
}

const PHASE_ORDER: readonly CinematicTransitionPhase[] = ['flight', 'cover', 'handoff', 'reveal']

function deepFreeze<T>(value: T): Readonly<T> {
  if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
    Object.freeze(value)
    for (const child of Object.values(value)) deepFreeze(child)
  }
  return value
}

type SharedPose = Pick<CinematicWaypointSpec, 'positionMm' | 'lookAtMm' | 'fovDeg'>

/**
 * Offsets are integer millimeters from the shared tower/floor center. The last
 * five poses follow the core's east door, so the camera crosses the opening
 * instead of entering through a facade window.
 */
const POSES = {
  exterior: {
    positionMm: { x: -150_400, y: 220_000, elevation: 78_400 },
    lookAtMm: { x: 0, y: 0, elevation: 17_000 },
    fovDeg: 45,
  },
  orbit: {
    positionMm: { x: -132_000, y: 190_000, elevation: 67_000 },
    lookAtMm: { x: -5_000, y: 10_000, elevation: 26_000 },
    fovDeg: 47,
  },
  descent: {
    positionMm: { x: -105_000, y: 155_000, elevation: 42_000 },
    lookAtMm: { x: -16_000, y: 20_000, elevation: 14_000 },
    fovDeg: 48,
  },
  westFacade: {
    positionMm: { x: -21_920, y: 21_920, elevation: 12_500 },
    lookAtMm: { x: -4_243, y: 4_243, elevation: 2_000 },
    fovDeg: 44,
  },
  coreAlignment: {
    positionMm: { x: -707, y: 707, elevation: 2_250 },
    lookAtMm: { x: 9_899, y: -9_899, elevation: 1_650 },
    fovDeg: 49,
  },
  floor16: {
    positionMm: { x: 4_950, y: -4_950, elevation: 1_700 },
    lookAtMm: { x: 12_728, y: -12_728, elevation: 1_550 },
    fovDeg: 52,
  },
  doorApproach: {
    positionMm: { x: 5_657, y: -5_657, elevation: 1_700 },
    lookAtMm: { x: 12_728, y: -12_728, elevation: 1_550 },
    fovDeg: 52,
  },
  doorThreshold: {
    positionMm: { x: 7_920, y: -7_920, elevation: 1_700 },
    lookAtMm: { x: 12_728, y: -12_728, elevation: 1_550 },
    fovDeg: 53,
  },
  room: {
    positionMm: { x: 9_546, y: -9_546, elevation: 1_680 },
    lookAtMm: { x: 13_789, y: -13_789, elevation: 1_550 },
    fovDeg: 54,
  },
  interior: {
    positionMm: { x: 10_253, y: -10_253, elevation: 1_650 },
    lookAtMm: { x: 13_789, y: -13_789, elevation: 1_550 },
    fovDeg: 55,
  },
} as const satisfies Record<string, SharedPose>

function waypoint(
  id: string,
  scene: ActiveScene,
  progress: number,
  phase: CinematicTransitionPhase,
  pose: SharedPose,
): CinematicWaypointSpec {
  return { id, frame: 'shared-world', scene, progress, phase, ...pose }
}

const ROUTES: readonly CinematicRouteSpec[] = [
  {
    id: 'cinematic-exterior-floor16-v3',
    status: 'demo-unverified',
    from: 'exterior',
    to: 'floor16',
    fromActiveScene: 'exterior',
    toActiveScene: 'exterior',
    durationMs: 6_800,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.84,
    waypoints: [
      waypoint('v3-exterior-floor16-departure', 'exterior', 0, 'flight', POSES.exterior),
      waypoint('v3-exterior-floor16-orbit', 'exterior', 0.23, 'flight', POSES.orbit),
      waypoint('v3-exterior-floor16-descent', 'exterior', 0.44, 'flight', POSES.descent),
      waypoint('v3-exterior-floor16-facade', 'exterior', 0.66, 'cover', POSES.westFacade),
      waypoint('v3-exterior-floor16-alignment', 'exterior', 0.84, 'handoff', POSES.coreAlignment),
      waypoint('v3-exterior-floor16-reveal', 'exterior', 1, 'reveal', POSES.floor16),
    ],
  },
  {
    id: 'cinematic-floor16-exterior-v3',
    status: 'demo-unverified',
    from: 'floor16',
    to: 'exterior',
    fromActiveScene: 'exterior',
    toActiveScene: 'exterior',
    durationMs: 4_200,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.42,
    waypoints: [
      waypoint('v3-floor16-exterior-departure', 'exterior', 0, 'flight', POSES.floor16),
      waypoint('v3-floor16-exterior-alignment', 'exterior', 0.2, 'cover', POSES.coreAlignment),
      waypoint('v3-floor16-exterior-facade', 'exterior', 0.42, 'handoff', POSES.westFacade),
      waypoint('v3-floor16-exterior-descent', 'exterior', 0.62, 'reveal', POSES.descent),
      waypoint('v3-floor16-exterior-orbit', 'exterior', 0.81, 'reveal', POSES.orbit),
      waypoint('v3-floor16-exterior-reveal', 'exterior', 1, 'reveal', POSES.exterior),
    ],
  },
  {
    id: 'cinematic-floor16-interior-v3',
    status: 'demo-unverified',
    from: 'floor16',
    to: 'interior',
    fromActiveScene: 'exterior',
    toActiveScene: 'interior',
    durationMs: 2_800,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.5,
    waypoints: [
      waypoint('v3-floor16-interior-departure', 'exterior', 0, 'flight', POSES.floor16),
      waypoint('v3-floor16-interior-approach', 'exterior', 0.26, 'cover', POSES.doorApproach),
      waypoint('v3-floor16-interior-threshold', 'interior', 0.5, 'handoff', POSES.doorThreshold),
      waypoint('v3-floor16-interior-room', 'interior', 0.76, 'reveal', POSES.room),
      waypoint('v3-floor16-interior-reveal', 'interior', 1, 'reveal', POSES.interior),
    ],
  },
  {
    id: 'cinematic-interior-floor16-v3',
    status: 'demo-unverified',
    from: 'interior',
    to: 'floor16',
    fromActiveScene: 'interior',
    toActiveScene: 'exterior',
    durationMs: 3_200,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.5,
    waypoints: [
      waypoint('v3-interior-floor16-departure', 'interior', 0, 'flight', POSES.interior),
      waypoint('v3-interior-floor16-room', 'interior', 0.24, 'cover', POSES.room),
      waypoint('v3-interior-floor16-threshold', 'exterior', 0.5, 'handoff', POSES.doorThreshold),
      waypoint('v3-interior-floor16-approach', 'exterior', 0.74, 'reveal', POSES.doorApproach),
      waypoint('v3-interior-floor16-reveal', 'exterior', 1, 'reveal', POSES.floor16),
    ],
  },
  {
    id: 'cinematic-interior-exterior-v3',
    status: 'demo-unverified',
    from: 'interior',
    to: 'exterior',
    fromActiveScene: 'interior',
    toActiveScene: 'exterior',
    durationMs: 7_200,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.18,
    waypoints: [
      waypoint('v3-interior-exterior-departure', 'interior', 0, 'flight', POSES.interior),
      waypoint('v3-interior-exterior-room', 'interior', 0.09, 'cover', POSES.room),
      waypoint('v3-interior-exterior-threshold', 'exterior', 0.18, 'handoff', POSES.doorThreshold),
      waypoint('v3-interior-exterior-floor16', 'exterior', 0.28, 'reveal', POSES.floor16),
      waypoint('v3-interior-exterior-alignment', 'exterior', 0.42, 'reveal', POSES.coreAlignment),
      waypoint('v3-interior-exterior-facade', 'exterior', 0.56, 'reveal', POSES.westFacade),
      waypoint('v3-interior-exterior-descent', 'exterior', 0.7, 'reveal', POSES.descent),
      waypoint('v3-interior-exterior-orbit', 'exterior', 0.85, 'reveal', POSES.orbit),
      waypoint('v3-interior-exterior-reveal', 'exterior', 1, 'reveal', POSES.exterior),
    ],
  },
  {
    id: 'cinematic-exterior-interior-v3',
    status: 'demo-unverified',
    from: 'exterior',
    to: 'interior',
    fromActiveScene: 'exterior',
    toActiveScene: 'interior',
    durationMs: 9_200,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.82,
    waypoints: [
      waypoint('v3-exterior-interior-departure', 'exterior', 0, 'flight', POSES.exterior),
      waypoint('v3-exterior-interior-orbit', 'exterior', 0.15, 'flight', POSES.orbit),
      waypoint('v3-exterior-interior-descent', 'exterior', 0.3, 'flight', POSES.descent),
      waypoint('v3-exterior-interior-facade', 'exterior', 0.48, 'flight', POSES.westFacade),
      waypoint('v3-exterior-interior-alignment', 'exterior', 0.63, 'flight', POSES.coreAlignment),
      waypoint('v3-exterior-interior-floor16', 'exterior', 0.7, 'cover', POSES.floor16),
      waypoint('v3-exterior-interior-approach', 'exterior', 0.76, 'cover', POSES.doorApproach),
      waypoint('v3-exterior-interior-threshold', 'interior', 0.82, 'handoff', POSES.doorThreshold),
      waypoint('v3-exterior-interior-room', 'interior', 0.91, 'reveal', POSES.room),
      waypoint('v3-exterior-interior-reveal', 'interior', 1, 'reveal', POSES.interior),
    ],
  },
]

export const CINEMATIC_ACCESS_ROUTES: readonly CinematicRouteSpec[] = deepFreeze(ROUTES)

const ROUTE_BY_PAIR = new Map(
  CINEMATIC_ACCESS_ROUTES.map((route) => [`${route.from}:${route.to}`, route] as const),
)

export function getCinematicRoute(
  from: StableSceneStage,
  to: StableSceneStage,
): CinematicRouteSpec | null {
  if (from === to) return null
  return ROUTE_BY_PAIR.get(`${from}:${to}`) ?? null
}

function addPointErrors(errors: string[], point: CinematicPoint3Mm, path: string) {
  for (const key of ['x', 'y', 'elevation'] as const) {
    if (!Number.isInteger(point[key])) {
      errors.push(`${path}.${key} must be an integer millimeter value`)
    }
  }
}

export function validateCinematicRoute(route: CinematicRouteSpec): string[] {
  const errors: string[] = []
  const waypointIds = new Set<string>()

  if (!route.id.trim()) errors.push('id must not be empty')
  if (route.status !== 'demo-unverified') errors.push('status must be demo-unverified')
  if (route.from === route.to) errors.push('from and to must be different stable stages')
  if (!Number.isInteger(route.durationMs) || route.durationMs <= 0) {
    errors.push('durationMs must be a positive integer')
  }
  if (!Number.isInteger(route.reducedMotionDurationMs) || route.reducedMotionDurationMs < 0) {
    errors.push('reducedMotionDurationMs must be a non-negative integer')
  }
  if (
    !Number.isFinite(route.handoffProgress) ||
    route.handoffProgress < 0 ||
    route.handoffProgress > 1
  ) {
    errors.push('handoffProgress must be between 0 and 1')
  }
  if (route.waypoints.length < 2) errors.push('waypoints must contain at least two entries')

  let previousProgress = -1
  let previousPhaseIndex = -1
  let hasHandoffWaypoint = false
  route.waypoints.forEach((waypoint, index) => {
    const path = `waypoints[${index}]`
    if (!waypoint.id.trim()) errors.push(`${path}.id must not be empty`)
    if (waypointIds.has(waypoint.id)) errors.push(`${path}.id duplicates "${waypoint.id}"`)
    waypointIds.add(waypoint.id)

    if (!Number.isFinite(waypoint.progress) || waypoint.progress < 0 || waypoint.progress > 1) {
      errors.push(`${path}.progress must be between 0 and 1`)
    } else if (waypoint.progress <= previousProgress) {
      errors.push(`${path}.progress must be strictly increasing`)
    }
    previousProgress = waypoint.progress

    const phaseIndex = PHASE_ORDER.indexOf(waypoint.phase)
    if (phaseIndex < previousPhaseIndex) errors.push(`${path}.phase must not move backwards`)
    previousPhaseIndex = phaseIndex
    if (waypoint.phase === 'handoff' && waypoint.progress === route.handoffProgress) {
      hasHandoffWaypoint = true
    }

    if (waypoint.frame !== 'shared-world') errors.push(`${path}.frame must be shared-world`)
    if (waypoint.progress < route.handoffProgress && waypoint.scene !== route.fromActiveScene) {
      errors.push(`${path}.scene must remain on fromActiveScene before handoff`)
    }
    if (waypoint.progress >= route.handoffProgress && waypoint.scene !== route.toActiveScene) {
      errors.push(`${path}.scene must use toActiveScene from handoff onward`)
    }
    addPointErrors(errors, waypoint.positionMm, `${path}.positionMm`)
    addPointErrors(errors, waypoint.lookAtMm, `${path}.lookAtMm`)
    if (!Number.isFinite(waypoint.fovDeg) || waypoint.fovDeg <= 0 || waypoint.fovDeg >= 180) {
      errors.push(`${path}.fovDeg must be between 0 and 180 degrees`)
    }
  })

  if (route.waypoints[0]?.progress !== 0) errors.push('first waypoint progress must be 0')
  if (route.waypoints.at(-1)?.progress !== 1) errors.push('last waypoint progress must be 1')
  if (!hasHandoffWaypoint) errors.push('waypoints must mark handoffProgress with a handoff phase')

  return errors
}

export function validateCinematicAccessRoutes(
  routes: readonly CinematicRouteSpec[] = CINEMATIC_ACCESS_ROUTES,
): string[] {
  const errors: string[] = []
  const routeIds = new Set<string>()
  const routePairs = new Set<string>()
  const waypointIds = new Set<string>()

  routes.forEach((route, routeIndex) => {
    if (routeIds.has(route.id)) errors.push(`routes[${routeIndex}].id duplicates "${route.id}"`)
    routeIds.add(route.id)

    const pair = `${route.from}:${route.to}`
    if (routePairs.has(pair)) errors.push(`routes[${routeIndex}] duplicates pair "${pair}"`)
    routePairs.add(pair)

    for (const waypoint of route.waypoints) {
      if (waypointIds.has(waypoint.id)) {
        errors.push(`routes[${routeIndex}] duplicates waypoint id "${waypoint.id}"`)
      }
      waypointIds.add(waypoint.id)
    }

    for (const error of validateCinematicRoute(route)) {
      errors.push(`routes[${routeIndex}].${error}`)
    }
  })

  return errors
}
