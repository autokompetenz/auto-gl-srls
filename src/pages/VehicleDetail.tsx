import { useEffect, useState } from 'react'
import { ArrowLeft, Check, Heart, MapPin, ShieldCheck } from 'lucide-react'
import ContactForm from '../components/ContactForm'
import VehicleCard from '../components/VehicleCard'
import VehicleDescription from '../components/VehicleDescription'
import { useVehicles } from '../context/VehiclesContext'
import type { Compare } from '../hooks/useCompare'
import type { Favorites } from '../hooks/useFavorites'
import { formatEuro, formatKm } from '../lib/format'

export default function VehicleDetail({ id, favorites, compare }: { id: string; favorites: Favorites; compare: Compare }) {
  const { vehicles, vehicleById, loading } = useVehicles()
  const [activeImage, setActiveImage] = useState(0)
  const vehicle = vehicleById(id)

  useEffect(() => setActiveImage(0), [id])

  if (!vehicle && loading) {
    return (
      <div className="page shell empty-state">
        <p className="eyebrow">Chargement</p>
        <h1>Chargement du véhicule…</h1>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="page shell empty-state not-found">
        <p className="eyebrow">Annonce introuvable</p>
        <h1>Ce véhicule n’est plus disponible.</h1>
        <p>Il a peut-être été retiré de la sélection. Retrouvez les véhicules actuellement proposés.</p>
        <a className="btn btn-primary" href="/catalogue">Retour au catalogue</a>
      </div>
    )
  }

  // Une annonce peut n'avoir qu'une image : la fiche reste affichable et
  // toutes les photos de la galerie sont navigables.
  const gallery = vehicle.gallery?.length
    ? vehicle.gallery
    : vehicle.image
      ? [{ src: vehicle.image, caption: vehicle.name }]
      : []
  const current = gallery[activeImage] ?? gallery[0]

  const related = vehicles.filter(item => item.id !== vehicle.id).slice(0, 2)
  const isFavorite = favorites.has(vehicle.id)

  return (
    <div className="page shell detail-page">
      <a className="back-link" href="/catalogue"><ArrowLeft size={17} aria-hidden="true" /> Retour au catalogue</a>

      <div className="detail-head">
        <div>
          <p className="eyebrow">{vehicle.year} · {vehicle.version}</p>
          <h1>{vehicle.name}</h1>
          <p className="detail-subtitle"><MapPin size={16} aria-hidden="true" /> {vehicle.location} · {formatKm(vehicle.mileage)}</p>
        </div>
        <div className="detail-actions">
          <button
            type="button"
            className={compare.has(vehicle.id) ? 'compare-button large active' : 'compare-button large'}
            onClick={() => compare.toggle(vehicle.id)}
            aria-pressed={compare.has(vehicle.id)}
            aria-label={compare.has(vehicle.id) ? 'Retirer du comparateur' : 'Ajouter au comparateur'}
            title="Comparer"
          >
            <span aria-hidden="true">⇄</span>
          </button>
          <button
            type="button"
            className={isFavorite ? 'heart-button large active' : 'heart-button large'}
            onClick={() => favorites.toggle(vehicle.id)}
            aria-pressed={isFavorite}
            aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          >
            <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="gallery">
            <div className="gallery-main">
              {current
                ? <img src={current.src} alt={`${vehicle.name} — ${current.caption}`} />
                : <p className="gallery-empty">Aucune image disponible pour ce véhicule.</p>}
            </div>
            <div className="gallery-thumbs" role="group" aria-label="Vues du véhicule">
              {gallery.map((item, index) => (
                <button
                  type="button"
                  key={`${item.src}-${index}`}
                  className={index === activeImage ? 'thumb active' : 'thumb'}
                  onClick={() => setActiveImage(index)}
                  aria-label={`Voir : ${item.caption}`}
                  aria-pressed={index === activeImage}
                >
                  <img src={item.src} alt="" />
                  <span>{item.caption}</span>
                </button>
              ))}
            </div>
          </div>

          <section className="detail-section">
            <p className="eyebrow">Le véhicule</p>
            <h2>Une annonce lisible, de la cabine à la batterie.</h2>
            <VehicleDescription value={vehicle.description} />
          </section>

          <section className="detail-section technical-section">
            <p className="eyebrow">Vues techniques</p>
            <div className="technical-grid">
              {gallery.slice(1).map(item => (
                <figure key={item.caption}>
                  <img src={item.src} alt={`${vehicle.name} — ${item.caption}`} loading="lazy" />
                  <figcaption>{item.caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>

        <aside className="detail-aside">
          <div className="price-card">
            <p className="price-label">Prix affiché</p>
            <p className="price-value">{formatEuro(vehicle.price)}</p>
            <div className="price-badges">
              {vehicle.badges.map(badge => <span key={badge}>{badge}</span>)}
            </div>
            <a className="btn btn-primary checkout-cta" href={`/commander/${encodeURIComponent(vehicle.id)}`}>
              Commander ce véhicule
            </a>
            <a className="text-link" href="/simulation">Simuler mon budget</a>
          </div>

          <div className="spec-card">
            <h2>Caractéristiques</h2>
            <dl>
              <div><dt>Année</dt><dd>{vehicle.year}</dd></div>
              <div><dt>Kilométrage</dt><dd>{formatKm(vehicle.mileage)}</dd></div>
              <div><dt>Énergie</dt><dd>Électrique</dd></div>
              <div><dt>Boîte</dt><dd>{vehicle.gearbox}</dd></div>
              <div><dt>Couleur</dt><dd>{vehicle.color}</dd></div>
              <div><dt>Jantes</dt><dd>{vehicle.wheels}</dd></div>
              <div><dt>Garantie</dt><dd>{vehicle.warranty}</dd></div>
              <div><dt>Localisation</dt><dd>{vehicle.location}</dd></div>
            </dl>
          </div>

          <div className="equipment-card">
            <h2>Équipements</h2>
            <ul>
              {vehicle.equipment.map(item => <li key={item}><Check size={16} aria-hidden="true" /> {item}</li>)}
            </ul>
          </div>

          <div className="contact-card">
            <div className="contact-card-head">
              <ShieldCheck size={20} aria-hidden="true" />
              <div>
                <h2>Organiser un essai</h2>
                <p>Envoyez-nous vos disponibilités : nous vous répondrons au plus vite.</p>
              </div>
            </div>
            <ContactForm vehicleLabel={vehicle.name} />
          </div>
        </aside>
      </div>

      <section className="related-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">À considérer aussi</p>
            <h2>Deux autres véhicules de la sélection.</h2>
          </div>
        </div>
        <div className="vehicle-grid related-grid">
          {related.map(item => (
            <VehicleCard
              key={item.id}
              vehicle={item}
              favorite={favorites.has(item.id)}
              onToggleFavorite={favorites.toggle}
              compared={compare.has(item.id)}
              onToggleCompare={compare.toggle}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
