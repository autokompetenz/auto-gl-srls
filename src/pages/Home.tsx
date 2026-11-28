import { ArrowRight, Search, MessageCircle, ClipboardCheck, CreditCard, ShieldCheck, Landmark, Wrench, Truck, Mail, Phone, MapPin, CarFront, RefreshCw, type LucideIcon } from 'lucide-react'
import VehicleCard from '../components/VehicleCard'
import { useVehicles } from '../context/VehiclesContext'
import type { Compare } from '../hooks/useCompare'
import type { Favorites } from '../hooks/useFavorites'

const steps: { icons: LucideIcon[]; title: string; text: string }[] = [
  {
    icons: [Search, MessageCircle],
    title: 'Sélection du véhicule',
    text: 'Parcourez notre catalogue en ligne ou contactez-nous. Filtrez par marque, modèle, prix et kilométrage. Chaque fiche inclut photos HD, historique complet et rapport d’inspection.',
  },
  {
    icons: [MessageCircle, Mail, Phone],
    title: 'Contact & Devis',
    text: 'Contactez-nous par WhatsApp, email ou téléphone. Nous vous envoyons un devis détaillé sous 24h avec toutes les options disponibles, frais inclus et conditions de financement.',
  },
  {
    icons: [ClipboardCheck, CreditCard],
    title: 'Contrat & Financement',
    text: 'Signature du bon de commande sécurisé. Si besoin, montage de votre dossier de financement avec nos partenaires bancaires. Réponse de principe sous 24h, taux compétitifs garantis.',
  },
  {
    icons: [ShieldCheck, Landmark],
    title: 'Paiement sécurisé',
    text: 'Virement bancaire sécurisé ou paiement par étapes selon accord. Reçu officiel émis immédiatement. Transparence totale : aucun frais caché, tout est clairement indiqué dans le contrat.',
  },
  {
    icons: [Wrench, Truck],
    title: 'Préparation du véhicule',
    text: 'Votre véhicule est soigneusement préparé : nettoyage professionnel intérieur/extérieur, vérification technique finale, plein de carburant, documentation complète prête à remettre.',
  },
  {
    icons: [Truck, MapPin],
    title: 'Livraison à domicile',
    text: 'Transport sécurisé jusqu’à votre porte partout dans le monde entier. Suivi en temps réel via numéro de commande. Livraison soignée, documents remis en main propre. Votre aventure commence !',
  },
]

const services: { icon: LucideIcon; badge: string; title: string; text: string }[] = [
  { icon: CarFront, badge: '2024 Models', title: 'Voitures Neuves', text: 'Derniers modèles, garantie constructeur, financement personnalisé.' },
  { icon: Wrench, badge: 'Certified', title: 'Voitures d’Occasion', text: 'Véhicules vérifiés, historique complet, garantie jusqu’à 36 mois.' },
  { icon: CreditCard, badge: 'Fast Approval', title: 'Financement Auto', text: 'Crédit sur mesure, taux avantageux, réponse en 24h.' },
  { icon: RefreshCw, badge: 'Best Value', title: 'Reprise & Échange', text: 'Reprise de votre véhicule actuel, estimation gratuite.' },
  { icon: ShieldCheck, badge: 'Full Coverage', title: 'Garantie & SAV', text: 'Garantie étendue, service après-vente, assistance 24/7.' },
  { icon: Truck, badge: 'Door to Door', title: 'Livraison & Transport', text: 'Livraison à domicile, transport sécurisé, partout dans le monde entier.' },
]

const faqs = [
  {
    question: 'Vos véhicules sont-ils garantis ?',
    answer: 'Oui, absolument. Chaque véhicule vendu est couvert par notre garantie AUTO GL SRLS d’au moins 12 mois ou 10 000 km, incluant la protection moteur et boîte de vitesse. Des extensions jusqu’à 36 mois sont disponibles à la commande.',
  },
  {
    question: 'Proposez-vous du financement ?',
    answer: 'Oui. Nous étudions votre projet avec nos partenaires bancaires et vous présentons une réponse de principe sous 24h, avec des taux compétitifs et des conditions clairement expliquées avant signature.',
  },
  {
    question: 'Comment fonctionne la livraison ?',
    answer: 'Nous organisons un transport sécurisé jusqu’à votre domicile, partout dans le monde entier. Vous recevez un numéro de commande pour suivre chaque étape, et les documents sont remis en main propre lors de la livraison.',
  },
  {
    question: 'Puis-je reprendre mon ancien véhicule ?',
    answer: 'Oui. Transmettez-nous les informations de votre véhicule actuel via le formulaire de contact : nous vous envoyons une estimation gratuite et sans engagement, puis nous vous proposons une reprise ou un échange.',
  },
  {
    question: 'Les véhicules ont-ils été accidentés ?',
    answer: 'Chaque fiche présente l’historique connu et le rapport d’inspection. Les éléments importants sont indiqués avant la commande, afin que vous sachiez exactement ce que vous achetez.',
  },
  {
    question: 'Comment puis-je suivre ma commande ?',
    answer: 'Rendez-vous sur la page « Suivre une commande », puis saisissez votre numéro de commande et l’adresse email utilisée lors de l’achat. Vous recevez également chaque étape par email.',
  },
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
            <div><dt>12 mois</dt><dd>garantie minimale</dd></div>
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
            <h2>De la sélection<br />à la livraison</h2>
            <p className="steps-lead">Un processus simple et transparent, du choix du véhicule jusqu’à sa livraison chez vous.</p>
          </div>
        </div>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <article className="step-card" key={step.title}>
              <span className="step-number">Step {String(index + 1).padStart(2, '0')}</span>
              <div className="step-icons">
                {step.icons.map((Icon, iconIndex) => (
                  <Icon key={iconIndex} size={23} aria-hidden="true" />
                ))}
              </div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section services-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Nos Services</p>
            <h2>Ce que nous faisons pour vous</h2>
            <p className="services-lead">De la voiture neuve à l’occasion, votre partenaire pour trouver la perle rare.</p>
          </div>
        </div>
        <div className="services-grid">
          {services.map(service => (
            <article className="service-card" key={service.title}>
              <span className="service-badge">{service.badge}</span>
              <div className="service-icon"><service.icon size={23} aria-hidden="true" /></div>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="shell section faq-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Pourquoi nous choisir ?</p>
            <h2>Vos questions, nos réponses</h2>
            <p className="faq-lead">Tout ce que vous devez savoir avant de passer commande. Une question ? Notre équipe est disponible 24/7.</p>
          </div>
        </div>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <details className="faq-item" key={faq.question} open={index === 0}>
              <summary>
                <span className="faq-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="faq-question">{faq.question}</span>
              </summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
