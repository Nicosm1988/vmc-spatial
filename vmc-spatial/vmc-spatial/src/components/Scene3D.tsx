// ============================================================================
// Escena 3D calcada del CAD (R3F + Drei).
// - Piso desde contorno TRAZADO. Núcleo DIAMANTE con 4 video walls.
// - Cada isla = UN DeskBench (dos filas ENFRENTADAS, monitores al centro),
//   rotado por z.rot para seguir la fachada.
// - Frente (Este): sala alargada + 3 oficinas. Pods redondos (Oeste).
// ============================================================================
import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, ContactShadows, Edges, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument, Zone } from '../types'
import { toM, center, heat } from '../lib/geometry'
import { INSIGHTS } from '../lib/insights'
import { DeskBench, VideoWallGrid, LongTable, MeetingTable, RoundTable, ExecDesk } from './Furniture'

interface Props { doc: VmcDocument; selectedId: string | null; insight: InsightKey; noche: boolean; techo: boolean; onSelect: (id: string | null) => void }

function shapeFrom(poly: Point[]) {
  const s = new THREE.Shape()
  poly.forEach((p, i) => { const x = toM(p.x), z = toM(p.y); if (i === 0) s.moveTo(x, z); else s.lineTo(x, z) })
  s.closePath()
  return s
}
function slab(poly: Point[], depth: number) {
  const g = new THREE.ExtrudeGeometry(shapeFrom(poly), { depth, bevelEnabled: false })
  g.rotateX(Math.PI / 2)
  return g
}
function cursor(on: boolean) { document.body.style.cursor = on ? 'pointer' : 'auto' }

