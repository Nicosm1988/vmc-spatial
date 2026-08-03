// ============================================================================
// Muebles realistas (R3F + Drei).
// Clave: DeskBench = isla con DOS FILAS ENFRENTADAS de escritorios; los
// monitores quedan espalda con espalda en el centro (enfrentados vistos de
// arriba) y las sillas Herman Miller en los lados externos.
// Medidas en METROS. Convención: el "spine" del bench corre en X; las filas
// se separan en Z (±). Los usuarios se miran a través del bench.
// ============================================================================
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const CHARCOAL = '#26262b'
const MESHCOL = '#33333a'
const FRAME = '#17171b'
const METAL = '#3a3a42'

// ---- Silla Herman Miller (malla, respaldo con struts en Y, base 5 estrellas) ----
export function HermanMillerChair({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2
        const lx = Math.sin(a) * 0.28, lz = Math.cos(a) * 0.28
        return (
          <group key={i}>
            <mesh position={[lx * 0.5, 0.06, lz * 0.5]} rotation={[0, -a, 0]}><boxGeometry args={[0.06, 0.04, 0.34]} /><meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.6} /></mesh>
            <mesh position={[lx, 0.03, lz]}><cylinderGeometry args={[0.035, 0.035, 0.05, 10]} /><meshStandardMaterial color="#0e0e12" roughness={0.4} metalness={0.5} /></mesh>
          </group>
        )
      })}
      <mesh position={[0, 0.28, 0]}><cylinderGeometry args={[0.04, 0.05, 0.4, 12]} /><meshStandardMaterial color={METAL} roughness={0.35} metalness={0.75} /></mesh>
      <RoundedBox args={[0.5, 0.09, 0.48]} radius={0.04} smoothness={3} position={[0, 0.49, 0.02]}><meshStandardMaterial color={MESHCOL} roughness={0.9} metalness={0.05} /></RoundedBox>
      <RoundedBox args={[0.52, 0.7, 0.06]} radius={0.06} smoothness={3} position={[0, 0.9, -0.21]} rotation={[-0.12, 0, 0]}><meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.4} /></RoundedBox>
      <mesh position={[0, 0.9, -0.195]} rotation={[-0.12, 0, 0]}><planeGeometry args={[0.42, 0.6]} /><meshStandardMaterial color={MESHCOL} roughness={0.95} metalness={0.02} side={THREE.DoubleSide} transparent opacity={0.92} /></mesh>
      <mesh position={[0, 0.77, -0.18]} rotation={[-0.12, 0, 0.35]}><boxGeometry args={[0.04, 0.32, 0.03]} /><meshStandardMaterial color={CHARCOAL} roughness={0.5} metalness={0.4} /></mesh>
      <mesh position={[0, 0.77, -0.18]} rotation={[-0.12, 0, -0.35]}><boxGeometry args={[0.04, 0.32, 0.03]} /><meshStandardMaterial color={CHARCOAL} roughness={0.5} metalness={0.4} /></mesh>
      {[-1, 1].map((s) => (
        <RoundedBox key={s} args={[0.08, 0.05, 0.22]} radius={0.02} smoothness={2} position={[s * 0.29, 0.76, 0.0]}><meshStandardMaterial color={CHARCOAL} roughness={0.7} metalness={0.2} /></RoundedBox>
      ))}
    </group>
  )
}

// ---- Monitor ENTERO (un panel ancho). dir=+1 pantalla mira +Z, dir=-1 mira -Z ----
export function Monitor({ screen = '#0e2a52', night = false, dir = -1 }: { screen?: string; night?: boolean; dir?: number }) {
  const emis = night ? 1.3 : 0.9
  return (
    <group>
      <mesh position={[0, 1.02, 0]}><boxGeometry args={[0.98, 0.42, 0.05]} /><meshStandardMaterial color="#0a0a0e" roughness={0.4} metalness={0.35} /></mesh>
      <mesh position={[0, 1.02, dir * 0.031]}>
        <planeGeometry args={[0.92, 0.36]} />
        <meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={emis} roughness={0.24} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.05, 0.22, 0.04]} /><meshStandardMaterial color="#1b1b20" roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[0, 0.76, 0]}><boxGeometry args={[0.3, 0.03, 0.16]} /><meshStandardMaterial color="#1b1b20" roughness={0.4} metalness={0.5} /></mesh>
    </group>
  )
}

