import type { ActiveScene, StableSceneStage } from './experience'

export type CinematicTransitionPhase = 'flight' | 'cover' | 'handoff' | 'reveal'
export type CinematicCoordinateFrame = 'exterior-origin' | 'interior-origin'

export type CinematicRouteId =
  | 'cinematic-exterior-floor16-v1'
  | 'cinematic-floor16-exterior-v1'
  | 'cinematic-floor16-interior-v1'
  | 'cinematic-interior-floor16-v1'
  | 'cinematic-interior-exterior-v1'
  | 'cinematic-exterior-interior-v1'

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
  /** Normalized timeline point at which the destination render tree takes ownership. */
  readonly handoffProgress: number
  readonly waypoints: readonly CinematicWaypointSpec[]
}

export const CINEMATIC_PHASE_LABELS: Record<CinematicTransitionPhase, string> = {
  flight: 'Aproximación al piso 16',
  cover: 'Alineación con el acceso',
  handoff: 'Cruce del umbral',
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

const ROUTES: readonly CinematicRouteSpec[] = [
  {
    id: 'cinematic-exterior-floor16-v1',
    status: 'demo-unverified',
    from: 'exterior',
    to: 'floor16',
    fromActiveScene: 'exterior',
    toActiveScene: 'exterior',
    durationMs: 5_600,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.9,
    waypoints: [
      {
        id: 'exterior-floor16-departure',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -150_400, y: 220_000, elevation: 78_400 },
        lookAtMm: { x: 0, y: 0, elevation: 17_000 },
        fovDeg: 45,
      },
      {
        id: 'exterior-floor16-orbit',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.28,
        phase: 'flight',
        positionMm: { x: -132_000, y: 190_000, elevation: 67_000 },
        lookAtMm: { x: -5_000, y: 10_000, elevation: 26_000 },
        fovDeg: 47,
      },
      {
        id: 'exterior-floor16-descent',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.58,
        phase: 'flight',
        positionMm: { x: -105_000, y: 155_000, elevation: 42_000 },
        lookAtMm: { x: -16_000, y: 20_000, elevation: 14_000 },
        fovDeg: 48,
      },
      {
        id: 'exterior-floor16-alignment',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.78,
        phase: 'cover',
        positionMm: { x: -95_000, y: 135_000, elevation: 22_000 },
        lookAtMm: { x: -28_000, y: 31_000, elevation: 6_000 },
        fovDeg: 43,
      },
      {
        id: 'exterior-floor16-handoff',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.9,
        phase: 'handoff',
        positionMm: { x: -112_800, y: 141_600, elevation: 12_000 },
        lookAtMm: { x: -36_000, y: 36_000, elevation: 1_400 },
        fovDeg: 40,
      },
      {
        id: 'exterior-floor16-reveal',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -112_800, y: 141_600, elevation: 12_000 },
        lookAtMm: { x: -36_000, y: 36_000, elevation: 1_400 },
        fovDeg: 40,
      },
    ],
  },
  {
    id: 'cinematic-floor16-exterior-v1',
    status: 'demo-unverified',
    from: 'floor16',
    to: 'exterior',
    fromActiveScene: 'exterior',
    toActiveScene: 'exterior',
    durationMs: 2_800,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.78,
    waypoints: [
      {
        id: 'floor16-exterior-departure',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -112_800, y: 141_600, elevation: 12_000 },
        lookAtMm: { x: -36_000, y: 36_000, elevation: 1_400 },
        fovDeg: 40,
      },
      {
        id: 'floor16-exterior-cover',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.5,
        phase: 'cover',
        positionMm: { x: -126_000, y: 177_000, elevation: 46_000 },
        lookAtMm: { x: -12_000, y: 12_000, elevation: 20_000 },
        fovDeg: 46,
      },
      {
        id: 'floor16-exterior-handoff',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.78,
        phase: 'handoff',
        positionMm: { x: -148_000, y: 214_000, elevation: 72_000 },
        lookAtMm: { x: 0, y: 0, elevation: 17_000 },
        fovDeg: 45,
      },
      {
        id: 'floor16-exterior-reveal',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -150_400, y: 220_000, elevation: 78_400 },
        lookAtMm: { x: 0, y: 0, elevation: 17_000 },
        fovDeg: 45,
      },
    ],
  },
  {
    id: 'cinematic-floor16-interior-v1',
    status: 'demo-unverified',
    from: 'floor16',
    to: 'interior',
    fromActiveScene: 'exterior',
    toActiveScene: 'interior',
    durationMs: 1_800,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.5,
    waypoints: [
      {
        id: 'floor16-interior-departure',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -112_800, y: 141_600, elevation: 12_000 },
        lookAtMm: { x: -36_000, y: 36_000, elevation: 1_400 },
        fovDeg: 40,
      },
      {
        id: 'floor16-interior-cover',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.46,
        phase: 'cover',
        positionMm: { x: -42_000, y: 47_000, elevation: 2_500 },
        lookAtMm: { x: -36_000, y: 36_000, elevation: 1_400 },
        fovDeg: 44,
      },
      {
        id: 'floor16-interior-handoff',
        frame: 'interior-origin',
        scene: 'interior',
        progress: 0.5,
        phase: 'handoff',
        positionMm: { x: -7_500, y: 10_500, elevation: 2_400 },
        lookAtMm: { x: 0, y: 0, elevation: 1_400 },
        fovDeg: 45,
      },
      {
        id: 'floor16-interior-reveal',
        frame: 'interior-origin',
        scene: 'interior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -5_500, y: 8_500, elevation: 2_350 },
        lookAtMm: { x: 5_500, y: 0, elevation: 1_300 },
        fovDeg: 45,
      },
    ],
  },
  {
    id: 'cinematic-interior-floor16-v1',
    status: 'demo-unverified',
    from: 'interior',
    to: 'floor16',
    fromActiveScene: 'interior',
    toActiveScene: 'exterior',
    durationMs: 1_800,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.5,
    waypoints: [
      {
        id: 'interior-floor16-departure',
        frame: 'interior-origin',
        scene: 'interior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -5_500, y: 8_500, elevation: 2_350 },
        lookAtMm: { x: 5_500, y: 0, elevation: 1_300 },
        fovDeg: 45,
      },
      {
        id: 'interior-floor16-cover',
        frame: 'interior-origin',
        scene: 'interior',
        progress: 0.46,
        phase: 'cover',
        positionMm: { x: -7_500, y: 10_500, elevation: 2_400 },
        lookAtMm: { x: 0, y: 0, elevation: 1_400 },
        fovDeg: 45,
      },
      {
        id: 'interior-floor16-handoff',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.5,
        phase: 'handoff',
        positionMm: { x: -42_000, y: 47_000, elevation: 2_500 },
        lookAtMm: { x: -36_000, y: 36_000, elevation: 1_400 },
        fovDeg: 44,
      },
      {
        id: 'interior-floor16-reveal',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -112_800, y: 141_600, elevation: 12_000 },
        lookAtMm: { x: -36_000, y: 36_000, elevation: 1_400 },
        fovDeg: 40,
      },
    ],
  },
  {
    id: 'cinematic-interior-exterior-v1',
    status: 'demo-unverified',
    from: 'interior',
    to: 'exterior',
    fromActiveScene: 'interior',
    toActiveScene: 'exterior',
    durationMs: 2_500,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.34,
    waypoints: [
      {
        id: 'interior-exterior-departure',
        frame: 'interior-origin',
        scene: 'interior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -5_500, y: 8_500, elevation: 2_350 },
        lookAtMm: { x: 5_500, y: 0, elevation: 1_300 },
        fovDeg: 45,
      },
      {
        id: 'interior-exterior-cover',
        frame: 'interior-origin',
        scene: 'interior',
        progress: 0.3,
        phase: 'cover',
        positionMm: { x: -7_500, y: 10_500, elevation: 2_400 },
        lookAtMm: { x: 0, y: 0, elevation: 1_400 },
        fovDeg: 45,
      },
      {
        id: 'interior-exterior-handoff',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.34,
        phase: 'handoff',
        positionMm: { x: -112_800, y: 141_600, elevation: 12_000 },
        lookAtMm: { x: -36_000, y: 36_000, elevation: 1_400 },
        fovDeg: 40,
      },
      {
        id: 'interior-exterior-reveal',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -150_400, y: 220_000, elevation: 78_400 },
        lookAtMm: { x: 0, y: 0, elevation: 17_000 },
        fovDeg: 45,
      },
    ],
  },
  {
    id: 'cinematic-exterior-interior-v1',
    status: 'demo-unverified',
    from: 'exterior',
    to: 'interior',
    fromActiveScene: 'exterior',
    toActiveScene: 'interior',
    durationMs: 6_400,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.88,
    waypoints: [
      {
        id: 'exterior-interior-departure',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -150_400, y: 220_000, elevation: 78_400 },
        lookAtMm: { x: 0, y: 0, elevation: 17_000 },
        fovDeg: 45,
      },
      {
        id: 'exterior-interior-orbit',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.42,
        phase: 'flight',
        positionMm: { x: -105_000, y: 155_000, elevation: 42_000 },
        lookAtMm: { x: -16_000, y: 20_000, elevation: 14_000 },
        fovDeg: 48,
      },
      {
        id: 'exterior-interior-cover',
        frame: 'exterior-origin',
        scene: 'exterior',
        progress: 0.84,
        phase: 'cover',
        positionMm: { x: -42_000, y: 47_000, elevation: 2_500 },
        lookAtMm: { x: -36_000, y: 36_000, elevation: 1_400 },
        fovDeg: 44,
      },
      {
        id: 'exterior-interior-handoff',
        frame: 'interior-origin',
        scene: 'interior',
        progress: 0.88,
        phase: 'handoff',
        positionMm: { x: -7_500, y: 10_500, elevation: 2_400 },
        lookAtMm: { x: 0, y: 0, elevation: 1_400 },
        fovDeg: 45,
      },
      {
        id: 'exterior-interior-reveal',
        frame: 'interior-origin',
        scene: 'interior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -5_500, y: 8_500, elevation: 2_350 },
        lookAtMm: { x: 5_500, y: 0, elevation: 1_300 },
        fovDeg: 45,
      },
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
    if (!Number.isInteger(point[key]))
      errors.push(`${path}.${key} must be an integer millimeter value`)
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

    const expectedFrame: CinematicCoordinateFrame = `${waypoint.scene}-origin`
    if (waypoint.frame !== expectedFrame) {
      errors.push(`${path}.frame must match its active scene`)
    }
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
