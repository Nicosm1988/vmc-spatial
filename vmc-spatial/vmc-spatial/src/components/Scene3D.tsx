// ============================================================================
// Escena 3D (R3F + Drei) · Editor en vivo con:
//  (1) FIX arrastre: al tomar un objeto, OrbitControls se desactiva (ref).
//  (2) Paredes de monitores editables (seleccionar/mover/rotar/estirar).
//  (3) Piso ALFOMBRA procedural + anillo más oscuro a ~3 m del núcleo.
//  (4) DÍA real: cielo (Sky) + sol + vidriado perimetral con vista afuera.
// ============================================================================
import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky, ContactShadows, Edges, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument, Zone } from '../types'
import { toM, heat, wallGeom } from '../lib/geometry'
import { scalePoly } from '../lib/plate'
import { makeCarpet } from '../lib/carpet'
import { INSIGHTS } from '../lib/insights'
import { DeskBench, VideoWall, RoundTable, Comedor, Oficina } from './Furniture'

interface Props {
  doc: VmcDocument; selectedId: string | null; insight: InsightKey
  noche: boolean; techo: boolean; editing: boolean; snap: boolean
  onSelect: (id: string | null) => void
  onMove: (id: string, cxmm: number, cymm: number) => void
}

function shapeFrom(poly: Point[]) {
  const s = new THREE.Shape()
  poly.forEach((p, i) => { const x = toM(p.x), z = toM(p.y); if (i === 0) s.moveTo(x, z); else s.lineTo(x, z) })
  s.closePath(); return s
}
function slab(poly: Point[], depth: number) {
  const g = new THREE.ExtrudeGeometry(shapeFrom(poly), { depth, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g
}
// Anillo (banda) entre dos polígonos: outer con hole=inner.
function ringGeom(outer: Point[], inner: Point[], depth: number) {
  const s = shapeFrom(outer)
  const h = new THREE.Path()
  inner.forEach((p, i) => { const x = toM(p.x), z = toM(p.y); if (i === 0) h.moveTo(x, z); else h.lineTo(x, z) })
  h.closePath(); s.holes.push(h)
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g
}
const toMM = (m: number) => Math.round(m * 1000)

export default function Scene3D({ doc, selectedId, insight, noche, techo, editing, snap, onSelect, onMove }: Props) {
  const controls = useRef<any>(null)
  const grab = useRef<{ id: string; dx: number; dz: number } | null>(null)
  const floorG = useMemo(() => slab(doc.plate, 0.3), [doc.plate])
  const carpet = useMemo(() => makeCarpet([150, 158, 168]), [])
  const carpetDark = useMemo(() => makeCarpet([96, 100, 110]), [])
  const cx = toM(doc.ancho) / 2, cz = toM(doc.alto) / 2
  const insightDef = INSIGHTS[insight]

  // Anillo oscuro ~3 m alrededor del núcleo (rodea la "Value").
  const ccx = doc.core.reduce((s, p) => s + p.x, 0) / doc.core.length
  const ccy = doc.core.reduce((s, p) => s + p.y, 0) / doc.core.length
  const coreOuter = scalePoly(doc.core, 1.55, ccx, ccy)   // ~3 m hacia afuera
  const ringG = useMemo(() => ringGeom(coreOuter, doc.core, 0.02), [doc.core])
  // Vidriado perimetral (anillo fino en el borde de la placa).
  const glassG = useMemo(() => ringGeom(doc.plate, scalePoly(doc.plate, 0.985, 31000, 20000), 2.6), [doc.plate])

  function beginGrab(id: string, e: any) {
    onSelect(id)
    if (!editing) return
    e.stopPropagation()
    if (controls.current) controls.current.enabled = false   // (1) frena el orbit
    grab.current = { id, dx: e.point.x, dz: e.point.z }
  }
  function floorMove(e: any) {
    if (!grab.current) return
    e.stopPropagation()
    let nx = toMM(e.point.x), ny = toMM(e.point.z)
    if (snap) { nx = Math.round(nx / 250) * 250; ny = Math.round(ny / 250) * 250 }
    onMove(grab.current.id, nx, ny)
  }
  function endGrab() { grab.current = null; if (controls.current) controls.current.enabled = true }
  const cur = (on: boolean) => { document.body.style.cursor = editing ? (on ? 'grab' : 'auto') : (on ? 'pointer' : 'auto') }

  const orient = [
    { t: 'FRENTE ▶ (Este)', cls: 'tag3d front', x: toM(60500), z: cz },
    { t: '◀ FONDO (Oeste)', cls: 'tag3d back', x: toM(2500), z: cz },
    { t: 'LADO NORTE', cls: 'tag3d', x: cx, z: toM(3400) },
    { t: 'LADO SUR', cls: 'tag3d', x: cx, z: toM(37000) },
  ]

  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [cx - 30, 46, cz + 60], fov: 45 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      {/* (4) DÍA real: cielo procedural + niebla clara */}
      {!noche
        ? <Sky sunPosition={[60, 24, 40]} turbidity={5} rayleigh={1.2} mieCoefficient={0.006} mieDirectionalG={0.85} />
        : <color attach="background" args={['#05070f']} />}
      <fog attach="fog" args={[noche ? '#05070f' : '#cfe0ef', 120, 320]} />
      <hemisphereLight args={[noche ? '#20304a' : '#eaf3ff', '#3a3f44', noche ? 0.3 : 0.9]} />
      <ambientLight intensity={noche ? 0.28 : 0.5} />
      <directionalLight position={[cx + 40, 55, cz - 20]} intensity={noche ? 0.5 : 2.0} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-55, 55, 55, -55, 0.1, 220]} />
      </directionalLight>

      {/* (3) PISO ALFOMBRA (sin líneas raras) */}
      <mesh geometry={floorG} position={[0, -0.02, 0]} receiveShadow onClick={() => { if (!grab.current) onSelect(null) }} onPointerMove={floorMove} onPointerUp={endGrab} onPointerLeave={endGrab}>
        <meshStandardMaterial map={carpet} color="#9aa2ac" roughness={0.98} metalness={0} />
      </mesh>
      {/* Anillo de alfombra más oscura alrededor del núcleo */}
      <mesh geometry={ringG} position={[0, 0.015, 0]} receiveShadow>
        <meshStandardMaterial map={carpetDark} color="#6a6f79" roughness={1} metalness={0} />
      </mesh>

      {/* (4) Vidriado perimetral (ventanas) + marcos */}
      <mesh geometry={glassG} position={[0, 0.30, 0]}>
        <meshPhysicalMaterial color="#bfe0f5" transparent opacity={0.16} roughness={0.05} metalness={0} transmission={0.6} thickness={0.2} />
      </mesh>
      <mesh geometry={glassG} position={[0, 0.30, 0]} scale={[1, 0.001, 1]}><meshStandardMaterial color="#8a97a6" /></mesh>
      <mesh geometry={glassG} position={[0, 2.88, 0]} scale={[1, 0.001, 1]}><meshStandardMaterial color="#8a97a6" /></mesh>

      {/* Núcleo (fijo) */}
      {doc.zonas.filter((z) => z.kind === 'nucleo').map((z) => (
        <mesh key={z.id} geometry={slab(doc.core, 0.14)} position={[0, 0.07, 0]} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }}>
          <meshStandardMaterial color="#0c1226" roughness={0.85} metalness={0.08} /><Edges color={z.id === selectedId ? '#ffd166' : '#0E9BC4'} />
        </mesh>
      ))}

      {/* (2) PAREDES DE MONITORES — editables (mover/rotar/estirar) */}
      {doc.videoWalls.map((v) => {
        const g = wallGeom(v)
        const mx = toM(g.cx), mz = toM(g.cy), len = toM(g.len)
        return (
          <group key={v.id} position={[mx, 0, mz]} rotation={[0, -g.ang, 0]}
            onPointerDown={(e) => beginGrab(v.id, e)}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            <VideoWall len={len} night={noche} count={v.pantallas} filas={v.filas} selected={v.id === selectedId} />
          </group>
        )
      })}

      {/* Islas bench (editables) */}
      {doc.zonas.filter((z) => z.kind === 'bench').map((z) => {
        const fill = insight === 'none' ? z.color : heat(insightDef.value(z))
        const len = toM((z.pairs || 3) * 1600) + 0.6, sel = z.id === selectedId
        return (
          <group key={z.id} position={[toM(z.cx), 0, toM(z.cy)]} rotation={[0, -(z.rot || 0), 0]}
            onPointerDown={(e) => beginGrab(z.id, e)}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            <mesh position={[0, 0.03, 0]}><boxGeometry args={[len, 0.05, 3.3]} /><meshStandardMaterial color={fill} roughness={0.6} metalness={0.05} transparent opacity={grab.current?.id === z.id ? 0.4 : 0.16} />{sel && <Edges color="#ffd166" />}</mesh>
            <DeskBench pairs={z.pairs || 3} screen={fill} night={noche} />
          </group>
        )
      })}

      {/* Mesas redondas (editables) */}
      {doc.zonas.filter((z) => z.kind === 'circular').map((z) => {
        const sel = z.id === selectedId, r = toM(z.r || 1650)
        return (
          <group key={z.id} position={[toM(z.cx), 0, toM(z.cy)]}
            onPointerDown={(e) => beginGrab(z.id, e)}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            {sel && <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[r, r, 0.06, 24]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}
            <RoundTable x={0} z={0} r={r} seats={5} />
          </group>
        )
      })}

      {/* Comedores (editables) */}
      {doc.zonas.filter((z) => z.kind === 'comedor').map((z) => {
        const sel = z.id === selectedId, w = toM(z.w || 3600)
        return (
          <group key={z.id} position={[toM(z.cx), 0, toM(z.cy)]} rotation={[0, -(z.rot || 0), 0]}
            onPointerDown={(e) => beginGrab(z.id, e)}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            {sel && <mesh position={[0, 0.05, 0]}><boxGeometry args={[w + 0.6, 0.06, 2.4]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}
            <Comedor x={0} z={0} w={w} rotY={0} seats={8} />
          </group>
        )
      })}

      {/* Oficinas (editables) */}
      {doc.zonas.filter((z) => z.kind === 'oficina').map((z) => {
        const w = toM(z.w || 3800), h = toM(z.h || 2600), sel = z.id === selectedId
        return (
          <group key={z.id} position={[toM(z.cx), 0, toM(z.cy)]} rotation={[0, -(z.rot || 0), 0]}
            onPointerDown={(e) => beginGrab(z.id, e)}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            <Oficina w={w} h={h} night={noche} color={z.color} />
            {sel && <mesh position={[0, 1.4, 0]}><boxGeometry args={[w, 2.8, h]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}
          </group>
        )
      })}

      {techo && (<mesh geometry={floorG} position={[0, toM(doc.alturaLibre), 0]}><meshStandardMaterial color="#e9e4da" transparent opacity={0.35} side={THREE.DoubleSide} /></mesh>)}
      {orient.map((o, i) => (<Html key={i} position={[o.x, 2.6, o.z]} center distanceFactor={48} zIndexRange={[10, 0]}><div className={o.cls}>{o.t}</div></Html>))}

      <ContactShadows position={[cx, 0.03, cz]} scale={104} blur={2.4} opacity={0.42} far={30} resolution={1024} color="#101418" />
      <OrbitControls ref={controls} target={[cx, 0, cz]} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.15} minDistance={14} maxDistance={190} />
    </Canvas>
  )
}
