import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument } from '../../types'
import { mmToMeters } from '../../domain/units'
import {
  buildPerformanceInteriorLayout,
  type PerformanceInstance,
} from './performanceInteriorLayout'

export interface PerformanceInteriorProps {
  doc: VmcDocument
  night: boolean
  insight: InsightKey
  roof?: boolean
}

interface InstanceBatchProps {
  placements: PerformanceInstance[]
  transparent?: boolean
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
  metalness?: number
  roughness?: number
  renderOrder?: number
  cylinder?: boolean
  depthWrite?: boolean
  name: string
}

function horizontalShape(points: readonly Point[]) {
  const shape = new THREE.Shape()
  points.forEach((point, index) => {
    const x = mmToMeters(point.x)
    const z = mmToMeters(point.y)
    if (index === 0) shape.moveTo(x, z)
    else shape.lineTo(x, z)
  })
  shape.closePath()
  return shape
}

function horizontalExtrusion(points: readonly Point[], height: number) {
  const geometry = new THREE.ExtrudeGeometry(horizontalShape(points), {
    depth: height,
    bevelEnabled: false,
  })
  geometry.rotateX(Math.PI / 2)
  geometry.translate(0, height, 0)
  return geometry
}

function coreCarpetRing(core: readonly Point[]) {
  const centerX = core.reduce((sum, point) => sum + point.x, 0) / core.length
  const centerY = core.reduce((sum, point) => sum + point.y, 0) / core.length
  const outer = core.map((point) => ({
    x: Math.round(centerX + (point.x - centerX) * 1.55),
    y: Math.round(centerY + (point.y - centerY) * 1.55),
  }))
  const shape = horizontalShape(outer)
  const hole = new THREE.Path()
  core.forEach((point, index) => {
    const x = mmToMeters(point.x)
    const z = mmToMeters(point.y)
    if (index === 0) hole.moveTo(x, z)
    else hole.lineTo(x, z)
  })
  hole.closePath()
  shape.holes.push(hole)
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.025, bevelEnabled: false })
  geometry.rotateX(Math.PI / 2)
  geometry.translate(0, 0.025, 0)
  return geometry
}

function useInstances(
  ref: React.RefObject<THREE.InstancedMesh>,
  placements: PerformanceInstance[],
) {
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const quaternion = new THREE.Quaternion()
    const rotation = new THREE.Euler()
    const scale = new THREE.Vector3()
    const color = new THREE.Color()

    mesh.count = placements.length
    mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
    placements.forEach((placement, index) => {
      position.fromArray(placement.position)
      rotation.set(...placement.rotation)
      quaternion.setFromEuler(rotation)
      scale.fromArray(placement.scale)
      matrix.compose(position, quaternion, scale)
      mesh.setMatrixAt(index, matrix)
      color.set(placement.color)
      mesh.setColorAt(index, color)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [placements, ref])
}

function InstanceBatch({
  placements,
  transparent = false,
  opacity = 1,
  emissive = '#000000',
  emissiveIntensity = 0,
  metalness = 0.05,
  roughness = 0.7,
  renderOrder,
  cylinder = false,
  depthWrite = true,
  name,
}: InstanceBatchProps) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useInstances(ref, placements)

  if (placements.length === 0) return null

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, placements.length]}
      name={name}
      renderOrder={renderOrder}
    >
      {cylinder ? <cylinderGeometry args={[0.5, 0.5, 1, 12]} /> : <boxGeometry args={[1, 1, 1]} />}
      <meshStandardMaterial
        color="#ffffff"
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={roughness}
        transparent={transparent}
        opacity={opacity}
        depthWrite={depthWrite}
        side={transparent ? THREE.DoubleSide : THREE.FrontSide}
        toneMapped={emissiveIntensity === 0}
      />
    </instancedMesh>
  )
}

/**
 * Procedural, presentation-only interior. It deliberately batches repeated
 * objects and keeps editing on the detailed renderer. Geometry remains
 * DEMO / NO VERIFICADA and is derived from the same validated document.
 */
