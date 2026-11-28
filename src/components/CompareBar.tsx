import { ArrowRight, X } from 'lucide-react'
import { useVehicles } from '../context/VehiclesContext'
import type { Compare } from '../hooks/useCompare'
import { T } from '../i18n'

export default function CompareBar({ compare, hidden }: { compare: Compare; hidden: boolean }) {
  const { vehicleById } = useVehicles()
  if (hidden || compare.ids.length === 0) return null

  const selected = compare.ids.map(vehicleById).filter((vehicle): vehicle is NonNullable<typeof vehicle> => Boolean(vehicle))

  return (
    <T>
    <aside className="compare-bar" aria-label="Sélection à comparer">
      <div className="shell compare-bar-inner">
        <div className="compare-bar-label">
          <strong>Comparateur</strong>
          <span>{selected.length}/{compare.max} véhicules</span>
        </div>
        <ul className="compare-bar-items">
          {selected.map(vehicle => (
            <li key={vehicle.id}>
              <img src={vehicle.image} alt="" loading="lazy" />
              <span>{vehicle.name}</span>
              <button
                type="button"
                onClick={() => compare.remove(vehicle.id)}
                aria-label={`Retirer ${vehicle.name} du comparateur`}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
        <div className="compare-bar-actions">
          <button type="button" className="compare-clear" onClick={compare.clear}>Vider</button>
          <a className="btn btn-primary" href="/comparateur">
            Comparer <ArrowRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </aside>
    </T>
  )
}
