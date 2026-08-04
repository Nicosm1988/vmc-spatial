import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { getCinematicRoute } from '../domain/cinematicAccess'
import { clampCameraFrameDeltaMs, resolveCameraRoute, sampleCameraRoute } from './cameraPath'

describe('cinematic camera path adapter', () => {
  it('keeps low-FPS progress while capping long background resumes', () => {
    expect(clampCameraFrameDeltaMs(1 / 60)).toBeCloseTo(16.67, 1)
    expect(clampCameraFrameDeltaMs(0.4)).toBe(400)
    expect(clampCameraFrameDeltaMs(8)).toBe(500)
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

  it('never interpolates between exterior and interior coordinate frames', () => {
    const route = getCinematicRoute('floor16', 'interior')
    expect(route).not.toBeNull()
    if (!route) return

    const waypoints = resolveCameraRoute(route, [31, 0, 20])
    const before = sampleCameraRoute(waypoints, 'exterior', route.handoffProgress - 0.001)
    const after = sampleCameraRoute(waypoints, 'interior', route.handoffProgress)

    expect(before?.position.toArray()).toEqual([-11, 2.5, 67])
    expect(after?.position.toArray()).toEqual([23.5, 2.4, 30.5])
    expect(before?.position.distanceTo(after?.position ?? new THREE.Vector3())).toBeGreaterThan(30)
  })

  it('returns finite curved samples with exact scene endpoints', () => {
    const route = getCinematicRoute('exterior', 'floor16')
    expect(route).not.toBeNull()
    if (!route) return

    const waypoints = resolveCameraRoute(route, [31, 0, 20])
    const samples = Array.from({ length: 101 }, (_, index) =>
      sampleCameraRoute(waypoints, 'exterior', index / 100),
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
    expect(samples.at(-1)?.position.toArray()).toEqual([-81.8, 12, 161.6])
  })
})
