import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  getCinematicRoute,
  type CinematicRouteSpec,
  type CinematicTransitionPhase,
} from '../domain/cinematicAccess'
import type { ActiveScene, StableSceneStage } from '../domain/experience'
import { useExperienceStore } from '../state/useExperienceStore'
import type { CamApiRef, OrbitControlsHandle } from './cameraTypes'
import {
  clampCameraFrameDeltaMs,
  resolveCameraRoute,
  resolveCameraWaypoint,
  sampleCameraRoute,
  type CameraPathPose,
  type ResolvedCameraWaypoint,
} from './cameraPath'

interface CameraDirectorProps {
  center: [number, number, number]
  controlsRef: React.MutableRefObject<OrbitControlsHandle | null>
  camApiRef: CamApiRef
}

interface ActiveTransition {
  readonly id: number
  readonly route: CinematicRouteSpec
  readonly waypoints: readonly ResolvedCameraWaypoint[]
  elapsedMs: number
  publishElapsedMs: number
  handedOff: boolean
}

export interface CameraDiagnosticsSnapshot {
  readonly transitionId: number | null
  readonly routeId: string | null
  readonly phase: CinematicTransitionPhase | 'idle'
  readonly progress: number
  readonly activeScene: ActiveScene
  readonly stage: StableSceneStage
  readonly reducedMotion: boolean
  readonly position: readonly [number, number, number]
  readonly target: readonly [number, number, number]
  readonly fovDeg: number
  readonly timestamp: number
}

interface CameraDiagnosticsWindow extends Window {
  __VMC_CAMERA_DIAGNOSTICS__?: CameraDiagnosticsSnapshot
}

const PROGRESS_PUBLISH_INTERVAL_MS = 80

function getStableWaypoint(stage: StableSceneStage) {
  if (stage === 'exterior') return getCinematicRoute('exterior', 'floor16')?.waypoints[0]
  if (stage === 'floor16') return getCinematicRoute('exterior', 'floor16')?.waypoints.at(-1)
  return getCinematicRoute('exterior', 'interior')?.waypoints.at(-1)
}

function stablePose(
  stage: StableSceneStage,
  center: readonly [number, number, number],
): CameraPathPose {
  const waypoint = getStableWaypoint(stage)
  if (!waypoint) {
    return {
      position: new THREE.Vector3(center[0] - 150.4, 78.4, center[2] + 220),
      lookAt: new THREE.Vector3(center[0], 17, center[2]),
      fovDeg: 45,
    }
  }
  return resolveCameraWaypoint(waypoint, center)
}

function getCameraFov(camera: THREE.Camera) {
  return camera instanceof THREE.PerspectiveCamera ? camera.fov : 45
}

function applyPose(camera: THREE.Camera, controls: OrbitControlsHandle, pose: CameraPathPose) {
  camera.position.copy(pose.position)
  controls.target.copy(pose.lookAt)
  if (camera instanceof THREE.PerspectiveCamera && camera.fov !== pose.fovDeg) {
    camera.fov = pose.fovDeg
    camera.updateProjectionMatrix()
  }
  controls.update()
}

function phaseAtProgress(route: CinematicRouteSpec, progress: number): CinematicTransitionPhase {
  let phase: CinematicTransitionPhase = 'flight'
  for (const waypoint of route.waypoints) {
    if (waypoint.progress > progress) break
    phase = waypoint.phase
  }
  return phase
}

function finalPose(
  route: CinematicRouteSpec,
  center: readonly [number, number, number],
): CameraPathPose | null {
  const waypoint = route.waypoints.at(-1)
  return waypoint ? resolveCameraWaypoint(waypoint, center) : null
}

