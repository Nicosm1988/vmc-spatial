// ============================================================================
// Plano 2D interactivo (SVG) con la planta en forma de LENTE.
// Pan (arrastre), zoom (rueda), click para seleccionar. Las zonas se recortan
// contra el contorno real de la planta (clipPath), y se dibujan calles + norte.
// ============================================================================
import { useEffect, useRef, useState } from 'react'
import type { InsightKey, VmcDocument } from '../types'
import { center, packDesks, heat } from '../lib/geometry'
import { toSvgPoints } from '../lib/plate'
import { INSIGHTS } from '../lib/insights'

interface Props {
  doc: VmcDocument
  selectedId: string | null
  insight: InsightKey
  onSelect: (id: string | null) => void
}

export default function Plan2D({ doc, selectedId, insight, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const pad = 3500
  const [vb, setVb] = useState({
    x: -pad, y: -pad, w: doc.ancho + pad * 2, h: doc.alto + pad * 2,
  })
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    setVb({ x: -pad, y: -pad, w: doc.ancho + pad * 2, h: doc.alto + pad * 2 })
  }, [doc.ancho, doc.alto])

  function onWheel(e: React.WheelEvent) {
    e.preventDefault()
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const mx = (e.clientX - rect.left) / rect.width
    const my = (e.clientY - rect.top) / rect.height
    const factor = e.deltaY > 0 ? 1.12 : 0.89
    const nw = vb.w * factor
    const nh = vb.h * factor
    setVb({ x: vb.x + (vb.w - nw) * mx, y: vb.y + (vb.h - nh) * my, w: nw, h: nh })
  }
  function onDown(e: React.PointerEvent) {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    drag.current = { sx: e.clientX, sy: e.clientY, ox: vb.x, oy: vb.y }
  }
  function onMove(e: React.PointerEvent) {
    if (!drag.current || !svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const dx = ((e.clientX - drag.current.sx) / rect.width) * vb.w
    const dy = ((e.clientY - drag.current.sy) / rect.height) * vb.h
    setVb((v) => ({ ...v, x: drag.current!.ox - dx, y: drag.current!.oy - dy }))
  }
  const onUp = () => (drag.current = null)

  const insightDef = INSIGHTS[insight]
  const platePts = toSvgPoints(doc.plate)

  return (
    <svg
      ref={svgRef}
      className="plan-svg"
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      onWheel={onWheel}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerLeave={onUp}
    >
      <defs>
        {/* Recorte al contorno de la planta */}
        <clipPath id="plateClip">
          <polygon points={platePts} />
        </clipPath>
        {/* Degradado piso azul-verde (paleta oficial) */}
        <linearGradient id="floorGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#071a4d" />
          <stop offset="100%" stopColor="#06253f" />
        </linearGradient>
        <radialGradient id="coreGlow" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#0b3a6b" />
          <stop offset="100%" stopColor="#050A30" />
        </radialGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="120" floodColor="#03C1BD" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Etiquetas de orientación (calles / río / norte) */}
      {doc.orientacion.map((o, i) => (
        <text
          key={i}
          className="street"
          x={o.x}
          y={o.y}
          textAnchor="middle"
          transform={o.rot ? `rotate(${o.rot} ${o.x} ${o.y})` : undefined}
        >
          {o.texto}
        </text>
      ))}

      {/* Placa de la planta (lente) */}
      <polygon
        points={platePts}
        fill="url(#floorGrad)"
        stroke="#03C1BD"
        strokeWidth={70}
        filter="url(#soft)"
        onClick={() => onSelect(null)}
      />

      {/* Contenido recortado al contorno */}
      <g clipPath="url(#plateClip)">
        {/* Grilla cada 2 m */}
        {gridLines(doc.ancho, doc.alto, 2000)}

        {/* Zonas / clusters */}
        {doc.zonas.map((z) => {
          if (z.w <= 0 || z.h <= 0) return null
          const isSel = z.id === selectedId
          const fill = insight === 'none' ? z.color : heat(insightDef.value(z))
          const { cx, cy } = center(z)
          const isCore = z.kind === 'nucleo'
          return (
            <g key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
              <rect
                x={z.x} y={z.y} width={z.w} height={z.h}
                rx={220}
                fill={isCore ? 'url(#coreGlow)' : fill}
                fillOpacity={isCore ? 1 : 0.5}
                stroke={isSel ? '#FFD166' : (isCore ? '#0E9BC4' : fill)}
                strokeWidth={isSel ? 150 : 70}
                strokeOpacity={0.95}
              />
              {z.puestos > 0 &&
                packDesks(z, z.puestos, doc.plate).map((p, i) => (
                  <rect key={i}
                    x={p.x - 700} y={p.y - 400} width={1400} height={800} rx={90}
                    fill="rgba(4,10,26,0.35)" stroke="rgba(255,255,255,0.35)" strokeWidth={30}
                  />
                ))}
              <text className="zone-label" x={cx} y={cy - 250} textAnchor="middle">{z.nombre}</text>
              <text className="zone-sub" x={cx} y={cy + 450} textAnchor="middle">
                {insight === 'none'
                  ? (z.puestos > 0 ? `${z.puestos} puestos` : kindLabel(z.kind))
                  : insightDef.readout(z)}
              </text>
            </g>
          )
        })}

        {/* Video walls */}
        {doc.videoWalls.map((v) => (
          <line key={v.id}
            x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2}
            stroke="#27E0FF" strokeWidth={240} strokeLinecap="round" opacity={0.92}
          />
        ))}
      </g>

      {/* Rosa de los vientos (Norte) */}
      <g transform={`translate(${doc.ancho - 3800} ${doc.alto - 2600})`}>
        <circle r={1500} fill="rgba(4,10,26,0.6)" stroke="#03C1BD" strokeWidth={50} />
        <polygon points="0,-1150 320,300 0,-100 -320,300" fill="#03C1BD" />
        <text x={0} y={-1750} textAnchor="middle" className="compass">N</text>
      </g>
    </svg>
  )
}

function kindLabel(kind: string): string {
  switch (kind) {
    case 'nucleo': return 'Video Walls'
    case 'sala': return 'Sala'
    case 'troubleshooting': return 'Mesa central'
    default: return 'Cluster'
  }
}

function gridLines(w: number, h: number, step: number) {
  const els: JSX.Element[] = []
  for (let x = 0; x <= w; x += step) els.push(<line key={`gx${x}`} className="grid-line" x1={x} y1={0} x2={x} y2={h} />)
  for (let y = 0; y <= h; y += step) els.push(<line key={`gy${y}`} className="grid-line" x1={0} y1={y} x2={w} y2={y} />)
  return els
}
