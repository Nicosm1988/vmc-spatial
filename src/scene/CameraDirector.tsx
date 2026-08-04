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
  coverHoldMs: number
  handoffHoldMs: number
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

const COVER_HOLD_MS = 420
const HANDOFF_HOLD_MS = 140
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

function coverProgress(route: CinematicRouteSpec) {
  return (
    route.waypoints.find((waypoint) => waypoint.phase === 'cover')?.progress ??
    route.handoffProgress
  )
}

function phaseAtProgress(route: CinematicRouteSpec, progress: number): CinematicTransitionPhase {
  const coverAt = coverProgress(route)
  if (progress < coverAt) return 'flight'
  if (progress < route.handoffProgress) return 'cover'
  if (progress === route.handoffProgress) return 'handoff'
  return 'reveal'
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
    diagnosticsWindow.__VMC_CAMERA_DIAGNOSTICS__ = {
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
      coverHoldMs: 0,
      handoffHoldMs: 0,
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

    // Cap long background-tab resumes without turning low-FPS devices into
    // slow motion. A 500 ms ceiling keeps the route progressing on software
    // WebGL while still preventing a multi-second suspension from skipping it.
    const deltaMs = clampCameraFrameDeltaMs(delta)
    transition.elapsedMs += deltaMs
    transition.publishElapsedMs += deltaMs

    const changesRenderScene = transition.route.fromActiveScene !== transition.route.toActiveScene
    const coverAt = coverProgress(transition.route)
    let progress = Math.min(1, transition.elapsedMs / transition.route.durationMs)
    let phase = phaseAtProgress(transition.route, progress)

    if (changesRenderScene && !transition.handedOff && progress >= coverAt) {
      transition.coverHoldMs += deltaMs
      progress = coverAt
      transition.elapsedMs = coverAt * transition.route.durationMs
      phase = 'cover'

      if (transition.coverHoldMs >= COVER_HOLD_MS) {
        progress = transition.route.handoffProgress
        transition.elapsedMs = transition.route.handoffProgress * transition.route.durationMs
        phase = 'handoff'
        transition.handedOff = handoffTransition(transition.id)
      }
    } else if (!transition.handedOff && progress >= transition.route.handoffProgress) {
      phase = 'handoff'
      transition.handedOff = handoffTransition(transition.id)
    }

    if (changesRenderScene && transition.handedOff) {
      if (transition.handoffHoldMs < HANDOFF_HOLD_MS) {
        transition.handoffHoldMs += deltaMs
        progress = transition.route.handoffProgress
        transition.elapsedMs = transition.route.handoffProgress * transition.route.durationMs
        phase = 'handoff'
      } else {
        phase = 'reveal'
      }
    }

    const scene = transition.handedOff
      ? transition.route.toActiveScene
      : transition.route.fromActiveScene
    const pose = sampleCameraRoute(transition.waypoints, scene, progress)
    if (pose) applyPose(camera, controls, pose)

    if (liveTransition.phase !== phase) setTransitionPhase(transition.id, phase)
    if (
      transition.publishElapsedMs >= PROGRESS_PUBLISH_INTERVAL_MS ||
      progress >= 1 ||
      progress === transition.route.handoffProgress
    ) {
      transition.publishElapsedMs = 0
      setTransitionProgress(transition.id, progress)
      publishDiagnostics(phase, progress, transition.route)
    }

    if (progress < 1) return
    controls.enabled = true
    active.current = null
    setTransitionProgress(transition.id, 1)
    setTransitionPhase(transition.id, 'reveal')
    completeTransition(transition.id)
    publishDiagnostics('idle', 1, transition.route)
  })

  return null
}
