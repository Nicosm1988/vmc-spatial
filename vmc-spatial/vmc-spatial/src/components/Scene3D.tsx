// ============================================================================
// Escena 3D (R3F + Drei). Núcleo DIAMANTE asimétrico (atrás corto, frente largo)
// con VIDEO WALLS en las 4 CARAS (incluida la del fondo). Cada pared se orienta
// sobre su arista y las pantallas miran HACIA AFUERA (a los escritorios).
// ============================================================================
import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, ContactShadows, Edges, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument, Zone } from '../types'
import { toM, heat } from '../lib/geometry'
import { INSIGHTS } from '../lib/insights'
import { DeskBench, VideoWallGrid, WoodTable, CircularRoom, ExecDesk } from './Furniture'

interface Props { doc: VmcDocument; selectedId: string | null; insight: InsightKey; noche: boolean; techo: boolean; onSelect: (id: string | null) => void }

function shapeFrom(poly: Point[]) {
  const s = new THREE.Shape()
  poly.forEach((p, i) => { const x = toM(p.x), z = toM(p.y); if (i === 0) s.moveTo(x, z); else s.lineTo(x, z) })
  s.closePath(); return s
}
function slab(poly: Point[], depth: number) {
  const g = new THREE.ExtrudeGeometry(shapeFrom(poly), { depth, bevelEnabled: false })
  g.rotateX(Math.PI / 2); return g
}
function cursor(on: boolean) { document.body.style.cursor = on ? 'pointer' : 'auto' }

function Bench({ z, fill, selected, night, onSelect }: { z: Zone; fill: string; selected: boolean; night: boolean; onSelect: (id: string) => void }) {
  const x = toM(z.cx), zz = toM(z.cy), rotY = -(z.rot || 0)
  const len = toM((z.pairs || 3) * 1500) + 0.6, wid = 3.2
  return (
    <group position={[x, 0, zz]} rotation={[0, rotY, 0]}
      onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
      onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
      <mesh position={[0, 0.03, 0]}><boxGeometry args={[len, 0.05, wid]} /><meshStandardMaterial color={fill} roughness={0.6} metalness={0.05} transparent opacity={0.22} />{selected && <Edges color="#ffd166" />}</mesh>
      <DeskBench pairs={z.pairs || 3} screen={fill} night={night} />
    </group>
  )
}

