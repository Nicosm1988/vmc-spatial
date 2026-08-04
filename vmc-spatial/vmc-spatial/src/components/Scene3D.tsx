// ============================================================================
// Escena 3D (R3F + Drei) · Editor en vivo.
// FIX selección: cada objeto corta la propagación del click → no se desclickea.
//   Deselección solo al hacer click en piso vacío o fuera (onPointerMissed).
// FIX arrastre fluido por referencia. FIX pared flip + estirable.
// NUEVO: modo EDIFICIO → torre completa (Torre YPF) con corte en el piso 16.
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
  noche: boolean; techo: boolean; editing: boolean; snap: boolean; building: boolean
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
  const s = shapeFrom(outer); const h = new THREE.Path()
  inner.forEach((p, i) => { const x = toM(p.x), z = toM(p.y); if (i === 0) h.moveTo(x, z); else h.lineTo(x, z) }); h.closePath(); s.holes.push(h)
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g
}
const toMM = (m: number) => Math.round(m * 1000)
function resample(poly: Point[], n: number): Point[] { const out: Point[] = []; for (let i = 0; i < n; i++) out.push(poly[Math.round((i * (poly.length - 1)) / n)]); return out }

const FLOOR_H = 3.7           // altura de piso (m)
const FLOOR16 = 16            // nuestro piso
const TOTAL_FLOORS = 36       // Torre YPF

