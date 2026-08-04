import { describe, expect, it } from 'vitest'
import type { StableSceneStage } from './experience'
import {
  CINEMATIC_ACCESS_ROUTES,
  getCinematicRoute,
  validateCinematicAccessRoutes,
  validateCinematicRoute,
  type CinematicRouteSpec,
} from './cinematicAccess'

describe('cinematic access contract', () => {
  it('keeps every published route valid, immutable and classified as demo data', () => {
    expect(validateCinematicAccessRoutes()).toEqual([])
    expect(Object.isFrozen(CINEMATIC_ACCESS_ROUTES)).toBe(true)

    for (const route of CINEMATIC_ACCESS_ROUTES) {
      expect(route.status).toBe('demo-unverified')
      expect(Object.isFrozen(route)).toBe(true)
      expect(Object.isFrozen(route.waypoints)).toBe(true)
      expect(Object.isFrozen(route.waypoints[0]?.positionMm)).toBe(true)
    }
  })

  it('defines a deterministic directed route between every pair of stable stages', () => {
    const stages: StableSceneStage[] = ['exterior', 'floor16', 'interior']

    for (const from of stages) {
      for (const to of stages) {
        const route = getCinematicRoute(from, to)
        if (from === to) {
          expect(route).toBeNull()
          continue
        }

        expect(route).toMatchObject({ from, to })
        expect(getCinematicRoute(from, to)).toBe(route)
      }
    }
  })

  it('stores all spatial positions and look targets as integer millimeters', () => {
    for (const route of CINEMATIC_ACCESS_ROUTES) {
      for (const waypoint of route.waypoints) {
        const values = [
          waypoint.positionMm.x,
          waypoint.positionMm.y,
          waypoint.positionMm.elevation,
          waypoint.lookAtMm.x,
          waypoint.lookAtMm.y,
          waypoint.lookAtMm.elevation,
        ]
        expect(values.every(Number.isInteger)).toBe(true)
      }
    }
  })

  it('uses stable globally unique route and waypoint IDs', () => {
    const routeIds = CINEMATIC_ACCESS_ROUTES.map((route) => route.id)
    const waypointIds = CINEMATIC_ACCESS_ROUTES.flatMap((route) =>
      route.waypoints.map((waypoint) => waypoint.id),
    )

    expect(new Set(routeIds).size).toBe(routeIds.length)
    expect(new Set(waypointIds).size).toBe(waypointIds.length)
  })

  it('rejects invalid millimeters and a route without an exact handoff marker', () => {
    const source = getCinematicRoute('exterior', 'floor16')!
    const invalid = {
      ...source,
      handoffProgress: 0.91,
      waypoints: source.waypoints.map((waypoint, index) =>
        index === 1 ? { ...waypoint, positionMm: { ...waypoint.positionMm, x: 1.5 } } : waypoint,
      ),
    } as CinematicRouteSpec

    expect(validateCinematicRoute(invalid)).toEqual(
      expect.arrayContaining([
        'waypoints[1].positionMm.x must be an integer millimeter value',
        'waypoints must mark handoffProgress with a handoff phase',
      ]),
    )
  })
})
