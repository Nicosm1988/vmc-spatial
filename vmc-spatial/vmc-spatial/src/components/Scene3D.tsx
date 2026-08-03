// ============================================================================
// Escena 3D realista (R3F + Drei), distribución del plano CAD.
// - Planta lente (Pelli). FRENTE = Este (3 oficinas). FONDO = Oeste. Lados N/S.
// - Núcleo central EN CRUZ (2 barras) con 4 Video Walls en las caras.
// - Islas de escritorios con silla Herman Miller + monitor curvo ENTERO.
// - Etiquetas de orientación (Html) para no mezclar frente/fondo/lados.
// ============================================================================
import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Lightformer, ContactShadows, RoundedBox, Edges, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument, Zone } from '../types'
import { toM, packDesks, center, heat } from '../lib/geometry'
import { INSIGHTS } from '../lib/insights'
import { Workstation, VideoWallGrid, MeetingTable, RoundTable, HermanMillerChair, CurvedMonitor, WhiteDesk } from './Furniture'

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

// Cluster de escritorios (isla). Los puestos miran al núcleo.
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

// Oficina vidriada (frente). big = con escritorio + monitor + silla adentro.
function Office({ z, selected, night, onSelect }: { z: Zone; selected: boolean; night: boolean; onSelect: (id: string) => void }) {
  const x = toM(z.x), zz = toM(z.y), w = toM(z.w), h = toM(z.h)
  const rcx = x + w / 2, rcz = zz + h / 2
  const big = z.id === 'oficina-centro'
  return (
    <group onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
      onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
      {/* Vidrio */}
      <mesh position={[rcx, 1.4, rcz]}>
        <boxGeometry args={[w, 2.8, h]} />
        <meshStandardMaterial color="#a9deff" transparent opacity={0.14} roughness={0.08} metalness={0.2} side={THREE.DoubleSide} />
        {selected && <Edges color="#ffd166" />}
      </mesh>
      {/* Base/solado */}
      <mesh position={[rcx, 0.04, rcz]}><boxGeometry args={[w, 0.06, h]} /><meshStandardMaterial color={z.color} roughness={0.5} metalness={0.1} transparent opacity={0.5} /></mesh>
      {/* Escritorio del ejecutivo (mira al río, -X = hacia el núcleo; ubicamos mirando al frente) */}
      <group position={[rcx, 0, rcz]} rotation={[0, Math.PI / 2, 0]}>
        <WhiteDesk />
        {big && <CurvedMonitor screen={z.color} night={night} />}
        <HermanMillerChair x={0} z={0.66} rot={Math.PI} />
      </group>
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

  // Etiquetas de orientación (Html, offline). x/z en metros.
  const orient = [
    { t: 'FRENTE ▶ (Este · Río)', cls: 'tag3d front', x: toM(60000), z: cz },
    { t: '◀ FONDO (Oeste · Ciudad)', cls: 'tag3d back', x: toM(2500), z: cz },
    { t: 'LADO NORTE', cls: 'tag3d', x: cx, z: toM(3200) },
    { t: 'LADO SUR', cls: 'tag3d', x: cx, z: toM(37000) },
  ]

  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [cx - 26, 44, cz + 60], fov: 45 }} gl={{ antialias: true }}>
      <color attach="background" args={[bg]} />
      <fog attach="fog" args={[bg, 85, 220]} />
      <ambientLight intensity={noche ? 0.3 : 0.62} />
      <directionalLight position={[cx - 28, 44, cz - 18]} intensity={noche ? 0.5 : 1.15} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048}>
        <orthographicCamera attach="shadow-camera" args={[-50, 50, 50, -50, 0.1, 180]} />
      </directionalLight>

      {/* Piso (lente) */}
      <mesh geometry={floorGeo} position={[0, -0.02, 0]} receiveShadow onClick={() => onSelect(null)}>
        <meshStandardMaterial color="#0a1836" roughness={0.85} metalness={0.12} />
      </mesh>
      <mesh geometry={floorGeo} position={[0, 0, 0]}>
        <meshBasicMaterial color="#03c1bd" wireframe transparent opacity={0.09} />
      </mesh>

      {/* Bandas de orientación: FRENTE (teal) al Este, FONDO (azul) al Oeste */}
      <mesh position={[toM(54000), 0.05, cz]}><boxGeometry args={[toM(9000), 0.02, toM(20000)]} /><meshStandardMaterial color="#03c1bd" transparent opacity={0.1} /></mesh>
      <mesh position={[toM(8000), 0.05, cz]}><boxGeometry args={[toM(9000), 0.02, toM(20000)]} /><meshStandardMaterial color="#0424d9" transparent opacity={0.1} /></mesh>

      {/* Núcleo EN CRUZ (dos barras) */}
      {core && (() => {
        const x = toM(core.x), zz = toM(core.y), w = toM(core.w), h = toM(core.h)
        const ccx = x + w / 2, ccz = zz + h / 2
        const sel = core.id === selectedId
        return (
          <group onClick={(e) => { e.stopPropagation(); onSelect(core.id) }}
            onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <mesh position={[ccx, 1.4, ccz]} castShadow receiveShadow>
              <boxGeometry args={[w, 2.8, h * 0.42]} />
              <meshStandardMaterial color="#0c1226" roughness={0.7} metalness={0.2} />
              {sel && <Edges color="#ffd166" />}
            </mesh>
            <mesh position={[ccx, 1.4, ccz]} castShadow receiveShadow>
              <boxGeometry args={[w * 0.42, 2.8, h]} />
              <meshStandardMaterial color="#0c1226" roughness={0.7} metalness={0.2} />
            </mesh>
          </group>
        )
      })()}

      {/* Islas de escritorios */}
      {doc.zonas.filter((z) => z.kind === 'cluster').map((z) => {
        const fill = insight === 'none' ? z.color : heat(insightDef.value(z))
        return <Cluster key={z.id} z={z} plate={doc.plate} cx={cx} cz={cz} fill={fill} selected={z.id === selectedId} night={noche} onSelect={onSelect} />
      })}

      {/* Video walls en las caras del núcleo */}
      {doc.videoWalls.map((v) => {
        const x1 = toM(v.x1), y1 = toM(v.y1), x2 = toM(v.x2), y2 = toM(v.y2)
        const mx = (x1 + x2) / 2, mz = (y1 + y2) / 2
        const len = Math.hypot(x2 - x1, y2 - y1)
        const rotY = Math.atan2(mx - cx, mz - cz)
        return <VideoWallGrid key={v.id} x={mx} z={mz} len={len} rotY={rotY} night={noche} />
      })}

      {/* Oficinas del FRENTE (Este) */}
      {doc.zonas.filter((z) => z.kind === 'oficina').map((z) => (
        <Office key={z.id} z={z} selected={z.id === selectedId} night={noche} onSelect={onSelect} />
      ))}

      {/* Salas de reunión vidriadas (Oeste del núcleo) */}
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
            <MeetingTable x={rcx} z={rcz} w={w * 0.5} d={h * 0.4} />
          </group>
        )
      })}

      {/* Pods redondos (esquinas) */}
      {doc.zonas.filter((z) => z.kind === 'servicio').map((z) => {
        const { cx: pcx, cy: pcy } = center(z)
        const px = toM(pcx), pz = toM(pcy), r = toM(Math.min(z.w, z.h)) / 2
        return (
          <group key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}
            onPointerOver={(e) => { e.stopPropagation(); cursor(true) }} onPointerOut={() => cursor(false)}>
            <mesh position={[px, 1.35, pz]}>
              <cylinderGeometry args={[r, r, 2.7, 28, 1, true]} />
              <meshStandardMaterial color="#9fe0ff" transparent opacity={0.12} roughness={0.1} metalness={0.2} side={THREE.DoubleSide} />
              {z.id === selectedId && <Edges color="#ffd166" />}
            </mesh>
            <RoundTable x={px} z={pz} r={r * 0.5} />
          </group>
        )
      })}

      {/* Techo opcional */}
      {techo && (
        <mesh geometry={floorGeo} position={[0, toM(doc.alturaLibre), 0]}>
          <meshStandardMaterial color="#0e1c3c" transparent opacity={0.16} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Etiquetas de orientación */}
      {orient.map((o, i) => (
        <Html key={i} position={[o.x, 2.4, o.z]} center distanceFactor={46} zIndexRange={[10, 0]}>
          <div className={o.cls}>{o.t}</div>
        </Html>
      ))}

      <ContactShadows position={[cx, 0.04, cz]} scale={98} blur={2.6} opacity={0.5} far={30} resolution={1024} color="#02040a" />

      <Environment resolution={256}>
        <Lightformer intensity={noche ? 0.5 : 1.3} position={[0, 12, 0]} scale={[28, 28, 1]} rotation-x={Math.PI / 2} />
        <Lightformer intensity={0.7} position={[16, 6, -14]} scale={[10, 10, 1]} color="#ffffff" />
        <Lightformer intensity={0.7} position={[-16, 6, 14]} scale={[10, 10, 1]} color="#27e0ff" />
        <Lightformer intensity={0.5} position={[0, 6, 20]} scale={[16, 6, 1]} color="#0424d9" />
      </Environment>

      <OrbitControls target={[cx, 0, cz]} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.15} minDistance={16} maxDistance={170} />
    </Canvas>
  )
}
