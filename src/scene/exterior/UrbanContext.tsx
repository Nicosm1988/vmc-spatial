import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  EXTERIOR_DEMO_SPEC,
  type ExteriorDetail,
  type ExteriorSiteElementSpec,
} from '../../domain/exteriorSpec'
import { mmToMeters } from '../../domain/units'

export interface UrbanContextProps {
  centerX: number
  centerZ: number
  noche: boolean
  detail?: ExteriorDetail
}

function requireSiteElement(kind: ExteriorSiteElementSpec['kind']) {
  const element = EXTERIOR_DEMO_SPEC.site.elements.find((candidate) => candidate.kind === kind)
  if (!element) throw new Error(`The validated exterior spec requires a ${kind} site element`)
  return element
}

function TreeInstances({
  centerX,
  centerZ,
  night,
  detail,
  ring,
}: {
  centerX: number
  centerZ: number
  night: boolean
  detail: ExteriorDetail
  ring: ExteriorSiteElementSpec
}) {
  const trunkRef = useRef<THREE.InstancedMesh>(null)
  const canopyRef = useRef<THREE.InstancedMesh>(null)
  const count = detail === 'near' ? 42 : detail === 'mid' ? 24 : 10
  const inner = mmToMeters(ring.innerRadiusMm ?? ring.sizeMm.width * 0.22)
  const outer = mmToMeters(ring.outerRadiusMm ?? ring.sizeMm.width * 0.5)
  const ground = mmToMeters(ring.elevationMm)
  const trunkHeight = mmToMeters(ring.sizeMm.width) * 0.023

  const placements = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * Math.PI * 2 + (index % 3) * 0.07
        const radialMix = ((index * 7) % 13) / 12
        const radius = THREE.MathUtils.lerp(inner * 1.12, outer * 0.88, radialMix)
        return {
          x: centerX + Math.cos(angle) * radius,
          z: centerZ + Math.sin(angle) * radius,
          scale: 0.82 + (index % 5) * 0.07,
        }
      }),
    [centerX, centerZ, count, inner, outer],
  )

  useLayoutEffect(() => {
    if (!trunkRef.current || !canopyRef.current) return
    const matrix = new THREE.Matrix4()
    placements.forEach((placement, index) => {
      const height = trunkHeight * placement.scale
      matrix.compose(
        new THREE.Vector3(placement.x, ground + height / 2, placement.z),
        new THREE.Quaternion(),
        new THREE.Vector3(height * 0.085, height, height * 0.085),
      )
      trunkRef.current?.setMatrixAt(index, matrix)

      matrix.compose(
        new THREE.Vector3(placement.x, ground + height * 1.22, placement.z),
        new THREE.Quaternion(),
        new THREE.Vector3(height * 0.62, height * 0.72, height * 0.62),
      )
      canopyRef.current?.setMatrixAt(index, matrix)
    })
    trunkRef.current.instanceMatrix.needsUpdate = true
    canopyRef.current.instanceMatrix.needsUpdate = true
    trunkRef.current.computeBoundingSphere()
    canopyRef.current.computeBoundingSphere()
  }, [ground, placements, trunkHeight])

  return (
    <group name="conceptual-vegetation">
      <instancedMesh
        ref={trunkRef}
        args={[undefined, undefined, count]}
        castShadow={detail === 'near'}
      >
        <cylinderGeometry args={[0.5, 0.68, 1, 6]} />
        <meshStandardMaterial color={night ? '#362b23' : '#5a4531'} roughness={1} />
      </instancedMesh>
      <instancedMesh
        ref={canopyRef}
        args={[undefined, undefined, count]}
        castShadow={detail === 'near'}
      >
        <icosahedronGeometry args={[1, detail === 'near' ? 1 : 0]} />
        <meshStandardMaterial color={night ? '#173822' : '#3f7446'} roughness={0.94} />
      </instancedMesh>
    </group>
  )
}

