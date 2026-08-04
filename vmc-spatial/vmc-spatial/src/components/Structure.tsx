import type { VmcDocument } from '../types'
import { puestosDe } from '../lib/geometry'
interface Props { doc: VmcDocument; selectedId: string | null; onSelect: (id: string | null) => void }
const GRP: Record<string, string> = { bench: 'Islas', nucleo: 'Núcleo', comedor: 'Comedores', circular: 'Mesas redondas', oficina: 'Oficinas' }
export default function Structure({ doc, selectedId, onSelect }: Props) {
  const totalPuestos = doc.zonas.reduce((s, z) => s + puestosDe(z), 0)
  const totalPant = doc.videoWalls.reduce((s, v) => s + v.pantallas, 0)
  const order: string[] = ['bench', 'nucleo', 'oficina', 'comedor', 'circular']
  return (
    <div>
      <h3>Estructura del piso</h3>
      {order.map((k) => {
        const items = doc.zonas.filter((z) => z.kind === k)
        if (!items.length) return null
        return (
          <div key={k}>
            <div className="grp">{GRP[k]}</div>
            <div className="zlist">
              {items.map((z) => (
                <div key={z.id} className={`zitem ${z.id === selectedId ? 'sel' : ''}`} onClick={() => onSelect(z.id)}>
                  <span className="sw" style={{ background: z.color }} /><span>{z.nombre}</span>
                  <span className="meta">{puestosDe(z) > 0 ? `${puestosDe(z)} p.` : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      <div className="grp">Paredes de monitores</div>
      <div className="zlist">
        {doc.videoWalls.map((v) => (
          <div key={v.id} className={`zitem ${v.id === selectedId ? 'sel' : ''}`} onClick={() => onSelect(v.id)}>
            <span className="sw" style={{ background: '#27e0ff' }} /><span>{v.nombre}</span>
            <span className="meta">{v.pantallas} ({Math.ceil(v.pantallas / (v.filas || 2))}×{v.filas || 2})</span>
          </div>
        ))}
      </div>
      <h3 style={{ marginTop: 16 }}>Totales</h3>
      <div className="hint"><div>🪑 <b>{totalPuestos}</b> puestos</div><div>🖥️ <b>{totalPant}</b> pantallas</div></div>
    </div>
  )
}