export default function Scene3D({ doc, selectedId, insight, noche, techo, onSelect }: Props) {
  const floorG = useMemo(() => slab(doc.plate, 0.3), [doc.plate])
  const coreG = useMemo(() => slab(doc.core, 0.32), [doc.core])
  const cx = toM(doc.ancho) / 2, cz = toM(doc.alto) / 2
  // centro real del núcleo (para orientar las paredes hacia afuera)
  const coreCx = toM(doc.core.reduce((s, p) => s + p.x, 0) / doc.core.length)
  const coreCz = toM(doc.core.reduce((s, p) => s + p.y, 0) / doc.core.length)
  const insightDef = INSIGHTS[insight]
  const bg = noche ? '#03060f' : '#060c1c'

  const orient = [
    { t: 'FRENTE ▶ (Este · Río)', cls: 'tag3d front', x: toM(60500), z: cz },
    { t: '◀ FONDO (Oeste · Ciudad)', cls: 'tag3d back', x: toM(2500), z: cz },
    { t: 'LADO NORTE', cls: 'tag3d', x: cx, z: toM(3400) },
    { t: 'LADO SUR', cls: 'tag3d', x: cx, z: toM(37000) },
  ]

  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [cx - 30, 48, cz + 64], fov: 45 }} gl={{ antialias: true }}>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 92, 240]} />
      <ambientLight intensity={noche ? 0.3 : 0.62} />
      <directionalLight position={[cx - 30, 48, cz - 20]} intensity={noche ? 0.5 : 1.15} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}>
        <orthographicCamera attach="shadow-camera" args={[-54, 54, 54, -54, 0.1, 200]} />
      </directionalLight>

      <mesh geometry={floorG} position={[0, -0.02, 0]} receiveShadow onClick={() => onSelect(null)}>
        <meshStandardMaterial color="#0a1836" roughness={0.85} metalness={0.12} />
      </mesh>
      <mesh geometry={floorG} position={[0, 0, 0]}><meshBasicMaterial color="#03c1bd" wireframe transparent opacity={0.08} /></mesh>

      <mesh position={[toM(56000), 0.05, cz]}><boxGeometry args={[toM(8000), 0.02, toM(16000)]} /><meshStandardMaterial color="#03c1bd" transparent opacity={0.1} /></mesh>
      <mesh position={[toM(7000), 0.05, cz]}><boxGeometry args={[toM(7000), 0.02, toM(16000)]} /><meshStandardMaterial color="#0424d9" transparent opacity={0.1} /></mesh>

      {/* Núcleo diamante (extruido en volumen) */}
      {doc.zonas.filter((z) => z.kind === 'nucleo').map((z) => (
        <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
          onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
          <mesh geometry={coreG} position={[0, 0.16, 0]} scale={[1, 8.4, 1]}><meshStandardMaterial color="#0c1226" roughness={0.7} metalness={0.2} />{z.id === selectedId && <Edges color="#ffd166" />}</mesh>
          <mesh geometry={coreG} position={[0, 0.16, 0]} scale={[1, 8.4, 1]}><meshBasicMaterial color="#0E9BC4" wireframe transparent opacity={0.16} /></mesh>
        </group>
      ))}

      {/* Video walls en las 4 caras del diamante (orientadas sobre la arista, mirando afuera) */}
      {doc.videoWalls.map((v) => {
        const x1 = toM(v.x1), y1 = toM(v.y1), x2 = toM(v.x2), y2 = toM(v.y2)
        const mx = (x1 + x2) / 2, mz = (y1 + y2) / 2
        const len = Math.hypot(x2 - x1, y2 - y1)
        const ux = (x2 - x1) / len, uz = (y2 - y1) / len
        let rotY = Math.atan2(-uz, ux)               // local X sobre la arista
        const nzx = Math.sin(rotY), nzz = Math.cos(rotY) // dir mundial de +Z local
        if (nzx * (mx - coreCx) + nzz * (mz - coreCz) < 0) rotY += Math.PI // que mire afuera
        return <VideoWallGrid key={v.id} x={mx} z={mz} len={len} rotY={rotY} night={noche} />
      })}

      {/* Islas de trabajo */}
      {doc.zonas.filter((z) => z.kind === 'bench').map((z) => {
        const fill = insight === 'none' ? z.color : heat(insightDef.value(z))
        return <Bench key={z.id} z={z} fill={fill} selected={z.id === selectedId} night={noche} onSelect={onSelect} />
      })}

      {/* Mesas de madera */}
      {doc.zonas.filter((z) => z.kind === 'wood').map((z) => (
        <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
          onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
          <WoodTable x={toM(z.cx)} z={toM(z.cy)} w={toM(z.w || 2200)} d={toM(z.h || 1400)} />
        </group>
      ))}

      {/* Circulares */}
      {doc.zonas.filter((z) => z.kind === 'circular').map((z) => (
        <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
          onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
          <CircularRoom x={toM(z.cx)} z={toM(z.cy)} r={toM(z.r || 1650)} color={z.color} selected={z.id === selectedId} />
        </group>
      ))}

      {/* Salas rectangulares */}
      {doc.zonas.filter((z) => z.kind === 'sala').map((z) => {
        const w = toM(z.w || 3600), h = toM(z.h || 2900)
        return (
          <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
            onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <mesh position={[toM(z.cx), 1.35, toM(z.cy)]}><boxGeometry args={[w, 2.7, h]} /><meshStandardMaterial color="#8fd6ff" transparent opacity={0.12} roughness={0.1} metalness={0.2} />{z.id === selectedId && <Edges color="#ffd166" />}</mesh>
            <mesh position={[toM(z.cx), 0.74, toM(z.cy)]}><boxGeometry args={[w * 0.5, 0.06, h * 0.45]} /><meshStandardMaterial color="#2a3350" roughness={0.4} /></mesh>
          </group>
        )
      })}

      {/* 3 oficinas del frente */}
      {doc.zonas.filter((z) => z.kind === 'oficina').map((z) => {
        const w = toM(z.w || 3800), h = toM(z.h || 2600), big = z.id === 'of-central'
        return (
          <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
            onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <mesh position={[toM(z.cx), 1.4, toM(z.cy)]}><boxGeometry args={[w, 2.8, h]} /><meshStandardMaterial color="#a9deff" transparent opacity={0.14} roughness={0.08} metalness={0.2} side={THREE.DoubleSide} />{z.id === selectedId && <Edges color="#ffd166" />}</mesh>
            <mesh position={[toM(z.cx), 0.04, toM(z.cy)]}><boxGeometry args={[w, 0.06, h]} /><meshStandardMaterial color={z.color} roughness={0.5} metalness={0.1} transparent opacity={0.5} /></mesh>
            <group position={[toM(z.cx), 0, toM(z.cy)]} rotation={[0, Math.PI / 2, 0]}><ExecDesk screen={z.color} night={noche} monitor={big} /></group>
          </group>
        )
      })}

      {techo && (<mesh geometry={floorG} position={[0, toM(doc.alturaLibre), 0]}><meshStandardMaterial color="#0e1c3c" transparent opacity={0.16} side={THREE.DoubleSide} /></mesh>)}

      {orient.map((o, i) => (<Html key={i} position={[o.x, 2.6, o.z]} center distanceFactor={48} zIndexRange={[10, 0]}><div className={o.cls}>{o.t}</div></Html>))}

      <ContactShadows position={[cx, 0.04, cz]} scale={102} blur={2.6} opacity={0.5} far={30} resolution={1024} color="#02040a" />
      <Environment resolution={256}>
        <Lightformer intensity={noche ? 0.5 : 1.3} position={[0, 12, 0]} scale={[32, 32, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={0.7} position={[18, 6, -16]} scale={[10, 10, 1]} color="#ffffff" />
        <Lightformer intensity={0.7} position={[-18, 6, 16]} scale={[10, 10, 1]} color="#27e0ff" />
        <Lightformer intensity={0.5} position={[0, 6, 22]} scale={[18, 6, 1]} color="#0424d9" />
      </Environment>
      <OrbitControls target={[cx, 0, cz]} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.15} minDistance={16} maxDistance={185} />
    </Canvas>
  )
}
