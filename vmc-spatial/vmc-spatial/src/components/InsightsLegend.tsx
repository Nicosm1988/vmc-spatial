import type { InsightKey } from '../types'
import { INSIGHTS } from '../lib/insights'
export default function InsightsLegend({ insight }: { insight: InsightKey }) {
  if (insight === 'none') return null
  const def = INSIGHTS[insight]
  return (
    <div className="insightbar">
      <div className="legend">
        <b>{def.label}</b>
        <div className="bar" />
        <div className="lbls"><span>bajo</span><span>alto</span></div>
        <div className="hint" style={{ marginTop: 4, maxWidth: 200 }}>{def.desc}</div>
      </div>
    </div>
  )
}