export default function Scene3D({ doc, selectedId, insight, noche, techo, editing, snap, building, onSelect, onMove }: Props) {
  const controls = useRef<any>(null)
  const drag = useRef<{ id: string; obj: THREE.Object3D; ox: number; oz: number } | null>(null)
  const moved = useRef(false)
  const floorG = useMemo(() => slab(doc.plate, 0.3), [doc.plate])
  const floorThin = useMemo(() => slab(doc.plate, 0.18), [doc.plate])
  const shaftG = useMemo(() => slab(doc.plate, FLOOR_H * TOTAL_FLOORS), [doc.plate])
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

  function planePoint(e: any): { x: number; z: number } {
    const r = e.ray as THREE.Ray; const t = -r.origin.y / r.direction.y
    return { x: r.origin.x + r.direction.x * t, z: r.origin.z + r.direction.z * t }
  }
  function beginGrab(id: string, e: any) {
    onSelect(id); moved.current = false
    if (!editing) return
    e.stopPropagation()
    if (controls.current) controls.current.enabled = false
    const obj = e.eventObject as THREE.Object3D; const p = planePoint(e)
    drag.current = { id, obj, ox: obj.position.x - p.x, oz: obj.position.z - p.z }
    ;(e.target as Element)?.setPointerCapture?.(e.pointerId)
  }
  function moveGrab(e: any) {
    if (!drag.current) return
    e.stopPropagation(); moved.current = true
    const p = planePoint(e)
    drag.current.obj.position.x = p.x + drag.current.ox
    drag.current.obj.position.z = p.z + drag.current.oz
  }
  function endGrab() {
    if (drag.current) { let nx = toMM(drag.current.obj.position.x), ny = toMM(drag.current.obj.position.z); if (snap) { nx = Math.round(nx / 250) * 250; ny = Math.round(ny / 250) * 250 } onMove(drag.current.id, nx, ny); drag.current = null }
    if (controls.current) controls.current.enabled = true
  }
  const stop = (e: any) => e.stopPropagation()   // corta el click para no desclickear
  const cur = (on: boolean) => { document.body.style.cursor = editing ? (on ? 'grab' : 'auto') : (on ? 'pointer' : 'auto') }
  const dh = { onPointerMove: moveGrab, onPointerUp: endGrab }

  const camPos: [number, number, number] = building ? [cx - 46, 44, cz + 96] : [cx - 30, 46, cz + 60]

  // helper para envolver un objeto editable con selección estable
  const wrap = (id: string, node: JSX.Element, extra: any = {}) => (
    <group key={id} onPointerDown={(e) => beginGrab(id, e)} onClick={stop} {...dh}
      onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)} {...extra}>
      {node}
    </group>
  )

  return (
    <Canvas key={building ? 'bld' : 'flo'} shadows dpr={[1, 1.75]} camera={{ position: camPos, fov: 45 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onPointerMissed={() => onSelect(null)}>
      {!noche ? <Sky sunPosition={[80, 30, 50]} turbidity={4} rayleigh={1} mieCoefficient={0.005} mieDirectionalG={0.85} /> : <color attach="background" args={['#05070f']} />}
      <fog attach="fog" args={[noche ? '#05070f' : '#cfe0ef', building ? 220 : 130, building ? 600 : 340]} />
      <hemisphereLight args={[noche ? '#20304a' : '#eaf3ff', '#3a3f44', noche ? 0.3 : 0.9]} />
      <ambientLight intensity={noche ? 0.28 : 0.5} />
      <directionalLight position={[cx + 60, 90, cz - 30]} intensity={noche ? 0.5 : 2.0} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-70, 70, 70, -70, 0.1, 320]} />
      </directionalLight>

      {/* ===================== MODO EDIFICIO ===================== */}
      {building && (<group>
        {/* Suelo urbano */}
        <mesh position={[cx, -FLOOR16 * FLOOR_H - 0.1, cz]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[900, 900]} /><meshStandardMaterial color={noche ? '#0b1020' : '#8f978f'} roughness={1} />
        </mesh>
        {/* Shaft de vidrio (piel de la torre) translúcido para ver el corte */}
        <mesh geometry={shaftG} position={[0, -FLOOR16 * FLOOR_H, 0]}>
          <meshPhysicalMaterial color="#bcd6ea" transparent opacity={0.12} roughness={0.05} metalness={0.1} transmission={0.5} thickness={0.4} side={THREE.DoubleSide} />
        </mesh>
        {/* Losas de cada piso (menos el 16) */}
        {Array.from({ length: TOTAL_FLOORS }).map((_, k) => {
          const f = k + 1; if (f === FLOOR16) return null
          const y = (f - FLOOR16) * FLOOR_H
          const hl = f === 1 || f === TOTAL_FLOORS
          return (<mesh key={f} geometry={floorThin} position={[0, y, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={hl ? '#5a6472' : '#3a4250'} roughness={0.8} metalness={0.1} transparent opacity={0.9} /></mesh>)
        })}
        {/* Cartel del piso 16 */}
        <mesh position={[cx + 33, 1.5, cz]}><boxGeometry args={[0.2, 3, 8]} /><meshStandardMaterial color="#0424d9" emissive="#0424d9" emissiveIntensity={0.5} /></mesh>
        {/* Torres vecinas (como la foto) */}
        {[[cx + 120, 55], [cx + 165, 45]].map(([tx, hgt], i) => (
          <mesh key={i} position={[tx, -FLOOR16 * FLOOR_H + hgt, cz + 40 + i * 25]} castShadow>
            <boxGeometry args={[24, hgt * 2, 24]} /><meshStandardMaterial color="#9fb0c4" roughness={0.4} metalness={0.3} /></mesh>
        ))}
      </group>)}

      {/* ===================== PISO 16 (nuestro diseño) ===================== */}
      <mesh geometry={floorG} position={[0, -0.02, 0]} receiveShadow onClick={() => onSelect(null)} {...dh}>
        <meshStandardMaterial map={carpet} color="#9aa2ac" roughness={0.98} metalness={0} />
      </mesh>
      <mesh geometry={ringG} position={[0, 0.015, 0]} receiveShadow {...dh}>
        <meshStandardMaterial map={carpetDark} color="#6a6f79" roughness={1} metalness={0} />
      </mesh>

      {/* Ventanas reales */}
      {winPts.map((p, i) => { const q = winPts[(i + 1) % winPts.length]; const x1 = toM(p.x), z1 = toM(p.y), x2 = toM(q.x), z2 = toM(q.y); const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, len = Math.hypot(x2 - x1, z2 - z1); if (len < 0.3) return null; const ang = Math.atan2(-(z2 - z1), x2 - x1); return (<group key={`win${i}`} position={[mx, 0.1, mz]} rotation={[0, ang, 0]}><Window len={len + 0.05} height={2.9} /></group>) })}

      {/* Núcleo */}
      {doc.zonas.filter((z) => z.kind === 'nucleo').map((z) => (
        <mesh key={z.id} geometry={slab(doc.core, 0.14)} position={[0, 0.07, 0]} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} {...dh}>
          <meshStandardMaterial color="#0c1226" roughness={0.85} metalness={0.08} /><Edges color={z.id === selectedId ? '#ffd166' : '#0E9BC4'} />
        </mesh>
      ))}

      {/* Paredes de monitores (flip + rotación) */}
      {doc.videoWalls.map((v) => {
        const g = wallGeom(v); const mx = toM(g.cx), mz = toM(g.cy), len = toM(g.len)
        let theta = Math.atan2(-(v.y2 - v.y1), v.x2 - v.x1)
        let flip = v.flip
        if (flip === undefined) { const nzx = Math.sin(theta), nzz = Math.cos(theta); flip = nzx * (g.cx - ccx) + nzz * (g.cy - ccy) < 0 }
        if (flip) theta += Math.PI
        return wrap(v.id, <VideoWall len={len} night={noche} count={v.pantallas} filas={v.filas} selected={v.id === selectedId} />, { position: [mx, 0, mz], rotation: [0, theta, 0] })
      })}

      {/* Islas bench */}
      {doc.zonas.filter((z) => z.kind === 'bench').map((z) => {
        const fill = insight === 'none' ? z.color : heat(insightDef.value(z)); const len = toM((z.pairs || 3) * 1600) + 0.6; const sel = z.id === selectedId
        return wrap(z.id, <group><mesh position={[0, 0.03, 0]}><boxGeometry args={[len, 0.05, 3.3]} /><meshStandardMaterial color={fill} roughness={0.6} metalness={0.05} transparent opacity={0.16} />{sel && <Edges color="#ffd166" />}</mesh><DeskBench pairs={z.pairs || 3} screen={fill} night={noche} /></group>, { position: [toM(z.cx), 0, toM(z.cy)], rotation: [0, -(z.rot || 0), 0] })
      })}

      {/* Mesas redondas */}
      {doc.zonas.filter((z) => z.kind === 'circular').map((z) => {
        const sel = z.id === selectedId, r = toM(z.r || 1650)
        return wrap(z.id, <group>{sel && <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[r, r, 0.06, 24]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}<RoundTable x={0} z={0} r={r} seats={5} /></group>, { position: [toM(z.cx), 0, toM(z.cy)] })
      })}

      {/* Comedores */}
      {doc.zonas.filter((z) => z.kind === 'comedor').map((z) => {
        const sel = z.id === selectedId, w = toM(z.w || 3600)
        return wrap(z.id, <group>{sel && <mesh position={[0, 0.05, 0]}><boxGeometry args={[w + 0.6, 0.06, 2.4]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}<Comedor x={0} z={0} w={w} rotY={0} seats={8} /></group>, { position: [toM(z.cx), 0, toM(z.cy)], rotation: [0, -(z.rot || 0), 0] })
      })}

      {/* Oficinas */}
      {doc.zonas.filter((z) => z.kind === 'oficina').map((z) => {
        const w = toM(z.w || 3800), h = toM(z.h || 2600), sel = z.id === selectedId
        return wrap(z.id, <group><Oficina w={w} h={h} night={noche} color={z.color} />{sel && <mesh position={[0, 1.4, 0]}><boxGeometry args={[w, 2.8, h]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}</group>, { position: [toM(z.cx), 0, toM(z.cy)], rotation: [0, -(z.rot || 0), 0] })
      })}

      {techo && (<mesh geometry={floorG} position={[0, toM(doc.alturaLibre), 0]}><meshStandardMaterial color="#e9e4da" transparent opacity={0.35} side={THREE.DoubleSide} /></mesh>)}
      <ContactShadows position={[cx, 0.03, cz]} scale={110} blur={2.4} opacity={0.42} far={30} resolution={1024} color="#101418" />
      <OrbitControls ref={controls} target={[cx, 0, cz]} enableDamping dampingFactor={0.08} maxPolarAngle={Math.PI / 2.05} minDistance={12} maxDistance={building ? 400 : 190} />
    </Canvas>
  )
}
