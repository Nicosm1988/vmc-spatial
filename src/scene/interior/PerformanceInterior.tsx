import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { mmToMeters } from '../../domain/units'
import { makeCarpet } from '../../lib/carpet'
import type { InsightKey, Point, VmcDocument } from '../../types'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  buildPerformanceInteriorLayout,
  type PerformanceInstance,
} from './performanceInteriorLayout'
import { useExperienceStore } from '../../state/useExperienceStore'

export interface PerformanceInteriorProps {
  doc: VmcDocument
  night: boolean
  insight: InsightKey
  roof?: boolean
}

type PrimitiveKind = 'box' | 'cylinder' | 'plane' | 'sphere'

interface InstanceBatchProps {
  placements: PerformanceInstance[]
  name: string
  primitive?: PrimitiveKind
  geometry?: THREE.BufferGeometry
  transparent?: boolean
  opacity?: number
  emissive?: string
  emissiveIntensity?: number
  metalness?: number
  roughness?: number
  renderOrder?: number
  depthWrite?: boolean
  side?: THREE.Side
  alphaMap?: THREE.Texture
  alphaTest?: number
  map?: THREE.Texture
  bumpMap?: THREE.Texture
  bumpScale?: number
  emissiveMap?: THREE.Texture
  toneMapped?: boolean
  castShadow?: boolean
  receiveShadow?: boolean
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

/** Matches the original renderer: the extrusion extends below its local origin. */
function horizontalExtrusion(points: readonly Point[], depth: number) {
  const geometry = new THREE.ExtrudeGeometry(horizontalShape(points), {
    depth,
    bevelEnabled: false,
  })
  geometry.rotateX(Math.PI / 2)
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
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false })
  geometry.rotateX(Math.PI / 2)
  return geometry
}

function makeMeshAlphaTexture(size = 128) {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4
      const cellX = x % 4
      const cellY = y % 4
      const distance = Math.hypot(cellX - 1.5, cellY - 1.5)
      const value = distance < 0.78 ? 0 : 238
      data[index] = value
      data[index + 1] = value
      data[index + 2] = value
      data[index + 3] = 255
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.magFilter = THREE.LinearFilter
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.needsUpdate = true
  return texture
}

function makeDashboardTexture(variant = 0) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 288
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)

  const gradient = context.createLinearGradient(0, 0, 512, 288)
  gradient.addColorStop(0, '#061533')
  gradient.addColorStop(0.52, '#062b62')
  gradient.addColorStop(1, '#041229')
  context.fillStyle = gradient
  context.fillRect(0, 0, 512, 288)

  context.strokeStyle = 'rgba(89, 183, 255, 0.1)'
  context.lineWidth = 1
  for (let x = 0; x <= 512; x += 32) {
    context.beginPath()
    context.moveTo(x, 0)
    context.lineTo(x, 288)
    context.stroke()
  }
  for (let y = 0; y <= 288; y += 24) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(512, y)
    context.stroke()
  }

  const panelColors = ['#0b3976', '#092c5d', '#0c4387']
  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const x = 12 + column * 126
      const y = 12 + row * 91
      const width = 112
      const height = 76
      context.fillStyle = panelColors[(row + column + variant) % panelColors.length]!
      context.fillRect(x, y, width, height)
      context.fillStyle = column % 2 === 0 ? '#17bfd0' : '#1a8fd1'
      context.fillRect(x, y, width, 8)

      context.fillStyle = 'rgba(170, 226, 255, 0.78)'
      for (let line = 0; line < 4; line += 1) {
        const lineWidth = 20 + ((row * 17 + column * 13 + line * 11 + variant * 19) % 67)
        context.fillRect(x + 8, y + 17 + line * 9, lineWidth, 2)
      }

      context.strokeStyle = column % 2 === 0 ? '#43e5ed' : '#69a9ff'
      context.lineWidth = 2
      context.beginPath()
      for (let point = 0; point <= 9; point += 1) {
        const px = x + 8 + point * 10
        const py = y + height - 10 - Math.sin(point * 0.9 + row + column + variant * 0.7) * 9
        if (point === 0) context.moveTo(px, py)
        else context.lineTo(px, py)
      }
      context.stroke()
    }
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.needsUpdate = true
  return texture
}

