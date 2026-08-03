// ============================================================================
// Muebles realistas (R3F + Drei).
// - DeskBench: dos filas ENFRENTADAS; monitores ENTEROS espalda con espalda;
//   sillas Herman Miller en los lados externos.
// - VideoWallGrid: pared de pantallas (grilla) + credenza. Se orienta desde
//   Scene3D para sentarse sobre cada cara del diamante (4 paredes).
// Medidas en METROS.
// ============================================================================
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const CHARCOAL = '#26262b', MESHCOL = '#33333a', FRAME = '#17171b', METAL = '#3a3a42'

export function HermanMillerChair({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2, lx = Math.sin(a) * 0.28, lz = Math.cos(a) * 0.28
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
      {[-1, 1].map((s) => (<RoundedBox key={s} args={[0.08, 0.05, 0.22]} radius={0.02} smoothness={2} position={[s * 0.29, 0.76, 0.0]}><meshStandardMaterial color={CHARCOAL} roughness={0.7} metalness={0.2} /></RoundedBox>))}
    </group>
  )
}

export function Monitor({ screen = '#0e2a52', night = false, dir = -1 }: { screen?: string; night?: boolean; dir?: number }) {
  const emis = night ? 1.3 : 0.9
  return (
    <group>
      <mesh position={[0, 1.02, 0]}><boxGeometry args={[0.98, 0.42, 0.05]} /><meshStandardMaterial color="#0a0a0e" roughness={0.4} metalness={0.35} /></mesh>
      <mesh position={[0, 1.02, dir * 0.031]}><planeGeometry args={[0.92, 0.36]} /><meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={emis} roughness={0.24} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.85, 0]}><boxGeometry args={[0.05, 0.22, 0.04]} /><meshStandardMaterial color="#1b1b20" roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[0, 0.76, 0]}><boxGeometry args={[0.3, 0.03, 0.16]} /><meshStandardMaterial color="#1b1b20" roughness={0.4} metalness={0.5} /></mesh>
    </group>
  )
}

export function DeskBench({ pairs = 3, screen = '#0e2a52', night = false }: { pairs?: number; screen?: string; night?: boolean }) {
  const deskW = 1.5, deskD = 0.82, spine = 0.06
  const rowZ = deskD / 2 + spine / 2
  const benchLen = pairs * deskW
  const items: JSX.Element[] = []
  items.push(<RoundedBox key="tA" args={[benchLen, 0.05, deskD]} radius={0.02} smoothness={3} position={[0, 0.74, -rowZ]}><meshStandardMaterial color="#eef0f2" roughness={0.4} metalness={0.05} /></RoundedBox>)
  items.push(<RoundedBox key="tB" args={[benchLen, 0.05, deskD]} radius={0.02} smoothness={3} position={[0, 0.74, +rowZ]}><meshStandardMaterial color="#eef0f2" roughness={0.4} metalness={0.05} /></RoundedBox>)
  items.push(<mesh key="lA" position={[0, 0.37, -rowZ]}><boxGeometry args={[benchLen * 0.96, 0.72, deskD * 0.5]} /><meshStandardMaterial color="#e0e2e6" roughness={0.5} /></mesh>)
  items.push(<mesh key="lB" position={[0, 0.37, +rowZ]}><boxGeometry args={[benchLen * 0.96, 0.72, deskD * 0.5]} /><meshStandardMaterial color="#e0e2e6" roughness={0.5} /></mesh>)
  for (let i = 0; i < pairs; i++) {
    const x = -benchLen / 2 + deskW / 2 + i * deskW
    items.push(<group key={`a${i}`} position={[x, 0, 0]}><group position={[0, 0, -rowZ + (deskD / 2 - 0.14)]}><Monitor screen={screen} night={night} dir={-1} /></group><HermanMillerChair x={0} z={-(rowZ + deskD / 2 + 0.42)} rot={0} /></group>)
    items.push(<group key={`b${i}`} position={[x, 0, 0]}><group position={[0, 0, +rowZ - (deskD / 2 - 0.14)]}><Monitor screen={screen} night={night} dir={+1} /></group><HermanMillerChair x={0} z={+(rowZ + deskD / 2 + 0.42)} rot={Math.PI} /></group>)
  }
  return <group>{items}</group>
}

