import type { ActiveScene, StableSceneStage } from './experience'

export type CinematicTransitionPhase = 'flight' | 'cover' | 'handoff' | 'reveal'
/**
 * Camera geometry lives in one shared world frame. Scene ownership may change
 * at handoff, but position and look target never change coordinate systems.
 */
export type CinematicCoordinateFrame = 'shared-world'

export type CinematicRouteId =
  | 'cinematic-exterior-floor16-v2'
  | 'cinematic-floor16-exterior-v2'
  | 'cinematic-floor16-interior-v2'
  | 'cinematic-interior-floor16-v2'
  | 'cinematic-interior-exterior-v2'
  | 'cinematic-exterior-interior-v2'

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
  flight: 'Vuelo continuo al piso 16',
  cover: 'Aproximación a la fachada',
  handoff: 'Continuidad entre escenas',
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
    id: 'cinematic-exterior-floor16-v2',
    status: 'demo-unverified',
    from: 'exterior',
    to: 'floor16',
    fromActiveScene: 'exterior',
    toActiveScene: 'exterior',
    durationMs: 5_600,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.86,
    waypoints: [
      {
        id: 'v2-exterior-floor16-departure',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -150_400, y: 220_000, elevation: 78_400 },
        lookAtMm: { x: 0, y: 0, elevation: 17_000 },
        fovDeg: 45,
      },
      {
        id: 'v2-exterior-floor16-orbit',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.24,
        phase: 'flight',
        positionMm: { x: -132_000, y: 190_000, elevation: 67_000 },
        lookAtMm: { x: -5_000, y: 10_000, elevation: 26_000 },
        fovDeg: 47,
      },
      {
        id: 'v2-exterior-floor16-descent',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.48,
        phase: 'flight',
        positionMm: { x: -105_000, y: 155_000, elevation: 42_000 },
        lookAtMm: { x: -16_000, y: 20_000, elevation: 14_000 },
        fovDeg: 48,
      },
      {
        id: 'v2-exterior-floor16-alignment',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.7,
        phase: 'cover',
        positionMm: { x: -62_000, y: 105_000, elevation: 26_000 },
        lookAtMm: { x: -18_000, y: 36_000, elevation: 9_000 },
        fovDeg: 44,
      },
      {
        id: 'v2-exterior-floor16-near-facade',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.86,
        phase: 'handoff',
        positionMm: { x: -30_000, y: 50_000, elevation: 12_500 },
        lookAtMm: { x: -15_000, y: 20_000, elevation: 3_200 },
        fovDeg: 41,
      },
      {
        id: 'v2-exterior-floor16-observation',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -18_000, y: 30_000, elevation: 6_000 },
        lookAtMm: { x: -14_000, y: 14_500, elevation: 1_400 },
        fovDeg: 42,
      },
    ],
  },
  {
    id: 'cinematic-floor16-exterior-v2',
    status: 'demo-unverified',
    from: 'floor16',
    to: 'exterior',
    fromActiveScene: 'exterior',
    toActiveScene: 'exterior',
    durationMs: 2_800,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.52,
    waypoints: [
      {
        id: 'v2-floor16-exterior-departure',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -18_000, y: 30_000, elevation: 6_000 },
        lookAtMm: { x: -14_000, y: 14_500, elevation: 1_400 },
        fovDeg: 42,
      },
      {
        id: 'v2-floor16-exterior-near-facade',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.14,
        phase: 'flight',
        positionMm: { x: -30_000, y: 50_000, elevation: 12_500 },
        lookAtMm: { x: -15_000, y: 20_000, elevation: 3_200 },
        fovDeg: 41,
      },
      {
        id: 'v2-floor16-exterior-alignment',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.3,
        phase: 'cover',
        positionMm: { x: -62_000, y: 105_000, elevation: 26_000 },
        lookAtMm: { x: -18_000, y: 36_000, elevation: 9_000 },
        fovDeg: 44,
      },
      {
        id: 'v2-floor16-exterior-handoff',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.52,
        phase: 'handoff',
        positionMm: { x: -105_000, y: 155_000, elevation: 42_000 },
        lookAtMm: { x: -16_000, y: 20_000, elevation: 14_000 },
        fovDeg: 48,
      },
      {
        id: 'v2-floor16-exterior-orbit',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.76,
        phase: 'reveal',
        positionMm: { x: -132_000, y: 190_000, elevation: 67_000 },
        lookAtMm: { x: -5_000, y: 10_000, elevation: 26_000 },
        fovDeg: 47,
      },
      {
        id: 'v2-floor16-exterior-reveal',
        frame: 'shared-world',
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
    id: 'cinematic-floor16-interior-v2',
    status: 'demo-unverified',
    from: 'floor16',
    to: 'interior',
    fromActiveScene: 'exterior',
    toActiveScene: 'interior',
    durationMs: 3_400,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.44,
    waypoints: [
      {
        id: 'v2-floor16-interior-departure',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -18_000, y: 30_000, elevation: 6_000 },
        lookAtMm: { x: -14_000, y: 14_500, elevation: 1_400 },
        fovDeg: 42,
      },
      {
        id: 'v2-floor16-interior-approach',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.25,
        phase: 'cover',
        positionMm: { x: -16_000, y: 18_000, elevation: 3_500 },
        lookAtMm: { x: -10_000, y: 7_000, elevation: 1_400 },
        fovDeg: 43,
      },
      {
        id: 'v2-floor16-interior-handoff',
        frame: 'shared-world',
        scene: 'interior',
        progress: 0.44,
        phase: 'handoff',
        positionMm: { x: -14_000, y: 14_200, elevation: 2_400 },
        lookAtMm: { x: -17_000, y: 3_000, elevation: 1_200 },
        fovDeg: 44,
      },
      {
        id: 'v2-floor16-interior-inside',
        frame: 'shared-world',
        scene: 'interior',
        progress: 0.7,
        phase: 'reveal',
        positionMm: { x: -15_000, y: 12_000, elevation: 1_900 },
        lookAtMm: { x: -11_000, y: 2_000, elevation: 1_300 },
        fovDeg: 48,
      },
      {
        id: 'v2-floor16-interior-reveal',
        frame: 'shared-world',
        scene: 'interior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -17_000, y: 12_000, elevation: 1_700 },
        lookAtMm: { x: -4_000, y: 1_000, elevation: 1_450 },
        fovDeg: 52,
      },
    ],
  },
  {
    id: 'cinematic-interior-floor16-v2',
    status: 'demo-unverified',
    from: 'interior',
    to: 'floor16',
    fromActiveScene: 'interior',
    toActiveScene: 'exterior',
    durationMs: 3_400,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.56,
    waypoints: [
      {
        id: 'v2-interior-floor16-departure',
        frame: 'shared-world',
        scene: 'interior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -17_000, y: 12_000, elevation: 1_700 },
        lookAtMm: { x: -4_000, y: 1_000, elevation: 1_450 },
        fovDeg: 52,
      },
      {
        id: 'v2-interior-floor16-inside',
        frame: 'shared-world',
        scene: 'interior',
        progress: 0.3,
        phase: 'cover',
        positionMm: { x: -15_000, y: 12_000, elevation: 1_900 },
        lookAtMm: { x: -11_000, y: 2_000, elevation: 1_300 },
        fovDeg: 48,
      },
      {
        id: 'v2-interior-floor16-handoff',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.56,
        phase: 'handoff',
        positionMm: { x: -14_000, y: 14_200, elevation: 2_400 },
        lookAtMm: { x: -17_000, y: 3_000, elevation: 1_200 },
        fovDeg: 44,
      },
      {
        id: 'v2-interior-floor16-approach',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.75,
        phase: 'reveal',
        positionMm: { x: -16_000, y: 18_000, elevation: 3_500 },
        lookAtMm: { x: -10_000, y: 7_000, elevation: 1_400 },
        fovDeg: 43,
      },
      {
        id: 'v2-interior-floor16-reveal',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -18_000, y: 30_000, elevation: 6_000 },
        lookAtMm: { x: -14_000, y: 14_500, elevation: 1_400 },
        fovDeg: 42,
      },
    ],
  },
  {
    id: 'cinematic-interior-exterior-v2',
    status: 'demo-unverified',
    from: 'interior',
    to: 'exterior',
    fromActiveScene: 'interior',
    toActiveScene: 'exterior',
    durationMs: 6_200,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.15,
    waypoints: [
      {
        id: 'v2-interior-exterior-departure',
        frame: 'shared-world',
        scene: 'interior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -17_000, y: 12_000, elevation: 1_700 },
        lookAtMm: { x: -4_000, y: 1_000, elevation: 1_450 },
        fovDeg: 52,
      },
      {
        id: 'v2-interior-exterior-inside',
        frame: 'shared-world',
        scene: 'interior',
        progress: 0.07,
        phase: 'cover',
        positionMm: { x: -15_000, y: 12_000, elevation: 1_900 },
        lookAtMm: { x: -11_000, y: 2_000, elevation: 1_300 },
        fovDeg: 48,
      },
      {
        id: 'v2-interior-exterior-handoff',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.15,
        phase: 'handoff',
        positionMm: { x: -14_000, y: 14_200, elevation: 2_400 },
        lookAtMm: { x: -17_000, y: 3_000, elevation: 1_200 },
        fovDeg: 44,
      },
      {
        id: 'v2-interior-exterior-approach',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.21,
        phase: 'reveal',
        positionMm: { x: -16_000, y: 18_000, elevation: 3_500 },
        lookAtMm: { x: -10_000, y: 7_000, elevation: 1_400 },
        fovDeg: 43,
      },
      {
        id: 'v2-interior-exterior-floor16',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.28,
        phase: 'reveal',
        positionMm: { x: -18_000, y: 30_000, elevation: 6_000 },
        lookAtMm: { x: -14_000, y: 14_500, elevation: 1_400 },
        fovDeg: 42,
      },
      {
        id: 'v2-interior-exterior-near-facade',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.38,
        phase: 'reveal',
        positionMm: { x: -30_000, y: 50_000, elevation: 12_500 },
        lookAtMm: { x: -15_000, y: 20_000, elevation: 3_200 },
        fovDeg: 41,
      },
      {
        id: 'v2-interior-exterior-alignment',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.52,
        phase: 'reveal',
        positionMm: { x: -62_000, y: 105_000, elevation: 26_000 },
        lookAtMm: { x: -18_000, y: 36_000, elevation: 9_000 },
        fovDeg: 44,
      },
      {
        id: 'v2-interior-exterior-descent',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.67,
        phase: 'reveal',
        positionMm: { x: -105_000, y: 155_000, elevation: 42_000 },
        lookAtMm: { x: -16_000, y: 20_000, elevation: 14_000 },
        fovDeg: 48,
      },
      {
        id: 'v2-interior-exterior-orbit',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.84,
        phase: 'reveal',
        positionMm: { x: -132_000, y: 190_000, elevation: 67_000 },
        lookAtMm: { x: -5_000, y: 10_000, elevation: 26_000 },
        fovDeg: 47,
      },
      {
        id: 'v2-interior-exterior-reveal',
        frame: 'shared-world',
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
    id: 'cinematic-exterior-interior-v2',
    status: 'demo-unverified',
    from: 'exterior',
    to: 'interior',
    fromActiveScene: 'exterior',
    toActiveScene: 'interior',
    durationMs: 8_400,
    reducedMotionDurationMs: 120,
    handoffProgress: 0.85,
    waypoints: [
      {
        id: 'v2-exterior-interior-departure',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0,
        phase: 'flight',
        positionMm: { x: -150_400, y: 220_000, elevation: 78_400 },
        lookAtMm: { x: 0, y: 0, elevation: 17_000 },
        fovDeg: 45,
      },
      {
        id: 'v2-exterior-interior-orbit',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.16,
        phase: 'flight',
        positionMm: { x: -132_000, y: 190_000, elevation: 67_000 },
        lookAtMm: { x: -5_000, y: 10_000, elevation: 26_000 },
        fovDeg: 47,
      },
      {
        id: 'v2-exterior-interior-descent',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.33,
        phase: 'flight',
        positionMm: { x: -105_000, y: 155_000, elevation: 42_000 },
        lookAtMm: { x: -16_000, y: 20_000, elevation: 14_000 },
        fovDeg: 48,
      },
      {
        id: 'v2-exterior-interior-alignment',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.48,
        phase: 'flight',
        positionMm: { x: -62_000, y: 105_000, elevation: 26_000 },
        lookAtMm: { x: -18_000, y: 36_000, elevation: 9_000 },
        fovDeg: 44,
      },
      {
        id: 'v2-exterior-interior-near-facade',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.62,
        phase: 'flight',
        positionMm: { x: -30_000, y: 50_000, elevation: 12_500 },
        lookAtMm: { x: -15_000, y: 20_000, elevation: 3_200 },
        fovDeg: 41,
      },
      {
        id: 'v2-exterior-interior-floor16',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.72,
        phase: 'flight',
        positionMm: { x: -18_000, y: 30_000, elevation: 6_000 },
        lookAtMm: { x: -14_000, y: 14_500, elevation: 1_400 },
        fovDeg: 42,
      },
      {
        id: 'v2-exterior-interior-approach',
        frame: 'shared-world',
        scene: 'exterior',
        progress: 0.79,
        phase: 'cover',
        positionMm: { x: -16_000, y: 18_000, elevation: 3_500 },
        lookAtMm: { x: -10_000, y: 7_000, elevation: 1_400 },
        fovDeg: 43,
      },
      {
        id: 'v2-exterior-interior-handoff',
        frame: 'shared-world',
        scene: 'interior',
        progress: 0.85,
        phase: 'handoff',
        positionMm: { x: -14_000, y: 14_200, elevation: 2_400 },
        lookAtMm: { x: -17_000, y: 3_000, elevation: 1_200 },
        fovDeg: 44,
      },
      {
        id: 'v2-exterior-interior-inside',
        frame: 'shared-world',
        scene: 'interior',
        progress: 0.93,
        phase: 'reveal',
        positionMm: { x: -15_000, y: 12_000, elevation: 1_900 },
        lookAtMm: { x: -11_000, y: 2_000, elevation: 1_300 },
        fovDeg: 48,
      },
      {
        id: 'v2-exterior-interior-reveal',
        frame: 'shared-world',
        scene: 'interior',
        progress: 1,
        phase: 'reveal',
        positionMm: { x: -17_000, y: 12_000, elevation: 1_700 },
        lookAtMm: { x: -4_000, y: 1_000, elevation: 1_450 },
        fovDeg: 52,
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

    if (waypoint.frame !== 'shared-world') {
      errors.push(`${path}.frame must be shared-world`)
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