// ---- Un puesto: tapa de escritorio ----
function DeskTop({ w = 1.5, d = 0.8 }: { w?: number; d?: number }) {
  return (
    <group>
      <RoundedBox args={[w, 0.05, d]} radius={0.02} smoothness={3} position={[0, 0.74, 0]}><meshStandardMaterial color="#eef0f2" roughness={0.4} metalness={0.05} /></RoundedBox>
      <mesh position={[0, 0.37, 0]}><boxGeometry args={[w * 0.9, 0.72, d * 0.5]} /><meshStandardMaterial color="#e4e6ea" roughness={0.5} /></mesh>
    </group>
  )
}

// ---- BENCH: dos filas enfrentadas, monitores espalda con espalda ----
export function DeskBench({ pairs = 3, screen = '#0e2a52', night = false }: { pairs?: number; screen?: string; night?: boolean }) {
  const deskW = 1.5, deskD = 0.82, spine = 0.06
  const rowZ = deskD / 2 + spine / 2          // distancia de cada fila al centro
  const benchLen = pairs * deskW
  const items: JSX.Element[] = []
  // Tapas continuas por fila
  items.push(<RoundedBox key="topA" args={[benchLen, 0.05, deskD]} radius={0.02} smoothness={3} position={[0, 0.74, -rowZ]}><meshStandardMaterial color="#eef0f2" roughness={0.4} metalness={0.05} /></RoundedBox>)
  items.push(<RoundedBox key="topB" args={[benchLen, 0.05, deskD]} radius={0.02} smoothness={3} position={[0, 0.74, +rowZ]}><meshStandardMaterial color="#eef0f2" roughness={0.4} metalness={0.05} /></RoundedBox>)
  items.push(<mesh key="legA" position={[0, 0.37, -rowZ]}><boxGeometry args={[benchLen * 0.96, 0.72, deskD * 0.5]} /><meshStandardMaterial color="#e0e2e6" roughness={0.5} /></mesh>)
  items.push(<mesh key="legB" position={[0, 0.37, +rowZ]}><boxGeometry args={[benchLen * 0.96, 0.72, deskD * 0.5]} /><meshStandardMaterial color="#e0e2e6" roughness={0.5} /></mesh>)
  for (let i = 0; i < pairs; i++) {
    const x = -benchLen / 2 + deskW / 2 + i * deskW
    // Fila A (z<0): usuario mira +Z; monitor cerca del spine (z≈-0.14) con pantalla hacia -Z (hacia el usuario)
    items.push(
      <group key={`a${i}`} position={[x, 0, 0]}>
        <group position={[0, 0, -rowZ + (deskD / 2 - 0.14)]}><Monitor screen={screen} night={night} dir={-1} /></group>
        <HermanMillerChair x={0} z={-(rowZ + deskD / 2 + 0.42)} rot={0} />
      </group>,
    )
    // Fila B (z>0): usuario mira -Z; monitor cerca del spine (z≈+0.14) con pantalla hacia +Z
    items.push(
      <group key={`b${i}`} position={[x, 0, 0]}>
        <group position={[0, 0, +rowZ - (deskD / 2 - 0.14)]}><Monitor screen={screen} night={night} dir={+1} /></group>
        <HermanMillerChair x={0} z={+(rowZ + deskD / 2 + 0.42)} rot={Math.PI} />
      </group>,
    )
  }
  return <group>{items}</group>
}