// Pared de pantallas. El grupo se ubica en el midpoint de una cara del diamante;
// rotY se calcula en Scene3D para alinear con la cara y mirar hacia afuera.
export function VideoWallGrid({ x, z, len, rotY, night, screenColor = '#123a7a' }: { x: number; z: number; len: number; rotY: number; night: boolean; screenColor?: string }) {
  const cols = Math.max(3, Math.round(len / 1.15)), rows = 2, gap = 0.04
  const sw = len / cols - gap, sh = 0.82, emis = night ? 1.6 : 0.95
  const screens: JSX.Element[] = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const sx = -len / 2 + sw / 2 + gap / 2 + c * (sw + gap), sy = 1.55 + r * (sh + gap)
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
      <mesh position={[0, 1.95, -0.02]}><boxGeometry args={[len + 0.2, 3.1, 0.1]} /><meshStandardMaterial color="#5c3f2e" roughness={0.6} metalness={0.25} /></mesh>
      {screens}
      <group position={[0, 0.45, 0.2]}>
        <RoundedBox args={[len + 0.1, 0.9, 0.5]} radius={0.02} smoothness={2}><meshStandardMaterial color="#eef0f2" roughness={0.5} metalness={0.05} /></RoundedBox>
        {Array.from({ length: doors }).map((_, i) => {
          const dx = -len / 2 + (len / doors) * (i + 0.5)
          return (<mesh key={i} position={[dx, 0, 0.26]}><boxGeometry args={[len / doors - 0.06, 0.7, 0.02]} /><meshStandardMaterial color="#d3d6db" roughness={0.6} metalness={0.2} /></mesh>)
        })}
      </group>
    </group>
  )
}

export function WoodTable({ x, z, w = 2.2, d = 1.4 }: { x: number; z: number; w?: number; d?: number }) {
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[w, 0.07, d]} radius={0.04} smoothness={3} position={[0, 0.74, 0]}><meshStandardMaterial color="#8a5a2b" roughness={0.45} metalness={0.05} /></RoundedBox>
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx, sz], i) => (<mesh key={i} position={[sx * (w/2-0.15), 0.37, sz * (d/2-0.15)]}><cylinderGeometry args={[0.05, 0.05, 0.72, 8]} /><meshStandardMaterial color="#6b4522" roughness={0.5} /></mesh>))}
    </group>
  )
}

export function CircularRoom({ x, z, r, color = '#3a6bb0', selected = false }: { x: number; z: number; r: number; night?: boolean; color?: string; selected?: boolean }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.35, 0]}><cylinderGeometry args={[r, r, 2.7, 36, 1, true]} /><meshStandardMaterial color="#9fe0ff" transparent opacity={selected ? 0.22 : 0.13} roughness={0.1} metalness={0.2} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.04, 0]}><cylinderGeometry args={[r, r, 0.06, 36]} /><meshStandardMaterial color={color} roughness={0.5} metalness={0.1} transparent opacity={0.5} /></mesh>
      <mesh position={[0, 0.74, 0]}><cylinderGeometry args={[r * 0.5, r * 0.5, 0.06, 24]} /><meshStandardMaterial color="#2a3350" roughness={0.4} metalness={0.15} /></mesh>
      <mesh position={[0, 0.37, 0]}><cylinderGeometry args={[0.09, 0.12, 0.72, 12]} /><meshStandardMaterial color="#20242e" roughness={0.5} metalness={0.4} /></mesh>
    </group>
  )
}

export function ExecDesk({ screen, night, monitor }: { screen: string; night: boolean; monitor: boolean }) {
  return (
    <group>
      <RoundedBox args={[1.7, 0.05, 0.9]} radius={0.02} smoothness={3} position={[0, 0.74, 0]}><meshStandardMaterial color="#eef0f2" roughness={0.4} metalness={0.05} /></RoundedBox>
      <mesh position={[0, 0.37, -0.32]}><boxGeometry args={[1.6, 0.72, 0.04]} /><meshStandardMaterial color="#e4e6ea" roughness={0.5} /></mesh>
      {monitor && <group position={[0, 0, -0.3]}><Monitor screen={screen} night={night} dir={1} /></group>}
      <HermanMillerChair x={0} z={-0.7} rot={0} />
    </group>
  )
}
