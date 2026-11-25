import { useCallback, useEffect, useState } from 'react'
import { ChevronRight, PackageOpen } from 'lucide-react'
import OrderDetail from '../components/OrderDetail'
import { useAuth } from '../context/AuthContext'
import { apiFetch, errorMessage } from '../lib/api'
import { formatDate, formatEuro } from '../lib/format'
import { statusLabel } from '../components/OrderDetail'
import type { OrderDTO } from '../types/features'

export default function MyOrders() {
  const { token } = useAuth()
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setStatus('loading')
    setError('')
    try {
      const response = await apiFetch<OrderDTO[] | { items?: OrderDTO[] }>('/orders/my')
      const list = Array.isArray(response) ? response : response?.items ?? []
      setOrders(list)
      setStatus('idle')
    } catch (caught) {
      setError(errorMessage(caught, 'Impossible de charger vos commandes.'))
      setStatus('error')
    }
  }, [token])

  useEffect(() => {
    if (token) void load()
  }, [token, load])

  if (!token) {
    return (
      <div className="page shell empty-state">
        <PackageOpen size={32} aria-hidden="true" />
        <h1>Connectez-vous pour voir vos commandes.</h1>
        <p>Vos commandes sont associées à votre compte. Le suivi sans compte reste possible avec le numéro et l’e-mail de commande.</p>
        <div className="form-actions">
          <a className="btn btn-primary" href="#/connexion">Se connecter</a>
          <a className="btn btn-ghost" href="#/suivi">Suivre une commande</a>
        </div>
      </div>
    )
  }

  const active = orders.find(order => order.id === selected)

  return (
    <div className="page shell my-orders-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Votre compte</p>
          <h1>Mes commandes.</h1>
          <p>Retrouvez les commandes liées à votre compte et leur état d’avancement.</p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={status === 'loading'}>
          {status === 'loading' ? 'Actualisation…' : 'Actualiser'}
        </button>
      </div>

      {status === 'error' && (
        <div className="form-status error" role="alert">
          <p>{error}</p>
          <button type="button" className="btn btn-ghost" onClick={() => void load()}>Réessayer</button>
        </div>
      )}

      {orders.length ? (
        <div className="order-list">
          {orders.map(order => (
            <article className="order-list-item" key={order.id}>
              <div>
                <p className="eyebrow">{formatDate(order.createdAt)}</p>
                <h2>{order.orderNumber}</h2>
                <p>{order.items.map(item => item.name).join(', ')}</p>
              </div>
              <span className="status-badge">{statusLabel(order.status)}</span>
              <strong>{formatEuro(order.totalPrice)}</strong>
              <button type="button" className="btn btn-ghost" onClick={() => setSelected(selected === order.id ? null : order.id)} aria-expanded={selected === order.id}>
                Détail <ChevronRight size={16} aria-hidden="true" />
              </button>
            </article>
          ))}
        </div>
      ) : status === 'idle' ? (
        <div className="empty-state">
          <PackageOpen size={30} aria-hidden="true" />
          <h2>Aucune commande pour le moment.</h2>
          <p>Vos commandes apparaîtront ici dès qu’elles seront enregistrées.</p>
          <a className="btn btn-primary" href="#/catalogue">Découvrir le catalogue</a>
        </div>
      ) : null}

      {active && (
        <section className="order-card" aria-label={`Commande ${active.orderNumber}`}>
          <OrderDetail order={active} />
        </section>
      )}
    </div>
  )
}
