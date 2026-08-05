import { Detailed } from '@react-three/drei'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import {
  EXTERIOR_DEMO_SPEC,
  type ExteriorDetail,
  type ExteriorGardenModuleSpec,
} from '../../domain/exteriorSpec'
import { mmToMeters } from '../../domain/units'
import {
  createCurvedProwShape,
  createFacadeLineGeometry,
  createMassingGeometry,
  createRoundedSquareShape,
} from './exteriorGeometry'

export interface TowerExteriorProps {
  centerX: number
  centerZ: number
  noche: boolean
  detail?: ExteriorDetail
}

const YPF_STROKES = [
  // Y
  { x: -5.95, y: 1.22, width: 0.62, height: 2.55, rotationZ: 0.52 },
  { x: -4.72, y: 1.22, width: 0.62, height: 2.55, rotationZ: -0.52 },
  { x: -5.34, y: -1.05, width: 0.68, height: 2.65, rotationZ: 0 },
  // P
  { x: -0.82, y: 0, width: 0.68, height: 4.75, rotationZ: 0 },
  { x: 0.48, y: 2.04, width: 3.25, height: 0.64, rotationZ: 0 },
  { x: 0.34, y: 0.15, width: 2.95, height: 0.64, rotationZ: 0 },
  { x: 1.72, y: 1.1, width: 0.64, height: 2.5, rotationZ: 0 },
  // F
  { x: 4.62, y: 0, width: 0.68, height: 4.75, rotationZ: 0 },
  { x: 5.98, y: 2.04, width: 3.4, height: 0.64, rotationZ: 0 },
  { x: 5.72, y: 0.15, width: 2.9, height: 0.64, rotationZ: 0 },
] as const

const YPF_STROKE_DESIGN_WIDTH_M = 14.53
const YPF_STROKE_DESIGN_HEIGHT_M = 4.86

