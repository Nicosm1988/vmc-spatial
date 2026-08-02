// ============================================================================
// Plano 2D interactivo (SVG). Pan con arrastre, zoom con rueda, click para
// seleccionar zona. Pinta insights como heatmap cuando corresponde.
// ============================================================================
import { useEffect, useRef, useState } from 'react'
import type { InsightKey, VmcDocument } from '../types'
import { center, packDesks, heat } from '../lib/geometry'
import { INSIGHTS } from '../lib/insights'

interface Props {
  doc: VmcDocument
  selectedId: string | null
  insight: InsightKey
  onSelect: (id: string | null) => void
}

export default function Plan2D({ doc, selectedId, insight, onSelect }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  // viewBox en mm; arranca con un margen alrededor de la placa.
  const pad = 3000
  const [vb, setVb] = useState({
    x: -pad,
    y: -pad,
    w: doc.ancho + pad * 2,
    h: doc.alto + pad * 2,
  })
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null)

  // Reencuadra si cambian las dimensiones del documento.
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
    // zoom hacia el cursor
    const nx = vb.x + (vb.w - nw) * mx
    const ny = vb.y + (vb.h - nh) * my
    setVb({ x: nx, y: ny, w: nw, h: nh })
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
  function onUp() {
    drag.current = null
  }

  const insightDef = INSIGHTS[insight]

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
      {/* Grilla de referencia cada 2 m */}
      <g>
        {gridLines(doc.ancho, doc.alto, 2000)}
      </g>

      {/* Placa / piso */}
      <rect
        x={0}
        y={0}
        width={doc.ancho}
        height={doc.alto}
        fill="#0a1430"
        stroke="#33538f"
        strokeWidth={60}
        rx={200}
        onClick={() => onSelect(null)}
      />

      {/* Zonas */}
      {doc.zonas.map((z) => {
        if (z.w <= 0 || z.h <= 0) return null
        const isSel = z.id === selectedId
        const fill =
          insight === 'none' ? z.color : heat(insightDef.value(z))
        const { cx, cy } = center(z)
        return (
          <g key={z.id} onClick={(e) => { e.stopPropagation(); onSelect(z.id) }} style={{ cursor: 'pointer' }}>
            <rect
              x={z.x}
              y={z.y}
              width={z.w}
              height={z.h}
              rx={160}
              fill={fill}
              fillOpacity={z.kind === 'nucleo' ? 0.95 : 0.82}
              stroke={isSel ? '#ffb020' : '#0a1430'}
              strokeWidth={isSel ? 130 : 60}
            />
            {/* Hot desks */}
            {z.puestos > 0 &&
              packDesks(z, z.puestos).map((p, i) => (
                <rect
                  key={i}
                  x={p.x - 700}
                  y={p.y - 400}
                  width={1400}
                  height={800}
                  rx={90}
                  fill="rgba(6,12,26,0.55)"
                  stroke="rgba(255,255,255,0.25)"
                  strokeWidth={30}
                />
              ))}
            {/* Etiquetas */}
            <text className="zone-label" x={cx} y={cy - 200} textAnchor="middle">
              {z.nombre}
            </text>
            <text className="zone-sub" x={cx} y={cy + 500} textAnchor="middle">
              {insight === 'none'
                ? z.puestos > 0 ? `${z.puestos} puestos` : kindLabel(z.kind)
                : insightDef.readout(z)}
            </text>
          </g>
        )
      })}

      {/* Video walls (segmentos gruesos resaltados) */}
      {doc.videoWalls.map((v) => (
        <g key={v.id}>
          <line
            x1={v.x1}
            y1={v.y1}
            x2={v.x2}
            y2={v.y2}
            stroke="#27e0ff"
            strokeWidth={220}
            strokeLinecap="round"
            opacity={0.9}
          />
        </g>
      ))}

      {/* Muros perimetrales */}
      {doc.muros.map((m) => (
        <line
          key={m.id}
          x1={m.x1}
          y1={m.y1}
          x2={m.x2}
          y2={m.y2}
          stroke="#4a6db0"
          strokeWidth={90}
          strokeLinecap="square"
        />
      ))}
    </svg>
  )
}

function kindLabel(kind: string): string {
  switch (kind) {
    case 'nucleo': return 'Video Walls'
    case 'sala': return 'Sala'
    case 'troubleshooting': return 'Mesa central'
    case 'servicio': return 'Servicio'
    default: return 'Ala operativa'
  }
}

function gridLines(w: number, h: number, step: number) {
  const els: JSX.Element[] = []
  for (let x = 0; x <= w; x += step) {
    els.push(<line key={`gx${x}`} className="grid-line" x1={x} y1={0} x2={x} y2={h} />)
  }
  for (let y = 0; y <= h; y += step) {
    els.push(<line key={`gy${y}`} className="grid-line" x1={0} y1={y} x2={w} y2={y} />)
  }
  return els
}
