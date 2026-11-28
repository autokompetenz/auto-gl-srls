import { ArrowRight, Search, CarFront, CreditCard, Mail, MapPin } from 'lucide-react'
import VehicleCard from '../components/VehicleCard'
import { useVehicles } from '../context/VehiclesContext'
import type { Compare } from '../hooks/useCompare'
import type { Favorites } from '../hooks/useFavorites'

const steps = [
  { icon: Search, title: 'Explorer sans compte', text: 'Accédez au catalogue sans inscription et préparez votre choix à votre rythme.' },
  { icon: CarFront, title: 'Choisir un véhicule', text: 'Filtrez par prix, année, kilométrage, couleur ou type de jantes, puis consultez chaque fiche en détail.' },
  { icon: CreditCard, title: 'Commander', text: 'Sélectionnez le financement souhaité et validez votre commande en quelques clics.' },
  { icon: Mail, title: 'Email de confirmation', text: 'Recevez votre bon de commande avec son numéro unique directement par email.' },
  { icon: MapPin, title: 'Suivre votre commande', text: 'Suivez chaque étape en temps réel sur notre page de suivi.' },
]

export default function Home({ favorites, compare }: { favorites: Favorites; compare: Compare }) {
  const { vehicles } = useVehicles()
  const featured = vehicles.slice(0, 3)

  return (
    <div className="page home-page">
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">AUTO GL SRLS · Sélection électrique</p>
          <h1>Électrique,<br />autrement.</h1>
          <p className="hero-lead">Une sélection de véhicules AUTO GL d’occasion, présentée avec des informations claires et des vues détaillées. Comparez, choisissez, réservez un essai.</p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#/catalogue">Voir le catalogue <ArrowRight size={17} aria-hidden="true" /></a>
            <a className="btn btn-ghost" href="#/favoris">Mes favoris ({favorites.ids.length})</a>
          </div>
          <dl className="hero-stats">
            <div><dt>{vehicles.length}</dt><dd>véhicules en stock</dd></div>
            <div><dt>6 mois</dt><dd>garantie minimale</dd></div>
            <div><dt>EUR</dt><dd>prix affichés</dd></div>
          </dl>
        </div>
        <div className="hero-visual">
          <div className="hero-frame">
            <img src="/media/exterior-polished.png" alt="AUTO GL Studio Silver en studio" />
          </div>
          <span className="hero-tag">Série 01 · Studio Silver</span>
        </div>
      </section>

      <section className="shell section">
        <div className="section-head">
          <div>
            <p className="eyebrow">À la une</p>
            <h2>Notre sélection du moment</h2>
          </div>
          <a className="text-link" href="#/catalogue">Tout le catalogue <ArrowRight size={16} aria-hidden="true" /></a>
        </div>
        <div className="vehicle-grid featured-grid">
          {featured.map(vehicle => (
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
      </section>

      <section className="shell section steps-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Comment ça marche</p>
            <h2>De la commande à la livraison</h2>
            <p className="steps-lead">Commandez votre véhicule en quelques minutes, suivez chaque étape depuis votre email.</p>
          </div>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span className="step-number">Étape {String(index + 1).padStart(2, '0')}</span>
              <step.icon size={24} aria-hidden="true" />
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