function YpfFacadeSign({ night }: { night: boolean }) {
  const signage = EXTERIOR_DEMO_SPEC.signage
  const letters = useRef<THREE.InstancedMesh>(null)

  useLayoutEffect(() => {
    if (!letters.current) return
    const matrix = new THREE.Matrix4()
    const quaternion = new THREE.Quaternion()
    YPF_STROKES.forEach((stroke, index) => {
      quaternion.setFromEuler(new THREE.Euler(0, 0, stroke.rotationZ))
      matrix.compose(
        new THREE.Vector3(stroke.x, stroke.y, 0),
        quaternion,
        new THREE.Vector3(stroke.width, stroke.height, 0.22),
      )
      letters.current?.setMatrixAt(index, matrix)
    })
    letters.current.instanceMatrix.needsUpdate = true
    letters.current.computeBoundingSphere()
  }, [])

  return (
    <group
      name="ypf-facade-sign-demo"
      position={[
        mmToMeters(signage.positionMm.x),
        mmToMeters(signage.positionMm.elevation),
        mmToMeters(signage.positionMm.y),
      ]}
      rotation={[0, signage.rotationRad, 0]}
      scale={[
        mmToMeters(signage.widthMm) / YPF_STROKE_DESIGN_WIDTH_M,
        mmToMeters(signage.heightMm) / YPF_STROKE_DESIGN_HEIGHT_M,
        1,
      ]}
      userData={{
        classification: 'DEMO / NO VERIFICADO',
        provenance: 'procedural letters; no YPF logo asset embedded',
      }}
      renderOrder={6}
    >
      <instancedMesh ref={letters} args={[undefined, undefined, YPF_STROKES.length]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={night ? '#f2fbff' : '#ffffff'}
          emissive={night ? '#b8ddf0' : '#202830'}
          emissiveIntensity={night ? 1.25 : 0.08}
          metalness={0.12}
          roughness={0.24}
        />
      </instancedMesh>
    </group>
  )
}

function GardenFacade({
  modules,
  night,
}: {
  modules: readonly ExteriorGardenModuleSpec[]
  night: boolean
}) {
  const panes = useRef<THREE.InstancedMesh>(null)
  const canopies = useRef<THREE.InstancedMesh>(null)
  const trunks = useRef<THREE.InstancedMesh>(null)
  const firstModule = modules[0]
  const canopyCount = 5

  useLayoutEffect(() => {
    if (!panes.current || !firstModule) return
    const matrix = new THREE.Matrix4()
    const position = new THREE.Vector3()
    const rotation = new THREE.Quaternion()
    const scale = new THREE.Vector3()
    const euler = new THREE.Euler()

    modules.forEach((module, index) => {
      position.set(
        mmToMeters(module.positionMm.x),
        mmToMeters(module.positionMm.elevation),
        mmToMeters(module.positionMm.y),
      )
      euler.set(0, module.rotationRad, 0)
      rotation.setFromEuler(euler)
      scale.set(
        mmToMeters(module.sizeMm.width),
        mmToMeters(module.sizeMm.height) * 0.94,
        mmToMeters(module.sizeMm.depth),
      )
      matrix.compose(position, rotation, scale)
      panes.current?.setMatrixAt(index, matrix)
    })
    panes.current.instanceMatrix.needsUpdate = true
    panes.current.computeBoundingSphere()
  }, [firstModule, modules])

  useLayoutEffect(() => {
    if (!canopies.current || !trunks.current || !firstModule) return
    const moduleHeight = mmToMeters(firstModule.sizeMm.height)
    const gardenBase = Math.min(
      ...modules.map((module) =>
        mmToMeters(module.positionMm.elevation - module.sizeMm.height / 2),
      ),
    )
    const width = mmToMeters(firstModule.sizeMm.width)
    const xCenter = mmToMeters(firstModule.positionMm.x)
    const zCenter = mmToMeters(firstModule.positionMm.y)
    const rotationY = firstModule.rotationRad
    const widthDirection = new THREE.Vector3(1, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rotationY,
    )
    const inwardDirection = new THREE.Vector3(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotationY)
      .multiplyScalar(mmToMeters(firstModule.sizeMm.depth) * 0.35)
    const matrix = new THREE.Matrix4()

    for (let index = 0; index < canopyCount; index += 1) {
      const lane = index / (canopyCount - 1) - 0.5
      const trunkHeight = moduleHeight * (1.4 + (index % 2) * 0.28)
      const x = xCenter + widthDirection.x * lane * width * 0.72 + inwardDirection.x
      const z =
        zCenter +
        widthDirection.z * lane * width * 0.72 +
        inwardDirection.z -
        Math.abs(lane) * moduleHeight * 0.12
      const trunkY = gardenBase + trunkHeight / 2
      const canopyY = gardenBase + trunkHeight + moduleHeight * 0.3

      matrix.compose(
        new THREE.Vector3(x, trunkY, z),
        new THREE.Quaternion(),
        new THREE.Vector3(moduleHeight * 0.07, trunkHeight, moduleHeight * 0.07),
      )
      trunks.current.setMatrixAt(index, matrix)

      matrix.compose(
        new THREE.Vector3(x, canopyY, z),
        new THREE.Quaternion(),
        new THREE.Vector3(
          moduleHeight * (0.42 + (index % 3) * 0.05),
          moduleHeight * (0.48 + (index % 2) * 0.05),
          moduleHeight * 0.42,
        ),
      )
      canopies.current.setMatrixAt(index, matrix)
    }

    trunks.current.instanceMatrix.needsUpdate = true
    canopies.current.instanceMatrix.needsUpdate = true
    trunks.current.computeBoundingSphere()
    canopies.current.computeBoundingSphere()
  }, [firstModule, modules])

  if (!firstModule) return null

  return (
    <group>
      <instancedMesh ref={trunks} args={[undefined, undefined, canopyCount]}>
        <cylinderGeometry args={[0.5, 0.65, 1, 6]} />
        <meshStandardMaterial color="#4a3929" roughness={0.96} />
      </instancedMesh>
      <instancedMesh ref={canopies} args={[undefined, undefined, canopyCount]}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial
          color={night ? '#28563b' : '#3d7652'}
          emissive={night ? '#173b2c' : '#000000'}
          emissiveIntensity={night ? 0.5 : 0}
          roughness={0.9}
        />
      </instancedMesh>
      <instancedMesh ref={panes} args={[undefined, undefined, modules.length]} renderOrder={4}>
        <boxGeometry args={[1, 1, 1]} />
        <meshPhysicalMaterial
          color={night ? '#b9d7b8' : '#8eb6ab'}
          emissive={night ? '#d9bc76' : '#1f3833'}
          emissiveIntensity={night ? 0.72 : 0.08}
          metalness={0.12}
          roughness={0.24}
          transparent
          opacity={0.88}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </instancedMesh>
      {night ? (
        <pointLight
          position={[
            mmToMeters(firstModule.positionMm.x),
            mmToMeters(firstModule.positionMm.elevation),
            mmToMeters(firstModule.positionMm.y) + 3,
          ]}
          color="#f4d690"
          intensity={7}
          distance={42}
          decay={2}
        />
      ) : null}
    </group>
  )
}

function FacadeLines({
  cityGeometry,
  prowGeometry,
  cityPosition,
  prowPosition,
  cityRotation,
  prowRotation,
  night,
}: {
  cityGeometry: THREE.BufferGeometry | null
  prowGeometry: THREE.BufferGeometry | null
  cityPosition: [number, number, number]
  prowPosition: [number, number, number]
  cityRotation: number
  prowRotation: number
  night: boolean
}) {
  if (!cityGeometry && !prowGeometry) return <group />
  return (
    <group renderOrder={3}>
      {cityGeometry ? (
        <group position={cityPosition} rotation={[0, cityRotation, 0]}>
          <lineSegments geometry={cityGeometry}>
            <lineBasicMaterial
              color={night ? '#7898ae' : '#60747f'}
              transparent
              opacity={night ? 0.38 : 0.58}
            />
          </lineSegments>
        </group>
      ) : null}
      {prowGeometry ? (
        <group position={prowPosition} rotation={[0, prowRotation, 0]}>
          <lineSegments geometry={prowGeometry}>
            <lineBasicMaterial
              color={night ? '#557b97' : '#7b9bac'}
              transparent
              opacity={night ? 0.3 : 0.46}
            />
          </lineSegments>
        </group>
      ) : null}
    </group>
  )
}

export function TowerExterior({ centerX, centerZ, noche, detail = 'near' }: TowerExteriorProps) {
  const city = EXTERIOR_DEMO_SPEC.massing.find((volume) => volume.kind === 'city-square')
  const prow = EXTERIOR_DEMO_SPEC.massing.find((volume) => volume.kind === 'river-prow')

  if (!city || !prow) throw new Error('The validated exterior spec requires both massing volumes')

  const geometry = useMemo(() => {
    const cityShape = createRoundedSquareShape(city.sizeMm.width, city.sizeMm.depth, 36)
    const prowShape = createCurvedProwShape(prow.sizeMm.width, prow.sizeMm.depth, 12)
    return {
      cityMass: createMassingGeometry(
        cityShape,
        city.sizeMm.height,
        city.baseElevationMm,
        city.taperMm.x,
        city.taperMm.y,
      ),
      prowMass: createMassingGeometry(
        prowShape,
        prow.sizeMm.height,
        prow.baseElevationMm,
        prow.taperMm.x,
        prow.taperMm.y,
      ),
      cityNear: createFacadeLineGeometry(cityShape, {
        baseElevationMm: city.baseElevationMm,
        heightMm: city.sizeMm.height,
        horizontalBands: EXTERIOR_DEMO_SPEC.floorCount,
        verticalEvery: 2,
        contourSegments: 36,
      }),
      cityMid: createFacadeLineGeometry(cityShape, {
        baseElevationMm: city.baseElevationMm,
        heightMm: city.sizeMm.height,
        horizontalBands: 12,
        verticalEvery: 6,
        contourSegments: 20,
      }),
      prowNear: createFacadeLineGeometry(prowShape, {
        baseElevationMm: prow.baseElevationMm,
        heightMm: prow.sizeMm.height,
        horizontalBands: EXTERIOR_DEMO_SPEC.floorCount,
        verticalEvery: 8,
        contourSegments: 36,
      }),
      prowMid: createFacadeLineGeometry(prowShape, {
        baseElevationMm: prow.baseElevationMm,
        heightMm: prow.sizeMm.height,
        horizontalBands: 12,
        verticalEvery: 20,
        contourSegments: 20,
      }),
    }
  }, [city, prow])

  useEffect(
    () => () => {
      Object.values(geometry).forEach((item) => item.dispose())
    },
    [geometry],
  )

  const cityPosition: [number, number, number] = [
    mmToMeters(city.centerMm.x),
    0,
    mmToMeters(city.centerMm.y),
  ]
  const prowPosition: [number, number, number] = [
    mmToMeters(prow.centerMm.x),
    0,
    mmToMeters(prow.centerMm.y),
  ]
  const top = mmToMeters(city.baseElevationMm + city.sizeMm.height)
  const nearDistance = mmToMeters(EXTERIOR_DEMO_SPEC.lod.nearMaxDistanceMm)
  const midDistance = mmToMeters(EXTERIOR_DEMO_SPEC.lod.midMaxDistanceMm)

  return (
    <group
      position={[centerX, 0, centerZ]}
      rotation={[0, EXTERIOR_DEMO_SPEC.rotationRad, 0]}
      name={EXTERIOR_DEMO_SPEC.id}
    >
      <group position={cityPosition} rotation={[0, city.rotationRad, 0]}>
        <mesh geometry={geometry.cityMass} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={noche ? '#4c5963' : '#87949b'}
            emissive={noche ? '#182632' : '#000000'}
            emissiveIntensity={noche ? 0.25 : 0}
            metalness={noche ? 0.42 : 0.34}
            roughness={noche ? 0.38 : 0.34}
            clearcoat={detail === 'near' ? 0.34 : 0.1}
            clearcoatRoughness={0.4}
          />
        </mesh>
      </group>
      <group position={prowPosition} rotation={[0, prow.rotationRad, 0]}>
        <mesh geometry={geometry.prowMass} castShadow receiveShadow>
          <meshPhysicalMaterial
            color={noche ? '#315a78' : '#87aec2'}
            emissive={noche ? '#0b2b45' : '#000000'}
            emissiveIntensity={noche ? 0.34 : 0}
            metalness={noche ? 0.16 : 0.06}
            roughness={noche ? 0.24 : 0.17}
            clearcoat={detail === 'near' ? 0.62 : 0.2}
            clearcoatRoughness={0.23}
          />
        </mesh>
      </group>

      <Detailed distances={[0, nearDistance, midDistance]} hysteresis={0.12}>
        <FacadeLines
          cityGeometry={
            detail === 'near' ? geometry.cityNear : detail === 'mid' ? geometry.cityMid : null
          }
          prowGeometry={
            detail === 'near' ? geometry.prowNear : detail === 'mid' ? geometry.prowMid : null
          }
          cityPosition={cityPosition}
          prowPosition={prowPosition}
          cityRotation={city.rotationRad}
          prowRotation={prow.rotationRad}
          night={noche}
        />
        <FacadeLines
          cityGeometry={detail === 'far' ? null : geometry.cityMid}
          prowGeometry={detail === 'far' ? null : geometry.prowMid}
          cityPosition={cityPosition}
          prowPosition={prowPosition}
          cityRotation={city.rotationRad}
          prowRotation={prow.rotationRad}
          night={noche}
        />
        <group />
      </Detailed>

      <GardenFacade modules={EXTERIOR_DEMO_SPEC.garden.modules} night={noche} />
      <YpfFacadeSign night={noche} />

      {/* Remates abstractos de pendientes opuestas. */}
      <mesh
        position={[
          cityPosition[0] + mmToMeters(city.taperMm.x),
          top - mmToMeters(city.sizeMm.height) * 0.012,
          cityPosition[2] + mmToMeters(city.taperMm.y),
        ]}
        rotation={[0, city.rotationRad, -0.035]}
        castShadow
      >
        <boxGeometry
          args={[
            mmToMeters(city.sizeMm.width) * 0.82,
            mmToMeters(city.sizeMm.height) * 0.024,
            mmToMeters(city.sizeMm.depth) * 0.72,
          ]}
        />
        <meshStandardMaterial
          color={noche ? '#142638' : '#9fb2c0'}
          metalness={0.58}
          roughness={0.22}
        />
      </mesh>
      <mesh
        position={[
          prowPosition[0] + mmToMeters(prow.taperMm.x),
          top - mmToMeters(prow.sizeMm.height) * 0.017,
          prowPosition[2] + mmToMeters(prow.taperMm.y),
        ]}
        rotation={[0, prow.rotationRad, 0.04]}
        castShadow
      >
        <boxGeometry
          args={[
            mmToMeters(prow.sizeMm.width) * 0.5,
            mmToMeters(prow.sizeMm.height) * 0.03,
            mmToMeters(prow.sizeMm.depth) * 0.58,
          ]}
        />
        <meshStandardMaterial
          color={noche ? '#102335' : '#91adbd'}
          metalness={0.42}
          roughness={0.2}
        />
      </mesh>
    </group>
  )
}