// ---- Video wall: panel bronce + grilla de pantallas + credenza blanca ----
export function VideoWallGrid({ x, z, len, rotY, night, screenColor = '#123a7a' }: { x: number; z: number; len: number; rotY: number; night: boolean; screenColor?: string }) {
  const cols = Math.max(3, Math.round(len / 1.15))
  const rows = 2, gap = 0.04
  const sw = len / cols - gap, sh = 0.82
  const emis = night ? 1.6 : 0.95
  const screens: JSX.Element[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const sx = -len / 2 + sw / 2 + gap / 2 + c * (sw + gap)
    const sy = 1.55 + r * (sh + gap)
    const bright = 0.72 + ((r * cols + c) % 4) * 0.09
    screens.push(
      <group key={`${r}-${c}`} position={[sx, sy, 0.09]}>
        <mesh position={[0, 0, -0.01]}><planeGeometry args={[sw, sh]} /><meshStandardMaterial color="#05060a" roughness={0.4} /></mesh>
        <mesh><planeGeometry args={[sw - 0.03, sh - 0.03]} /><meshStandardMaterial color={screenColor} emissive={screenColor} emissiveIntensity={emis * bright} roughness={0.25} /></mesh>
      </group>,
    )
  }
  const doors = Math.max(3, Math.round(len / 1.0))
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.95, -0.02]}><boxGeometry args={[len + 0.3, 3.1, 0.1]} /><meshStandardMaterial color="#5c3f2e" roughness={0.6} metalness={0.25} /></mesh>
      {screens}
      <group position={[0, 0.45, 0.2]}>
        <RoundedBox args={[len + 0.2, 0.9, 0.5]} radius={0.02} smoothness={2}><meshStandardMaterial color="#eef0f2" roughness={0.5} metalness={0.05} /></RoundedBox>
        {Array.from({ length: doors }).map((_, i) => {
          const dx = -len / 2 + (len / doors) * (i + 0.5)
          return (<mesh key={i} position={[dx, 0, 0.26]}><boxGeometry args={[len / doors - 0.06, 0.7, 0.02]} /><meshStandardMaterial color="#d3d6db" roughness={0.6} metalness={0.2} /></mesh>)
        })}
      </group>
    </group>
  )
}

// ---- Mesa larga (sala del frente) con sillas a ambos lados ----
export function LongTable({ x, z, w, d, rot = 0, seats = 10 }: { x: number; z: number; w: number; d: number; rot?: number; seats?: number }) {
  const perSide = Math.max(1, Math.floor(seats / 2))
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <RoundedBox args={[w, 0.06, d]} radius={0.03} smoothness={3} position={[0, 0.74, 0]}><meshStandardMaterial color="#e6e8ec" roughness={0.4} metalness={0.1} /></RoundedBox>
      <mesh position={[0, 0.37, 0]}><boxGeometry args={[w * 0.9, 0.72, d * 0.3]} /><meshStandardMaterial color="#20242e" roughness={0.6} metalness={0.3} /></mesh>
      {Array.from({ length: perSide }).map((_, i) => {
        const sx = -w / 2 + (w / (perSide + 1)) * (i + 1)
        return (<group key={i}><HermanMillerChair x={sx} z={d / 2 + 0.35} rot={Math.PI} /><HermanMillerChair x={sx} z={-d / 2 - 0.35} rot={0} /></group>)
      })}
    </group>
  )
}

export function MeetingTable({ x, z, w, d, color = '#2a3350' }: { x: number; z: number; w: number; d: number; color?: string }) {
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[w, 0.06, d]} radius={0.03} smoothness={3} position={[0, 0.74, 0]}><meshStandardMaterial color={color} roughness={0.4} metalness={0.15} /></RoundedBox>
      <mesh position={[0, 0.37, 0]}><boxGeometry args={[w * 0.8, 0.72, d * 0.6]} /><meshStandardMaterial color="#20242e" roughness={0.6} metalness={0.3} /></mesh>
    </group>
  )
}

export function RoundTable({ x, z, r = 0.9 }: { x: number; z: number; r?: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.74, 0]}><cylinderGeometry args={[r, r, 0.06, 28]} /><meshStandardMaterial color="#2a3350" roughness={0.4} metalness={0.15} /></mesh>
      <mesh position={[0, 0.37, 0]}><cylinderGeometry args={[0.08, 0.12, 0.72, 12]} /><meshStandardMaterial color="#20242e" roughness={0.5} metalness={0.4} /></mesh>
    </group>
  )
}

// ---- Escritorio ejecutivo (oficinas del frente) ----
export function ExecDesk({ screen, night, monitor }: { screen: string; night: boolean; monitor: boolean }) {
  return (
    <group>
      <DeskTop w={1.7} d={0.9} />
      {monitor && <group position={[0, 0, -0.3]}><Monitor screen={screen} night={night} dir={1} /></group>}
      <HermanMillerChair x={0} z={-0.7} rot={0} />
    </group>
  )
}