function Pergola({
  centerX,
  centerZ,
  promenade,
  night,
}: {
  centerX: number
  centerZ: number
  promenade: ExteriorSiteElementSpec
  night: boolean
}) {
  const columns = useRef<THREE.InstancedMesh>(null)
  const count = 12
  const inner = mmToMeters(promenade.innerRadiusMm ?? promenade.sizeMm.width * 0.44)
  const outer = mmToMeters(promenade.outerRadiusMm ?? promenade.sizeMm.width * 0.5)
  const radius = (inner + outer) / 2
  const ground = mmToMeters(promenade.elevationMm)
  const height = mmToMeters(promenade.sizeMm.width) * 0.045
  const arc = Math.PI * 1.35

  useLayoutEffect(() => {
    if (!columns.current) return
    const matrix = new THREE.Matrix4()
    for (let index = 0; index < count; index += 1) {
      const angle = -arc / 2 + (index / (count - 1)) * arc
      matrix.compose(
        new THREE.Vector3(
          centerX + Math.cos(angle) * radius,
          ground + height / 2,
          centerZ + Math.sin(angle) * radius,
        ),
        new THREE.Quaternion(),
        new THREE.Vector3(height * 0.055, height, height * 0.055),
      )
      columns.current.setMatrixAt(index, matrix)
    }
    columns.current.instanceMatrix.needsUpdate = true
    columns.current.computeBoundingSphere()
  }, [arc, centerX, centerZ, ground, height, radius])

  return (
    <group name="conceptual-pergola">
      <instancedMesh ref={columns} args={[undefined, undefined, count]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1, 8]} />
        <meshStandardMaterial
          color={night ? '#5f6a70' : '#d3d1c8'}
          metalness={0.38}
          roughness={0.42}
        />
      </instancedMesh>
      <mesh
        position={[centerX, ground + height, centerZ]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <torusGeometry args={[radius, height * 0.065, 6, 48, arc]} />
        <meshStandardMaterial
          color={night ? '#69747b' : '#dedbd2'}
          metalness={0.42}
          roughness={0.38}
        />
      </mesh>
    </group>
  )
}

export function UrbanContext({ centerX, centerZ, noche, detail = 'near' }: UrbanContextProps) {
  const ground = requireSiteElement('ground')
  const greenRing = requireSiteElement('green-ring')
  const promenade = requireSiteElement('promenade')
  const street = requireSiteElement('street')
  const water = requireSiteElement('water')

  return (
    <group name={EXTERIOR_DEMO_SPEC.site.id}>
      <mesh
        position={[
          centerX + mmToMeters(ground.centerMm.x),
          mmToMeters(ground.elevationMm),
          centerZ + mmToMeters(ground.centerMm.y),
        ]}
        rotation={[-Math.PI / 2, 0, ground.rotationRad]}
        receiveShadow
      >
        <planeGeometry args={[mmToMeters(ground.sizeMm.width), mmToMeters(ground.sizeMm.depth)]} />
        <meshStandardMaterial color={noche ? '#111a22' : '#8d9491'} roughness={0.98} />
      </mesh>

      <mesh
        position={[centerX, mmToMeters(greenRing.elevationMm), centerZ]}
        rotation={[-Math.PI / 2, 0, greenRing.rotationRad]}
        receiveShadow
      >
        <ringGeometry
          args={[
            mmToMeters(greenRing.innerRadiusMm ?? 1),
            mmToMeters(greenRing.outerRadiusMm ?? 2),
            detail === 'far' ? 32 : 72,
          ]}
        />
        <meshStandardMaterial color={noche ? '#102c1b' : '#4c8450'} roughness={0.96} />
      </mesh>

      <mesh
        position={[centerX, mmToMeters(promenade.elevationMm), centerZ]}
        rotation={[-Math.PI / 2, 0, promenade.rotationRad]}
        receiveShadow
      >
        <ringGeometry
          args={[
            mmToMeters(promenade.innerRadiusMm ?? 1),
            mmToMeters(promenade.outerRadiusMm ?? 2),
            detail === 'far' ? 32 : 72,
          ]}
        />
        <meshStandardMaterial color={noche ? '#667079' : '#d6d4cd'} roughness={0.88} />
      </mesh>

      <mesh
        position={[
          centerX + mmToMeters(street.centerMm.x),
          mmToMeters(street.elevationMm),
          centerZ + mmToMeters(street.centerMm.y),
        ]}
        rotation={[-Math.PI / 2, 0, street.rotationRad]}
        receiveShadow
      >
        <planeGeometry args={[mmToMeters(street.sizeMm.width), mmToMeters(street.sizeMm.depth)]} />
        <meshStandardMaterial color={noche ? '#141a22' : '#343b42'} roughness={0.92} />
      </mesh>

      <mesh
        position={[
          centerX + mmToMeters(water.centerMm.x),
          mmToMeters(water.elevationMm),
          centerZ + mmToMeters(water.centerMm.y),
        ]}
        rotation={[-Math.PI / 2, 0, water.rotationRad]}
      >
        <planeGeometry args={[mmToMeters(water.sizeMm.width), mmToMeters(water.sizeMm.depth)]} />
        <meshPhysicalMaterial
          color={noche ? '#0d3550' : '#4c7e98'}
          metalness={0.32}
          roughness={0.2}
          clearcoat={detail === 'near' ? 0.48 : 0}
        />
      </mesh>

      <TreeInstances
        centerX={centerX}
        centerZ={centerZ}
        night={noche}
        detail={detail}
        ring={greenRing}
      />
      {detail === 'near' ? (
        <Pergola centerX={centerX} centerZ={centerZ} promenade={promenade} night={noche} />
      ) : null}
    </group>
  )
}
