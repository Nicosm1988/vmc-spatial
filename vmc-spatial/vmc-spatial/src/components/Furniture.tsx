// ============================================================================
// Muebles realistas (React Three Fiber + Drei), inspirados en las fotos reales:
// - Silla Herman Miller (malla + respaldo con struts en Y, base 5 estrellas).
// - Monitor curvo ultrawide (3 segmentos) + laptop.
// - Escritorio blanco tipo bench.
// - Video wall: panel bronce + GRILLA de pantallas + credenza blanca (como foto).
// Medidas en METROS.
// ============================================================================
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const CHARCOAL = '#26262b'
const MESHCOL = '#33333a'
const FRAME = '#17171b'
const METAL = '#3a3a42'

// ---- Silla Herman Miller (estilo Cosm/Verus) ----
export function HermanMillerChair({ x, z, rot = 0 }: { x: number; z: number; rot?: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {Array.from({ length: 5 }).map((_, i) => {
        const a = (i / 5) * Math.PI * 2
        const lx = Math.sin(a) * 0.28, lz = Math.cos(a) * 0.28
        return (
          <group key={i}>
            <mesh position={[lx * 0.5, 0.06, lz * 0.5]} rotation={[0, -a, 0]}>
              <boxGeometry args={[0.06, 0.04, 0.34]} />
              <meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.6} />
            </mesh>
            <mesh position={[lx, 0.03, lz]}>
              <cylinderGeometry args={[0.035, 0.035, 0.05, 10]} />
              <meshStandardMaterial color="#0e0e12" roughness={0.4} metalness={0.5} />
            </mesh>
          </group>
        )
      })}
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.04, 0.05, 0.4, 12]} />
        <meshStandardMaterial color={METAL} roughness={0.35} metalness={0.75} />
      </mesh>
      <RoundedBox args={[0.52, 0.09, 0.5]} radius={0.04} smoothness={3} position={[0, 0.49, 0.02]}>
        <meshStandardMaterial color={MESHCOL} roughness={0.9} metalness={0.05} />
      </RoundedBox>
      <RoundedBox args={[0.54, 0.72, 0.06]} radius={0.06} smoothness={3} position={[0, 0.92, -0.22]} rotation={[-0.12, 0, 0]}>
        <meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.92, -0.205]} rotation={[-0.12, 0, 0]}>
        <planeGeometry args={[0.44, 0.62]} />
        <meshStandardMaterial color={MESHCOL} roughness={0.95} metalness={0.02} side={THREE.DoubleSide} transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, 0.78, -0.19]} rotation={[-0.12, 0, 0.35]}>
        <boxGeometry args={[0.04, 0.34, 0.03]} /><meshStandardMaterial color={CHARCOAL} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.78, -0.19]} rotation={[-0.12, 0, -0.35]}>
        <boxGeometry args={[0.04, 0.34, 0.03]} /><meshStandardMaterial color={CHARCOAL} roughness={0.5} metalness={0.4} />
      </mesh>
      <mesh position={[0, 1.02, -0.2]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.04, 0.28, 0.03]} /><meshStandardMaterial color={CHARCOAL} roughness={0.5} metalness={0.4} />
      </mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.3, 0.66, 0.04]}><boxGeometry args={[0.04, 0.22, 0.04]} /><meshStandardMaterial color={FRAME} roughness={0.5} metalness={0.5} /></mesh>
          <RoundedBox args={[0.09, 0.05, 0.24]} radius={0.02} smoothness={2} position={[s * 0.3, 0.78, 0.0]}>
            <meshStandardMaterial color={CHARCOAL} roughness={0.7} metalness={0.2} />
          </RoundedBox>
        </group>
      ))}
    </group>
  )
}

