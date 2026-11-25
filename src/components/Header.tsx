import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import type { Route } from '../hooks/useRoute'

const links = [
  { href: '#/', label: 'Accueil', page: 'home' },
  { href: '#/catalogue', label: 'Catalogue', page: 'catalogue' },
  { href: '#/comparateur', label: 'Comparateur', page: 'compare' },
  { href: '#/simulation', label: 'Simulation', page: 'simulation' },
  { href: '#/suivi', label: 'Suivi', page: 'tracking' },
  { href: '#/mes-commandes', label: 'Mes commandes', page: 'my-orders' },
  { href: '#/favoris', label: 'Favoris', page: 'favorites' },
  { href: '#/contact', label: 'Contact', page: 'contact' },
] as const

export default function Header({ route, favoritesCount, compareCount }: { route: Route; favoritesCount: number; compareCount: number }) {
  const { user } = useAuth()
  const accountLabel = user ? 'Compte' : 'Connexion'
  const isActive = (page: (typeof links)[number]['page']) => route.page === page

  return (
    <header className="site-header">
      <div className="shell header-inner">
        <a className="wordmark" href="#/" aria-label="AUTO GL SRLS — accueil">
          AUTO GL{' '}<span className="wordmark-suffix">SRLS</span>
        </a>
        <nav className="main-nav" aria-label="Navigation principale">
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={isActive(link.page) ? 'nav-link active' : 'nav-link'}
              aria-current={isActive(link.page) ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#/connexion"
            className={route.page === 'account' || route.page === 'admin' ? 'nav-link active' : 'nav-link'}
            aria-current={route.page === 'account' ? 'page' : undefined}
          >
            {accountLabel}
          </a>
        </nav>
        <div className="header-counters">
          <a
            className="compare-counter"
            href="#/comparateur"
            aria-label={`${compareCount} véhicule${compareCount > 1 ? 's' : ''} à comparer`}
          >
            <span aria-hidden="true">⇄</span>
            <span>{compareCount}</span>
          </a>
          <a className="favorites-counter" href="#/favoris" aria-label={`${favoritesCount} véhicule${favoritesCount > 1 ? 's' : ''} en favoris`}>
            <Heart size={17} aria-hidden="true" />
            <span>{favoritesCount}</span>
          </a>
        </div>
      </div>
    </header>
  )
}
