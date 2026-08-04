import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { SceneStage } from '../domain/experience'
import { useExperienceStore } from '../state/useExperienceStore'
import type { CamApiRef, OrbitControlsHandle } from './cameraTypes'

interface CameraDirectorProps {
  center: [number, number, number]
  controlsRef: React.MutableRefObject<OrbitControlsHandle | null>
  camApiRef: CamApiRef
}

interface CameraPreset {
  position: THREE.Vector3
  target: THREE.Vector3
  duration: number
}

interface ActiveTransition {
  stage: SceneStage
  startedAt: number
  duration: number
  fromPosition: THREE.Vector3
  fromTarget: THREE.Vector3
  toPosition: THREE.Vector3
  toTarget: THREE.Vector3
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value ** 3 : 1 - (-2 * value + 2) ** 3 / 2
}

function makePreset(stage: SceneStage, cx: number, cz: number): CameraPreset {
  switch (stage) {
    case 'approach16':
    case 'floor16':
      return {
        position: new THREE.Vector3(cx - 34, 7.5, cz + 52),
        target: new THREE.Vector3(cx, 1.5, cz),
        duration: 2.8,
      }
    case 'interior':
      return {
        position: new THREE.Vector3(cx - 5.5, 2.35, cz + 8.5),
        target: new THREE.Vector3(cx + 5.5, 1.3, cz),
        duration: 1.55,
      }
    case 'exterior':
    default:
      return {
        position: new THREE.Vector3(cx - 150, 78, cz + 220),
        target: new THREE.Vector3(cx, 17, cz),
        duration: 2.25,
      }
  }
}

export default function CameraDirector({ center, controlsRef, camApiRef }: CameraDirectorProps) {
  const { camera, gl } = useThree()
  const stage = useExperienceStore((state) => state.stage)
  const settleAtFloor16 = useExperienceStore((state) => state.settleAtFloor16)
  const enterInterior = useExperienceStore((state) => state.enterInterior)
  const finishTransition = useExperienceStore((state) => state.finishTransition)
  const active = useRef<ActiveTransition | null>(null)
  const initialized = useRef(false)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return

    const preset = makePreset(stage, center[0], center[2])
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!initialized.current || reducedMotion || stage === 'floor16') {
      camera.position.copy(preset.position)
      controls.target.copy(preset.target)
      controls.enabled = true
      controls.update()
      initialized.current = true
      active.current = null
      if (stage === 'approach16') settleAtFloor16()
      else finishTransition()
      return
    }

    controls.enabled = false
    active.current = {
      stage,
      startedAt: performance.now(),
      duration: preset.duration,
      fromPosition: camera.position.clone(),
      fromTarget: controls.target.clone(),
      toPosition: preset.position,
      toTarget: preset.target,
    }
  }, [camera, center, controlsRef, finishTransition, settleAtFloor16, stage])

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
      reset: () => {
        const preset = makePreset(stage, center[0], center[2])
        camera.position.copy(preset.position)
        controls.target.copy(preset.target)
        controls.update()
      },
      top: () => {
        controls.target.set(center[0], 0, center[2])
        camera.position.set(center[0], 105, center[2] + 0.01)
        controls.update()
      },
      enter: enterInterior,
      capture: () => {
        const url = gl.domElement.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = url
        link.download = `vmc-spatial-${Date.now()}.png`
        link.click()
      },
    }
  }, [camApiRef, camera, center, controlsRef, enterInterior, gl, stage])

  useFrame(() => {
    const transition = active.current
    const controls = controlsRef.current
    if (!transition || !controls) return

    const elapsed = (performance.now() - transition.startedAt) / 1000
    const progress = Math.min(1, elapsed / transition.duration)
    const eased = easeInOutCubic(progress)
    camera.position.lerpVectors(transition.fromPosition, transition.toPosition, eased)
    controls.target.lerpVectors(transition.fromTarget, transition.toTarget, eased)
    controls.update()

    if (progress < 1) return
    controls.enabled = true
    active.current = null
    if (transition.stage === 'approach16') settleAtFloor16()
    else finishTransition()
  })

  return null
}