function configureSurfaceTexture(canvas: HTMLCanvasElement, repeatX = 1, repeatY = 1) {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(repeatX, repeatY)
  texture.anisotropy = 8
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  return texture
}

function makeDesktopTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 288
  const context = canvas.getContext('2d')!
  const gradient = context.createLinearGradient(0, 0, 512, 288)
  gradient.addColorStop(0, '#020407')
  gradient.addColorStop(0.62, '#07101a')
  gradient.addColorStop(1, '#101a23')
  context.fillStyle = gradient
  context.fillRect(0, 0, 512, 288)
  context.fillStyle = 'rgba(84, 146, 188, 0.14)'
  context.fillRect(34, 36, 276, 174)
  context.fillStyle = 'rgba(86, 194, 224, 0.22)'
  context.fillRect(34, 36, 276, 7)
  context.strokeStyle = 'rgba(77, 170, 214, 0.32)'
  context.lineWidth = 2
  context.beginPath()
  for (let point = 0; point <= 12; point += 1) {
    const x = 48 + point * 20
    const y = 171 - Math.sin(point * 0.72) * 24 - point * 2
    if (point === 0) context.moveTo(x, y)
    else context.lineTo(x, y)
  }
  context.stroke()
  context.fillStyle = 'rgba(170, 211, 232, 0.22)'
  for (let line = 0; line < 8; line += 1) {
    context.fillRect(340, 50 + line * 20, 90 + (line % 3) * 16, 2)
  }
  const reflection = context.createLinearGradient(0, 0, 512, 288)
  reflection.addColorStop(0, 'rgba(255,255,255,0.08)')
  reflection.addColorStop(0.32, 'rgba(255,255,255,0)')
  reflection.addColorStop(1, 'rgba(255,255,255,0.035)')
  context.fillStyle = reflection
  context.fillRect(0, 0, 512, 288)
  return configureSurfaceTexture(canvas)
}

function makeLaminateTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  context.fillStyle = '#eeece7'
  context.fillRect(0, 0, 256, 256)
  for (let index = 0; index < 180; index += 1) {
    const x = (index * 73) % 256
    const y = (index * 151) % 256
    context.fillStyle = index % 3 === 0 ? 'rgba(91,86,78,0.045)' : 'rgba(255,255,255,0.12)'
    context.fillRect(x, y, 1 + (index % 5), 1)
  }
  context.strokeStyle = 'rgba(112,106,96,0.035)'
  context.lineWidth = 1
  for (let y = 12; y < 256; y += 31) {
    context.beginPath()
    context.moveTo(0, y)
    context.lineTo(256, y + 3)
    context.stroke()
  }
  return configureSurfaceTexture(canvas, 4, 2)
}

function makeRibbedPanelTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  context.fillStyle = '#e8e3dc'
  context.fillRect(0, 0, 256, 256)
  for (let x = 0; x < 256; x += 8) {
    context.fillStyle = 'rgba(75,65,54,0.16)'
    context.fillRect(x, 0, 1, 256)
    context.fillStyle = 'rgba(255,255,255,0.22)'
    context.fillRect(x + 1, 0, 1, 256)
  }
  return configureSurfaceTexture(canvas, 2, 1)
}

function makeCeilingTileTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  context.fillStyle = '#e7e5df'
  context.fillRect(0, 0, 256, 256)
  context.fillStyle = 'rgba(66,70,73,0.11)'
  for (let index = 0; index < 420; index += 1) {
    const x = (index * 47) % 256
    const y = (index * 89) % 256
    context.fillRect(x, y, 1, 1)
  }
  context.strokeStyle = 'rgba(92,96,99,0.18)'
  for (let step = 0; step <= 256; step += 64) {
    context.beginPath()
    context.moveTo(step, 0)
    context.lineTo(step, 256)
    context.stroke()
    context.beginPath()
    context.moveTo(0, step)
    context.lineTo(256, step)
    context.stroke()
  }
  return configureSurfaceTexture(canvas)
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