// Isla = pad + UN bench de escritorios enfrentados, rotado para seguir la fachada.
function Island({ z, fill, selected, night, onSelect }: { z: Zone; fill: string; selected: boolean; night: boolean; onSelect: (id: string) => void }) {
  const w = toM(z.w), h = toM(z.h)
  const mcx = toM(z.x + z.w / 2), mcz = toM(z.y + z.h / 2)
  const rotY = -(z.rot || 0)
  return (
    <group position={[mcx, 0, mcz]} rotation={[0, rotY, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
      onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
      <mesh position={[0, 0.03, 0]}><boxGeometry args={[w, 0.05, h]} /><meshStandardMaterial color={fill} roughness={0.6} metalness={0.05} transparent opacity={0.24} />{selected && <Edges color="#ffd166" />}</mesh>
      <DeskBench pairs={z.pairs || 3} screen={fill} night={night} />
    </group>
  )
}

export default function Scene3D({ doc, selectedId, insight, noche, techo, onSelect }: Props) {
  const floorG = useMemo(() => slab(doc.plate, 0.3), [doc.plate])
  const coreG = useMemo(() => slab(doc.core, 0.32), [doc.core])
  const cx = toM(doc.ancho) / 2, cz = toM(doc.alto) / 2
  const insightDef = INSIGHTS[insight]
  const bg = noche ? '#03060f' : '#060c1c'

  const orient = [
    { t: 'FRENTE ▶ (Este · Río)', cls: 'tag3d front', x: toM(60000), z: cz },
    { t: '◀ FONDO (Oeste · Ciudad)', cls: 'tag3d back', x: toM(2500), z: cz },
    { t: 'LADO NORTE', cls: 'tag3d', x: cx, z: toM(3200) },
    { t: 'LADO SUR', cls: 'tag3d', x: cx, z: toM(37000) },
  ]

  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [cx - 30, 46, cz + 62], fov: 45 }} gl={{ antialias: true }}>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 90, 230]} />
      <ambientLight intensity={noche ? 0.3 : 0.62} />
      <directionalLight position={[cx - 30, 46, cz - 20]} intensity={noche ? 0.5 : 1.15} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}>
        <orthographicCamera attach="shadow-camera" args={[-52, 52, 52, -52, 0.1, 190]} />
      </directionalLight>

      <mesh geometry={floorG} position={[0, -0.02, 0]} receiveShadow onClick={() => onSelect(null)}>
        <meshStandardMaterial color="#0a1836" roughness={0.85} metalness={0.12} />
      </mesh>
      <mesh geometry={floorG} position={[0, 0, 0]}><meshBasicMaterial color="#03c1bd" wireframe transparent opacity={0.08} /></mesh>

      <mesh position={[toM(55000), 0.05, cz]}><boxGeometry args={[toM(9000), 0.02, toM(18000)]} /><meshStandardMaterial color="#03c1bd" transparent opacity={0.1} /></mesh>
      <mesh position={[toM(8000), 0.05, cz]}><boxGeometry args={[toM(8000), 0.02, toM(18000)]} /><meshStandardMaterial color="#0424d9" transparent opacity={0.1} /></mesh>

      {/* Núcleo diamante */}
      <mesh geometry={coreG} position={[0, 0.16, 0]}><meshStandardMaterial color="#0c1226" roughness={0.7} metalness={0.2} /></mesh>
      <mesh geometry={coreG} position={[0, 0.16, 0]}><meshBasicMaterial color="#0E9BC4" wireframe transparent opacity={0.25} /></mesh>

      {/* Columnas del pasillo del frente */}
      {doc.columns.map((c, i) => (
        <mesh key={i} position={[toM(c.x), 1.4, toM(c.y)]} castShadow><cylinderGeometry args={[0.16, 0.16, 2.8, 14]} /><meshStandardMaterial color="#12203f" roughness={0.5} metalness={0.4} /></mesh>
      ))}

      {/* Islas = benches enfrentados */}
      {doc.zonas.filter((z) => z.kind === 'cluster').map((z) => {
        const fill = insight === 'none' ? z.color : heat(insightDef.value(z))
        return <Island key={z.id} z={z} fill={fill} selected={z.id === selectedId} night={noche} onSelect={onSelect} />
      })}

      {/* Video walls en las 4 caras del diamante */}
      {doc.videoWalls.map((v) => {
        const x1 = toM(v.x1), y1 = toM(v.y1), x2 = toM(v.x2), y2 = toM(v.y2)
        const mx = (x1 + x2) / 2, mz = (y1 + y2) / 2
        const len = Math.hypot(x2 - x1, y2 - y1)
        const rotY = Math.atan2(mx - cx, mz - cz)
        return <VideoWallGrid key={v.id} x={mx} z={mz} len={len} rotY={rotY} night={noche} />
      })}

      {/* Sala alargada del frente */}
      {doc.zonas.filter((z) => z.kind === 'salalarga').map((z) => {
        const rcx = toM(z.x + z.w / 2), rcz = toM(z.y + z.h / 2), w = toM(z.w), h = toM(z.h)
        return (
          <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <mesh position={[rcx, 0.04, rcz]}><boxGeometry args={[w, 0.06, h]} /><meshStandardMaterial color={z.color} roughness={0.5} metalness={0.1} transparent opacity={0.4} />{z.id === selectedId && <Edges color="#ffd166" />}</mesh>
            <LongTable x={rcx} z={rcz} w={w * 0.82} d={h * 0.3} seats={10} />
          </group>
        )
      })}

      {/* Oficinas del frente */}
      {doc.zonas.filter((z) => z.kind === 'oficina').map((z) => {
        const rcx = toM(z.x + z.w / 2), rcz = toM(z.y + z.h / 2), w = toM(z.w), h = toM(z.h)
        const big = z.id === 'oficina-centro'
        return (
          <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <mesh position={[rcx, 1.4, rcz]}><boxGeometry args={[w, 2.8, h]} /><meshStandardMaterial color="#a9deff" transparent opacity={0.14} roughness={0.08} metalness={0.2} side={THREE.DoubleSide} />{z.id === selectedId && <Edges color="#ffd166" />}</mesh>
            <mesh position={[rcx, 0.04, rcz]}><boxGeometry args={[w, 0.06, h]} /><meshStandardMaterial color={z.color} roughness={0.5} metalness={0.1} transparent opacity={0.5} /></mesh>
            <group position={[rcx, 0, rcz]} rotation={[0, Math.PI / 2, 0]}><ExecDesk screen={z.color} night={noche} monitor={big} /></group>
          </group>
        )
      })}

      {/* Salas de reunión (Oeste) */}
      {doc.zonas.filter((z) => z.kind === 'sala').map((z) => {
        const rcx = toM(z.x + z.w / 2), rcz = toM(z.y + z.h / 2), w = toM(z.w), h = toM(z.h)
        return (
          <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <mesh position={[rcx, 1.35, rcz]}><boxGeometry args={[w, 2.7, h]} /><meshStandardMaterial color="#8fd6ff" transparent opacity={0.12} roughness={0.1} metalness={0.2} />{z.id === selectedId && <Edges color="#ffd166" />}</mesh>
            <MeetingTable x={rcx} z={rcz} w={w * 0.5} d={h * 0.4} />
          </group>
        )
      })}

      {/* Pods redondos (Oeste) */}
      {doc.zonas.filter((z) => z.kind === 'pod').map((z) => {
        const { cx: pcx, cy: pcy } = center(z)
        const px = toM(pcx), pz = toM(pcy), r = toM(Math.min(z.w, z.h)) / 2
        return (
          <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <mesh position={[px, 1.35, pz]}><cylinderGeometry args={[r, r, 2.7, 28, 1, true]} /><meshStandardMaterial color="#9fe0ff" transparent opacity={0.12} roughness={0.1} metalness={0.2} side={THREE.DoubleSide} />{z.id === selectedId && <Edges color="#ffd166" />}</mesh>
            <RoundTable x={px} z={pz} r={r * 0.5} />
          </group>
        )
      })}

      {techo && (<mesh geometry={floorG} position={[0, toM(doc.alturaLibre), 0]}><meshStandardMaterial color="#0e1c3c" transparent opacity={0.16} side={THREE.DoubleSide} /></mesh>)}

      {orient.map((o, i) => (<Html key={i} position={[o.x, 2.4, o.z]} center distanceFactor={46} zIndexRange={[10, 0]}><div className={o.cls}>{o.t}</div></Html>))}

      <ContactShadows position={[cx, 0.04, cz]} scale={100} blur={2.6} opacity={0.5} far={30} resolution={1024} color="#02040a" />

      <Environment resolution={256}>
        <Lightformer intensity={noche ? 0.5 : 1.3} position={[0, 12, 0]} scale={[30, 30, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={0.7} position={[18, 6, -16]} scale={[10, 10, 1]} color="#ffffff" />
        <Lightformer intensity={0.7} position={[-18, 6, 16]} scale={[10, 10, 1]} color="#27e0ff" />
        <Lightformer intensity={0.5} position={[0, 6, 22]} scale={[18, 6, 1]} color="#0424d9" />
      </Environment>

      <OrbitControls target={[cx, 0, cz]} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.15} minDistance={16} maxDistance={180} />
    </Canvas>
  )
}
