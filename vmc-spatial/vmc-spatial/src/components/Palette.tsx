import type { ZoneKind } from '../types'
interface Props { onAdd: (kind: ZoneKind) => void; onAddWall: () => void }
const ITEMS: { kind: ZoneKind; label: string; icon: string }[] = [
  { kind: 'bench', label: 'Isla de escritorios', icon: '🖥️' },
  { kind: 'circular', label: 'Mesa redonda', icon: '⭕' },
  { kind: 'comedor', label: 'Comedor / mesa larga', icon: '🍽️' },
  { kind: 'oficina', label: 'Oficina vidriada', icon: '🏢' },
]
export default function Palette({ onAdd, onAddWall }: Props) {
  return (
    <div>
      <h3>➕ Agregar objeto</h3>
      <div className="palette">
        {ITEMS.map((it) => (<button key={it.kind} className="pitem" onClick={() => onAdd(it.kind)}><span className="pico">{it.icon}</span><span>{it.label}</span></button>))}
        <button className="pitem" onClick={onAddWall}><span className="pico">📺</span><span>Pared de monitores</span></button>
      </div>
      <div className="hint" style={{ marginTop: 8 }}>Aparece a la vista; arrastralo libre a su lugar.</div>
    </div>
  )
}