export default function PerformanceInterior({
  doc,
  night,
  insight,
  roof = false,
}: PerformanceInteriorProps) {
  const layout = useMemo(() => buildPerformanceInteriorLayout(doc, insight), [doc, insight])
  const floorGeometry = useMemo(() => horizontalExtrusion(doc.plate, 0.08), [doc.plate])
  const coreGeometry = useMemo(() => horizontalExtrusion(doc.core, 2.8), [doc.core])
  const ringGeometry = useMemo(() => coreCarpetRing(doc.core), [doc.core])

  useEffect(
    () => () => {
      floorGeometry.dispose()
      coreGeometry.dispose()
      ringGeometry.dispose()
    },
    [coreGeometry, floorGeometry, ringGeometry],
  )

  return (
    <group
      name="performance-interior"
      userData={{
        classification: 'DEMO / NO VERIFICADO',
        renderer: 'procedural-presentation',
      }}
    >
      <mesh geometry={floorGeometry} receiveShadow name="presentation-carpet-floor">
        <meshStandardMaterial
          color={night ? '#646b75' : '#969eaa'}
          roughness={0.98}
          metalness={0}
        />
      </mesh>
      <mesh geometry={ringGeometry} position={[0, 0.065, 0]} receiveShadow>
        <meshStandardMaterial color={night ? '#444a55' : '#666d77'} roughness={1} />
      </mesh>
      <mesh geometry={coreGeometry}>
        <meshStandardMaterial
          color={night ? '#080d19' : '#10182c'}
          roughness={0.84}
          metalness={0.08}
        />
      </mesh>

      <InstanceBatch
        placements={layout.accentPads}
        transparent
        opacity={0.2}
        roughness={0.78}
        depthWrite={false}
        renderOrder={2}
        name="zone-accents"
      />
      <InstanceBatch
        placements={layout.windowGlass}
        transparent
        opacity={night ? 0.1 : 0.18}
        metalness={0.08}
        roughness={0.18}
        depthWrite={false}
        renderOrder={3}
        name="perimeter-glass"
      />
      <InstanceBatch
        placements={layout.windowFrames}
        metalness={0.55}
        roughness={0.46}
        name="perimeter-frames"
      />
      <InstanceBatch
        placements={layout.officeGlass}
        transparent
        opacity={0.13}
        metalness={0.05}
        roughness={0.2}
        depthWrite={false}
        renderOrder={2}
        name="office-glass"
      />

      <InstanceBatch
        placements={layout.videoWallShells}
        roughness={0.82}
        name="video-wall-shells"
      />
      <InstanceBatch
        placements={layout.videoWallScreens}
        emissive={night ? '#126b80' : '#0c4e63'}
        emissiveIntensity={night ? 1.25 : 0.72}
        metalness={0.08}
        roughness={0.22}
        name="video-wall-screens"
      />

      <InstanceBatch placements={layout.tableTops} roughness={0.48} name="table-tops" />
      <InstanceBatch
        placements={layout.tableLegs}
        metalness={0.42}
        roughness={0.46}
        name="table-legs"
      />
      <InstanceBatch
        placements={layout.roundTableTops}
        cylinder
        metalness={0.14}
        roughness={0.42}
        name="round-table-tops"
      />
      <InstanceBatch
        placements={layout.roundPedestals}
        cylinder
        metalness={0.42}
        roughness={0.46}
        name="round-table-pedestals"
      />
      <InstanceBatch placements={layout.chairSeats} roughness={0.88} name="chair-seats" />
      <InstanceBatch placements={layout.chairBacks} roughness={0.74} name="chair-backs" />
      <InstanceBatch
        placements={layout.monitorBodies}
        emissive={night ? '#145970' : '#0b3e54'}
        emissiveIntensity={night ? 0.92 : 0.48}
        metalness={0.08}
        roughness={0.24}
        name="workstation-monitors"
      />
      <InstanceBatch
        placements={layout.monitorStands}
        metalness={0.5}
        roughness={0.42}
        name="monitor-stands"
      />

      {roof ? (
        <mesh geometry={floorGeometry} position={[0, mmToMeters(doc.alturaLibre), 0]}>
          <meshStandardMaterial
            color={night ? '#6d6d70' : '#e9e4da'}
            transparent
            opacity={0.32}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}
    </group>
  )
}
