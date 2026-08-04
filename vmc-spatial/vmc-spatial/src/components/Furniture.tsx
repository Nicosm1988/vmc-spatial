// Muebles realistas (R3F + Drei). Monitor curvo, bench, pared de pantallas
// (largo/cantidad/filas), mesa redonda, comedor, oficina. Medidas en METROS.
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'

const CHARCOAL = '#26262b', MESHCOL = '#33333a', FRAME = '#17171b', METAL = '#3a3a42'
const WALLCOL = '#d8cdbf', WALLTOP = '#c3b6a4' // revestimiento claro tipo lamas (como la foto)

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
      {[-1, 1].map((s) => (<RoundedBox key={s} args={[0.08, 0.05, 0.22]} radius={0.02} smoothness={2} position={[s * 0.29, 0.76, 0.0]}><meshStandardMaterial color={CHARCOAL} roughness={0.7} metalness={0.2} /></RoundedBox>))}
    </group>
  )
}

// Monitor CURVO ultrawide (como la foto): panel cóncavo negro emisivo.
export function Monitor({ screen = '#0e2a52', night = false, dir = -1 }: { screen?: string; night?: boolean; dir?: number }) {
  const emis = night ? 1.15 : 0.85
  const r = 0.9, th = 0.95, seg = 20
  return (
    <group position={[0, 1.02, 0]}>
      {/* carcasa curva */}
      <mesh rotation={[0, dir < 0 ? 0 : Math.PI, 0]}>
        <cylinderGeometry args={[r, r, 0.4, seg, 1, true, -th / 2, th]} />
        <meshStandardMaterial color="#0a0a0e" roughness={0.4} metalness={0.4} side={THREE.BackSide} />
      </mesh>
      {/* pantalla curva emisiva */}
      <mesh rotation={[0, dir < 0 ? 0 : Math.PI, 0]}>
        <cylinderGeometry args={[r - 0.02, r - 0.02, 0.34, seg, 1, true, -th / 2, th]} />
        <meshStandardMaterial color={screen} emissive={screen} emissiveIntensity={emis} roughness={0.24} side={THREE.FrontSide} />
      </mesh>
      <mesh position={[0, -0.17, dir * (r - 0.08)]}><boxGeometry args={[0.05, 0.22, 0.04]} /><meshStandardMaterial color="#1b1b20" roughness={0.4} metalness={0.5} /></mesh>
      <mesh position={[0, -0.26, dir * (r - 0.08)]}><boxGeometry args={[0.32, 0.03, 0.18]} /><meshStandardMaterial color="#1b1b20" roughness={0.4} metalness={0.5} /></mesh>
    </group>
  )
}

export function DeskBench({ pairs = 3, screen = '#0e2a52', night = false }: { pairs?: number; screen?: string; night?: boolean }) {
  const deskW = 1.6, deskD = 0.86, spine = 0.06, rowZ = deskD / 2 + spine / 2, benchLen = pairs * deskW
  const items: JSX.Element[] = []
  items.push(<RoundedBox key="tA" args={[benchLen, 0.05, deskD]} radius={0.02} smoothness={3} position={[0, 0.74, -rowZ]}><meshStandardMaterial color="#f2f2ee" roughness={0.35} metalness={0.05} /></RoundedBox>)
  items.push(<RoundedBox key="tB" args={[benchLen, 0.05, deskD]} radius={0.02} smoothness={3} position={[0, 0.74, +rowZ]}><meshStandardMaterial color="#f2f2ee" roughness={0.35} metalness={0.05} /></RoundedBox>)
  items.push(<mesh key="lA" position={[0, 0.37, -rowZ]}><boxGeometry args={[benchLen * 0.96, 0.72, deskD * 0.5]} /><meshStandardMaterial color="#e6e6e2" roughness={0.5} /></mesh>)
  items.push(<mesh key="lB" position={[0, 0.37, +rowZ]}><boxGeometry args={[benchLen * 0.96, 0.72, deskD * 0.5]} /><meshStandardMaterial color="#e6e6e2" roughness={0.5} /></mesh>)
  for (let i = 0; i < pairs; i++) {
    const x = -benchLen / 2 + deskW / 2 + i * deskW
    items.push(<group key={`a${i}`} position={[x, 0, 0]}><group position={[0, 0, -rowZ + (deskD / 2 - 0.16)]}><Monitor screen={screen} night={night} dir={-1} /></group><HermanMillerChair x={0} z={-(rowZ + deskD / 2 + 0.45)} rot={0} /></group>)
    items.push(<group key={`b${i}`} position={[x, 0, 0]}><group position={[0, 0, +rowZ - (deskD / 2 - 0.16)]}><Monitor screen={screen} night={night} dir={+1} /></group><HermanMillerChair x={0} z={+(rowZ + deskD / 2 + 0.45)} rot={Math.PI} /></group>)
  }
  return <group>{items}</group>
}

