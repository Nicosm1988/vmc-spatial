// ============================================================================
// TORRE YPF (César Pelli · Puerto Madero) — modelo fiel y cinematográfico.
// Dos prismas yuxtapuestos girados 45°: uno CUADRADO (Oeste·ciudad) y uno
// TRIANGULAR (Este·río). Muro cortina de vidrio con mullions, remates
// inclinados opuestos (el triángulo abraza al cuadrado), SKY GARDEN (26–31),
// pérgola + jardín + calle en la base. 160 m · 1600 m²/planta.
// Todo paramétrico; el corte del piso 16 lo maneja Scene3D (hueco por opacidad).
// ============================================================================
import { useMemo } from 'react'
import * as THREE from 'three'
import { toM } from '../lib/geometry'

const FLOOR_H = 3.7
const FLOORS = 36
const CUT = 16            // piso del VMC
const SIDE = 40           // lado del cuadrado (m) ≈ √1600
const H = FLOORS * FLOOR_H

// Vidrio muro cortina (curtain wall) reutilizable
function glassMat(noche: boolean) {
  return <meshPhysicalMaterial color={noche ? '#0e2036' : '#8fb8d8'} metalness={0.35} roughness={0.06} transmission={0.55} thickness={0.6} transparent opacity={0.62} ior={1.25} envMapIntensity={1.1} clearcoat={0.6} clearcoatRoughness={0.1} side={THREE.DoubleSide} />
}

// Genera las líneas de mullions (retícula de la fachada) como wireframe fino.
function facadeGrid(w: number, d: number, floors: number, y0: number) {
  const pts: number[] = []
  for (let f = 0; f <= floors; f++) { const y = y0 + f * FLOOR_H
    pts.push(-w/2, y, -d/2, w/2, y, -d/2); pts.push(w/2, y, -d/2, w/2, y, d/2); pts.push(w/2, y, d/2, -w/2, y, d/2); pts.push(-w/2, y, d/2, -w/2, y, -d/2)
  }
  const cols = Math.round(w / 2.0)
  for (let c = 0; c <= cols; c++) { const x = -w/2 + (w/cols)*c; pts.push(x, y0, -d/2, x, y0+floors*FLOOR_H, -d/2); pts.push(x, y0, d/2, x, y0+floors*FLOOR_H, d/2) }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g
}

export function TorreYPF({ centerX, centerZ, noche }: { centerX: number; centerZ: number; noche: boolean }) {
  // El VMC (piso 16) está a y=0. Base de la torre en yBase.
  const yBase = -(CUT - 1) * FLOOR_H
  const gridSq = useMemo(() => facadeGrid(SIDE, SIDE, FLOORS, 0), [])
  const triShape = useMemo(() => { const s = new THREE.Shape(); const R = SIDE * 0.72; s.moveTo(R, 0); s.lineTo(-R * 0.5, R * 0.86); s.lineTo(-R * 0.5, -R * 0.86); s.closePath(); return s }, [])
  const triGeo = useMemo(() => { const g = new THREE.ExtrudeGeometry(triShape, { depth: H, bevelEnabled: false }); g.rotateX(-Math.PI / 2); return g }, [triShape])
  const topSlope = useMemo(() => new THREE.PlaneGeometry(SIDE * 1.5, SIDE * 1.5), [])

  return (
    <group position={[centerX, yBase, centerZ]} rotation={[0, Math.PI / 4, 0]}>
      {/* ===== PRISMA CUADRADO (Oeste / ciudad) ===== */}
      <group position={[-SIDE * 0.28, 0, -SIDE * 0.28]}>
        <mesh position={[0, H / 2, 0]} castShadow>
          <boxGeometry args={[SIDE, H, SIDE]} />{glassMat(noche)}
        </mesh>
        {/* núcleo opaco interior para dar densidad */}
        <mesh position={[0, H / 2, 0]}><boxGeometry args={[SIDE * 0.5, H, SIDE * 0.5]} /><meshStandardMaterial color={noche ? '#0a1424' : '#5b6b7d'} roughness={0.7} metalness={0.2} /></mesh>
        {/* retícula de fachada */}
        <lineSegments geometry={gridSq}><lineBasicMaterial color={noche ? '#2a4a6b' : '#c9dbe9'} transparent opacity={0.25} /></lineSegments>
        {/* remate inclinado (hacia afuera-oeste) */}
        <mesh geometry={topSlope} position={[0, H + 3, 0]} rotation={[-Math.PI / 2.6, 0, 0]}>{glassMat(noche)}</mesh>
      </group>

      {/* ===== PRISMA TRIANGULAR (Este / río) — abraza al cuadrado ===== */}
      <group position={[SIDE * 0.30, 0, SIDE * 0.30]}>
        <mesh geometry={triGeo} castShadow>{glassMat(noche)}</mesh>
        <lineSegments><edgesGeometry args={[triGeo]} /><lineBasicMaterial color={noche ? '#2a4a6b' : '#c9dbe9'} transparent opacity={0.28} /></lineSegments>
        {/* remate inclinado opuesto (hacia el río-este) */}
        <mesh geometry={topSlope} position={[SIDE * 0.15, H + 5, 0]} rotation={[Math.PI / 2.4, 0, 0]}>{glassMat(noche)}</mesh>
      </group>

      {/* ===== SKY GARDEN (pisos 26–31): banda verde translúcida ===== */}
      {(() => { const y = (26 - 1) * FLOOR_H, hh = (31 - 26) * FLOOR_H; return (
        <group position={[0, y + hh / 2, 0]}>
          <mesh><boxGeometry args={[SIDE * 1.15, hh, SIDE * 1.15]} /><meshPhysicalMaterial color="#bfe6c8" transparent opacity={0.16} roughness={0.1} transmission={0.5} /></mesh>
          {/* copas de árboles adentro */}
          {Array.from({ length: 14 }).map((_, i) => { const a = (i / 14) * Math.PI * 2, rr = SIDE * 0.38; return (
            <mesh key={i} position={[Math.cos(a) * rr, -hh / 2 + 2 + (i % 3), Math.sin(a) * rr]}><icosahedronGeometry args={[1.6 + (i % 3) * 0.4, 0]} /><meshStandardMaterial color={['#2f6d3a', '#3f8a49', '#276031'][i % 3]} roughness={0.9} /></mesh>) })}
        </group>) })()}

      {/* ===== CORONA "YPF" arriba ===== */}
      <mesh position={[0, H + 8, 0]}><boxGeometry args={[10, 3, 1]} /><meshStandardMaterial color="#0424d9" emissive="#0b3ad6" emissiveIntensity={noche ? 1.4 : 0.5} /></mesh>

      {/* ===== BASE: planta baja, pérgola y jardín (a nivel del suelo real) ===== */}
      <group position={[0, -yBase * 0 + (-(H) + (H)) , 0]}>
        {/* planta baja vidriada (en la base de la torre) */}
        <mesh position={[0, 4, 0]}><boxGeometry args={[SIDE * 1.5, 8, SIDE * 1.5]} /><meshPhysicalMaterial color={noche ? '#0f2338' : '#a9c6dd'} metalness={0.3} roughness={0.08} transmission={0.5} transparent opacity={0.5} /></mesh>
        {/* pérgola de acceso (Macacha Güemes) */}
        <group position={[SIDE * 1.1, 3, 0]}>
          {Array.from({ length: 8 }).map((_, i) => (<mesh key={i} position={[0, 0, -14 + i * 4]}><boxGeometry args={[10, 0.25, 0.25]} /><meshStandardMaterial color="#d8d2c4" /></mesh>))}
          {[-1, 1].map((s) => (<mesh key={s} position={[s * 4.5, -1.5, 0]}><boxGeometry args={[0.4, 6, 30]} /><meshStandardMaterial color="#cfc8ba" /></mesh>))}
          <mesh position={[0, 0.2, 0]}><boxGeometry args={[10, 0.1, 30]} /><meshStandardMaterial color="#3f8a49" transparent opacity={0.5} /></mesh>
        </group>
      </group>
    </group>
  )
}

