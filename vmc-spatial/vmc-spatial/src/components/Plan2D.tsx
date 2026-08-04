import { useEffect, useRef, useState } from 'react'
import type { InsightKey, VideoWall, VmcDocument, Zone } from '../types'
import { heat, wallGeom } from '../lib/geometry'
import { toSvgPoints } from '../lib/plate'
import { INSIGHTS } from '../lib/insights'
interface Props {
  doc: VmcDocument; selectedId: string | null; insight: InsightKey; editing: boolean; snap: boolean
  onSelect: (id: string | null) => void
  onMove: (id: string, cxmm: number, cymm: number) => void
}
export default function Plan2D({ doc, selectedId, insight, editing, snap, onSelect, onMove }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pad = 3500
  const [vb, setVb] = useState({ x: -pad, y: -pad, w: doc.ancho + pad * 2, h: doc.alto + pad * 2 })
  const grab = useRef<{ id: string; dx: number; dy: number } | null>(null)
  useEffect(() => { setVb({ x: -pad, y: -pad, w: doc.ancho + pad * 2, h: doc.alto + pad * 2 }) }, [doc.ancho, doc.alto])
  function toWorld(e: React.PointerEvent) { const r = svgRef.current!.getBoundingClientRect(); return { x: vb.x + ((e.clientX - r.left) / r.width) * vb.w, y: vb.y + ((e.clientY - r.top) / r.height) * vb.h } }
  function onWheel(e: React.WheelEvent) { e.preventDefault(); const svg = svgRef.current; if (!svg) return; const r = svg.getBoundingClientRect(); const mx = (e.clientX - r.left) / r.width, my = (e.clientY - r.top) / r.height; const f = e.deltaY > 0 ? 1.12 : 0.89, nw = vb.w * f, nh = vb.h * f; setVb({ x: vb.x + (vb.w - nw) * mx, y: vb.y + (vb.h - nh) * my, w: nw, h: nh }) }
  function grabAt(id: string, curX: number, curY: number, e: React.PointerEvent) { e.stopPropagation(); onSelect(id); if (!editing) return; (e.target as Element).setPointerCapture?.(e.pointerId); const w = toWorld(e); grab.current = { id, dx: curX - w.x, dy: curY - w.y } }
  function onMovePtr(e: React.PointerEvent) { if (!grab.current) return; const w = toWorld(e); let nx = Math.round(w.x + grab.current.dx), ny = Math.round(w.y + grab.current.dy); if (snap) { nx = Math.round(nx / 250) * 250; ny = Math.round(ny / 250) * 250 } onMove(grab.current.id, nx, ny) }
  const onUp = () => { grab.current = null }
  const idf = INSIGHTS[insight]
  const platePts = toSvgPoints(doc.plate), corePts = toSvgPoints(doc.core)
  function Bench({ z }: { z: Zone }) {
    const pairs = z.pairs || 3, du = 1600, dv = 950, spine = 500, L = pairs * du
    const ang = ((z.rot || 0) * 180) / Math.PI, fill = insight === 'none' ? z.color : heat(idf.value(z)), sel = z.id === selectedId
    const desks: JSX.Element[] = []
    for (let i = 0; i < pairs; i++) { const lx = -L / 2 + du / 2 + i * du; for (const s of [-1, 1]) { const y0 = z.cy + (s > 0 ? spine / 2 : -spine / 2 - dv); desks.push(<rect key={`${i}-${s}`} x={z.cx + lx - du * 0.38} y={y0} width={du * 0.76} height={dv} rx={70} fill="rgba(4,10,26,0.4)" stroke="rgba(255,255,255,0.35)" strokeWidth={26} />) } }
    return (<g transform={`rotate(${ang} ${z.cx} ${z.cy})`} onPointerDown={(e) => grabAt(z.id, z.cx, z.cy, e)} style={{ cursor: editing ? 'grab' : 'pointer' }}><rect x={z.cx - L / 2 - 200} y={z.cy - spine / 2 - dv - 200} width={L + 400} height={2 * dv + spine + 400} rx={220} fill={fill} fillOpacity={0.22} stroke={sel ? '#FFD166' : fill} strokeWidth={sel ? 160 : 70} />{desks}<line x1={z.cx - L / 2 + 250} y1={z.cy} x2={z.cx + L / 2 - 250} y2={z.cy} stroke="#27E0FF" strokeWidth={140} strokeLinecap="round" /></g>)
  }
  function Wall({ w }: { w: VideoWall }) { const g = wallGeom(w), sel = w.id === selectedId; return (<g onPointerDown={(e) => grabAt(w.id, g.cx, g.cy, e)} style={{ cursor: editing ? 'grab' : 'pointer' }}><line x1={w.x1} y1={w.y1} x2={w.x2} y2={w.y2} stroke={sel ? '#FFD166' : '#27E0FF'} strokeWidth={sel ? 420 : 320} strokeLinecap="round" opacity={0.95} /><text className="zone-sub" x={g.cx} y={g.cy + 150} textAnchor="middle" fill="#04121f">{w.pantallas}</text></g>) }
  return (
    <svg ref={svgRef} className="plan-svg" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} onWheel={onWheel} onPointerMove={onMovePtr} onPointerUp={onUp} onPointerLeave={onUp}>
      <defs>
        <clipPath id="plateClip"><polygon points={platePts} /></clipPath>
        <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#a6adb7" /><stop offset="100%" stopColor="#8f97a2" /></linearGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%"><stop offset="0%" stopColor="#0b3a6b" /><stop offset="100%" stopColor="#0a1636" /></radialGradient>
      </defs>
      <polygon points={platePts} fill="url(#floorGrad)" stroke="#5b6470" strokeWidth={80} onClick={() => onSelect(null)} />
      <g clipPath="url(#plateClip)">
        {doc.zonas.filter((z) => z.kind === 'nucleo').map((z) => (<polygon key={z.id} points={corePts} fill="url(#coreGlow)" stroke={z.id === selectedId ? '#FFD166' : '#0E9BC4'} strokeWidth={z.id === selectedId ? 150 : 90} onPointerDown={(e) => grabAt(z.id, z.cx, z.cy, e)} style={{ cursor: 'pointer' }} />))}
        {doc.videoWalls.map((w) => <Wall key={w.id} w={w} />)}
        {doc.zonas.filter((z) => z.kind === 'bench').map((z) => <Bench key={z.id} z={z} />)}
        {doc.zonas.filter((z) => z.kind === 'comedor').map((z) => { const w = z.w || 3600, d = 1600, ang = ((z.rot || 0) * 180) / Math.PI, sel = z.id === selectedId; return (<g key={z.id} transform={`rotate(${ang} ${z.cx} ${z.cy})`} onPointerDown={(e) => grabAt(z.id, z.cx, z.cy, e)} style={{ cursor: editing ? 'grab' : 'pointer' }}><rect x={z.cx - w / 2} y={z.cy - d / 2} width={w} height={d} rx={200} fill="#9a6a34" stroke={sel ? '#FFD166' : '#c8974f'} strokeWidth={sel ? 160 : 70} /></g>) })}
        {doc.zonas.filter((z) => z.kind === 'oficina').map((z) => { const w = z.w || 3800, h = z.h || 2600, ang = ((z.rot || 0) * 180) / Math.PI, sel = z.id === selectedId, fill = insight === 'none' ? z.color : heat(idf.value(z)); return (<g key={z.id} transform={`rotate(${ang} ${z.cx} ${z.cy})`} onPointerDown={(e) => grabAt(z.id, z.cx, z.cy, e)} style={{ cursor: editing ? 'grab' : 'pointer' }}><rect x={z.cx - w / 2} y={z.cy - h / 2} width={w} height={h} rx={240} fill={fill} fillOpacity={0.55} stroke={sel ? '#FFD166' : '#a9deff'} strokeWidth={sel ? 160 : 80} /></g>) })}
        {doc.zonas.filter((z) => z.kind === 'circular').map((z) => { const fill = insight === 'none' ? z.color : heat(idf.value(z)), sel = z.id === selectedId; return (<circle key={z.id} cx={z.cx} cy={z.cy} r={z.r || 1650} fill={fill} fillOpacity={0.5} stroke={sel ? '#FFD166' : '#9fe0ff'} strokeWidth={sel ? 160 : 70} onPointerDown={(e) => grabAt(z.id, z.cx, z.cy, e)} style={{ cursor: editing ? 'grab' : 'pointer' }} />) })}
      </g>
      <g transform={`translate(${doc.ancho - 3600} ${doc.alto - 2400})`}>
        <circle r={1400} fill="rgba(255,255,255,0.7)" stroke="#5b6470" strokeWidth={50} />
        <polygon points="0,-1050 300,280 0,-90 -300,280" fill="#1657ce" />
        <text x={0} y={-1650} textAnchor="middle" className="compass">N</text>
      </g>
    </svg>
  )
}
