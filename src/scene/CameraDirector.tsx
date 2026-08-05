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
  editing: boolean
}

interface ActiveTransition {
  readonly id: number
  readonly route: CinematicRouteSpec
  readonly waypoints: readonly ResolvedCameraWaypoint[]
  elapsedMs: number
  publishElapsedMs: number
  handedOff: boolean
}

interface ManualCameraTween {
  readonly fromPosition: THREE.Vector3
  readonly fromTarget: THREE.Vector3
  readonly toPosition: THREE.Vector3
  readonly toTarget: THREE.Vector3
  elapsedMs: number
  readonly durationMs: number
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

function isWorldVisible(object: THREE.Object3D) {
  let current: THREE.Object3D | null = object
  while (current) {
    if (!current.visible) return false
    current = current.parent
  }
  return true
}

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

export default function CameraDirector({
  center,
  controlsRef,
  camApiRef,
  editing,
}: CameraDirectorProps) {
  const { camera, gl, scene } = useThree()
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
  const manualTween = useRef<ManualCameraTween | null>(null)
  const pressedKeys = useRef(new Set<string>())
  const lastTouch = useRef<{ time: number; x: number; y: number } | null>(null)
  const scratch = useRef({
    forward: new THREE.Vector3(),
    right: new THREE.Vector3(),
    movement: new THREE.Vector3(),
    offset: new THREE.Vector3(),
    hitDirection: new THREE.Vector3(),
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
  })
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

  function startManualTween(toPosition: THREE.Vector3, toTarget: THREE.Vector3, durationMs = 520) {
    const controls = controlsRef.current
    if (!controls) return
    manualTween.current = {
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition,
      toTarget,
      elapsedMs: 0,
      durationMs,
    }
  }

  function moveAlongView(distance: number, strafe = 0) {
    const controls = controlsRef.current
    if (!controls) return
    const vectors = scratch.current
    camera.getWorldDirection(vectors.forward)
    if (camera.position.y < 4.2) {
      vectors.forward.y = 0
    }
    if (vectors.forward.lengthSq() < 0.0001) vectors.forward.set(0, 0, -1)
    vectors.forward.normalize()
    vectors.right.crossVectors(vectors.forward, camera.up).normalize()
    vectors.movement
      .copy(vectors.forward)
      .multiplyScalar(distance)
      .addScaledVector(vectors.right, strafe)
    startManualTween(
      camera.position.clone().add(vectors.movement),
      controls.target.clone().add(vectors.movement),
      360,
    )
  }

  function navigateAtClientPoint(clientX: number, clientY: number, backward: boolean) {
    const controls = controlsRef.current
    if (!controls || editing || useExperienceStore.getState().transition) return
    if (backward) {
      moveAlongView(-4)
      return
    }

    const rect = gl.domElement.getBoundingClientRect()
    const vectors = scratch.current
    vectors.pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    vectors.raycaster.setFromCamera(vectors.pointer, camera)
    const hit = vectors.raycaster
      .intersectObjects(scene.children, true)
      .find((intersection) => intersection.distance > 0.2 && isWorldVisible(intersection.object))

    if (!hit) {
      moveAlongView(4)
      return
    }

    const humanScale = camera.position.y < 4.2
    vectors.hitDirection.subVectors(hit.point, camera.position)
    const hitDistance = vectors.hitDirection.length()
    if (hitDistance < 0.001) return
    vectors.hitDirection.normalize()

    if (humanScale) {
      vectors.hitDirection.y = 0
      if (vectors.hitDirection.lengthSq() < 0.0001) {
        camera.getWorldDirection(vectors.hitDirection)
        vectors.hitDirection.y = 0
      }
      vectors.hitDirection.normalize()
      if (hitDistance <= 0.9) return
      const advance = THREE.MathUtils.clamp(
        hitDistance < 8 ? hitDistance - 0.75 : hitDistance * 0.62,
        0.5,
        7,
      )
      vectors.movement.copy(vectors.hitDirection).multiplyScalar(advance)
      startManualTween(
        camera.position.clone().add(vectors.movement),
        controls.target.clone().add(vectors.movement),
      )
      return
    }

    if (hitDistance < 14) {
      vectors.movement.copy(vectors.hitDirection).multiplyScalar(hitDistance + 2.2)
      startManualTween(
        camera.position.clone().add(vectors.movement),
        controls.target.clone().add(vectors.movement),
      )
      return
    }

    const desiredDistance = THREE.MathUtils.clamp(hitDistance * 0.34, 3, 65)
    vectors.offset.subVectors(camera.position, hit.point).setLength(desiredDistance)
    startManualTween(hit.point.clone().add(vectors.offset), hit.point.clone())
  }

  useEffect(() => {
    const canvas = gl.domElement
    const movementKeys = new Set([
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'KeyQ',
      'KeyE',
      'ArrowUp',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ShiftLeft',
      'ShiftRight',
    ])

    const isFormControl = (target: EventTarget | null) =>
      target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, button'))

    const onDoubleClick = (event: MouseEvent) => {
      event.preventDefault()
      navigateAtClientPoint(event.clientX, event.clientY, event.shiftKey)
    }
    const onPointerDown = () => {
      manualTween.current = null
      if (useExperienceStore.getState().transition) cancelTransition()
    }
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || editing) return
      const now = performance.now()
      const previous = lastTouch.current
      lastTouch.current = { time: now, x: event.clientX, y: event.clientY }
      if (
        previous &&
        now - previous.time < 320 &&
        Math.hypot(event.clientX - previous.x, event.clientY - previous.y) < 24
      ) {
        navigateAtClientPoint(event.clientX, event.clientY, false)
        lastTouch.current = null
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (!movementKeys.has(event.code) || isFormControl(event.target)) return
      event.preventDefault()
      manualTween.current = null
      if (useExperienceStore.getState().transition) cancelTransition()
      pressedKeys.current.add(event.code)
    }
    const onKeyUp = (event: KeyboardEvent) => {
      pressedKeys.current.delete(event.code)
    }
    const clearKeys = () => pressedKeys.current.clear()

    canvas.addEventListener('dblclick', onDoubleClick)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', clearKeys)
    return () => {
      canvas.removeEventListener('dblclick', onDoubleClick)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', clearKeys)
      clearKeys()
    }
    // Navigation helpers intentionally read live camera, controls and store refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelTransition, editing, gl, scene])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const stopProgrammaticMotion = () => {
      manualTween.current = null
    }
    controls.addEventListener('start', stopProgrammaticMotion)
    return () => controls.removeEventListener('start', stopProgrammaticMotion)
  }, [controlsRef])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const transition = useExperienceStore.getState().transition
    if (!transition || transition.id !== transitionId) {
      const preserveLivePose = active.current !== null
      active.current = null
      controls.enabled = true
      if (preserveLivePose) controls.update()
      else applyPose(camera, controls, stablePose(stage, center))
      publishDiagnostics('idle', 1, null)
      return
    }

    const route = getCinematicRoute(transition.from, transition.to)
    if (!route || route.id !== transition.routeId) {
      cancelTransition()
      controls.enabled = true
      return
    }

    manualTween.current = null

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
        manualTween.current = null
        const direction = new THREE.Vector3().subVectors(camera.position, target())
        direction.setLength(THREE.MathUtils.clamp(direction.length() * factor, 0.8, 1400))
        camera.position.copy(target()).add(direction)
        controls.update()
      },
      orbit: (degrees) => {
        manualTween.current = null
        const angle = THREE.MathUtils.degToRad(degrees)
        const offset = new THREE.Vector3().subVectors(camera.position, target())
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle)
        camera.position.copy(target()).add(offset)
        controls.update()
      },
      tilt: (degrees) => {
        manualTween.current = null
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
      stepForward: () => moveAlongView(4),
      stepBackward: () => moveAlongView(-4),
      strafe: (direction) => moveAlongView(0, direction * 3),
      reset: () => {
        manualTween.current = null
        applyPose(camera, controls, stablePose(stage, center))
        publishDiagnostics('idle', 1, null)
      },
      top: () => {
        manualTween.current = null
        controls.target.set(center[0], 0, center[2])
        const topHeight = useExperienceStore.getState().stage === 'exterior' ? 105 : 36
        camera.position.set(center[0], topHeight, center[2] + 0.01)
        controls.update()
        publishDiagnostics('idle', 1, null)
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
    // moveAlongView intentionally reads live refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camApiRef, camera, center, controlsRef, enterInterior, gl, stage])

  useEffect(
    () => () => {
      const controls = controlsRef.current
      if (controls) controls.enabled = true
      active.current = null
      manualTween.current = null
      pressedKeys.current.clear()
      if (diagnosticsEnabled.current) {
        delete (window as CameraDiagnosticsWindow).__VMC_CAMERA_DIAGNOSTICS__
      }
    },
    [controlsRef],
  )

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    const transition = active.current
    if (transition) {
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
      return
    }

    const tween = manualTween.current
    if (tween) {
      tween.elapsedMs += Math.min(delta, 0.05) * 1000
      const linear = THREE.MathUtils.clamp(tween.elapsedMs / tween.durationMs, 0, 1)
      const eased = linear * linear * (3 - 2 * linear)
      camera.position.lerpVectors(tween.fromPosition, tween.toPosition, eased)
      controls.target.lerpVectors(tween.fromTarget, tween.toTarget, eased)
      controls.update()
      publishDiagnostics('idle', linear, null)
      if (linear >= 1) manualTween.current = null
      return
    }

    const keys = pressedKeys.current
    if (keys.size === 0 || !controls.enabled || useExperienceStore.getState().transition) return

    const vectors = scratch.current
    camera.getWorldDirection(vectors.forward)
    const humanScale = camera.position.y < 4.2
    if (humanScale) vectors.forward.y = 0
    if (vectors.forward.lengthSq() < 0.0001) vectors.forward.set(0, 0, -1)
    vectors.forward.normalize()
    vectors.right.crossVectors(vectors.forward, camera.up).normalize()
    vectors.movement.set(0, 0, 0)

    if (keys.has('KeyW') || keys.has('ArrowUp')) vectors.movement.add(vectors.forward)
    if (keys.has('KeyS') || keys.has('ArrowDown')) vectors.movement.sub(vectors.forward)
    if (keys.has('KeyD') || keys.has('ArrowRight')) vectors.movement.add(vectors.right)
    if (keys.has('KeyA') || keys.has('ArrowLeft')) vectors.movement.sub(vectors.right)
    if (keys.has('KeyE')) vectors.movement.y += 1
    if (keys.has('KeyQ')) vectors.movement.y -= 1
    if (vectors.movement.lengthSq() < 0.0001) return

    const fast = keys.has('ShiftLeft') || keys.has('ShiftRight')
    const speed = humanScale ? (fast ? 8 : 4.2) : fast ? 70 : 34
    vectors.movement.normalize().multiplyScalar(speed * Math.min(delta, 0.05))
    if (humanScale) {
      const desiredY = THREE.MathUtils.clamp(camera.position.y + vectors.movement.y, 1.5, 2.3)
      vectors.movement.y = desiredY - camera.position.y
    }
    camera.position.add(vectors.movement)
    controls.target.add(vectors.movement)
    controls.update()
    publishDiagnostics('idle', 1, null)
  })

  return null
}
