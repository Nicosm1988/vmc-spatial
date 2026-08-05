import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { CINEMATIC_ACCESS_ROUTES, getCinematicRoute } from '../domain/cinematicAccess'
import { clampCameraFrameDeltaMs, resolveCameraRoute, sampleCameraRoute } from './cameraPath'

describe('cinematic camera path adapter', () => {
  it('keeps low-FPS progress while capping long background resumes', () => {
    expect(clampCameraFrameDeltaMs(1 / 60)).toBeCloseTo(16.67, 1)
    expect(clampCameraFrameDeltaMs(0.4)).toBe(100)
    expect(clampCameraFrameDeltaMs(8)).toBe(100)
    expect(clampCameraFrameDeltaMs(Number.NaN)).toBe(0)
  })

  it('converts domain millimeters to scene meters around the runtime center', () => {
    const route = getCinematicRoute('exterior', 'floor16')
    expect(route).not.toBeNull()
    if (!route) return

    const [first] = resolveCameraRoute(route, [31, 0, 20])
    expect(first?.position.toArray()).toEqual([-119.4, 78.4, 240])
    expect(first?.lookAt.toArray()).toEqual([31, 17, 20])
  })

  it('uses the live camera pose as the departure without mutating the domain route', () => {
    const route = getCinematicRoute('exterior', 'floor16')
    expect(route).not.toBeNull()
    if (!route) return

    const originalX = route.waypoints[0]?.positionMm.x
    const current = {
      position: new THREE.Vector3(1, 2, 3),
      lookAt: new THREE.Vector3(4, 5, 6),
      fovDeg: 51,
    }
    const [first] = resolveCameraRoute(route, [31, 0, 20], current)

    expect(first?.position.toArray()).toEqual([1, 2, 3])
    expect(first?.lookAt.toArray()).toEqual([4, 5, 6])
    expect(first?.fovDeg).toBe(51)
    expect(route.waypoints[0]?.positionMm.x).toBe(originalX)
  })

  it('keeps a continuous pose and tangent while crossing the sliding door', () => {
    const route = getCinematicRoute('floor16', 'interior')
    expect(route).not.toBeNull()
    if (!route) return

    const waypoints = resolveCameraRoute(route, [31, 0, 20])
    const epsilon = 0.001
    const before = sampleCameraRoute(waypoints, route.handoffProgress - epsilon)
    const atHandoff = sampleCameraRoute(waypoints, route.handoffProgress)
    const after = sampleCameraRoute(waypoints, route.handoffProgress + epsilon)

    expect(atHandoff?.position.toArray()).toEqual([38.92, 1.7, 12.08])
    expect(atHandoff?.lookAt.toArray()).toEqual([43.728, 1.55, 7.272])
    expect(before?.position.distanceTo(after?.position ?? new THREE.Vector3())).toBeLessThan(0.2)

    const incoming = atHandoff?.position.clone().sub(before?.position ?? new THREE.Vector3())
    const outgoing = after?.position.clone().sub(atHandoff?.position ?? new THREE.Vector3())
    expect(incoming?.length()).toBeGreaterThan(0)
    expect(outgoing?.length()).toBeGreaterThan(0)
    expect(incoming?.angleTo(outgoing ?? new THREE.Vector3())).toBeLessThan(0.02)

    const oneFrame = 1000 / 60 / route.durationMs
    const previousFrame = sampleCameraRoute(waypoints, route.handoffProgress - oneFrame)
    const nextFrame = sampleCameraRoute(waypoints, route.handoffProgress + oneFrame)
    expect(
      previousFrame?.position.distanceTo(atHandoff?.position ?? new THREE.Vector3()),
    ).toBeLessThan(0.5)
    expect(atHandoff?.position.distanceTo(nextFrame?.position ?? new THREE.Vector3())).toBeLessThan(
      0.5,
    )
  })

  it('returns finite curved samples with exact scene endpoints', () => {
    const route = getCinematicRoute('exterior', 'floor16')
    expect(route).not.toBeNull()
    if (!route) return

    const waypoints = resolveCameraRoute(route, [31, 0, 20])
    const samples = Array.from({ length: 101 }, (_, index) =>
      sampleCameraRoute(waypoints, index / 100),
    )

    expect(samples.every(Boolean)).toBe(true)
    expect(
      samples.every((sample) =>
        [
          ...(sample?.position.toArray() ?? []),
          ...(sample?.lookAt.toArray() ?? []),
          sample?.fovDeg,
        ].every((value) => Number.isFinite(value)),
      ),
    ).toBe(true)
    expect(samples[0]?.position.toArray()).toEqual([-119.4, 78.4, 240])
    expect(samples.at(-1)?.position.toArray()).toEqual([35.95, 1.7, 15.05])
  })

  it('moves through internal waypoints without the per-segment stop from eased lerps', () => {
    const route = getCinematicRoute('exterior', 'interior')
    expect(route).not.toBeNull()
    if (!route) return

    const waypoints = resolveCameraRoute(route, [31, 0, 20])
    const internal = route.waypoints.slice(1, -1)

    for (const waypoint of internal) {
      const before = sampleCameraRoute(waypoints, waypoint.progress - 0.0005)
      const atWaypoint = sampleCameraRoute(waypoints, waypoint.progress)
      const after = sampleCameraRoute(waypoints, waypoint.progress + 0.0005)
      expect(before).not.toBeNull()
      expect(atWaypoint).not.toBeNull()
      expect(after).not.toBeNull()
      expect(
        before?.position.distanceTo(atWaypoint?.position ?? new THREE.Vector3()),
      ).toBeGreaterThan(0)
      expect(
        atWaypoint?.position.distanceTo(after?.position ?? new THREE.Vector3()),
      ).toBeGreaterThan(0)
    }
  })

  it('limits every cross-scene handoff to less than half a meter per 60 Hz frame', () => {
    const crossingRoutes = CINEMATIC_ACCESS_ROUTES.filter(
      (route) => route.fromActiveScene !== route.toActiveScene,
    )

    for (const route of crossingRoutes) {
      const waypoints = resolveCameraRoute(route, [31, 0, 20])
      const oneFrame = 1000 / 60 / route.durationMs
      const before = sampleCameraRoute(waypoints, route.handoffProgress - oneFrame)
      const atHandoff = sampleCameraRoute(waypoints, route.handoffProgress)
      const after = sampleCameraRoute(waypoints, route.handoffProgress + oneFrame)

      expect(
        before?.position.distanceTo(atHandoff?.position ?? new THREE.Vector3()),
        `${route.id} before handoff`,
      ).toBeLessThan(0.5)
      expect(
        atHandoff?.position.distanceTo(after?.position ?? new THREE.Vector3()),
        `${route.id} after handoff`,
      ).toBeLessThan(0.5)
    }
  })
})
