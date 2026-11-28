import { Heart, MapPin, ArrowUpRight } from 'lucide-react'
import type { Vehicle } from '../data/vehicles'
import { formatEuro, formatKm } from '../lib/format'
import { T } from '../i18n'

export default function VehicleCard({
  vehicle,
  favorite,
  onToggleFavorite,
  compared = false,
  onToggleCompare,
}: {
  vehicle: Vehicle
  favorite: boolean
  onToggleFavorite: (id: string) => void
  compared?: boolean
  onToggleCompare?: (id: string) => void
}) {
  return (
    <T>
    <article className="vehicle-card">
      <a className="vehicle-media" href={`/vehicule/${vehicle.id}`} aria-label={`Voir ${vehicle.name}`}>
        <img src={vehicle.image} alt={`${vehicle.name} ${vehicle.color}`} loading="lazy" />
        <span className="vehicle-year">{vehicle.year}</span>
      </a>
      <div className="vehicle-body">
        <div className="vehicle-heading">
          <div>
            <h3>{vehicle.name}</h3>
            <p>{vehicle.version}</p>
          </div>
          <div className="vehicle-controls">
            {onToggleCompare && (
              <button
                type="button"
                className={compared ? 'compare-button active' : 'compare-button'}
                onClick={() => onToggleCompare(vehicle.id)}
                aria-pressed={compared}
                aria-label={compared ? `Retirer ${vehicle.name} du comparateur` : `Ajouter ${vehicle.name} au comparateur`}
                title="Comparer"
              >
                <span aria-hidden="true">⇄</span>
              </button>
            )}
            <button
              type="button"
              className={favorite ? 'heart-button active' : 'heart-button'}
              onClick={() => onToggleFavorite(vehicle.id)}
              aria-pressed={favorite}
              aria-label={favorite ? `Retirer ${vehicle.name} des favoris` : `Ajouter ${vehicle.name} aux favoris`}
            >
              <Heart size={18} fill={favorite ? 'currentColor' : 'none'} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="vehicle-meta">
          <span>{formatKm(vehicle.mileage)}</span>
          <span>{vehicle.color}</span>
          <span><MapPin size={14} aria-hidden="true" /> {vehicle.location}</span>
        </div>
        <div className="vehicle-badges">
          {vehicle.badges.map(badge => <span key={badge}>{badge}</span>)}
        </div>
        <div className="vehicle-footer">
          <strong>{formatEuro(vehicle.price)}</strong>
          <a className="card-link" href={`/vehicule/${vehicle.id}`}>
            Voir le véhicule <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
    </T>
  )
}
