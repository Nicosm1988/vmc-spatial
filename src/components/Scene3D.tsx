import { lazy, Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ContactShadows, Edges, OrbitControls, Sky } from '@react-three/drei'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument } from '../types'
import { toM, heat, wallGeom } from '../lib/geometry'
import { scalePoly } from '../lib/plate'
import { makeCarpet } from '../lib/carpet'
import { INSIGHTS } from '../lib/insights'
import { DeskBench, VideoWall, RoundTable, Comedor, Oficina, Window } from './Furniture'
import { TorreYPF, Entorno } from './TorreYPF'
import { QUALITY_PROFILES } from '../scene/qualityProfiles'
import { useExperienceStore } from '../state/useExperienceStore'
import CameraDirector from '../scene/CameraDirector'
import type { CamApi, OrbitControlsHandle } from '../scene/cameraTypes'
import SceneMetrics from '../scene/SceneMetrics'
import { EXTERIOR_DEMO_SPEC } from '../domain/exteriorSpec'
import { mmToMeters } from '../domain/units'
import { AccessPortal } from '../scene/exterior/AccessPortal'
import PerformanceInterior from '../scene/interior/PerformanceInterior'

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

function shapeFrom(poly: Point[]) {
  const shape = new THREE.Shape()
  poly.forEach((point, index) => {
    const x = toM(point.x)
    const z = toM(point.y)
    if (index === 0) shape.moveTo(x, z)
    else shape.lineTo(x, z)
  })
  shape.closePath()
  return shape
}

function slab(poly: Point[], depth: number) {
  const geometry = new THREE.ExtrudeGeometry(shapeFrom(poly), {
    depth,
    bevelEnabled: false,
  })
  geometry.rotateX(Math.PI / 2)
  return geometry
}

function ringGeom(outer: Point[], inner: Point[], depth: number) {
  const shape = shapeFrom(outer)
  const hole = new THREE.Path()
  inner.forEach((point, index) => {
    const x = toM(point.x)
    const z = toM(point.y)
    if (index === 0) hole.moveTo(x, z)
    else hole.lineTo(x, z)
  })
  hole.closePath()
  shape.holes.push(hole)
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  geometry.rotateX(Math.PI / 2)
  return geometry
}

const toMM = (meters: number) => Math.round(meters * 1000)

