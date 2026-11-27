import { useEffect, useState } from 'react'
import { Heart, Menu, X } from 'lucide-react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const accountLabel = user ? 'Compte' : 'Connexion'
  const isActive = (page: (typeof links)[number]['page']) => route.page === page

  // Le menu mobile se referme dès que la route change (navigation par hash).
  useEffect(() => setMenuOpen(false), [route])

  const close = () => setMenuOpen(false)

  return (
    <header className={menuOpen ? 'site-header nav-open' : 'site-header'}>
      <div className="shell header-inner">
        <a className="wordmark" href="#/" aria-label="AUTO GL SRLS — accueil" onClick={close}>
          AUTO GL{' '}<span className="wordmark-suffix">SRLS</span>
        </a>
        <nav id="main-navigation" className="main-nav" aria-label="Navigation principale">
          {links.map(link => (
            <a
              key={link.href}
              href={link.href}
              className={isActive(link.page) ? 'nav-link active' : 'nav-link'}
              aria-current={isActive(link.page) ? 'page' : undefined}
              onClick={close}
            >
              {link.label}
            </a>
          ))}
          <a
            href="#/connexion"
            className={route.page === 'account' || route.page === 'admin' ? 'nav-link active' : 'nav-link'}
            aria-current={route.page === 'account' ? 'page' : undefined}
            onClick={close}
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
        <button
          type="button"
          className="menu-toggle"
          aria-controls="main-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          onClick={() => setMenuOpen(open => !open)}
        >
          {menuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </div>
    </header>
  )
}
