// ============================================================================
// TORRE YPF (César Pelli) — OPACA (fachada de vidrio espejado sólido).
// Solo el PISO 16 (VMC) queda abierto/visible. Dos prismas girados 45°:
// cuadrado (Oeste·ciudad) + triangular (Este·río). Remates inclinados, sky
// garden 26–31, corona YPF, pérgola + jardín. 160 m · 36 pisos · 1600 m².
// ============================================================================
import { useMemo } from 'react'
import * as THREE from 'three'

const FLOOR_H = 3.7
const FLOORS = 36
const CUT = 16
const SIDE = 40
const H = FLOORS * FLOOR_H

// Vidrio espejado OPACO (fachada real, no transparente)
function facadeMat(noche: boolean) {
  return <meshStandardMaterial color={noche ? '#0c1a2c' : '#7fa6c6'} metalness={0.85} roughness={0.12} envMapIntensity={1.3} />
}

function facadeGrid(w: number, d: number, floors: number, y0: number) {
  const pts: number[] = []
  for (let f = 0; f <= floors; f++) { const y = y0 + f * FLOOR_H; pts.push(-w/2, y, -d/2, w/2, y, -d/2, w/2, y, -d/2, w/2, y, d/2, w/2, y, d/2, -w/2, y, d/2, -w/2, y, d/2, -w/2, y, -d/2) }
  const cols = Math.round(w / 2.0)
  for (let c = 0; c <= cols; c++) { const x = -w/2 + (w/cols)*c; pts.push(x, y0, -d/2, x, y0+floors*FLOOR_H, -d/2, x, y0, d/2, x, y0+floors*FLOOR_H, d/2) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g
}

export function TorreYPF({ centerX, centerZ, noche }: { centerX: number; centerZ: number; noche: boolean }) {
  const yBase = -(CUT - 1) * FLOOR_H
  const gridSq = useMemo(() => facadeGrid(SIDE, SIDE, FLOORS, 0), [])
  const triShape = useMemo(() => { const s = new THREE.Shape(); const R = SIDE * 0.72; s.moveTo(R, 0); s.lineTo(-R * 0.5, R * 0.86); s.lineTo(-R * 0.5, -R * 0.86); s.closePath(); return s }, [])
  const triGeo = useMemo(() => { const g = new THREE.ExtrudeGeometry(triShape, { depth: H, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g }, [triShape])
  const topSlope = useMemo(() => new THREE.PlaneGeometry(SIDE * 1.5, SIDE * 1.5), [])
  // Altura del hueco (piso 16) en coords de la torre (base en yBase)
  const cutY = (CUT - 1) * FLOOR_H

  return (
    <group position={[centerX, yBase, centerZ]} rotation={[0, Math.PI / 4, 0]}>
      {/* ===== PRISMA CUADRADO (Oeste) — dos tramos, dejando hueco en el 16 ===== */}
      <group position={[-SIDE * 0.28, 0, -SIDE * 0.28]}>
        {/* tramo inferior (pisos 1–15) */}
        <mesh position={[0, (cutY) / 2, 0]} castShadow>
          <boxGeometry args={[SIDE, cutY, SIDE]} />{facadeMat(noche)}
        </mesh>
        {/* tramo superior (17–36) */}
        <mesh position={[0, cutY + FLOOR_H + (H - cutY - FLOOR_H) / 2, 0]} castShadow>
          <boxGeometry args={[SIDE, H - cutY - FLOOR_H, SIDE]} />{facadeMat(noche)}
        </mesh>
        <lineSegments geometry={gridSq}><lineBasicMaterial color={noche ? '#25405f' : '#a9c2d8'} transparent opacity={0.35} /></lineSegments>
        <mesh geometry={topSlope} position={[0, H + 3, 0]} rotation={[-Math.PI / 2.6, 0, 0]}>{facadeMat(noche)}</mesh>
      </group>

      {/* ===== PRISMA TRIANGULAR (Este) — abraza al cuadrado ===== */}
      <group position={[SIDE * 0.30, 0, SIDE * 0.30]}>
        <mesh geometry={triGeo} castShadow>{facadeMat(noche)}</mesh>
        <lineSegments><edgesGeometry args={[triGeo]} /><lineBasicMaterial color={noche ? '#25405f' : '#a9c2d8'} transparent opacity={0.3} /></lineSegments>
        <mesh geometry={topSlope} position={[SIDE * 0.15, H + 5, 0]} rotation={[Math.PI / 2.4, 0, 0]}>{facadeMat(noche)}</mesh>
      </group>

      {/* ===== SKY GARDEN (26–31) ===== */}
      {(() => { const y = (26 - 1) * FLOOR_H, hh = (31 - 26) * FLOOR_H; return (
        <group position={[0, y + hh / 2, 0]}>
          <mesh><boxGeometry args={[SIDE * 1.02, hh, SIDE * 1.02]} /><meshPhysicalMaterial color="#bfe6c8" transparent opacity={0.28} roughness={0.1} transmission={0.4} /></mesh>
          {Array.from({ length: 12 }).map((_, i) => { const a = (i / 12) * Math.PI * 2, rr = SIDE * 0.34; return (<mesh key={i} position={[Math.cos(a) * rr, -hh / 2 + 2 + (i % 3), Math.sin(a) * rr]}><icosahedronGeometry args={[1.6 + (i % 3) * 0.4, 0]} /><meshStandardMaterial color={['#2f6d3a', '#3f8a49', '#276031'][i % 3]} roughness={0.9} /></mesh>) })}
        </group>) })()}

      {/* ===== CORONA "YPF" ===== */}
      <mesh position={[0, H + 8, 0]}><boxGeometry args={[10, 3, 1]} /><meshStandardMaterial color="#0424d9" emissive="#0b3ad6" emissiveIntensity={noche ? 1.6 : 0.6} /></mesh>

      {/* ===== PLANTA BAJA + PÉRGOLA (base real) ===== */}
      <group position={[0, -yBase * 0, 0]}>
        <mesh position={[0, -yBase + 4, 0]}><boxGeometry args={[SIDE * 1.4, 8, SIDE * 1.4]} /><meshPhysicalMaterial color={noche ? '#0f2338' : '#a9c6dd'} metalness={0.5} roughness={0.1} transmission={0.35} transparent opacity={0.6} /></mesh>
        <group position={[SIDE * 1.05, -yBase + 3, 0]}>
          {Array.from({ length: 8 }).map((_, i) => (<mesh key={i} position={[0, 0, -14 + i * 4]}><boxGeometry args={[10, 0.25, 0.25]} /><meshStandardMaterial color="#d8d2c4" /></mesh>))}
          {[-1, 1].map((s) => (<mesh key={s} position={[s * 4.5, -1.5, 0]}><boxGeometry args={[0.4, 6, 30]} /><meshStandardMaterial color="#cfc8ba" /></mesh>))}
        </group>
      </group>
    </group>
  )
}

export function Entorno({ centerX, centerZ, noche }: { centerX: number; centerZ: number; noche: boolean }) {
  const yGround = -(CUT - 1) * FLOOR_H
  return (
    <group>
      <mesh position={[centerX, yGround - 0.1, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[1400, 1400]} /><meshStandardMaterial color={noche ? '#0b1220' : '#9aa0a6'} roughness={1} /></mesh>
      <mesh position={[centerX, yGround - 0.05, centerZ]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[45, 120, 48]} /><meshStandardMaterial color={noche ? '#12331d' : '#3f7d42'} roughness={0.95} /></mesh>
      <mesh position={[centerX - 90, yGround, centerZ]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[26, 900]} /><meshStandardMaterial color="#2b2f36" roughness={0.9} /></mesh>
      <mesh position={[centerX + 260, yGround + 0.05, centerZ]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[500, 1400]} /><meshPhysicalMaterial color={noche ? '#0a2036' : '#3f6f8f'} roughness={0.15} metalness={0.4} /></mesh>
      {Array.from({ length: 40 }).map((_, i) => { const a = (i / 40) * Math.PI * 2, rr = 55 + (i % 5) * 12; const x = centerX + Math.cos(a) * rr, z = centerZ + Math.sin(a) * rr; return (<group key={i} position={[x, yGround, z]}><mesh position={[0, 2, 0]}><cylinderGeometry args={[0.3, 0.4, 4, 6]} /><meshStandardMaterial color="#5a3f28" /></mesh><mesh position={[0, 5, 0]}><icosahedronGeometry args={[2.4, 0]} /><meshStandardMaterial color={['#2f6d3a', '#3f8a49', '#357a3e'][i % 3]} roughness={0.9} /></mesh></group>) })}
      {[[150, 60, 60], [200, 48, 30], [175, 70, -70]].map(([dx, hh, dz], i) => (<mesh key={i} position={[centerX + dx, yGround + hh, centerZ + dz]} castShadow><boxGeometry args={[26, hh * 2, 26]} /><meshStandardMaterial color="#9fb4c8" metalness={0.6} roughness={0.2} /></mesh>))}
    </group>
  )
}
