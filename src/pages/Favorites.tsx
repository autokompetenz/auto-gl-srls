import { Heart } from 'lucide-react'
import VehicleCard from '../components/VehicleCard'
import { useVehicles } from '../context/VehiclesContext'
import type { Compare } from '../hooks/useCompare'
import type { Favorites } from '../hooks/useFavorites'

export default function Favorites({ favorites, compare }: { favorites: Favorites; compare: Compare }) {
  const { vehicleById } = useVehicles()
  const saved = favorites.ids.map(vehicleById).filter((vehicle): vehicle is NonNullable<typeof vehicle> => Boolean(vehicle))

  return (
    <div className="page shell favorites-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Votre sélection</p>
          <h1>Mes favoris.</h1>
          <p>Retrouvez ici les véhicules que vous avez mis de côté. La liste est conservée dans ce navigateur.</p>
        </div>
        {saved.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={favorites.clear}>Tout retirer</button>
        )}
      </div>

      {saved.length ? (
        <div className="vehicle-grid catalogue-grid">
          {saved.map(vehicle => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              favorite
              onToggleFavorite={favorites.remove}
              compared={compare.has(vehicle.id)}
              onToggleCompare={compare.toggle}
            />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Heart size={32} aria-hidden="true" />
          <h2>Aucun favori pour le moment.</h2>
          <p>Parcourez le catalogue et appuyez sur le cœur d’un véhicule pour le retrouver ici.</p>
          <a className="btn btn-primary" href="#/catalogue">Découvrir le catalogue</a>
        </div>
      )}
    </div>
  )
}