// Pared de pantallas (revestimiento claro + grilla). len/count/filas editables.
export function VideoWall({ len, night, count, filas, selected, screenColor = '#123a7a' }: { len: number; night: boolean; count: number; filas?: number; selected?: boolean; screenColor?: string }) {
  const wallH = 3.1, rows = Math.max(1, filas ?? 2), cols = Math.max(1, Math.ceil(count / rows)), gap = 0.03
  const bandBottom = 1.05, bandTop = wallH - 0.2, availH = bandTop - bandBottom
  const sh = Math.min(0.86, (availH - (rows - 1) * gap) / rows), bandH = rows * sh + (rows - 1) * gap
  const sw = (len - 0.4) / cols - gap, yBottom = bandBottom + (availH - bandH) / 2 + sh / 2, emis = night ? 1.7 : 1.15
  const screens: JSX.Element[] = []; let placed = 0
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (placed >= count) break
    const sx = -((cols - 1) * (sw + gap)) / 2 + c * (sw + gap), sy = yBottom + r * (sh + gap)
    const bright = 0.8 + ((r * cols + c) % 4) * 0.06
    screens.push(<group key={`${r}-${c}`} position={[sx, sy, 0.08]}><mesh position={[0, 0, -0.01]}><planeGeometry args={[sw, sh]} /><meshStandardMaterial color="#04060b" roughness={0.4} /></mesh><mesh><planeGeometry args={[sw - 0.02, sh - 0.02]} /><meshStandardMaterial color={screenColor} emissive={screenColor} emissiveIntensity={emis * bright} roughness={0.2} /></mesh></group>)
    placed++
  }
  return (
    <group>
      <mesh position={[0, wallH / 2, 0]} castShadow receiveShadow><boxGeometry args={[len, wallH, 0.14]} /><meshStandardMaterial color={WALLCOL} roughness={0.8} metalness={0.03} /></mesh>
      <mesh position={[0, 0.08, 0.075]}><boxGeometry args={[len, 0.16, 0.02]} /><meshStandardMaterial color={WALLTOP} roughness={0.7} /></mesh>
      <mesh position={[0, wallH - 0.08, 0.075]}><boxGeometry args={[len, 0.16, 0.02]} /><meshStandardMaterial color={WALLTOP} roughness={0.7} /></mesh>
      {screens}
      {selected && <mesh position={[0, wallH / 2, 0]}><boxGeometry args={[len, wallH, 0.16]} /><meshBasicMaterial color="#ffd166" wireframe /></mesh>}
    </group>
  )
}

export function RoundTable({ x, z, r = 1.65, seats = 5 }: { x: number; z: number; r?: number; seats?: number }) {
  const tr = r * 0.55
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.74, 0]}><cylinderGeometry args={[tr, tr, 0.06, 28]} /><meshStandardMaterial color="#2a3350" roughness={0.4} metalness={0.15} /></mesh>
      <mesh position={[0, 0.37, 0]}><cylinderGeometry args={[0.09, 0.12, 0.72, 12]} /><meshStandardMaterial color="#20242e" roughness={0.5} metalness={0.4} /></mesh>
      {Array.from({ length: seats }).map((_, i) => {
        const a = (i / seats) * Math.PI * 2, cxp = Math.cos(a) * (r * 0.85), czp = Math.sin(a) * (r * 0.85)
        return <HermanMillerChair key={i} x={cxp} z={czp} rot={-a + Math.PI / 2} />
      })}
    </group>
  )
}

export function Comedor({ x, z, w, rotY, seats = 8 }: { x: number; z: number; w: number; rotY: number; seats?: number }) {
  const d = 1.1, per = Math.max(1, Math.floor(seats / 2))
  return (
    <group position={[x, 0, z]} rotation={[0, rotY, 0]}>
      <RoundedBox args={[w, 0.07, d]} radius={0.05} smoothness={3} position={[0, 0.75, 0]}><meshStandardMaterial color="#9a6a34" roughness={0.45} metalness={0.05} /></RoundedBox>
      {[[-1,-1],[1,-1],[-1,1],[1,1]].map(([sx, sz], i) => (<mesh key={i} position={[sx * (w/2-0.15), 0.37, sz * (d/2-0.15)]}><cylinderGeometry args={[0.05, 0.05, 0.72, 8]} /><meshStandardMaterial color="#6b4522" roughness={0.5} /></mesh>))}
      {Array.from({ length: per }).map((_, i) => {
        const sx = -w / 2 + (w / (per + 1)) * (i + 1)
        return (<group key={i}><HermanMillerChair x={sx} z={d / 2 + 0.35} rot={Math.PI} /><HermanMillerChair x={sx} z={-d / 2 - 0.35} rot={0} /></group>)
      })}
    </group>
  )
}

export function Oficina({ w, h, night, color }: { w: number; h: number; night: boolean; color: string }) {
  return (
    <group>
      <mesh position={[0, 1.4, 0]}><boxGeometry args={[w, 2.8, h]} /><meshStandardMaterial color="#a9deff" transparent opacity={0.12} roughness={0.08} metalness={0.2} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.04, 0]}><boxGeometry args={[w, 0.06, h]} /><meshStandardMaterial color={color} roughness={0.5} metalness={0.1} transparent opacity={0.5} /></mesh>
      <RoundedBox args={[1.6, 0.05, 0.85]} radius={0.02} smoothness={3} position={[0, 0.74, -0.1]}><meshStandardMaterial color="#f2f2ee" roughness={0.4} /></RoundedBox>
      <group position={[0, 0, -0.1]}><Monitor screen={color} night={night} dir={1} /></group>
      <HermanMillerChair x={0} z={-0.8} rot={0} />
    </group>
  )
}
