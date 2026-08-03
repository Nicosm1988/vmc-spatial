// Panel Estructura: lista de clusters/zonas del piso, seleccionable.
import type { VmcDocument } from '../types'

interface Props {
  doc: VmcDocument
  selectedId: string | null
  onSelect: (id: string | null) => void
}

export default function Structure({ doc, selectedId, onSelect }: Props) {
  const totalPuestos = doc.zonas.reduce((s, z) => s + z.puestos, 0)
  const totalPantallas = doc.videoWalls.reduce((s, v) => s + v.pantallas, 0)

  return (
    <div>
      <h3>Estructura del piso</h3>
      <div className="zlist">
        {doc.zonas.map((z) => (
          <div
            key={z.id}
            className={`zitem ${z.id === selectedId ? 'sel' : ''}`}
            onClick={() => onSelect(z.id)}
          >
            <span className="sw" style={{ background: z.color }} />
            <span>{z.nombre}</span>
            <span className="meta">{z.puestos > 0 ? `${z.puestos} p.` : tipo(z.kind)}</span>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 18 }}>Totales</h3>
      <div className="hint">
        <div>🪑 <b>{totalPuestos}</b> puestos / hot desks</div>
        <div>🖥️ <b>{totalPantallas}</b> pantallas en video walls</div>
        <div>🧩 <b>{doc.zonas.length}</b> zonas modeladas</div>
        <div>📐 Planta tipo Pelli · ~1.600 m²</div>
      </div>
    </div>
  )
}

function tipo(kind: string): string {
  switch (kind) {
    case 'nucleo': return 'núcleo'
    case 'sala': return 'sala'
    case 'troubleshooting': return 'mesa'
    default: return '—'
  }
}
