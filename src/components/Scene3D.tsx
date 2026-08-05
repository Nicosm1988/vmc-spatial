import { lazy, Suspense, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Edges, MapControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import type { InsightKey, VmcDocument, Zone } from '../types'
import { toM } from '../lib/geometry'
import { TorreYPF, Entorno } from './TorreYPF'
import { QUALITY_PROFILES } from '../scene/qualityProfiles'
import { useExperienceStore } from '../state/useExperienceStore'
import CameraDirector from '../scene/CameraDirector'
import type { CamApi, OrbitControlsHandle } from '../scene/cameraTypes'
import SceneMetrics from '../scene/SceneMetrics'
import { EXTERIOR_DEMO_SPEC } from '../domain/exteriorSpec'
import { mmToMeters } from '../domain/units'
import PerformanceInterior from '../scene/interior/PerformanceInterior'
import { resolveVideoWallArchitecture } from '../scene/interior/performanceInteriorLayout'
import ProceduralEnvironment from '../scene/ProceduralEnvironment'
import { FLOOR16_WORLD_FRAME, worldToFloorLocal } from '../scene/spatialFrame'

const CinematicEffects = lazy(() => import('../scene/CinematicEffects'))

export type { CamApi } from '../scene/cameraTypes'

interface Props {
  doc: VmcDocument
  selectedId: string | null
  insight: InsightKey
  techo: boolean
  editing: boolean
  snap: boolean
  camApi: React.MutableRefObject<CamApi>
  onSelect: (id: string | null) => void
  onMove: (id: string, cxmm: number, cymm: number) => void
}

interface EditorProxyProps {
  zone: Zone
  selected: boolean
}

function DistanceAwareFloor({
  children,
  center,
}: {
  children: ReactNode
  center: readonly [number, number, number]
}) {
  const group = useRef<THREE.Group>(null)
  const revealDistanceSquared = 112 * 112
  const hideDistanceSquared = 124 * 124

  useFrame(({ camera }) => {
    if (!group.current) return
    const distanceSquared =
      (camera.position.x - center[0]) ** 2 +
      (camera.position.y - center[1]) ** 2 +
      (camera.position.z - center[2]) ** 2
    const experience = useExperienceStore.getState()
    const transitionRevealsFloor =
      experience.transition?.to !== 'exterior' &&
      (experience.transition?.phase === 'cover' ||
        experience.transition?.phase === 'handoff' ||
        experience.transition?.phase === 'reveal')
    if (experience.stage !== 'exterior' || transitionRevealsFloor) {
      group.current.visible = true
      return
    }
    group.current.visible = group.current.visible
      ? distanceSquared < hideDistanceSquared
      : distanceSquared < revealDistanceSquared
  })

  return <group ref={group}>{children}</group>
}

function EditorZoneProxy({ zone, selected }: EditorProxyProps) {
  const color = selected ? '#ffd166' : '#31d7c5'
  if (zone.kind === 'circular') {
    const radius = toM(zone.r ?? 1650)
    return (
      <mesh position={[0, 0.75, 0]}>
        <cylinderGeometry args={[radius, radius, 1.5, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={selected ? 0.08 : 0}
          depthWrite={false}
        />
        {selected ? <Edges color={color} /> : null}
      </mesh>
    )
  }

  const dimensions: [number, number, number] =
    zone.kind === 'bench'
      ? [toM((zone.pairs ?? 3) * 1600) + 0.6, 1.55, 3.3]
      : zone.kind === 'comedor'
        ? [toM(zone.w ?? 3600) + 0.5, 1.4, 2.5]
        : [toM(zone.w ?? 3800), 2.8, toM(zone.h ?? 2600)]

  return (
    <mesh position={[0, dimensions[1] / 2, 0]}>
      <boxGeometry args={dimensions} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={selected ? 0.07 : 0}
        depthWrite={false}
      />
      {selected ? <Edges color={color} /> : null}
    </mesh>
  )
}

function EditorWallProxy({ length, selected }: { length: number; selected: boolean }) {
  const color = selected ? '#ffd166' : '#31d7c5'
  return (
    <mesh position={[0, 1.55, 0]}>
      <boxGeometry args={[length, 3.1, 0.38]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={selected ? 0.08 : 0}
        depthWrite={false}
      />
      {selected ? <Edges color={color} /> : null}
    </mesh>
  )
}

const toMM = (meters: number) => Math.round(meters * 1000)

export default function Scene3D({
  doc,
  selectedId,
  insight,
  techo,
  editing,
  snap,
  camApi,
  onSelect,
  onMove,
}: Props) {
  const controls = useRef<OrbitControlsHandle | null>(null)
  const drag = useRef<{ id: string; obj: THREE.Object3D } | null>(null)
  const stage = useExperienceStore((state) => state.stage)
  const night = useExperienceStore((state) => state.night)
  const quality = useExperienceStore((state) => state.resolvedQuality)
  const profile = QUALITY_PROFILES[quality]
  const floorCenterX = toM(doc.ancho) / 2
  const floorCenterZ = toM(doc.alto) / 2
  const centerX = FLOOR16_WORLD_FRAME.centerXM
  const centerZ = FLOOR16_WORLD_FRAME.centerYM
  const cameraCenter = useMemo<[number, number, number]>(
    () => [centerX, FLOOR16_WORLD_FRAME.elevationM, centerZ],
    [centerX, centerZ],
  )
  const daylightTarget = useMemo(() => {
    const target = new THREE.Object3D()
    target.position.set(centerX, FLOOR16_WORLD_FRAME.elevationM, centerZ)
    return target
  }, [centerX, centerZ])
  const diagnosticsEnabled = useMemo(
    () => new URLSearchParams(window.location.search).get('diagnostics') === '1',
    [],
  )
  const videoWallArchitecture = useMemo(() => resolveVideoWallArchitecture(doc), [doc])

  useEffect(
    () => () => {
      document.body.style.cursor = 'auto'
    },
    [],
  )

  useEffect(() => {
    if (editing) return
    drag.current = null
    document.body.style.cursor = 'auto'
    if (controls.current) controls.current.enabled = true
  }, [editing])

  function floorPoint(event: { ray: THREE.Ray }) {
    const denominator = event.ray.direction.y
    if (Math.abs(denominator) < 0.0001) return { x: centerX, y: centerZ }
    const distance = (FLOOR16_WORLD_FRAME.elevationM - event.ray.origin.y) / denominator
    return worldToFloorLocal(
      {
        x: event.ray.origin.x + event.ray.direction.x * distance,
        y: FLOOR16_WORLD_FRAME.elevationM,
        z: event.ray.origin.z + event.ray.direction.z * distance,
      },
      { x: floorCenterX, y: floorCenterZ },
    )
  }

  function beginGrab(id: string, event: any) {
    onSelect(id)
    if (!editing) return
    event.stopPropagation()
    if (controls.current) controls.current.enabled = false
    drag.current = { id, obj: event.eventObject as THREE.Object3D }
    ;(event.target as Element)?.setPointerCapture?.(event.pointerId)
  }

  function moveGrab(event: any) {
    if (!drag.current) return
    event.stopPropagation()
    const point = floorPoint(event)
    drag.current.obj.position.x = point.x
    drag.current.obj.position.z = point.y
  }

  function endGrab() {
    if (drag.current) {
      let nextX = toMM(drag.current.obj.position.x)
      let nextY = toMM(drag.current.obj.position.z)
      if (snap) {
        nextX = Math.round(nextX / 250) * 250
        nextY = Math.round(nextY / 250) * 250
      }
      onMove(drag.current.id, nextX, nextY)
      drag.current = null
    }
    if (controls.current) controls.current.enabled = true
  }

  const setCursor = (active: boolean) => {
    document.body.style.cursor = editing ? (active ? 'grab' : 'auto') : 'auto'
  }
  const dragHandlers = {
    onPointerMove: moveGrab,
    onPointerUp: endGrab,
    onPointerCancel: endGrab,
  }
  const wrapProxy = (
    id: string,
    node: JSX.Element,
    position: [number, number, number],
    rotationY = 0,
  ) => (
    <group
      key={id}
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerDown={(event) => beginGrab(id, event)}
      onClick={(event) => event.stopPropagation()}
      {...dragHandlers}
      onPointerOver={(event) => {
        event.stopPropagation()
        setCursor(true)
      }}
      onPointerOut={() => setCursor(false)}
    >
      {node}
    </group>
  )
  const wrapFixedProxy = (
    id: string,
    node: JSX.Element,
    position: [number, number, number],
    rotationY = 0,
  ) => (
    <group
      key={id}
      position={position}
      rotation={[0, rotationY, 0]}
      onPointerDown={(event) => {
        event.stopPropagation()
        onSelect(id)
      }}
      onClick={(event) => event.stopPropagation()}
      onPointerOver={(event) => {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
    >
      {node}
    </group>
  )

  return (
    <Canvas
      className="scene-canvas"
      shadows={profile.shadows}
      dpr={Math.min(profile.dpr, window.devicePixelRatio || 1)}
      camera={{
        position: [
          centerX - mmToMeters(EXTERIOR_DEMO_SPEC.heightMm) * 0.94,
          mmToMeters(EXTERIOR_DEMO_SPEC.heightMm) * 0.49,
          centerZ + mmToMeters(EXTERIOR_DEMO_SPEC.heightMm) * 1.375,
        ],
        fov: 44,
        near: 0.08,
        far: 4000,
      }}
      gl={{
        antialias: !profile.postprocessing,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: night ? 1.02 : 0.9,
        preserveDrawingBuffer: true,
      }}
      onCreated={({ gl }) => {
        gl.domElement.dataset.sceneComposition = 'unified-world'
        gl.domElement.dataset.interiorRenderer = 'shared'
      }}
      onPointerMissed={() => onSelect(null)}
    >
      {!night ? (
        <Sky
          distance={1500}
          sunPosition={[130, 45, 90]}
          turbidity={2.6}
          rayleigh={0.9}
          mieCoefficient={0.004}
          mieDirectionalG={0.88}
        />
      ) : (
        <color attach="background" args={['#02050b']} />
      )}
      <fog attach="fog" args={[night ? '#08111d' : '#bcd2e6', 240, 1100]} />
      <hemisphereLight args={[night ? '#355579' : '#f0f6ff', '#27362f', night ? 0.7 : 1.02]} />
      <ambientLight intensity={night ? 0.35 : 0.28} />
      <primitive object={daylightTarget} />
      <directionalLight
        position={[centerX + 100, 150, centerZ - 50]}
        target={daylightTarget}
        intensity={night ? 0.9 : 2.05}
        color={night ? '#9fb4e0' : '#fff3e0'}
        castShadow={profile.shadows}
        shadow-mapSize-width={profile.shadowMapSize}
        shadow-mapSize-height={profile.shadowMapSize}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
      >
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100, 0.1, 520]} />
      </directionalLight>
      <directionalLight
        position={[centerX - 130, 96, centerZ + 190]}
        target={daylightTarget}
        intensity={night ? 0.5 : 0.78}
        color={night ? '#496582' : '#d9edff'}
      />

      <ProceduralEnvironment />
      <Entorno centerX={centerX} centerZ={centerZ} noche={night} detail={profile.exteriorDetail} />
      <TorreYPF centerX={centerX} centerZ={centerZ} noche={night} detail={profile.exteriorDetail} />

      <group
        name="floor16-shared-world-frame"
        position={[centerX, FLOOR16_WORLD_FRAME.elevationM, centerZ]}
        rotation={[0, FLOOR16_WORLD_FRAME.rotationRad, 0]}
      >
        <group position={[-floorCenterX, 0, -floorCenterZ]}>
          <DistanceAwareFloor center={cameraCenter}>
            <PerformanceInterior doc={doc} night={night} insight={insight} roof={techo} />

            {editing ? (
              <group name="editor-selection-layer">
                {doc.zonas
                  .filter((zone) => zone.kind !== 'nucleo')
                  .map((zone) =>
                    wrapProxy(
                      zone.id,
                      <EditorZoneProxy zone={zone} selected={zone.id === selectedId} />,
                      [toM(zone.cx), 0, toM(zone.cy)],
                      -(zone.rot ?? 0),
                    ),
                  )}
                {doc.videoWalls.map((wall) => {
                  const geometry = videoWallArchitecture.walls.find(
                    (structure) => structure.ownerId === wall.id,
                  )
                  if (!geometry) return null
                  return wrapFixedProxy(
                    wall.id,
                    <EditorWallProxy length={geometry.length} selected={wall.id === selectedId} />,
                    [geometry.centerX, 0, geometry.centerZ],
                    geometry.rotationY,
                  )
                })}
              </group>
            ) : null}
          </DistanceAwareFloor>
        </group>
      </group>

      <MapControls
        ref={controls}
        makeDefault
        target={[centerX, 17, centerZ]}
        enableDamping
        dampingFactor={0.1}
        zoomToCursor
        enablePan
        panSpeed={1.15}
        zoomSpeed={1.25}
        rotateSpeed={0.8}
        screenSpacePanning
        maxPolarAngle={Math.PI / 2 - 0.02}
        minDistance={0.45}
        maxDistance={1400}
        mouseButtons={{
          LEFT: THREE.MOUSE.PAN,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
        touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }}
      />
      <CameraDirector
        camApiRef={camApi}
        center={cameraCenter}
        controlsRef={controls}
        editing={editing}
      />
      {diagnosticsEnabled ? <SceneMetrics stage={stage} quality={quality} /> : null}

      {profile.postprocessing ? (
        <Suspense fallback={null}>
          <CinematicEffects night={night} />
        </Suspense>
      ) : null}
    </Canvas>
  )
}
