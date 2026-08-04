// ============================================================================
// Escena 3D (R3F + Drei) · Editor en vivo.
// FIX #2/#5: arrastre FLUIDO por referencia directa (mueve el Object3D sin
//   re-renderizar la escena; commit al soltar). Intersección exacta con y=0.
// FIX #3: la pared usa `flip` (elegís el lado); la rotación funciona.
// FIX #6: la pared se estira desde el Inspector (largo) — endpoints derivados.
// FIX #4: monitores hacia las sillas (en Furniture).
// ============================================================================
import { useMemo, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Sky, ContactShadows, Edges } from '@react-three/drei'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument } from '../types'
import { toM, heat, wallGeom } from '../lib/geometry'
import { scalePoly } from '../lib/plate'
import { makeCarpet } from '../lib/carpet'
import { INSIGHTS } from '../lib/insights'
import { DeskBench, VideoWall, RoundTable, Comedor, Oficina, Window } from './Furniture'

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
function ringGeom(outer: Point[], inner: Point[], depth: number) {
  const s = shapeFrom(outer)
  const h = new THREE.Path()
  inner.forEach((p, i) => { const x = toM(p.x), z = toM(p.y); if (i === 0) h.moveTo(x, z); else h.lineTo(x, z) })
  h.closePath(); s.holes.push(h)
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g
}
const toMM = (m: number) => Math.round(m * 1000)
function resample(poly: Point[], n: number): Point[] { const out: Point[] = []; for (let i = 0; i < n; i++) out.push(poly[Math.round((i * (poly.length - 1)) / n)]); return out }

