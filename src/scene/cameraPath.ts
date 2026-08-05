import * as THREE from 'three'
import type { CinematicRouteSpec, CinematicWaypointSpec } from '../domain/cinematicAccess'
import { mmToMeters } from '../domain/units'

export interface CameraPathPose {
  readonly position: THREE.Vector3
  readonly lookAt: THREE.Vector3
  readonly fovDeg: number
}

export interface ResolvedCameraKeyframe extends CameraPathPose {
  readonly id: string
  readonly progress: number
}

export interface ResolvedCameraWaypoint extends ResolvedCameraKeyframe {
  readonly positionTangent: THREE.Vector3
  readonly lookAtTangent: THREE.Vector3
  readonly fovTangent: number
}

export function clampCameraFrameDeltaMs(deltaSeconds: number) {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0
  return Math.min(deltaSeconds, 0.1) * 1000
}

export function resolveCameraWaypoint(
  waypoint: CinematicWaypointSpec,
  center: readonly [number, number, number],
): ResolvedCameraKeyframe {
  return {
    id: waypoint.id,
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

function vectorTangent(
  keyframes: readonly ResolvedCameraKeyframe[],
  index: number,
  pick: (keyframe: ResolvedCameraKeyframe) => THREE.Vector3,
) {
  if (index === 0 || index === keyframes.length - 1) return new THREE.Vector3()
  const previous = keyframes[index - 1]
  const next = keyframes[index + 1]
  if (!previous || !next) return new THREE.Vector3()

  const span = next.progress - previous.progress
  if (span <= Number.EPSILON) return new THREE.Vector3()
  return pick(next)
    .clone()
    .sub(pick(previous))
    .multiplyScalar(1 / span)
}

function numberTangent(
  keyframes: readonly ResolvedCameraKeyframe[],
  index: number,
  pick: (keyframe: ResolvedCameraKeyframe) => number,
) {
  if (index === 0 || index === keyframes.length - 1) return 0
  const previous = keyframes[index - 1]
  const next = keyframes[index + 1]
  if (!previous || !next) return 0

  const span = next.progress - previous.progress
  return span <= Number.EPSILON ? 0 : (pick(next) - pick(previous)) / span
}

function resolveTangents(
  keyframes: readonly ResolvedCameraKeyframe[],
): readonly ResolvedCameraWaypoint[] {
  return keyframes.map((keyframe, index) => ({
    ...keyframe,
    positionTangent: vectorTangent(keyframes, index, (item) => item.position),
    lookAtTangent: vectorTangent(keyframes, index, (item) => item.lookAt),
    fovTangent: numberTangent(keyframes, index, (item) => item.fovDeg),
  }))
}

export function resolveCameraRoute(
  route: CinematicRouteSpec,
  center: readonly [number, number, number],
  currentPose?: CameraPathPose,
): readonly ResolvedCameraWaypoint[] {
  const keyframes = route.waypoints.map((waypoint) => resolveCameraWaypoint(waypoint, center))
  const first = keyframes[0]
  if (!first || !currentPose) return resolveTangents(keyframes)

  keyframes[0] = {
    ...first,
    position: currentPose.position.clone(),
    lookAt: currentPose.lookAt.clone(),
    fovDeg: currentPose.fovDeg,
  }
  return resolveTangents(keyframes)
}

function hermiteVector(
  left: THREE.Vector3,
  right: THREE.Vector3,
  leftTangent: THREE.Vector3,
  rightTangent: THREE.Vector3,
  progress: number,
  span: number,
) {
  const squared = progress * progress
  const cubed = squared * progress
  const h00 = 2 * cubed - 3 * squared + 1
  const h10 = cubed - 2 * squared + progress
  const h01 = -2 * cubed + 3 * squared
  const h11 = cubed - squared

  return new THREE.Vector3()
    .addScaledVector(left, h00)
    .addScaledVector(leftTangent, h10 * span)
    .addScaledVector(right, h01)
    .addScaledVector(rightTangent, h11 * span)
}

function hermiteNumber(
  left: number,
  right: number,
  leftTangent: number,
  rightTangent: number,
  progress: number,
  span: number,
) {
  const squared = progress * progress
  const cubed = squared * progress
  const h00 = 2 * cubed - 3 * squared + 1
  const h10 = cubed - 2 * squared + progress
  const h01 = -2 * cubed + 3 * squared
  const h11 = cubed - squared
  return h00 * left + h10 * span * leftTangent + h01 * right + h11 * span * rightTangent
}

function clonePose(waypoint: ResolvedCameraKeyframe): CameraPathPose {
  return {
    position: waypoint.position.clone(),
    lookAt: waypoint.lookAt.clone(),
    fovDeg: waypoint.fovDeg,
  }
}

/**
 * Samples a single C1-continuous world-space curve. The renderer may exchange
 * scene ownership at handoff, but the camera pose comes from this same curve on
 * both sides of that state change.
 */
export function sampleCameraRoute(
  waypoints: readonly ResolvedCameraWaypoint[],
  progress: number,
): CameraPathPose | null {
  const first = waypoints[0]
  const last = waypoints.at(-1)
  if (!first || !last) return null

  const clampedProgress = THREE.MathUtils.clamp(progress, 0, 1)
  if (clampedProgress <= first.progress) return clonePose(first)
  if (clampedProgress >= last.progress) return clonePose(last)

  const rightIndex = waypoints.findIndex((waypoint) => waypoint.progress >= clampedProgress)
  if (rightIndex <= 0) return clonePose(first)

  const leftIndex = rightIndex - 1
  const left = waypoints[leftIndex]
  const right = waypoints[rightIndex]
  if (!left || !right) return clonePose(last)

  const span = Math.max(Number.EPSILON, right.progress - left.progress)
  const localProgress = (clampedProgress - left.progress) / span

  return {
    position: hermiteVector(
      left.position,
      right.position,
      left.positionTangent,
      right.positionTangent,
      localProgress,
      span,
    ),
    lookAt: hermiteVector(
      left.lookAt,
      right.lookAt,
      left.lookAtTangent,
      right.lookAtTangent,
      localProgress,
      span,
    ),
    fovDeg: hermiteNumber(
      left.fovDeg,
      right.fovDeg,
      left.fovTangent,
      right.fovTangent,
      localProgress,
      span,
    ),
  }
}
