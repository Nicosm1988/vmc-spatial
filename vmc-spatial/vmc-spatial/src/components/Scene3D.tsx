// ============================================================================
// Escena 3D realista (R3F + Drei) con la distribución del PLANO CAD.
// - Piso en forma de lente (Pelli), núcleo de servicio central.
// - Estaciones de trabajo reales por puesto (silla Herman Miller + monitor curvo).
// - 4 video walls (grilla de pantallas sobre credenzas) en las caras del núcleo.
// - Salas vidriadas, mesa de troubleshooting. Environment (reflejos) + ContactShadows.
// ============================================================================
import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, ContactShadows, RoundedBox, Edges } from '@react-three/drei'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument, Zone } from '../types'
import { toM, packDesks, center, heat } from '../lib/geometry'
import { INSIGHTS } from '../lib/insights'
import { Workstation, VideoWallGrid, TroubleTable, HermanMillerChair } from './Furniture'

interface Props {
  doc: VmcDocument
  selectedId: string | null
  insight: InsightKey
  noche: boolean
  techo: boolean
  onSelect: (id: string | null) => void
}

function useFloorGeo(plate: Point[]) {
  return useMemo(() => {
    const s = new THREE.Shape()
    plate.forEach((p, i) => { const x = toM(p.x), z = toM(p.y); if (i === 0) s.moveTo(x, z); else s.lineTo(x, z) })
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: false })
    g.rotateX(Math.PI / 2)
    return g
  }, [plate])
}
function cursor(on: boolean) { document.body.style.cursor = on ? 'pointer' : 'auto' }

function Cluster({ z, plate, cx, cz, fill, selected, night, onSelect }: { z: Zone; plate: Point[]; cx: number; cz: number; fill: string; selected: boolean; night: boolean; onSelect: (id: string) => void }) {
  const x = toM(z.x), zz = toM(z.y), w = toM(z.w), h = toM(z.h)
  const px = x + w / 2, pz = zz + h / 2
  const desks = packDesks(z, z.puestos, plate)
  return (
    <group>
      <RoundedBox args={[w, 0.05, h]} radius={0.05} smoothness={2} position={[px, 0.03, pz]}
        onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
        onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
        <meshStandardMaterial color={fill} roughness={0.6} metalness={0.05} transparent opacity={0.28} />
        {selected && <Edges color="#ffd166" />}
      </RoundedBox>
      {desks.map((d, i) => {
        const dx = toM(d.x), dz = toM(d.y)
        const rot = Math.atan2(cz - dz, cx - dx) - Math.PI / 2
        return <Workstation key={i} x={dx} z={dz} rot={rot} screen={fill} night={night} />
      })}
    </group>
  )
}