function resample(poly: Point[], length: number): Point[] {
  const output: Point[] = []
  for (let index = 0; index < length; index += 1) {
    const sourceIndex = Math.round((index * (poly.length - 1)) / length)
    const point = poly[sourceIndex]
    if (point) output.push(point)
  }
  return output
}

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
  const activeScene = useExperienceStore((state) => state.activeScene)
  const showAccessPortal = useExperienceStore(
    (state) => state.stage === 'floor16' || state.transition !== null,
  )
  const night = useExperienceStore((state) => state.night)
  const quality = useExperienceStore((state) => state.resolvedQuality)
  const profile = QUALITY_PROFILES[quality]
  const isInterior = activeScene === 'interior'
  const diagnosticsEnabled = useMemo(
    () => new URLSearchParams(window.location.search).get('diagnostics') === '1',
    [],
  )

  const floorGeometry = useMemo(() => slab(doc.plate, 0.3), [doc.plate])
  const coreGeometry = useMemo(() => slab(doc.core, 0.14), [doc.core])
  const carpet = useMemo(() => makeCarpet([150, 158, 168]), [])
  const carpetDark = useMemo(() => makeCarpet([96, 100, 110]), [])
  const centerX = toM(doc.ancho) / 2
  const centerZ = toM(doc.alto) / 2
  const cameraCenter = useMemo<[number, number, number]>(
    () => [centerX, 0, centerZ],
    [centerX, centerZ],
  )
  const insightDefinition = INSIGHTS[insight]
  const coreCenterX = doc.core.reduce((sum, point) => sum + point.x, 0) / doc.core.length
  const coreCenterY = doc.core.reduce((sum, point) => sum + point.y, 0) / doc.core.length
  const coreOuter = useMemo(
    () => scalePoly(doc.core, 1.55, coreCenterX, coreCenterY),
    [coreCenterX, coreCenterY, doc.core],
  )
  const ringGeometry = useMemo(() => ringGeom(coreOuter, doc.core, 0.02), [coreOuter, doc.core])
  const windowInner = useMemo(() => scalePoly(doc.plate, 0.985, 31000, 20000), [doc.plate])
  const windowPoints = useMemo(() => resample(windowInner, 30), [windowInner])

  useEffect(
    () => () => {
      floorGeometry.dispose()
      coreGeometry.dispose()
      ringGeometry.dispose()
    },
    [coreGeometry, floorGeometry, ringGeometry],
  )

  useEffect(
    () => () => {
      carpet.dispose()
      carpetDark.dispose()
      document.body.style.cursor = 'auto'
    },
    [carpet, carpetDark],
  )

  useEffect(() => {
    if (editing) return
    drag.current = null
    document.body.style.cursor = 'auto'
    if (controls.current) controls.current.enabled = true
  }, [editing])

  function planePoint(event: { ray: THREE.Ray }) {
    const denominator = event.ray.direction.y
    if (Math.abs(denominator) < 0.0001) return { x: 0, z: 0 }
    const distance = -event.ray.origin.y / denominator
    return {
      x: event.ray.origin.x + event.ray.direction.x * distance,
      z: event.ray.origin.z + event.ray.direction.z * distance,
    }
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
    const point = planePoint(event)
    drag.current.obj.position.x = point.x
    drag.current.obj.position.z = point.z
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

  const stop = (event: any) => event.stopPropagation()
  const setCursor = (active: boolean) => {
    document.body.style.cursor = editing ? (active ? 'grab' : 'auto') : active ? 'pointer' : 'auto'
  }
  const dragHandlers = {
    onPointerMove: moveGrab,
    onPointerUp: endGrab,
    onPointerCancel: endGrab,
  }
  const wrap = (id: string, node: JSX.Element, extra: Record<string, unknown> = {}) => (
    <group
      key={id}
      onPointerDown={(event) => beginGrab(id, event)}
      onClick={stop}
      {...dragHandlers}
      onPointerOver={(event) => {
        event.stopPropagation()
        setCursor(true)
      }}
      onPointerOut={() => setCursor(false)}
      {...extra}
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
        near: 0.1,
        far: 4000,
      }}
      gl={{
        antialias: !profile.postprocessing,
        powerPreference: 'high-performance',
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: night ? 1.12 : 1.02,
        preserveDrawingBuffer: true,
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
      <fog
        attach="fog"
        args={[night ? '#08111d' : '#bcd2e6', isInterior ? 180 : 300, isInterior ? 520 : 1050]}
      />
      <hemisphereLight args={[night ? '#355579' : '#f0f6ff', '#27362f', night ? 0.72 : 1.05]} />
      <ambientLight intensity={night ? 0.4 : 0.32} />
      <directionalLight
        position={[centerX + 100, 150, centerZ - 50]}
        intensity={night ? 0.9 : 2.15}
        color={night ? '#9fb4e0' : '#fff3e0'}
        castShadow={profile.shadows}
        shadow-mapSize-width={profile.shadowMapSize}
        shadow-mapSize-height={profile.shadowMapSize}
        shadow-bias={-0.0004}
      >
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100, 0.1, 520]} />
      </directionalLight>
      <directionalLight
        position={[centerX - 130, 96, centerZ + 190]}
        intensity={night ? 0.55 : 0.82}
        color={night ? '#496582' : '#d9edff'}
      />

      {!isInterior ? (
        <group>
          <Entorno
            centerX={centerX}
            centerZ={centerZ}
            noche={night}
            detail={profile.exteriorDetail}
          />
          <TorreYPF
            centerX={centerX}
            centerZ={centerZ}
            noche={night}
            detail={profile.exteriorDetail}
          />
          {showAccessPortal ? (
            <AccessPortal centerX={centerX} centerZ={centerZ} night={night} />
          ) : null}
        </group>
      ) : !editing ? (
        <PerformanceInterior doc={doc} night={night} insight={insight} roof={techo} />
      ) : (
        <group>
          <mesh
            geometry={floorGeometry}
            position={[0, -0.02, 0]}
            receiveShadow
            onClick={() => onSelect(null)}
            {...dragHandlers}
          >
            <meshStandardMaterial map={carpet} color="#9aa2ac" roughness={0.98} metalness={0} />
          </mesh>
          <mesh geometry={ringGeometry} position={[0, 0.015, 0]} receiveShadow {...dragHandlers}>
            <meshStandardMaterial map={carpetDark} color="#6a6f79" roughness={1} metalness={0} />
          </mesh>
          {windowPoints.map((point, index) => {
            const nextPoint = windowPoints[(index + 1) % windowPoints.length]
            if (!nextPoint) return null
            const x1 = toM(point.x)
            const z1 = toM(point.y)
            const x2 = toM(nextPoint.x)
            const z2 = toM(nextPoint.y)
            const midpointX = (x1 + x2) / 2
            const midpointZ = (z1 + z2) / 2
            const length = Math.hypot(x2 - x1, z2 - z1)
            if (length < 0.3) return null
            const angle = Math.atan2(-(z2 - z1), x2 - x1)
            return (
              <group
                key={`window-${index}`}
                position={[midpointX, 0.1, midpointZ]}
                rotation={[0, angle, 0]}
              >
                <Window len={length + 0.05} height={2.9} />
              </group>
            )
          })}
          {doc.zonas
            .filter((zone) => zone.kind === 'nucleo')
            .map((zone) => (
              <mesh
                key={zone.id}
                geometry={coreGeometry}
                position={[0, 0.07, 0]}
                onClick={(event) => {
                  event.stopPropagation()
                  onSelect(zone.id)
                }}
                {...dragHandlers}
              >
                <meshStandardMaterial color="#0c1226" roughness={0.85} metalness={0.08} />
                <Edges color={zone.id === selectedId ? '#ffd166' : '#0E9BC4'} />
              </mesh>
            ))}
          {doc.videoWalls.map((wall) => {
            const geometry = wallGeom(wall)
            const midpointX = toM(geometry.cx)
            const midpointZ = toM(geometry.cy)
            const length = toM(geometry.len)
            let angle = Math.atan2(-(wall.y2 - wall.y1), wall.x2 - wall.x1)
            let flip = wall.flip
            if (flip === undefined) {
              const normalX = Math.sin(angle)
              const normalZ = Math.cos(angle)
              flip =
                normalX * (geometry.cx - coreCenterX) + normalZ * (geometry.cy - coreCenterY) < 0
            }
            if (flip) angle += Math.PI
            return wrap(
              wall.id,
              <VideoWall
                len={length}
                night={night}
                count={wall.pantallas}
                filas={wall.filas}
                selected={wall.id === selectedId}
              />,
              { position: [midpointX, 0, midpointZ], rotation: [0, angle, 0] },
            )
          })}
          {doc.zonas
            .filter((zone) => zone.kind === 'bench')
            .map((zone) => {
              const fill = insight === 'none' ? zone.color : heat(insightDefinition.value(zone))
              const length = toM((zone.pairs || 3) * 1600) + 0.6
              const selected = zone.id === selectedId
              return wrap(
                zone.id,
                <group>
                  <mesh position={[0, 0.03, 0]}>
                    <boxGeometry args={[length, 0.05, 3.3]} />
                    <meshStandardMaterial
                      color={fill}
                      roughness={0.6}
                      metalness={0.05}
                      transparent
                      opacity={0.14}
                    />
                    {selected ? <Edges color="#ffd166" /> : null}
                  </mesh>
                  <DeskBench pairs={zone.pairs || 3} screen={fill} night={night} />
                </group>,
                {
                  position: [toM(zone.cx), 0, toM(zone.cy)],
                  rotation: [0, -(zone.rot || 0), 0],
                },
              )
            })}
          {doc.zonas
            .filter((zone) => zone.kind === 'circular')
            .map((zone) => {
              const selected = zone.id === selectedId
              const radius = toM(zone.r || 1650)
              return wrap(
                zone.id,
                <group>
                  {selected ? (
                    <mesh position={[0, 0.05, 0]}>
                      <cylinderGeometry args={[radius, radius, 0.06, 24]} />
                      <meshBasicMaterial color="#ffd166" wireframe />
                    </mesh>
                  ) : null}
                  <RoundTable x={0} z={0} r={radius} seats={5} />
                </group>,
                { position: [toM(zone.cx), 0, toM(zone.cy)] },
              )
            })}
          {doc.zonas
            .filter((zone) => zone.kind === 'comedor')
            .map((zone) => {
              const selected = zone.id === selectedId
              const width = toM(zone.w || 3600)
              return wrap(
                zone.id,
                <group>
                  {selected ? (
                    <mesh position={[0, 0.05, 0]}>
                      <boxGeometry args={[width + 0.6, 0.06, 2.4]} />
                      <meshBasicMaterial color="#ffd166" wireframe />
                    </mesh>
                  ) : null}
                  <Comedor x={0} z={0} w={width} rotY={0} seats={8} />
                </group>,
                {
                  position: [toM(zone.cx), 0, toM(zone.cy)],
                  rotation: [0, -(zone.rot || 0), 0],
                },
              )
            })}
          {doc.zonas
            .filter((zone) => zone.kind === 'oficina')
            .map((zone) => {
              const width = toM(zone.w || 3800)
              const height = toM(zone.h || 2600)
              const selected = zone.id === selectedId
              return wrap(
                zone.id,
                <group>
                  <Oficina w={width} h={height} night={night} color={zone.color} />
                  {selected ? (
                    <mesh position={[0, 1.4, 0]}>
                      <boxGeometry args={[width, 2.8, height]} />
                      <meshBasicMaterial color="#ffd166" wireframe />
                    </mesh>
                  ) : null}
                </group>,
                {
                  position: [toM(zone.cx), 0, toM(zone.cy)],
                  rotation: [0, -(zone.rot || 0), 0],
                },
              )
            })}
          {techo ? (
            <mesh geometry={floorGeometry} position={[0, toM(doc.alturaLibre), 0]}>
              <meshStandardMaterial
                color="#e9e4da"
                transparent
                opacity={0.35}
                side={THREE.DoubleSide}
              />
            </mesh>
          ) : null}
          {profile.contactShadowResolution > 0 ? (
            <ContactShadows
              position={[centerX, 0.03, centerZ]}
              scale={120}
              blur={2.6}
              opacity={0.42}
              far={30}
              frames={1}
              resolution={profile.contactShadowResolution}
              color="#0a0d12"
            />
          ) : null}
        </group>
      )}

      <OrbitControls
        ref={controls}
        makeDefault
        target={[centerX, 17, centerZ]}
        enableDamping
        dampingFactor={0.09}
        zoomToCursor
        enablePan
        panSpeed={1.1}
        zoomSpeed={1.2}
        rotateSpeed={0.85}
        screenSpacePanning={false}
        maxPolarAngle={Math.PI / 1.9}
        minDistance={0.8}
        maxDistance={isInterior ? 400 : 1400}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.DOLLY,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      />
      <CameraDirector camApiRef={camApi} center={cameraCenter} controlsRef={controls} />
      {diagnosticsEnabled ? <SceneMetrics stage={stage} quality={quality} /> : null}

      {profile.postprocessing ? (
        <Suspense fallback={null}>
          <CinematicEffects night={night} />
        </Suspense>
      ) : null}
    </Canvas>
  )
}
