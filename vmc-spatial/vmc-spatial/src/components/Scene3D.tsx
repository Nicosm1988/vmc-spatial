// ============================================================================
// Escena 3D (R3F + Drei) · Editor + Torre YPF opaca + POST-PROCESADO CINE.
// EffectComposer: SSAO (sombras de contacto) + Bloom (glow de pantallas) +
// Vignette + DepthOfField (desenfoque cine) + SMAA (antialias). Cámara Google
// Earth con zoom profundo (0.4 m) y API para el panel de botones.
// ============================================================================
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Sky, ContactShadows, Edges, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, SSAO, Vignette, DepthOfField, SMAA, BrightnessContrast } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import type { InsightKey, Point, VmcDocument } from '../types'
import { toM, heat, wallGeom } from '../lib/geometry'
import { scalePoly } from '../lib/plate'
import { makeCarpet } from '../lib/carpet'
import { INSIGHTS } from '../lib/insights'
import { DeskBench, VideoWall, RoundTable, Comedor, Oficina, Window } from './Furniture'
import { TorreYPF, Entorno } from './TorreYPF'

export interface CamApi { zoom?: (f: number) => void; orbit?: (deg: number) => void; tilt?: (deg: number) => void; reset?: () => void; top?: () => void; enter?: () => void }
interface Props {
  doc: VmcDocument; selectedId: string | null; insight: InsightKey
  noche: boolean; techo: boolean; editing: boolean; snap: boolean; building: boolean; cine: boolean
  camApi: React.MutableRefObject<CamApi>
  onSelect: (id: string | null) => void
  onMove: (id: string, cxmm: number, cymm: number) => void
}
function shapeFrom(poly: Point[]) { const s = new THREE.Shape(); poly.forEach((p, i) => { const x = toM(p.x), z = toM(p.y); if (i === 0) s.moveTo(x, z); else s.lineTo(x, z) }); s.closePath(); return s }
function slab(poly: Point[], depth: number) { const g = new THREE.ExtrudeGeometry(shapeFrom(poly), { depth, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g }
function ringGeom(outer: Point[], inner: Point[], depth: number) { const s = shapeFrom(outer); const h = new THREE.Path(); inner.forEach((p, i) => { const x = toM(p.x), z = toM(p.y); if (i === 0) h.moveTo(x, z); else h.lineTo(x, z) }); h.closePath(); s.holes.push(h); const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false }); g.rotateX(Math.PI / 2); return g }
const toMM = (m: number) => Math.round(m * 1000)
function resample(poly: Point[], n: number): Point[] { const out: Point[] = []; for (let i = 0; i < n; i++) out.push(poly[Math.round((i * (poly.length - 1)) / n)]); return out }

function CameraRig({ camApi, center }: { camApi: React.MutableRefObject<CamApi>; center: [number, number, number] }) {
  const { camera, controls } = useThree() as any
  useEffect(() => {
    const c = controls
    const t = () => (c ? c.target as THREE.Vector3 : new THREE.Vector3(...center))
    camApi.current = {
      zoom: (f) => { const tg = t(); const dir = new THREE.Vector3().subVectors(camera.position, tg); const nd = THREE.MathUtils.clamp(dir.length() * f, 0.4, 1400); dir.setLength(nd); camera.position.copy(tg).add(dir); c && c.update() },
      orbit: (deg) => { const tg = t(); const a = (deg * Math.PI) / 180; const off = new THREE.Vector3().subVectors(camera.position, tg); const nx = off.x * Math.cos(a) - off.z * Math.sin(a); const nz = off.x * Math.sin(a) + off.z * Math.cos(a); off.x = nx; off.z = nz; camera.position.copy(tg).add(off); c && c.update() },
      tilt: (deg) => { const tg = t(); const a = (deg * Math.PI) / 180; const off = new THREE.Vector3().subVectors(camera.position, tg); const r = off.length(); let ph = Math.acos(THREE.MathUtils.clamp(off.y / r, -1, 1)); ph = THREE.MathUtils.clamp(ph - a, 0.05, Math.PI / 2.02); const th = Math.atan2(off.z, off.x); off.set(r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)); camera.position.copy(tg).add(off); c && c.update() },
      reset: () => { if (!c) return; c.target.set(center[0], 0, center[2]); camera.position.set(center[0] - 26, 30, center[2] + 46); c.update() },
      top: () => { if (!c) return; c.target.set(center[0], 0, center[2]); camera.position.set(center[0], 90, center[2] + 0.01); c.update() },
      enter: () => { if (!c) return; c.target.set(center[0] + 6, 1.2, center[2]); camera.position.set(center[0] - 5, 2.3, center[2] + 7); c.update() },
    }
  }, [camera, controls])
  return null
}