function PrimitiveGeometry({ kind }: { kind: PrimitiveKind }) {
  if (kind === 'cylinder') return <cylinderGeometry args={[0.5, 0.5, 1, 12]} />
  if (kind === 'plane') return <planeGeometry args={[1, 1]} />
  if (kind === 'sphere') return <icosahedronGeometry args={[0.5, 0]} />
  return <boxGeometry args={[1, 1, 1]} />
}

function InstanceBatch({
  placements,
  name,
  primitive = 'box',
  geometry,
  transparent = false,
  opacity = 1,
  emissive = '#000000',
  emissiveIntensity = 0,
  metalness = 0.05,
  roughness = 0.7,
  renderOrder,
  depthWrite = true,
  side = THREE.FrontSide,
  alphaMap,
  alphaTest = 0,
  map,
  bumpMap,
  bumpScale = 0.01,
  emissiveMap,
  toneMapped = true,
  castShadow = false,
  receiveShadow = !transparent && emissiveIntensity === 0,
}: InstanceBatchProps) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useInstances(ref, placements)

  if (placements.length === 0) return null

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, placements.length]}
      geometry={geometry}
      name={name}
      renderOrder={renderOrder}
      castShadow={castShadow && !transparent}
      receiveShadow={receiveShadow}
    >
      {geometry ? null : <PrimitiveGeometry kind={primitive} />}
      <meshStandardMaterial
        color="#ffffff"
        emissive={emissive}
        emissiveIntensity={emissiveIntensity}
        metalness={metalness}
        roughness={roughness}
        transparent={transparent}
        opacity={opacity}
        depthWrite={depthWrite}
        side={side}
        alphaMap={alphaMap}
        alphaTest={alphaTest}
        map={map}
        bumpMap={bumpMap}
        bumpScale={bumpScale}
        emissiveMap={emissiveMap}
        toneMapped={toneMapped}
      />
    </instancedMesh>
  )
}

function pickPracticalLights(placements: PerformanceInstance[], count: number) {
  if (placements.length <= count) return placements
  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = Math.round((index * (placements.length - 1)) / (count - 1))
    return placements[sourceIndex]!
  })
}

