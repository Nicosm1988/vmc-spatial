// Plano 2D (SVG): contorno, núcleo DIAMANTE (4 caras), 4 paredes de pantallas
// (con el nº exacto), islas BENCH (spine + escritorios enfrentados), circulares,
// madera, salas y oficinas del frente.
import { useEffect, useRef, useState } from 'react'
import type { InsightKey, VmcDocument, Zone } from '../types'
import { heat } from '../lib/geometry'
import { toSvgPoints } from '../lib/plate'
import { INSIGHTS } from '../lib/insights'

interface Props { doc: VmcDocument; selectedId: string | null; insight: InsightKey; onSelect: (id: string | null) => void }

export default function Plan2D({ doc, selectedId, insight, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pad = 3500
  const [vb, setVb] = useState({ x: -pad, y: -pad, w: doc.ancho + pad * 2, h: doc.alto + pad * 2 })
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)
  useEffect(() => { setVb({ x: -pad, y: -pad, w: doc.ancho + pad * 2, h: doc.alto + pad * 2 }) }, [doc.ancho, doc.alto])
  function onWheel(e: React.WheelEvent) {
    e.preventDefault(); const svg = svgRef.current; if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / rect.width, my = (e.clientY - rect.top) / rect.height
    const f = e.deltaY > 0 ? 1.12 : 0.89, nw = vb.w * f, nh = vb.h * f
    setVb({ x: vb.x + (vb.w - nw) * mx, y: vb.y + (vb.h - nh) * my, w: nw, h: nh })
  }
  function onDown(e: React.PointerEvent) { (e.target as Element).setPointerCapture?.(e.pointerId); drag.current = { sx: e.clientX, sy: e.clientY, ox: vb.x, oy: vb.y } }
  function onMove(e: React.PointerEvent) {
    if (!drag.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - drag.current.sx) / rect.width) * vb.w, dy = ((e.clientY - drag.current.sy) / rect.height) * vb.h
    setVb((v) => ({ ...v, x: drag.current!.ox - dx, y: drag.current!.oy - dy }))
  }
  const onUp = () => (drag.current = null)
  const idf = INSIGHTS[insight]
  const platePts = toSvgPoints(doc.plate)
  const corePts = toSvgPoints(doc.core)

  function Bench({ z }: { z: Zone }) {
    const pairs = z.pairs || 3, du = 1500, dv = 900, spine = 500
    const L = pairs * du, ang = ((z.rot || 0) * 180) / Math.PI
    const fill = insight === 'none' ? z.color : heat(idf.value(z))
    const sel = z.id === selectedId
    const desks: JSX.Element[] = []
    for (let i = 0; i < pairs; i++) {
      const lx = -L / 2 + du / 2 + i * du
      for (const s of [-1, 1]) {
        const y0 = z.cy + (s > 0 ? spine / 2 : -spine / 2 - dv)
        desks.push(<rect key={`${i}-${s}`} x={z.cx + lx - du * 0.38} y={y0} width={du * 0.76} height={dv} rx={70} fill="rgba(4,10,26,0.4)" stroke="rgba(255,255,255,0.35)" strokeWidth={26} />)
      }
    }
    return (
      <g transform={`rotate(${ang} ${z.cx} ${z.cy})`} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
        <rect x={z.cx - L / 2 - 200} y={z.cy - spine / 2 - dv - 200} width={L + 400} height={2 * dv + spine + 400} rx={220} fill={fill} fillOpacity={0.22} stroke={sel ? '#FFD166' : fill} strokeWidth={sel ? 150 : 70} />
        {desks}
        <line x1={z.cx - L / 2 + 250} y1={z.cy} x2={z.cx + L / 2 - 250} y2={z.cy} stroke="#27E0FF" strokeWidth={140} strokeLinecap="round" />
      </g>
    )
  }

  return (
    <svg ref={svgRef} className="plan-svg" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} onWheel={onWheel} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
      <defs>
        <clipPath id="plateClip"><polygon points={platePts} /></clipPath>
        <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#071a4d" /><stop offset="100%" stopColor="#06253f" /></linearGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#0b3a6b" /><stop offset="100%" stopColor="#0a1636" /></radialGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="0" stdDeviation="120" floodColor="#03C1BD" floodOpacity="0.25" /></filter>
      </defs>
      {doc.orientacion.map((o, i) => (<text key={i} className="street" x={o.x} y={o.y} textAnchor="middle" transform={o.rot ? `rotate(${o.rot} ${o.x} ${o.y})` : undefined}>{o.texto}</text>))}
      <polygon points={platePts} fill="url(#floorGrad)" stroke="#03C1BD" strokeWidth={80} filter="url(#soft)" onClick={() => onSelect(null)} />
      <g clipPath="url(#plateClip)">
        {gridLines(doc.ancho, doc.alto, 2000)}
        {doc.zonas.filter((z) => z.kind === 'nucleo').map((z) => (
          <g key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
            <polygon points={corePts} fill="url(#coreGlow)" stroke={z.id === selectedId ? '#FFD166' : '#0E9BC4'} strokeWidth={z.id === selectedId ? 150 : 90} />
          </g>
        ))}
        {/* 4 paredes de pantallas + etiqueta con el nº exacto */}
        {doc.videoWalls.map((v) => {
          const mx = (v.x1 + v.x2) / 2, my = (v.y1 + v.y2) / 2
          return (
            <g key={v.id}>
              <line x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2} stroke="#27E0FF" strokeWidth={320} strokeLinecap="round" opacity={0.95} />
              <text className="zone-sub" x={mx} y={my + 150} textAnchor="middle" fill="#eaf7ff">{v.pantallas}</text>
            </g>
          )
        })}
        {doc.zonas.filter((z) => z.kind === 'bench').map((z) => <Bench key={z.id} z={z} />)}
        {doc.zonas.filter((z) => z.kind === 'wood').map((z) => (
          <g key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
            <rect x={z.cx - (z.w || 2200) / 2} y={z.cy - (z.h || 1400) / 2} width={z.w || 2200} height={z.h || 1400} rx={180} fill="#8a5a2b" stroke={z.id === selectedId ? '#FFD166' : '#c8974f'} strokeWidth={z.id === selectedId ? 130 : 60} />
          </g>
        ))}
        {doc.zonas.filter((z) => z.kind === 'circular').map((z) => {
          const fill = insight === 'none' ? z.color : heat(idf.value(z))
          return (
            <g key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
              <circle cx={z.cx} cy={z.cy} r={z.r || 1650} fill={fill} fillOpacity={0.5} stroke={z.id === selectedId ? '#FFD166' : '#9fe0ff'} strokeWidth={z.id === selectedId ? 150 : 70} />
              <text className="zone-sub" x={z.cx} y={z.cy + 120} textAnchor="middle">{z.nombre.includes('ficina') ? 'of.' : 'sala'}</text>
            </g>
          )
        })}
        {doc.zonas.filter((z) => z.kind === 'sala').map((z) => {
          const fill = insight === 'none' ? z.color : heat(idf.value(z))
          return (
            <g key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
              <rect x={z.cx - (z.w || 3600) / 2} y={z.cy - (z.h || 2900) / 2} width={z.w || 3600} height={z.h || 2900} rx={200} fill={fill} fillOpacity={0.45} stroke={z.id === selectedId ? '#FFD166' : '#8fd6ff'} strokeWidth={z.id === selectedId ? 150 : 70} />
              <text className="zone-sub" x={z.cx} y={z.cy + 120} textAnchor="middle">{z.nombre}</text>
            </g>
          )
        })}
        {doc.zonas.filter((z) => z.kind === 'oficina').map((z) => {
          const fill = insight === 'none' ? z.color : heat(idf.value(z))
          return (
            <g key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
              <rect x={z.cx - (z.w || 3800) / 2} y={z.cy - (z.h || 2600) / 2} width={z.w || 3800} height={z.h || 2600} rx={240} fill={fill} fillOpacity={0.55} stroke={z.id === selectedId ? '#FFD166' : '#a9deff'} strokeWidth={z.id === selectedId ? 150 : 80} />
              <text className="zone-label" x={z.cx} y={z.cy + 120} textAnchor="middle">{z.id === 'of-central' ? 'OFICINA' : z.id === 'of-norte' ? 'of. N' : 'of. S'}</text>
            </g>
          )
        })}
      </g>
      <g transform={`translate(${doc.ancho - 3600} ${doc.alto - 2400})`}>
        <circle r={1400} fill="rgba(4,10,26,0.6)" stroke="#03C1BD" strokeWidth={50} />
        <polygon points="0,-1050 300,280 0,-90 -300,280" fill="#03C1BD" />
        <text x={0} y={-1650} textAnchor="middle" className="compass">N</text>
      </g>
    </svg>
  )
}
function gridLines(w: number, h: number, step: number) {
  const els: JSX.Element[] = []
  for (let x = 0; x <= w; x += step) els.push(<line key={`gx${x}`} className="grid-line" x1={x} y1={0} x2={x} y2={h} />)
  for (let y = 0; y <= h; y += step) els.push(<line key={`gy${y}`} className="grid-line" x1={0} y1={y} x2={w} y2={y} />)
  return els
}
