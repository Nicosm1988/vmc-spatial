import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { EXTERIOR_DEMO_SPEC } from '../../domain/exteriorSpec'
import { mmToMeters } from '../../domain/units'

export interface AccessPortalProps {
  centerX: number
  centerZ: number
  night: boolean
}

const FRAME_INSTANCE_COUNT = 4

export function AccessPortal({ centerX, centerZ, night }: AccessPortalProps) {
  const frames = useRef<THREE.InstancedMesh>(null)
  const { demoEntryAnchorMm: anchor, demoEntryPortal: portal } = EXTERIOR_DEMO_SPEC
  const width = mmToMeters(portal.sizeMm.width)
  const height = mmToMeters(portal.sizeMm.height)
  const depth = mmToMeters(portal.sizeMm.depth)
  const frameThickness = mmToMeters(portal.frameThicknessMm)
  const innerWidth = width - frameThickness * 2
  const innerHeight = height - frameThickness * 2

  useLayoutEffect(() => {
    if (!frames.current) return

    const matrix = new THREE.Matrix4()
    const rotation = new THREE.Quaternion()
    const verticalOffset = width / 2 - frameThickness / 2
    const horizontalOffset = height / 2 - frameThickness / 2
    const placements = [
      { position: [-verticalOffset, 0, 0], scale: [frameThickness, height, depth] },
      { position: [verticalOffset, 0, 0], scale: [frameThickness, height, depth] },
      { position: [0, -horizontalOffset, 0], scale: [innerWidth, frameThickness, depth] },
      { position: [0, horizontalOffset, 0], scale: [innerWidth, frameThickness, depth] },
    ] as const

    placements.forEach((placement, index) => {
      matrix.compose(
        new THREE.Vector3(...placement.position),
        rotation,
        new THREE.Vector3(...placement.scale),
      )
      frames.current?.setMatrixAt(index, matrix)
    })
    frames.current.instanceMatrix.needsUpdate = true
    frames.current.computeBoundingSphere()
  }, [depth, frameThickness, height, innerWidth, width])

  return (
    <group
      name={portal.id}
      position={[
        centerX + mmToMeters(anchor.x),
        mmToMeters(anchor.elevation),
        centerZ + mmToMeters(anchor.y),
      ]}
      rotation={[0, portal.rotationRad, 0]}
      userData={{ classification: 'DEMO / NO VERIFICADO', role: 'floor-16-access-portal' }}
    >
      <instancedMesh
        ref={frames}
        name={`${portal.id}-frame`}
        args={[undefined, undefined, FRAME_INSTANCE_COUNT]}
        renderOrder={11}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={night ? '#58e7d5' : '#d9ffff'}
          emissive={night ? '#1fd6c1' : '#136d72'}
          emissiveIntensity={night ? 1.35 : 0.35}
          metalness={0.22}
          roughness={0.3}
        />
      </instancedMesh>
      <mesh name={`${portal.id}-glazing`} position={[0, 0, depth / 2]} renderOrder={12}>
        <planeGeometry args={[innerWidth, innerHeight]} />
        <meshBasicMaterial
          color={night ? '#35e8d2' : '#5edfdc'}
          transparent
          opacity={night ? 0.3 : 0.18}
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
    </group>
  )
}
