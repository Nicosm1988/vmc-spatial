import type { QualityPreference } from '../domain/experience'
import { useExperienceStore } from '../state/useExperienceStore'

const OPTIONS: Array<{ value: QualityPreference; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'performance', label: 'Rendimiento' },
  { value: 'balanced', label: 'Equilibrada' },
  { value: 'cinematic', label: 'Cinemática' },
]

export default function QualitySelector() {
  const preference = useExperienceStore((state) => state.qualityPreference)
  const resolved = useExperienceStore((state) => state.resolvedQuality)
  const setPreference = useExperienceStore((state) => state.setQualityPreference)

  return (
    <label className="quality-control">
      <span>Calidad</span>
      <select
        aria-label="Calidad gráfica"
        value={preference}
        onChange={(event) => setPreference(event.target.value as QualityPreference)}
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {preference === 'auto' ? <small>{resolved}</small> : null}
    </label>
  )
}
