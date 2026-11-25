import { useMemo, useState } from 'react'
import { BellPlus, RotateCcw, Search, SlidersHorizontal } from 'lucide-react'
import AlertModal from '../components/AlertModal'
import VehicleCard from '../components/VehicleCard'
import { colors, maxMileage, maxPrice, vehicles, wheelOptions, years } from '../data/vehicles'
import type { Compare } from '../hooks/useCompare'
import type { Favorites } from '../hooks/useFavorites'
import { formatEuro, formatKm } from '../lib/format'
import type { AlertFilters } from '../types/features'

const sortOptions = [
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'mileage-asc', label: 'Kilométrage croissant' },
  { value: 'year-desc', label: 'Année récente' },
] as const

export default function Catalogue({ favorites, compare }: { favorites: Favorites; compare: Compare }) {
  const [alertOpen, setAlertOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [color, setColor] = useState('all')
  const [wheels, setWheels] = useState('all')
  const [year, setYear] = useState('all')
  const [priceLimit, setPriceLimit] = useState(maxPrice)
  const [mileageLimit, setMileageLimit] = useState(maxMileage)
  const [warrantyOnly, setWarrantyOnly] = useState(false)
  const [sort, setSort] = useState<(typeof sortOptions)[number]['value']>('price-asc')

  const results = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('fr')
    const filtered = vehicles.filter(vehicle => {
      const haystack = `${vehicle.name} ${vehicle.version} ${vehicle.color} ${vehicle.wheels} ${vehicle.location}`.toLocaleLowerCase('fr')
      if (needle && !haystack.includes(needle)) return false
      if (color !== 'all' && vehicle.color !== color) return false
      if (wheels !== 'all' && vehicle.wheels !== wheels) return false
      if (year !== 'all' && vehicle.year !== Number(year)) return false
      if (vehicle.price > priceLimit || vehicle.mileage > mileageLimit) return false
      if (warrantyOnly && !vehicle.warranty.includes('12')) return false
      return true
    })
    return filtered.sort((a, b) => {
      if (sort === 'price-desc') return b.price - a.price
      if (sort === 'mileage-asc') return a.mileage - b.mileage
      if (sort === 'year-desc') return b.year - a.year || a.price - b.price
      return a.price - b.price
    })
  }, [query, color, wheels, year, priceLimit, mileageLimit, warrantyOnly, sort])

  const alertFilters: AlertFilters = useMemo(() => ({
    search: query.trim() || undefined,
    color: color === 'all' ? undefined : color,
    wheels: wheels === 'all' ? undefined : wheels,
    year: year === 'all' ? undefined : Number(year),
    maxPrice: priceLimit,
    maxMileage: mileageLimit,
    warrantyOnly,
  }), [query, color, wheels, year, priceLimit, mileageLimit, warrantyOnly])

  const reset = () => {
    setQuery('')
    setColor('all')
    setWheels('all')
    setYear('all')
    setPriceLimit(maxPrice)
    setMileageLimit(maxMileage)
    setWarrantyOnly(false)
    setSort('price-asc')
  }

  return (
    <div className="page shell catalogue-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1>Trouvez votre AUTO GL d’occasion.</h1>
          <p>Filtrez la sélection selon votre budget, vos usages et vos préférences esthétiques.</p>
        </div>
        <p className="results-count" role="status" aria-live="polite">{results.length} véhicule{results.length > 1 ? 's' : ''} disponible{results.length > 1 ? 's' : ''}</p>
      </div>

      <div className="catalogue-layout">
        <aside className="filters" aria-label="Filtres de recherche">
          <div className="filters-head">
            <h2><SlidersHorizontal size={18} aria-hidden="true" /> Filtres</h2>
            <button type="button" className="reset-button" onClick={reset}><RotateCcw size={15} aria-hidden="true" /> Réinitialiser</button>
          </div>
          <label className="filter-field">
            <span>Recherche</span>
            <span className="input-with-icon">
              <Search size={16} aria-hidden="true" />
              <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Couleur, ville, version…" />
            </span>
          </label>
          <label className="filter-field">
            <span>Couleur</span>
            <select value={color} onChange={event => setColor(event.target.value)}>
              <option value="all">Toutes les couleurs</option>
              {colors.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span>Jantes</span>
            <select value={wheels} onChange={event => setWheels(event.target.value)}>
              <option value="all">Toutes les jantes</option>
              {wheelOptions.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="filter-field">
            <span>Année</span>
            <select value={year} onChange={event => setYear(event.target.value)}>
              <option value="all">Toutes les années</option>
              {years.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="filter-field range-field">
            <span>Prix maximum : <b>{formatEuro(priceLimit)}</b></span>
            <input type="range" min={20000} max={maxPrice} step={100} value={priceLimit} onChange={event => setPriceLimit(Number(event.target.value))} />
          </label>
          <label className="filter-field range-field">
            <span>Kilométrage maximum : <b>{formatKm(mileageLimit)}</b></span>
            <input type="range" min={5000} max={maxMileage} step={500} value={mileageLimit} onChange={event => setMileageLimit(Number(event.target.value))} />
          </label>
          <label className="checkbox-field">
            <input type="checkbox" checked={warrantyOnly} onChange={event => setWarrantyOnly(event.target.checked)} />
            <span>Garantie 12 mois uniquement</span>
          </label>
        </aside>

        <section className="catalogue-results" aria-label="Véhicules disponibles">
          <div className="results-toolbar">
            <button type="button" className="create-alert" onClick={() => setAlertOpen(true)}>
              <BellPlus size={16} aria-hidden="true" /> Créer une alerte
            </button>
            <p>Trier par</p>
            <select value={sort} onChange={event => setSort(event.target.value as typeof sort)} aria-label="Trier les résultats">
              {sortOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
          {results.length ? (
            <div className="vehicle-grid catalogue-grid">
              {results.map(vehicle => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  favorite={favorites.has(vehicle.id)}
                  onToggleFavorite={favorites.toggle}
                  compared={compare.has(vehicle.id)}
                  onToggleCompare={compare.toggle}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h2>Aucun véhicule ne correspond.</h2>
              <p>Essayez d’élargir le budget, le kilométrage ou de retirer un filtre.</p>
              <button type="button" className="btn btn-primary" onClick={reset}>Réinitialiser les filtres</button>
            </div>
          )}
        </section>
      </div>
      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} filters={alertFilters} />
    </div>
  )
}
