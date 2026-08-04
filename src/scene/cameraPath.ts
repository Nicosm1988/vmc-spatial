import * as THREE from 'three'
import type { CinematicRouteSpec, CinematicWaypointSpec } from '../domain/cinematicAccess'
import type { ActiveScene } from '../domain/experience'
import { mmToMeters } from '../domain/units'

export interface CameraPathPose {
  readonly position: THREE.Vector3
  readonly lookAt: THREE.Vector3
  readonly fovDeg: number
}

export interface ResolvedCameraWaypoint extends CameraPathPose {
  readonly id: string
  readonly scene: ActiveScene
  readonly progress: number
}

export function clampCameraFrameDeltaMs(deltaSeconds: number) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0
  return Math.min(deltaSeconds, 0.5) * 1000
}

export function resolveCameraWaypoint(
  waypoint: CinematicWaypointSpec,
  center: readonly [number, number, number],
): ResolvedCameraWaypoint {
  return {
    id: waypoint.id,
    scene: waypoint.scene,
    progress: waypoint.progress,
    position: new THREE.Vector3(
      center[0] + mmToMeters(waypoint.positionMm.x),
      center[1] + mmToMeters(waypoint.positionMm.elevation),
      center[2] + mmToMeters(waypoint.positionMm.y),
    ),
    lookAt: new THREE.Vector3(
      center[0] + mmToMeters(waypoint.lookAtMm.x),
      center[1] + mmToMeters(waypoint.lookAtMm.elevation),
      center[2] + mmToMeters(waypoint.lookAtMm.y),
    ),
    fovDeg: waypoint.fovDeg,
  }
}

export function resolveCameraRoute(
  route: CinematicRouteSpec,
  center: readonly [number, number, number],
  currentPose?: CameraPathPose,
): readonly ResolvedCameraWaypoint[] {
  const waypoints = route.waypoints.map((waypoint) => resolveCameraWaypoint(waypoint, center))
  const first = waypoints[0]
  if (!first || !currentPose) return waypoints

  waypoints[0] = {
    ...first,
    position: currentPose.position.clone(),
    lookAt: currentPose.lookAt.clone(),
    fovDeg: currentPose.fovDeg,
  }
  return waypoints
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2
}

function catmullRom(
  p0: THREE.Vector3,
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  p3: THREE.Vector3,
  t: number,
) {
  const t2 = t * t
  const t3 = t2 * t
  return new THREE.Vector3(
    0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
    0.5 *
      (2 * p1.z +
        (-p0.z + p2.z) * t +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3),
  )
}

function clonePose(waypoint: ResolvedCameraWaypoint): CameraPathPose {
  return {
    position: waypoint.position.clone(),
    lookAt: waypoint.lookAt.clone(),
    fovDeg: waypoint.fovDeg,
  }
}

/**
 * Samples only within one render scene. A route crossing coordinate frames
 * therefore holds the last source pose until handoff and starts exactly at the
 * first destination pose afterwards; it never interpolates through unrelated
 * frames.
 */
export function sampleCameraRoute(
  waypoints: readonly ResolvedCameraWaypoint[],
  scene: ActiveScene,
  progress: number,
): CameraPathPose | null {
  const sceneWaypoints = waypoints.filter((waypoint) => waypoint.scene === scene)
  const first = sceneWaypoints[0]
  const last = sceneWaypoints.at(-1)
  if (!first || !last) return null

  const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1)
  if (clampedProgress <= first.progress) return clonePose(first)
  if (clampedProgress >= last.progress) return clonePose(last)

  const rightIndex = sceneWaypoints.findIndex((waypoint) => waypoint.progress >= clampedProgress)
  if (rightIndex <= 0) return clonePose(first)

  const leftIndex = rightIndex - 1
  const left = sceneWaypoints[leftIndex]
  const right = sceneWaypoints[rightIndex]
  if (!left || !right) return clonePose(last)

  const previous = sceneWaypoints[Math.max(0, leftIndex - 1)] ?? left
  const next = sceneWaypoints[Math.min(sceneWaypoints.length - 1, rightIndex + 1)] ?? right
  const span = Math.max(Number.EPSILON, right.progress - left.progress)
  const localProgress = easeInOutCubic((clampedProgress - left.progress) / span)

  return {
    position: catmullRom(
      previous.position,
      left.position,
      right.position,
      next.position,
      localProgress,
    ),
    lookAt: catmullRom(previous.lookAt, left.lookAt, right.lookAt, next.lookAt, localProgress),
    fovDeg: THREE.MathUtils.lerp(left.fovDeg, right.fovDeg, localProgress),
  }
}