export default function CameraDirector({ center, controlsRef, camApiRef }: CameraDirectorProps) {
  const { camera, gl } = useThree()
  const stage = useExperienceStore((state) => state.stage)
  const transitionId = useExperienceStore((state) => state.transition?.id ?? null)
  const reducedMotion = useExperienceStore((state) => state.reducedMotion)
  const setTransitionPhase = useExperienceStore((state) => state.setTransitionPhase)
  const setTransitionProgress = useExperienceStore((state) => state.setTransitionProgress)
  const handoffTransition = useExperienceStore((state) => state.handoffTransition)
  const completeTransition = useExperienceStore((state) => state.completeTransition)
  const cancelTransition = useExperienceStore((state) => state.cancelTransition)
  const enterInterior = useExperienceStore((state) => state.enterInterior)
  const active = useRef<ActiveTransition | null>(null)
  const diagnosticsEnabled = useRef(
    new URLSearchParams(window.location.search).get('diagnostics') === '1',
  )

  function publishDiagnostics(
    phase: CinematicTransitionPhase | 'idle',
    progress: number,
    route: CinematicRouteSpec | null,
  ) {
    if (!diagnosticsEnabled.current) return
    const controls = controlsRef.current
    if (!controls) return
    const state = useExperienceStore.getState()
    const diagnosticsWindow = window as CameraDiagnosticsWindow
    const snapshot: CameraDiagnosticsSnapshot = {
      transitionId: state.transition?.id ?? null,
      routeId: route?.id ?? null,
      phase,
      progress,
      activeScene: state.activeScene,
      stage: state.stage,
      reducedMotion: state.reducedMotion,
      position: camera.position.toArray(),
      target: controls.target.toArray(),
      fovDeg: getCameraFov(camera),
      timestamp: performance.now(),
    }
    diagnosticsWindow.__VMC_CAMERA_DIAGNOSTICS__ = snapshot
    diagnosticsWindow.dispatchEvent(
      new CustomEvent<CameraDiagnosticsSnapshot>('vmc-camera-diagnostics', { detail: snapshot }),
    )
  }

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const transition = useExperienceStore.getState().transition
    if (!transition || transition.id !== transitionId) {
      active.current = null
      controls.enabled = true
      applyPose(camera, controls, stablePose(stage, center))
      publishDiagnostics('idle', 1, null)
      return
    }

    const route = getCinematicRoute(transition.from, transition.to)
    if (!route || route.id !== transition.routeId) {
      cancelTransition()
      controls.enabled = true
      return
    }

    if (reducedMotion) {
      const destination = finalPose(route, center)
      if (destination) applyPose(camera, controls, destination)
      controls.enabled = true
      completeTransition(transition.id)
      publishDiagnostics('idle', 1, route)
      return
    }

    const currentPose: CameraPathPose = {
      position: camera.position.clone(),
      lookAt: controls.target.clone(),
      fovDeg: getCameraFov(camera),
    }
    active.current = {
      id: transition.id,
      route,
      waypoints: resolveCameraRoute(route, center, currentPose),
      elapsedMs: transition.progress * route.durationMs,
      publishElapsedMs: PROGRESS_PUBLISH_INTERVAL_MS,
      handedOff: transition.handedOff,
    }
    controls.enabled = false
    publishDiagnostics(transition.phase, transition.progress, route)

    return () => {
      controls.enabled = true
    }
    // publishDiagnostics intentionally stays outside dependencies: it writes
    // opt-in diagnostics only and reads current refs/store state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    camera,
    cancelTransition,
    center,
    completeTransition,
    controlsRef,
    reducedMotion,
    stage,
    transitionId,
  ])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const target = () => controls.target
    camApiRef.current = {
      zoom: (factor) => {
        const direction = new THREE.Vector3().subVectors(camera.position, target())
        direction.setLength(THREE.MathUtils.clamp(direction.length() * factor, 0.8, 1400))
        camera.position.copy(target()).add(direction)
        controls.update()
      },
      orbit: (degrees) => {
        const angle = THREE.MathUtils.degToRad(degrees)
        const offset = new THREE.Vector3().subVectors(camera.position, target())
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
        camera.position.copy(target()).add(offset)
        controls.update()
      },
      tilt: (degrees) => {
        const offset = new THREE.Vector3().subVectors(camera.position, target())
        const spherical = new THREE.Spherical().setFromVector3(offset)
        spherical.phi = THREE.MathUtils.clamp(
          spherical.phi - THREE.MathUtils.degToRad(degrees),
          0.08,
          Math.PI / 2,
        )
        offset.setFromSpherical(spherical)
        camera.position.copy(target()).add(offset)
        controls.update()
      },
      reset: () => applyPose(camera, controls, stablePose(stage, center)),
      top: () => {
        controls.target.set(center[0], 0, center[2])
        camera.position.set(center[0], 105, center[2] + 0.01)
        controls.update()
      },
      enter: enterInterior,
      capture: () => {
        const source = gl.domElement
        const exportCanvas = document.createElement('canvas')
        exportCanvas.width = source.width
        exportCanvas.height = source.height
        const context = exportCanvas.getContext('2d')
        if (!context) return

        context.drawImage(source, 0, 0)
        const scale = Math.max(1, exportCanvas.width / Math.max(1, source.clientWidth))
        const padding = 16 * scale
        const fontSize = 12 * scale
        const label = 'DEMO · NO VERIFICADO'
        context.font = `700 ${fontSize}px system-ui, sans-serif`
        const width = context.measureText(label).width + padding * 1.5
        context.fillStyle = 'rgba(3, 12, 20, 0.78)'
        context.fillRect(padding, exportCanvas.height - padding * 3, width, padding * 2)
        context.fillStyle = '#78efe1'
        context.fillText(label, padding * 1.65, exportCanvas.height - padding * 1.7)

        const url = exportCanvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = url
        link.download = `vmc-spatial-${Date.now()}.png`
        link.click()
      },
    }
  }, [camApiRef, camera, center, controlsRef, enterInterior, gl, stage])

  useEffect(
    () => () => {
      const controls = controlsRef.current
      if (controls) controls.enabled = true
      active.current = null
      if (diagnosticsEnabled.current) {
        delete (window as CameraDiagnosticsWindow).__VMC_CAMERA_DIAGNOSTICS__
      }
    },
    [controlsRef],
  )

  useFrame((_, delta) => {
    const transition = active.current
    const controls = controlsRef.current
    if (!transition || !controls) return

    const liveState = useExperienceStore.getState()
    const liveTransition = liveState.transition
    if (!liveTransition || liveTransition.id !== transition.id) {
      active.current = null
      controls.enabled = true
      return
    }

    if (liveState.reducedMotion) {
      const destination = finalPose(transition.route, center)
      if (destination) applyPose(camera, controls, destination)
      controls.enabled = true
      active.current = null
      completeTransition(transition.id)
      publishDiagnostics('idle', 1, transition.route)
      return
    }

    // A hidden tab or stalled frame must not skip a visible section of the
    // route. The 100 ms ceiling favors spatial continuity over wall-clock time.
    const deltaMs = clampCameraFrameDeltaMs(delta)
    transition.elapsedMs += deltaMs
    transition.publishElapsedMs += deltaMs

    const progress = Math.min(1, transition.elapsedMs / transition.route.durationMs)
    const phase = phaseAtProgress(transition.route, progress)
    const pose = sampleCameraRoute(transition.waypoints, progress)
    if (pose) applyPose(camera, controls, pose)

    let didHandoff = false
    if (!transition.handedOff && progress >= transition.route.handoffProgress) {
      didHandoff = handoffTransition(transition.id)
      if (!didHandoff) {
        active.current = null
        controls.enabled = true
        return
      }
      transition.handedOff = true
    }

    if (liveTransition.phase !== phase) setTransitionPhase(transition.id, phase)
    // Diagnostics are opt-in and sample every rendered frame so continuity
    // assertions compare adjacent camera poses instead of 80 ms UI updates.
    publishDiagnostics(phase, progress, transition.route)
    if (
      transition.publishElapsedMs >= PROGRESS_PUBLISH_INTERVAL_MS ||
      progress >= 1 ||
      didHandoff
    ) {
      transition.publishElapsedMs = 0
      setTransitionProgress(transition.id, progress)
    }

    if (progress < 1) return
    controls.enabled = true
    active.current = null
    completeTransition(transition.id)
    publishDiagnostics('idle', 1, transition.route)
  })

  return null
}