export default function Scene3D({ doc, selectedId, insight, noche, techo, onSelect }: Props) {
  const floorGeo = useFloorGeo(doc.plate)
  const cx = toM(doc.ancho) / 2
  const cz = toM(doc.alto) / 2
  const insightDef = INSIGHTS[insight]
  const bg = noche ? '#03060f' : '#060c1c'
  const core = doc.zonas.find((z) => z.kind === 'nucleo')

  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [cx, 46, cz + 60], fov: 45 }} gl={{ antialias: true }}>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 80, 210]} />
      <ambientLight intensity={noche ? 0.3 : 0.62} />
      <directionalLight position={[cx - 28, 44, cz - 18]} intensity={noche ? 0.5 : 1.15} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}>
        <orthographicCamera attach="shadow-camera" args={[-48, 48, 48, -48, 0.1, 170]} />
      </directionalLight>

      <mesh geometry={floorGeo} position={[0, -0.02, 0]} receiveShadow onClick={() => onSelect(null)}>
        <meshStandardMaterial color="#0a1836" roughness={0.85} metalness={0.12} />
      </mesh>
      <mesh geometry={floorGeo} position={[0, 0, 0]}>
        <meshBasicMaterial color="#03c1bd" wireframe transparent opacity={0.1} />
      </mesh>

      {core && (() => {
        const x = toM(core.x), zz = toM(core.y), w = toM(core.w), h = toM(core.h)
        return (
          <mesh position={[x + w / 2, 1.4, zz + h / 2]} castShadow receiveShadow
            onClick={(e) => { e.stopPropagation(); onSelect(core.id) }}
            onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <boxGeometry args={[w, 2.8, h]} />
            <meshStandardMaterial color="#0c1226" roughness={0.7} metalness={0.2} />
            {core.id === selectedId && <Edges color="#ffd166" />}
          </mesh>
        )
      })()}

      {doc.zonas.filter((z) => z.kind === 'cluster').map((z) => {
        const fill = insight === 'none' ? z.color : heat(insightDef.value(z))
        return <Cluster key={z.id} z={z} plate={doc.plate} cx={cx} cz={cz} fill={fill} selected={z.id === selectedId} night={noche} onSelect={onSelect} />
      })}

      {doc.videoWalls.map((v) => {
        const x1 = toM(v.x1), y1 = toM(v.y1), x2 = toM(v.x2), y2 = toM(v.y2)
        const mx = (x1 + x2) / 2, mz = (y1 + y2) / 2
        const len = Math.hypot(x2 - x1, y2 - y1)
        const rotY = Math.atan2(mx - cx, mz - cz)
        return <VideoWallGrid key={v.id} x={mx} z={mz} len={len} rotY={rotY} night={noche} />
      })}

      {doc.zonas.filter((z) => z.kind === 'troubleshooting').map((z) => {
        const { cx: mcx, cy: mcy } = center(z)
        const tx = toM(mcx), tz = toM(mcy), w = toM(z.w) * 0.6, d = toM(z.h) * 0.55
        return (
          <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
            onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <TroubleTable x={tx} z={tz} w={w} d={d} color={z.color} />
            <HermanMillerChair x={tx - w / 2 - 0.4} z={tz} rot={Math.PI / 2} />
            <HermanMillerChair x={tx + w / 2 + 0.4} z={tz} rot={-Math.PI / 2} />
          </group>
        )
      })}

      {doc.zonas.filter((z) => z.kind === 'sala').map((z) => {
        const x = toM(z.x), zz = toM(z.y), w = toM(z.w), h = toM(z.h)
        const rcx = x + w / 2, rcz = zz + h / 2
        return (
          <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
            onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <mesh position={[rcx, 1.35, rcz]}>
              <boxGeometry args={[w, 2.7, h]} />
              <meshStandardMaterial color="#8fd6ff" transparent opacity={0.12} roughness={0.1} metalness={0.2} />
              {z.id === selectedId && <Edges color="#ffd166" />}
            </mesh>
            <TroubleTable x={rcx} z={rcz} w={w * 0.5} d={h * 0.4} color="#2a3350" />
          </group>
        )
      })}

      {techo && (
        <mesh geometry={floorGeo} position={[0, toM(doc.alturaLibre), 0]}>
          <meshStandardMaterial color="#0e1c3c" transparent opacity={0.16} side={THREE.DoubleSide} />
        </mesh>
      )}

      <ContactShadows position={[cx, 0.04, cz]} scale={95} blur={2.6} opacity={0.5} far={30} resolution={1024} color="#02040a" />

      <Environment resolution={256}>
        <Lightformer intensity={noche ? 0.5 : 1.3} position={[0, 12, 0]} scale={[26, 26, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={0.7} position={[16, 6, -14]} scale={[10, 10, 1]} color="#ffffff" />
        <Lightformer intensity={0.7} position={[-16, 6, 14]} scale={[10, 10, 1]} color="#27e0ff" />
        <Lightformer intensity={0.5} position={[0, 6, 20]} scale={[16, 6, 1]} color="#0424d9" />
      </Environment>

      <OrbitControls target={[cx, 0, cz]} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.15} minDistance={16} maxDistance={160} />
    </Canvas>
  )
}
