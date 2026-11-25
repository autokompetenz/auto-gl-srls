import { ArrowRight, ShieldCheck, ClipboardCheck, CalendarCheck } from 'lucide-react'
import VehicleCard from '../components/VehicleCard'
import { vehicles } from '../data/vehicles'
import type { Compare } from '../hooks/useCompare'
import type { Favorites } from '../hooks/useFavorites'

const steps = [
  { icon: ClipboardCheck, title: 'Choisir', text: 'Filtrez par prix, année, kilométrage, couleur ou type de jantes.' },
  { icon: CalendarCheck, title: 'Essayer', text: 'Sélectionnez un véhicule et préparez une demande d’essai en quelques secondes.' },
  { icon: ShieldCheck, title: 'Repartir', text: 'Chaque annonce affiche clairement sa garantie, son historique et sa localisation.' },
]

export default function Home({ favorites, compare }: { favorites: Favorites; compare: Compare }) {
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
            <h2>Un parcours simple, sans surprise.</h2>
          </div>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span className="step-number">0{index + 1}</span>
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