// Entorno urbano: suelo, calles, río, árboles, torres vecinas — a nivel real.
export function Entorno({ centerX, centerZ, noche }: { centerX: number; centerZ: number; noche: boolean }) {
  const yGround = -(CUT - 1) * FLOOR_H
  return (
    <group>
      {/* Suelo / vereda */}
      <mesh position={[centerX, yGround - 0.1, centerZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1400, 1400]} /><meshStandardMaterial color={noche ? '#0b1220' : '#9aa0a6'} roughness={1} />
      </mesh>
      {/* Jardín parquizado alrededor */}
      <mesh position={[centerX, yGround - 0.05, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[45, 120, 48]} /><meshStandardMaterial color={noche ? '#12331d' : '#3f7d42'} roughness={0.95} />
      </mesh>
      {/* Calle Macacha Güemes (Norte-Sur) */}
      <mesh position={[centerX - 90, yGround, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 900]} /><meshStandardMaterial color="#2b2f36" roughness={0.9} />
      </mesh>
      {/* Río de la Plata al Este */}
      <mesh position={[centerX + 260, yGround + 0.05, centerZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[500, 1400]} /><meshPhysicalMaterial color={noche ? '#0a2036' : '#3f6f8f'} roughness={0.15} metalness={0.4} transmission={0.2} />
      </mesh>
      {/* Árboles del parque */}
      {Array.from({ length: 40 }).map((_, i) => { const a = (i / 40) * Math.PI * 2, rr = 55 + (i % 5) * 12; const x = centerX + Math.cos(a) * rr, z = centerZ + Math.sin(a) * rr
        return (<group key={i} position={[x, yGround, z]}><mesh position={[0, 2, 0]}><cylinderGeometry args={[0.3, 0.4, 4, 6]} /><meshStandardMaterial color="#5a3f28" /></mesh><mesh position={[0, 5, 0]}><icosahedronGeometry args={[2.4, 0]} /><meshStandardMaterial color={['#2f6d3a', '#3f8a49', '#357a3e'][i % 3]} roughness={0.9} /></mesh></group>) })}
      {/* Torres vecinas (River View / del Yacht) */}
      {[[150, 60, 60], [200, 48, 30], [175, 70, -70]].map(([dx, hh, dz], i) => (
        <mesh key={i} position={[centerX + dx, yGround + hh, centerZ + dz]} castShadow><boxGeometry args={[26, hh * 2, 26]} /><meshPhysicalMaterial color="#9fb4c8" metalness={0.3} roughness={0.2} transmission={0.15} transparent opacity={0.9} /></mesh>
      ))}
    </group>
  )
}