// ---- Monitor curvo ultrawide (3 segmentos) ----
export function CurvedMonitor({ screen = '#0e2a52', night = false }: { screen?: string; night?: boolean }) {
  const emis = night ? 1.2 : 0.8
  const Seg = ({ px, ry, w, fwd }: { px: number; ry: number; w: number; fwd: number }) => (
    <group position={[px, 0, fwd]} rotation={[0, ry, 0]}>
      <mesh position={[0, 0, -0.012]}><planeGeometry args={[w + 0.03, 0.37]} /><meshStandardMaterial color="#0a0a0e" roughness={0.4} metalness={0.3} side={THREE.DoubleSide} /></mesh>
      <mesh><planeGeometry args={[w, 0.33]} /><meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={emis} roughness={0.25} side={THREE.DoubleSide} /></mesh>
    </group>
  )
  return (
    <group position={[0, 1.04, -0.3]}>
      <Seg px={0} ry={0} w={0.44} fwd={0} />
      <Seg px={-0.4} ry={0.42} w={0.38} fwd={0.06} />
      <Seg px={0.4} ry={-0.42} w={0.38} fwd={0.06} />
      <mesh position={[0, -0.26, -0.02]}><boxGeometry args={[0.05, 0.26, 0.04]} /><meshStandardMaterial color="#1b1b20" roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[0, -0.4, 0.02]}><boxGeometry args={[0.26, 0.03, 0.16]} /><meshStandardMaterial color="#1b1b20" roughness={0.4} metalness={0.5} /></mesh>
    </group>
  )
}

// ---- Laptop ----
export function Laptop({ x = 0.42, z = 0.06 }: { x?: number; z?: number }) {
  return (
    <group position={[x, 0.76, z]} rotation={[0, -0.3, 0]}>
      <mesh><boxGeometry args={[0.34, 0.02, 0.24]} /><meshStandardMaterial color="#1a1c22" roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[0, 0.11, -0.11]} rotation={[-1.2, 0, 0]}><boxGeometry args={[0.34, 0.22, 0.01]} /><meshStandardMaterial color="#0e2a52" emissive="#123a6b" emissiveIntensity={0.5} roughness={0.3} /></mesh>
    </group>
  )
}

// ---- Escritorio blanco tipo bench ----
export function WhiteDesk() {
  return (
    <group>
      <RoundedBox args={[1.6, 0.05, 0.85]} radius={0.02} smoothness={3} position={[0, 0.74, 0]}>
        <meshStandardMaterial color="#eef0f2" roughness={0.4} metalness={0.05} />
      </RoundedBox>
      <mesh position={[0, 0.4, -0.3]}><boxGeometry args={[1.5, 0.62, 0.03]} /><meshStandardMaterial color="#e4e6ea" roughness={0.5} metalness={0.05} /></mesh>
      <mesh position={[-0.72, 0.37, 0]}><boxGeometry args={[0.04, 0.72, 0.8]} /><meshStandardMaterial color="#d7dade" roughness={0.5} /></mesh>
      <mesh position={[0.72, 0.37, 0]}><boxGeometry args={[0.04, 0.72, 0.8]} /><meshStandardMaterial color="#d7dade" roughness={0.5} /></mesh>
      <mesh position={[0.5, 0.28, 0.18]}><boxGeometry args={[0.4, 0.54, 0.44]} /><meshStandardMaterial color="#e9ebee" roughness={0.5} /></mesh>
    </group>
  )
}

// ---- Estación completa ----
export function Workstation({ x, z, rot = 0, screen = '#0e2a52', night = false }: { x: number; z: number; rot?: number; screen?: string; night?: boolean }) {
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <WhiteDesk />
      <CurvedMonitor screen={screen} night={night} />
      <Laptop />
      <HermanMillerChair x={0} z={0.66} rot={Math.PI} />
    </group>
  )
}

// ---- Video wall: panel bronce + grilla de pantallas + credenza blanca ----
export function VideoWallGrid({ x, z, len, rotY, night, screenColor = '#123a7a' }: { x: number; z: number; len: number; rotY: number; night: boolean; screenColor?: string }) {
  const cols = Math.max(3, Math.round(len / 1.15))
  const rows = 2
  const gap = 0.04
  const sw = len / cols - gap
  const sh = 0.82
  const emis = night ? 1.6 : 0.95
  const screens: JSX.Element[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
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

// ---- Mesa (troubleshooting / salas) ----
export function TroubleTable({ x, z, w, d, color = '#c9611f' }: { x: number; z: number; w: number; d: number; color?: string }) {
  return (
    <group position={[x, 0, z]}>
      <RoundedBox args={[w, 0.06, d]} radius={0.03} smoothness={3} position={[0, 0.74, 0]}><meshStandardMaterial color={color} roughness={0.4} metalness={0.15} /></RoundedBox>
      <mesh position={[0, 0.37, 0]}><boxGeometry args={[w * 0.8, 0.72, d * 0.6]} /><meshStandardMaterial color="#20242e" roughness={0.6} metalness={0.3} /></mesh>
    </group>
  )
}