function SlidingEntryDoor({ leaves }: { leaves: readonly PerformanceInstance[] }) {
  const group = useRef<THREE.Group>(null)
  const refs = useRef<Array<THREE.Mesh | null>>([])
  const openness = useRef(0)
  const localCenter = useMemo(() => {
    const center = new THREE.Vector3()
    leaves.forEach((leaf) => center.add(new THREE.Vector3(...leaf.position)))
    return center.multiplyScalar(1 / Math.max(1, leaves.length))
  }, [leaves])
  const worldCenter = useRef(new THREE.Vector3())
  const { camera } = useThree()
  const stage = useExperienceStore((state) => state.stage)
  const transitionTarget = useExperienceStore((state) => state.transition?.to)

  useFrame((_, delta) => {
    if (leaves.length !== 2 || !group.current) return
    worldCenter.current.copy(localCenter)
    group.current.localToWorld(worldCenter.current)
    const shouldOpen =
      stage === 'interior' ||
      transitionTarget === 'interior' ||
      camera.position.distanceToSquared(worldCenter.current) < 81
    openness.current = THREE.MathUtils.damp(openness.current, shouldOpen ? 1 : 0, 7.5, delta)

    leaves.forEach((leaf, index) => {
      const mesh = refs.current[index]
      if (!mesh) return
      const side = index === 0 ? -1 : 1
      const rotationY = leaf.rotation[1]
      const travel = leaf.scale[0] * 0.96 * openness.current * side
      mesh.position.set(
        leaf.position[0] + Math.cos(rotationY) * travel,
        leaf.position[1],
        leaf.position[2] - Math.sin(rotationY) * travel,
      )
      mesh.rotation.set(...leaf.rotation)
      mesh.scale.set(...leaf.scale)
    })
  })

  return (
    <group ref={group} name="double-sliding-entry-door">
      {leaves.map((leaf, index) => (
        <mesh
          key={leaf.id}
          ref={(mesh) => {
            refs.current[index] = mesh
          }}
          position={leaf.position}
          rotation={leaf.rotation}
          scale={leaf.scale}
          castShadow
          renderOrder={5}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshPhysicalMaterial
            color={leaf.color}
            transparent
            opacity={0.34}
            metalness={0.05}
            roughness={0.18}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Shared presentation/edit renderer with a batched visual vocabulary. Edit
 * mode adds interaction proxies without replacing this geometry. Everything
 * shown here remains DEMO / NO VERIFICADA.
 */
export default function PerformanceInterior({
  doc,
  night,
  insight,
  roof = false,
}: PerformanceInteriorProps) {
  const layout = useMemo(() => buildPerformanceInteriorLayout(doc, insight), [doc, insight])
  const floorGeometry = useMemo(() => horizontalExtrusion(doc.plate, 0.3), [doc.plate])
  const coreGeometry = useMemo(() => horizontalExtrusion(doc.core, 0.14), [doc.core])
  const ringGeometry = useMemo(() => coreCarpetRing(doc.core), [doc.core])
  const monitorFrameGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.9, 0.9, 0.4, 24, 1, true, -0.475, 0.95)
    geometry.translate(0, 0, -0.9)
    return geometry
  }, [])
  const monitorScreenGeometry = useMemo(() => {
    const geometry = new THREE.CylinderGeometry(0.88, 0.88, 0.34, 24, 1, true, -0.475, 0.95)
    geometry.translate(0, 0, -0.874)
    return geometry
  }, [])
  const chairSeatGeometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.12), [])
  const tableTopGeometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.045), [])
  const carpet = useMemo(() => {
    const texture = makeCarpet([146, 152, 160], 256)
    texture.repeat.set(14, 9)
    return texture
  }, [])
  const carpetDark = useMemo(() => {
    const texture = makeCarpet([82, 87, 96], 256)
    texture.repeat.set(5, 4)
    return texture
  }, [])
  const chairMeshAlpha = useMemo(() => makeMeshAlphaTexture(), [])
  const dashboardTextures = useMemo(
    () => Array.from({ length: 4 }, (_, variant) => makeDashboardTexture(variant)),
    [],
  )
  const desktopTexture = useMemo(() => makeDesktopTexture(), [])
  const laminateTexture = useMemo(() => makeLaminateTexture(), [])
  const ribbedPanelTexture = useMemo(() => makeRibbedPanelTexture(), [])
  const ceilingTileTexture = useMemo(() => makeCeilingTileTexture(), [])
  const videoWallScreenGroups = useMemo(
    () =>
      Array.from({ length: 4 }, (_, variant) =>
        layout.videoWallScreens.filter((_, index) => index % 4 === variant),
      ),
    [layout.videoWallScreens],
  )
  const practicalLights = useMemo(
    () => pickPracticalLights(layout.ceilingLights, 6),
    [layout.ceilingLights],
  )

  useEffect(
    () => () => {
      floorGeometry.dispose()
      coreGeometry.dispose()
      ringGeometry.dispose()
      monitorFrameGeometry.dispose()
      monitorScreenGeometry.dispose()
      carpet.dispose()
      carpetDark.dispose()
      chairMeshAlpha.dispose()
      chairSeatGeometry.dispose()
      tableTopGeometry.dispose()
      dashboardTextures.forEach((texture) => texture.dispose())
      desktopTexture.dispose()
      laminateTexture.dispose()
      ribbedPanelTexture.dispose()
      ceilingTileTexture.dispose()
    },
    [
      carpet,
      carpetDark,
      chairMeshAlpha,
      chairSeatGeometry,
      ceilingTileTexture,
      coreGeometry,
      dashboardTextures,
      desktopTexture,
      floorGeometry,
      laminateTexture,
      monitorFrameGeometry,
      monitorScreenGeometry,
      ribbedPanelTexture,
      ringGeometry,
      tableTopGeometry,
    ],
  )

  return (
    <group
      name="performance-interior"
      userData={{
        classification: 'DEMO / NO VERIFICADO',
        renderer: 'procedural-presentation',
      }}
    >
      <mesh
        geometry={floorGeometry}
        position={[0, -0.02, 0]}
        receiveShadow
        name="presentation-carpet-floor"
      >
        <meshStandardMaterial
          map={carpet}
          bumpMap={carpet}
          bumpScale={0.02}
          color={night ? '#555b64' : '#747b84'}
          roughness={0.98}
          metalness={0}
        />
      </mesh>
      <mesh geometry={ringGeometry} position={[0, 0.015, 0]} receiveShadow>
        <meshStandardMaterial
          map={carpetDark}
          bumpMap={carpetDark}
          bumpScale={0.01}
          color={night ? '#3d4249' : '#565c65'}
          roughness={1}
          metalness={0}
        />
      </mesh>
      <mesh geometry={coreGeometry} position={[0, 0.07, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#0c1226" roughness={0.85} metalness={0.08} />
      </mesh>

      <InstanceBatch
        placements={layout.accentPads}
        transparent
        opacity={0.13}
        roughness={0.62}
        depthWrite={false}
        renderOrder={1}
        name="zone-accents"
      />

      <InstanceBatch
        placements={layout.windowGlass}
        transparent
        opacity={night ? 0.09 : 0.11}
        metalness={0}
        roughness={0.1}
        depthWrite={false}
        side={THREE.FrontSide}
        renderOrder={2}
        name="floor-to-ceiling-glass"
      />
      <InstanceBatch
        placements={layout.windowFrames}
        metalness={0.58}
        roughness={0.46}
        name="window-mullions-and-rails"
      />
      <InstanceBatch
        placements={layout.windowShades}
        transparent
        opacity={night ? 0.76 : 0.67}
        roughness={0.94}
        depthWrite={false}
        side={THREE.DoubleSide}
        renderOrder={3}
        name="roller-shades"
      />
      <InstanceBatch
        placements={layout.windowShadeCassettes}
        metalness={0.24}
        roughness={0.6}
        name="roller-shade-cassettes"
      />

      <InstanceBatch
        placements={layout.officeGlass}
        transparent
        opacity={0.1}
        metalness={0}
        roughness={0.12}
        depthWrite={false}
        side={THREE.DoubleSide}
        renderOrder={2}
        name="office-glass"
      />

      <InstanceBatch
        placements={layout.videoWallShells}
        map={ribbedPanelTexture}
        bumpMap={ribbedPanelTexture}
        bumpScale={0.018}
        roughness={0.82}
        castShadow
        name="video-wall-shells"
      />
      <InstanceBatch placements={layout.videoWallTrims} roughness={0.7} name="video-wall-trims" />
      <InstanceBatch
        placements={layout.entryDoorFrames}
        map={ribbedPanelTexture}
        bumpMap={ribbedPanelTexture}
        bumpScale={0.018}
        metalness={0}
        roughness={0.82}
        castShadow
        name="core-entry-frame"
      />
      <SlidingEntryDoor leaves={layout.entryDoorLeaves} />
      <InstanceBatch
        placements={layout.videoWallBezels}
        metalness={0.22}
        roughness={0.34}
        name="video-wall-bezels"
      />
      {videoWallScreenGroups.map((placements, variant) => {
        const texture = dashboardTextures[variant]
        if (!texture) return null
        return (
          <InstanceBatch
            key={`video-wall-screen-variant-${variant}`}
            placements={placements}
            map={texture}
            emissiveMap={texture}
            emissive={night ? '#69b7ff' : '#398fd0'}
            emissiveIntensity={night ? 0.9 : 0.38}
            metalness={0}
            roughness={0.2}
            name={`video-wall-screens-${variant}`}
          />
        )
      })}
      <InstanceBatch
        placements={layout.heroScreenFrames}
        metalness={0.12}
        roughness={0.34}
        castShadow
        name="entry-hero-screen-frame"
      />
      <InstanceBatch
        placements={layout.heroScreens}
        map={dashboardTextures[0]}
        emissiveMap={dashboardTextures[0]}
        emissive={night ? '#69b7ff' : '#398fd0'}
        emissiveIntensity={night ? 0.95 : 0.42}
        metalness={0}
        roughness={0.18}
        name="entry-hero-screen"
      />

      <InstanceBatch
        placements={layout.tableTops}
        geometry={tableTopGeometry}
        map={laminateTexture}
        bumpMap={laminateTexture}
        bumpScale={0.006}
        metalness={0}
        roughness={0.6}
        castShadow
        name="desk-and-table-tops"
      />
      <InstanceBatch
        placements={layout.tableBases}
        metalness={0}
        roughness={0.62}
        castShadow
        name="desk-bases"
      />
      <InstanceBatch
        placements={layout.tableLegs}
        primitive="cylinder"
        metalness={0.22}
        roughness={0.5}
        name="dining-table-legs"
      />
      <InstanceBatch
        placements={layout.roundTableTops}
        primitive="cylinder"
        metalness={0.15}
        roughness={0.4}
        name="round-table-tops"
      />
      <InstanceBatch
        placements={layout.roundPedestals}
        primitive="cylinder"
        metalness={0.4}
        roughness={0.5}
        name="round-table-pedestals"
      />

      <InstanceBatch
        placements={layout.chairSeats}
        geometry={chairSeatGeometry}
        metalness={0}
        roughness={0.88}
        name="ergonomic-chair-seats"
      />
      <InstanceBatch
        placements={layout.chairBackFrames}
        metalness={0}
        roughness={0.6}
        name="ergonomic-chair-back-frames"
      />
      <InstanceBatch
        placements={layout.chairBackMesh}
        primitive="plane"
        alphaMap={chairMeshAlpha}
        alphaTest={0.3}
        side={THREE.DoubleSide}
        roughness={0.98}
        name="perforated-chair-mesh"
      />
      <InstanceBatch
        placements={layout.chairArmrests}
        metalness={0}
        roughness={0.66}
        name="ergonomic-chair-armrests"
      />
      <InstanceBatch
        placements={layout.chairStems}
        primitive="cylinder"
        metalness={0.66}
        roughness={0.34}
        name="chair-stems"
      />
      <InstanceBatch
        placements={layout.chairSpokes}
        metalness={0.5}
        roughness={0.44}
        name="five-spoke-chair-bases"
      />
      <InstanceBatch
        placements={layout.chairCasters}
        primitive="sphere"
        metalness={0.36}
        roughness={0.5}
        name="chair-casters"
      />

      <InstanceBatch
        placements={layout.monitorFrames}
        geometry={monitorFrameGeometry}
        side={THREE.BackSide}
        metalness={0}
        roughness={0.54}
        name="curved-monitor-frames"
      />
      <InstanceBatch
        placements={layout.monitorScreens}
        geometry={monitorScreenGeometry}
        side={THREE.FrontSide}
        map={desktopTexture}
        emissiveMap={desktopTexture}
        emissive={night ? '#76a9c7' : '#31566c'}
        emissiveIntensity={night ? 0.38 : 0.12}
        metalness={0}
        roughness={0.26}
        name="curved-ultrawide-screens"
      />
      <InstanceBatch
        placements={layout.monitorStems}
        metalness={0.55}
        roughness={0.4}
        name="monitor-support-stems"
      />
      <InstanceBatch
        placements={layout.monitorBases}
        metalness={0.55}
        roughness={0.4}
        name="monitor-support-bases"
      />

      {roof ? (
        <group name="technical-ceiling">
          <mesh geometry={floorGeometry} position={[0, mmToMeters(doc.alturaLibre), 0]}>
            <meshStandardMaterial
              color={night ? '#5f6265' : '#deddd8'}
              transparent
              opacity={0.18}
              depthWrite={false}
              roughness={0.9}
              side={THREE.DoubleSide}
            />
          </mesh>
          <InstanceBatch
            placements={layout.ceilingPanels}
            map={ceilingTileTexture}
            bumpMap={ceilingTileTexture}
            bumpScale={0.008}
            metalness={0}
            roughness={0.86}
            name="technical-ceiling-panels"
          />
          <InstanceBatch
            placements={layout.ceilingLights}
            emissive={night ? '#ffd994' : '#fff4d5'}
            emissiveIntensity={night ? 1.35 : 0.78}
            roughness={0.24}
            name="technical-ceiling-luminaires"
          />
          {practicalLights.map((light) => (
            <pointLight
              key={light.id}
              position={[light.position[0], light.position[1] - 0.22, light.position[2]]}
              color={night ? '#ffdba0' : '#fff1cf'}
              intensity={night ? 7 : 2.8}
              distance={10}
              decay={2}
            />
          ))}
        </group>
      ) : null}
    </group>
  )
}
