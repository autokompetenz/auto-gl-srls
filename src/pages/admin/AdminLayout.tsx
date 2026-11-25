import { LogOut } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { AdminSection } from '../../hooks/useRoute'

type Item = { section: AdminSection; href: string; label: string }

const items: Item[] = [
  { section: 'dashboard', href: '#/admin', label: 'Tableau de bord' },
  { section: 'vehicles', href: '#/admin/vehicules', label: 'Véhicules' },
  { section: 'orders', href: '#/admin/commandes', label: 'Commandes' },
  { section: 'clients', href: '#/admin/clients', label: 'Clients' },
  { section: 'payments', href: '#/admin/paiements', label: 'Paiements' },
  { section: 'settings', href: '#/admin/parametres', label: 'Paramètres' },
]

export default function AdminLayout({ section, children }: { section: AdminSection; children: React.ReactNode }) {
  const { user, logout } = useAuth()

  return (
    <div className="page shell admin-layout">
      <div className="admin-head">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Espace AUTO GL SRLS.</h1>
          <p>{user?.name} · {user?.email}</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={logout}>
          <LogOut size={16} aria-hidden="true" /> Déconnexion
        </button>
      </div>
      <div className="admin-body">
        <nav className="admin-nav" aria-label="Navigation administration">
          {items.map(item => (
            <a
              key={item.section}
              href={item.href}
              className={section === item.section ? 'admin-nav-link active' : 'admin-nav-link'}
              aria-current={section === item.section ? 'page' : undefined}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <section className="admin-content" aria-label="Contenu administration">
          {children}
        </section>
      </div>
    </div>
  )
}
