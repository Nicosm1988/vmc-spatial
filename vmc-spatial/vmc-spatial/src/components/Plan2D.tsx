// Plano 2D calcado del CAD: contorno facetado, núcleo diamante, islas BENCH
// con escritorios ENFRENTADOS (dos filas + spine de monitores), pods, oficinas.
import { useEffect, useRef, useState } from 'react'
import type { InsightKey, VmcDocument, Zone } from '../types'
import { center, benchDesks, heat } from '../lib/geometry'
import { toSvgPoints, rotatedRect } from '../lib/plate'
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
  const insightDef = INSIGHTS[insight]
  const platePts = toSvgPoints(doc.plate)
  const corePts = toSvgPoints(doc.core)
  const zonePoly = (z: Zone) => toSvgPoints(rotatedRect(z.x, z.y, z.w, z.h, z.rot || 0, z.x + z.w / 2, z.y + z.h / 2))

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
        <polygon points={corePts} fill="url(#coreGlow)" stroke="#0E9BC4" strokeWidth={90} />
        {doc.columns.map((c, i) => (<circle key={i} cx={c.x} cy={c.y} r={260} fill="#7fb0e0" opacity={0.8} />))}

        {doc.zonas.map((z) => {
          const isSel = z.id === selectedId
          const fill = insight === 'none' ? z.color : heat(insightDef.value(z))
          const { cx, cy } = center(z)
          if (z.kind === 'pod') {
            const r = Math.min(z.w, z.h) / 2
            return (
              <g key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
                <circle cx={cx} cy={cy} r={r} fill={fill} fillOpacity={0.5} stroke={isSel ? '#FFD166' : fill} strokeWidth={isSel ? 150 : 70} />
                <text className="zone-sub" x={cx} y={cy + 150} textAnchor="middle">pod</text>
              </g>
            )
          }
          const op = z.kind === 'oficina' ? 0.6 : z.kind === 'salalarga' ? 0.5 : 0.42
          const angDeg = ((z.rot || 0) * 180) / Math.PI
          return (
            <g key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
              <polygon points={zonePoly(z)} fill={fill} fillOpacity={op} stroke={isSel ? '#FFD166' : fill} strokeWidth={isSel ? 150 : 70} strokeOpacity={0.95} />
              {/* Bench: escritorios enfrentados + spine de monitores */}
              {z.kind === 'cluster' && benchDesks(z).map((d, i) => (
                <g key={i} transform={`rotate(${angDeg} ${d.x} ${d.y})`}>
                  {/* escritorio */}
                  <rect x={d.x - 750} y={d.y - (d.side < 0 ? 900 : 100)} width={1500} height={800} rx={70} fill="rgba(4,10,26,0.4)" stroke="rgba(255,255,255,0.35)" strokeWidth={30} />
                  {/* monitor (barra) hacia el spine */}
                  <rect x={d.x - 520} y={d.y - (d.side < 0 ? 160 : 80)} width={1040} height={80} rx={20} fill="#27E0FF" opacity={0.9} />
                </g>
              ))}
              <text className="zone-label" x={cx} y={cy - 150} textAnchor="middle">{z.nombre}</text>
              <text className="zone-sub" x={cx} y={cy + 520} textAnchor="middle">{insight === 'none' ? (z.puestos > 0 ? `${z.puestos} puestos` : kindLabel(z.kind)) : insightDef.readout(z)}</text>
            </g>
          )
        })}

        {doc.videoWalls.map((v) => (<line key={v.id} x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2} stroke="#27E0FF" strokeWidth={260} strokeLinecap="round" opacity={0.92} />))}
      </g>

      <g transform={`translate(${doc.ancho - 3600} ${doc.alto - 2400})`}>
        <circle r={1400} fill="rgba(4,10,26,0.6)" stroke="#03C1BD" strokeWidth={50} />
        <polygon points="0,-1050 300,280 0,-90 -300,280" fill="#03C1BD" />
        <text x={0} y={-1650} textAnchor="middle" className="compass">N</text>
      </g>
    </svg>
  )
}
function kindLabel(kind: string): string { switch (kind) { case 'sala': return 'Sala'; case 'oficina': return 'Oficina'; case 'salalarga': return 'Sala larga'; case 'pod': return 'Pod'; default: return 'Cluster' } }
function gridLines(w: number, h: number, step: number) {
  const els: JSX.Element[] = []
  for (let x = 0; x <= w; x += step) els.push(<line key={`gx${x}`} className="grid-line" x1={x} y1={0} x2={x} y2={h} />)
  for (let y = 0; y <= h; y += step) els.push(<line key={`gy${y}`} className="grid-line" x1={0} y1={y} x2={w} y2={y} />)
  return els
}