export default function Scene3D({ doc, selectedId, insight, noche, techo, editing, snap, building, cine, camApi, onSelect, onMove }: Props) {
  const controls = useRef<any>(null)
  const drag = useRef<{ id: string; obj: THREE.Object3D } | null>(null)
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

  function planePoint(e: any) { const r = e.ray as THREE.Ray; const t = -r.origin.y / r.direction.y; return { x: r.origin.x + r.direction.x * t, z: r.origin.z + r.direction.z * t } }
  function beginGrab(id: string, e: any) { onSelect(id); if (!editing) return; e.stopPropagation(); if (controls.current) controls.current.enabled = false; drag.current = { id, obj: e.eventObject as THREE.Object3D }; (e.target as Element)?.setPointerCapture?.(e.pointerId) }
  function moveGrab(e: any) { if (!drag.current) return; e.stopPropagation(); const p = planePoint(e); drag.current.obj.position.x = p.x; drag.current.obj.position.z = p.z }
  function endGrab() { if (drag.current) { let nx = toMM(drag.current.obj.position.x), ny = toMM(drag.current.obj.position.z); if (snap) { nx = Math.round(nx / 250) * 250; ny = Math.round(ny / 250) * 250 } onMove(drag.current.id, nx, ny); drag.current = null } if (controls.current) controls.current.enabled = true }
  const stop = (e: any) => e.stopPropagation()
  const cur = (on: boolean) => { document.body.style.cursor = editing ? (on ? 'grab' : 'auto') : (on ? 'pointer' : 'auto') }
  const dh = { onPointerMove: moveGrab, onPointerUp: endGrab }
  const wrap = (id: string, node: JSX.Element, extra: any = {}) => (<group key={id} onPointerDown={(e) => beginGrab(id, e)} onClick={stop} {...dh} onPointerOver={(e) => { e.stopPropagation(); cur(true) }} onPointerOut={() => cur(false)} {...extra}>{node}</group>)
  const camPos: [number, number, number] = building ? [cx - 60, 55, cz + 120] : [cx - 24, 30, cz + 44]

  return (
    <Canvas key={building ? 'bld' : 'flo'} shadows dpr={[1, 2]} camera={{ position: camPos, fov: 46, near: 0.1, far: 4000 }} gl={{ antialias: !cine, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.08 }} onPointerMissed={() => onSelect(null)}>
      {!noche ? <Sky sunPosition={[130, 45, 90]} turbidity={2.6} rayleigh={0.9} mieCoefficient={0.004} mieDirectionalG={0.88} /> : <color attach="background" args={['#04060e']} />}
      <fog attach="fog" args={[noche ? '#05070f' : '#bcd2e6', building ? 320 : 180, building ? 1100 : 520]} />
      <hemisphereLight args={[noche ? '#1a2840' : '#f0f6ff', '#40453f', noche ? 0.4 : 1.0]} />
      <ambientLight intensity={noche ? 0.3 : 0.4} />
      <directionalLight position={[cx + 100, 150, cz - 50]} intensity={noche ? 0.7 : 2.4} color={noche ? '#9fb4e0' : '#fff3e0'} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} shadow-bias={-0.0004}>
        <orthographicCamera attach="shadow-camera" args={[-100, 100, 100, -100, 0.1, 520]} />
      </directionalLight>
      <Environment preset={noche ? 'night' : 'city'} />

      {building && (<group><Entorno centerX={cx} centerZ={cz} noche={noche} /><TorreYPF centerX={cx} centerZ={cz} noche={noche} /></group>)}

      <mesh geometry={floorG} position={[0, -0.02, 0]} receiveShadow onClick={() => onSelect(null)} {...dh}><meshStandardMaterial map={carpet} color="#9aa2ac" roughness={0.98} metalness={0} /></mesh>
      <mesh geometry={ringG} position={[0, 0.015, 0]} receiveShadow {...dh}><meshStandardMaterial map={carpetDark} color="#6a6f79" roughness={1} metalness={0} /></mesh>
      {winPts.map((p, i) => { const q = winPts[(i + 1) % winPts.length]; const x1 = toM(p.x), z1 = toM(p.y), x2 = toM(q.x), z2 = toM(q.y); const mx = (x1 + x2) / 2, mz = (z1 + z2) / 2, len = Math.hypot(x2 - x1, z2 - z1); if (len < 0.3) return null; const ang = Math.atan2(-(z2 - z1), x2 - x1); return (<group key={`win${i}`} position={[mx, 0.1, mz]} rotation={[0, ang, 0]}><Window len={len + 0.05} height={2.9} /></group>) })}
      {doc.zonas.filter((z) => z.kind === 'nucleo').map((z) => (<mesh key={z.id} geometry={slab(doc.core, 0.14)} position={[0, 0.07, 0]} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} {...dh}><meshStandardMaterial color="#0c1226" roughness={0.85} metalness={0.08} /><Edges color={z.id === selectedId ? '#ffd166' : '#0E9BC4'} /></mesh>))}
      {doc.videoWalls.map((v) => { const g = wallGeom(v); const mx = toM(g.cx), mz = toM(g.cy), len = toM(g.len); let theta = Math.atan2(-(v.y2 - v.y1), v.x2 - v.x1); let flip = v.flip; if (flip === undefined) { const nzx = Math.sin(theta), nzz = Math.cos(theta); flip = nzx * (g.cx - ccx) + nzz * (g.cy - ccy) < 0 } if (flip) theta += Math.PI; return wrap(v.id, <VideoWall len={len} night={noche} count={v.pantallas} filas={v.filas} selected={v.id === selectedId} />, { position: [mx, 0, mz], rotation: [0, theta, 0] }) })}
      {doc.zonas.filter((z) => z.kind === 'bench').map((z) => { const fill = insight === 'none' ? z.color : heat(insightDef.value(z)); const len = toM((z.pairs || 3) * 1600) + 0.6; const sel = z.id === selectedId; return wrap(z.id, <group><mesh position={[0, 0.03, 0]}><boxGeometry args={[len, 0.05, 3.3]} /><meshStandardMaterial color={fill} roughness={0.6} metalness={0.05} transparent opacity={0.14} />{sel && <Edges color="#ffd166" />}</mesh><DeskBench pairs={z.pairs || 3} screen={fill} night={noche} /></group>, { position: [toM(z.cx), 0, toM(z.cy)], rotation: [0, -(z.rot || 0), 0] }) })}
      {doc.zonas.filter((z) => z.kind === 'circular').map((z) => { const sel = z.id === selectedId, r = toM(z.r || 1650); return wrap(z.id, <group>{sel && <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[r, r, 0.06, 24]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}<RoundTable x={0} z={0} r={r} seats={5} /></group>, { position: [toM(z.cx), 0, toM(z.cy)] }) })}
      {doc.zonas.filter((z) => z.kind === 'comedor').map((z) => { const sel = z.id === selectedId, w = toM(z.w || 3600); return wrap(z.id, <group>{sel && <mesh position={[0, 0.05, 0]}><boxGeometry args={[w + 0.6, 0.06, 2.4]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}<Comedor x={0} z={0} w={w} rotY={0} seats={8} /></group>, { position: [toM(z.cx), 0, toM(z.cy)], rotation: [0, -(z.rot || 0), 0] }) })}
      {doc.zonas.filter((z) => z.kind === 'oficina').map((z) => { const w = toM(z.w || 3800), h = toM(z.h || 2600), sel = z.id === selectedId; return wrap(z.id, <group><Oficina w={w} h={h} night={noche} color={z.color} />{sel && <mesh position={[0, 1.4, 0]}><boxGeometry args={[w, 2.8, h]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}</group>, { position: [toM(z.cx), 0, toM(z.cy)], rotation: [0, -(z.rot || 0), 0] }) })}
      {techo && !building && (<mesh geometry={floorG} position={[0, toM(doc.alturaLibre), 0]}><meshStandardMaterial color="#e9e4da" transparent opacity={0.35} side={THREE.DoubleSide} /></mesh>)}

      <ContactShadows position={[cx, 0.03, cz]} scale={120} blur={2.6} opacity={0.5} far={30} resolution={1024} color="#0a0d12" />

      <OrbitControls ref={controls} makeDefault target={[cx, building ? 20 : 0, cz]} enableDamping dampingFactor={0.09} zoomToCursor enablePan panSpeed={1.1} zoomSpeed={1.2} rotateSpeed={0.85} screenSpacePanning={false} maxPolarAngle={Math.PI / 1.9} minDistance={0.4} maxDistance={building ? 1400 : 400} mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }} touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }} />
      <CameraRig camApi={camApi} center={[cx, 0, cz]} />

      {cine && (
        <EffectComposer multisampling={0} enableNormalPass>
          <SSAO blendFunction={BlendFunction.MULTIPLY} samples={16} radius={0.12} intensity={22} luminanceInfluence={0.5} color={new THREE.Color('#0a0d14')} />
          <Bloom intensity={noche ? 0.9 : 0.5} luminanceThreshold={0.65} luminanceSmoothing={0.25} mipmapBlur />
          <DepthOfField focusDistance={0.012} focalLength={0.045} bokehScale={2.2} />
          <BrightnessContrast brightness={0.02} contrast={0.09} />
          <Vignette eskil={false} offset={0.28} darkness={0.72} />
          <SMAA />
        </EffectComposer>
      )}
    </Canvas>
  )
}