export default function Scene3D({ doc, selectedId, insight, noche, techo, editing, snap, onSelect, onMove }: Props) {
  const controls = useRef<any>(null)
  // drag por referencia: guardamos el Object3D y el offset (world) — sin setState
  const drag = useRef<{ id: string; obj: THREE.Object3D; ox: number; oz: number } | null>(null)
  const floorG = useMemo(() => slab(doc.plate, 0.3), [doc.plate])
  const carpet = useMemo(() => makeCarpet([150, 158, 168]), [])
  const carpetDark = useMemo(() => makeCarpet([96, 100, 110]), [])
  const cx = toM(doc.ancho) / 2, cz = toM(doc.alto) / 2
  const insightDef = INSIGHTS[insight]

  const ccx = doc.core.reduce((s, p) => s + p.x, 0) / doc.core.length
  const ccy = doc.core.reduce((s, p) => s + p.y, 0) / doc.core.length
  const coreOuter = scalePoly(doc.core, 1.55, ccx, ccy)
  const ringG = useMemo(() => ringGeom(coreOuter, doc.core, 0.02), [doc.core])
  const winInner = useMemo(() => scalePoly(doc.plate, 0.985, 31000, 20000), [doc.plate])
  const winPts = useMemo(() => resample(winInner, 30), [winInner])

  // Intersección EXACTA del rayo del puntero con el plano y=0 (arrastre preciso).
  function planePoint(e: any): { x: number; z: number } {
    const r = e.ray as THREE.Ray
    const t = -r.origin.y / r.direction.y
    return { x: r.origin.x + r.direction.x * t, z: r.origin.z + r.direction.z * t }
  }
  function beginGrab(id: string, e: any) {
    onSelect(id)
    if (!editing) return
    e.stopPropagation()
    if (controls.current) controls.current.enabled = false
    const obj = e.eventObject as THREE.Object3D
    const p = planePoint(e)
    drag.current = { id, obj, ox: obj.position.x - p.x, oz: obj.position.z - p.z }
    ;(e.target as Element)?.setPointerCapture?.(e.pointerId)
  }
  function moveGrab(e: any) {
    if (!drag.current) return
    e.stopPropagation()
    const p = planePoint(e)
    drag.current.obj.position.x = p.x + drag.current.ox   // mueve directo -> 60fps
    drag.current.obj.position.z = p.z + drag.current.oz
  }
  function endGrab() {
    if (drag.current) {
      let nx = toMM(drag.current.obj.position.x), ny = toMM(drag.current.obj.position.z)
      if (snap) { nx = Math.round(nx / 250) * 250; ny = Math.round(ny / 250) * 250 }
      onMove(drag.current.id, nx, ny)
      drag.current = null
    }
    if (controls.current) controls.current.enabled = true
  }
  const cur = (on: boolean) => { document.body.style.cursor = editing ? (on ? 'grab' : 'auto') : (on ? 'pointer' : 'auto') }
  // handlers compartidos: cualquier mesh capturable delega el move/up
  const dragHandlers = { onPointerMove: moveGrab, onPointerUp: endGrab }

  return (
    <Canvas shadows dpr={[1, 1.75]} camera={{ position: [cx - 30, 46, cz + 60], fov: 45 }} gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      {!noche
        ? <Sky sunPosition={[60, 24, 40]} turbidity={5} rayleigh={1.2} mieCoefficient={0.006} mieDirectionalG={0.85} />
        : <color attach="background" args={['#05070f']} />}
      <fog attach="fog" args={[noche ? '#05070f' : '#cfe0ef', 130, 340]} />
      <hemisphereLight args={[noche ? '#20304a' : '#eaf3ff', '#3a3f44', noche ? 0.3 : 0.9]} />
      <ambientLight intensity={noche ? 0.28 : 0.5} />
      <directionalLight position={[cx + 40, 55, cz - 20]} intensity={noche ? 0.5 : 2.0} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-55, 55, 55, -55, 0.1, 220]} />
      </directionalLight>

      {/* PISO ALFOMBRA (captura move/up del arrastre) */}
      <mesh geometry={floorG} position={[0, -0.02, 0]} receiveShadow onClick={() => { if (!drag.current) onSelect(null) }} {...dragHandlers}>
        <meshStandardMaterial map={carpet} color="#9aa2ac" roughness={0.98} metalness={0} />
      </mesh>
      <mesh geometry={ringG} position={[0, 0.015, 0]} receiveShadow {...dragHandlers}>
        <meshStandardMaterial map={carpetDark} color="#6a6f79" roughness={1} metalness={0} />
      </mesh>

      {/* VENTANAS reales */}
      {winPts.map((p, i) => {
        const q = winPts[(i + 1) % winPts.length]
        const x1 = toM(p.x), z1 = toM(p.y), x2 = toM(q.x), z2 = toM(q.y)
        const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, len = Math.hypot(x2 - x1, z2 - z1)
        if (len < 0.3) return null
        const ang = Math.atan2(-(z2 - z1), x2 - x1)
        return (<group key={`win${i}`} position={[mx, 0.1, mz]} rotation={[0, ang, 0]}><Window len={len + 0.05} height={2.9} /></group>)
      })}

      {/* Núcleo */}
      {doc.zonas.filter((z) => z.kind === 'nucleo').map((z) => (
        <mesh key={z.id} geometry={slab(doc.core, 0.14)} position={[0, 0.07, 0]} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} {...dragHandlers}>
          <meshStandardMaterial color="#0c1226" roughness={0.85} metalness={0.08} /><Edges color={z.id === selectedId ? '#ffd166' : '#0E9BC4'} />
        </mesh>
      ))}

      {/* PAREDES DE MONITORES — respetan rotación + flip elegible */}
      {doc.videoWalls.map((v) => {
        const g = wallGeom(v)
        const mx = toM(g.cx), mz = toM(g.cy), len = toM(g.len)
        let theta = Math.atan2(-(v.y2 - v.y1), v.x2 - v.x1)   // alinea +X con el segmento
        let flip = v.flip
        if (flip === undefined) { const nzx = Math.sin(theta), nzz = Math.cos(theta); flip = nzx * (g.cx - ccx) + nzz * (g.cy - ccy) < 0 }
        if (flip) theta += Math.PI                             // pantallas al lado elegido
        return (
          <group key={v.id} position={[mx, 0, mz]} rotation={[0, theta, 0]}
            onPointerDown={(e) => beginGrab(v.id, e)} {...dragHandlers}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            <VideoWall len={len} night={noche} count={v.pantallas} filas={v.filas} selected={v.id === selectedId} />
          </group>
        )
      })}

      {/* Islas bench */}
      {doc.zonas.filter((z) => z.kind === 'bench').map((z) => {
        const fill = insight === 'none' ? z.color : heat(insightDef.value(z))
        const len = toM((z.pairs || 3) * 1600) + 0.6, sel = z.id === selectedId
        return (
          <group key={z.id} position={[toM(z.cx), 0, toM(z.cy)]} rotation={[0, -(z.rot || 0), 0]}
            onPointerDown={(e) => beginGrab(z.id, e)} {...dragHandlers}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            <mesh position={[0, 0.03, 0]}><boxGeometry args={[len, 0.05, 3.3]} /><meshStandardMaterial color={fill} roughness={0.6} metalness={0.05} transparent opacity={0.16} />{sel && <Edges color="#ffd166" />}</mesh>
            <DeskBench pairs={z.pairs || 3} screen={fill} night={noche} />
          </group>
        )
      })}

      {/* Mesas redondas */}
      {doc.zonas.filter((z) => z.kind === 'circular').map((z) => {
        const sel = z.id === selectedId, r = toM(z.r || 1650)
        return (
          <group key={z.id} position={[toM(z.cx), 0, toM(z.cy)]}
            onPointerDown={(e) => beginGrab(z.id, e)} {...dragHandlers}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            {sel && <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[r, r, 0.06, 24]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}
            <RoundTable x={0} z={0} r={r} seats={5} />
          </group>
        )
      })}

      {/* Comedores */}
      {doc.zonas.filter((z) => z.kind === 'comedor').map((z) => {
        const sel = z.id === selectedId, w = toM(z.w || 3600)
        return (
          <group key={z.id} position={[toM(z.cx), 0, toM(z.cy)]} rotation={[0, -(z.rot || 0), 0]}
            onPointerDown={(e) => beginGrab(z.id, e)} {...dragHandlers}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            {sel && <mesh position={[0, 0.05, 0]}><boxGeometry args={[w + 0.6, 0.06, 2.4]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}
            <Comedor x={0} z={0} w={w} rotY={0} seats={8} />
          </group>
        )
      })}

      {/* Oficinas */}
      {doc.zonas.filter((z) => z.kind === 'oficina').map((z) => {
        const w = toM(z.w || 3800), h = toM(z.h || 2600), sel = z.id === selectedId
        return (
          <group key={z.id} position={[toM(z.cx), 0, toM(z.cy)]} rotation={[0, -(z.rot || 0), 0]}
            onPointerDown={(e) => beginGrab(z.id, e)} {...dragHandlers}
            onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)}>
            <Oficina w={w} h={h} night={noche} color={z.color} />
            {sel && <mesh position={[0, 1.4, 0]}><boxGeometry args={[w, 2.8, h]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}
          </group>
        )
      })}

      {techo && (<mesh geometry={floorG} position={[0, toM(doc.alturaLibre), 0]}><meshStandardMaterial color="#e9e4da" transparent opacity={0.35} side={THREE.DoubleSide} /></mesh>)}

      <ContactShadows position={[cx, 0.03, cz]} scale={104} blur={2.4} opacity={0.42} far={30} resolution={1024} color="#101418" />
      <OrbitControls ref={controls} target={[cx, 0, cz]} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.15} minDistance={14} maxDistance={190} />
    </Canvas>
  )
}
