import { useCallback, useEffect, useState } from 'react'
import { adminList } from '../../lib/admin'
import { apiFetch, errorMessage } from '../../lib/api'
import { formatDate, formatEuro } from '../../lib/format'
import { statusLabel } from '../../components/OrderDetail'
import type { OrderDTO, OrderStatus } from '../../types/features'
import { T } from '../../i18n'

const statuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

type Draft = { id: string; status: OrderStatus; note: string }

export default function AdminOrders() {
  const [orders, setOrders] = useState<OrderDTO[]>([])
  const [draft, setDraft] = useState<Draft | null>(null)
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      setOrders(adminList<OrderDTO>(await apiFetch<unknown>('/admin/orders')))
      setStatus('idle')
    } catch (caught) {
      setError(errorMessage(caught, 'Impossible de charger les commandes.'))
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft) return
    try {
      await apiFetch(`/admin/orders/${encodeURIComponent(draft.id)}`, {
        method: 'PATCH',
        body: { status: draft.status, note: draft.note.trim() || undefined },
      })
      setDraft(null)
      await load()
    } catch (caught) {
      setError(errorMessage(caught, 'Mise à jour indisponible.'))
    }
  }

  return (
    <T>
      <div className="admin-panel">
        <div className="admin-panel-head">
          <h2>Commandes</h2>
          <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={status === 'loading'}>
            {status === 'loading' ? 'Chargement…' : 'Actualiser'}
          </button>
        </div>
        {error && <p className="form-status error" role="alert">{error}</p>}

        {draft && (
          <form className="admin-form-card" onSubmit={event => void save(event)}>
            <h3>Modifier {draft.id}</h3>
            <div className="form-grid">
              <label>Statut
                <select value={draft.status} onChange={event => setDraft({ ...draft, status: event.target.value as OrderStatus })}>
                  {statuses.map(item => <option key={item} value={item}>{statusLabel(item)}</option>)}
                </select>
              </label>
              <label>Note de suivi
                <input type="text" value={draft.note} onChange={event => setDraft({ ...draft, note: event.target.value })} placeholder="Information ajoutée à l’historique" />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">Enregistrer</button>
              <button type="button" className="btn btn-ghost" onClick={() => setDraft(null)}>Annuler</button>
            </div>
          </form>
        )}

        {status === 'loading' ? (
          <p className="form-status" role="status">Chargement des commandes…</p>
        ) : orders.length ? (
          <div className="table-scroll">
            <table className="table-list">
              <thead><tr><th scope="col">Commande</th><th scope="col">Client</th><th scope="col">Total</th><th scope="col">Statut</th><th scope="col">Action</th></tr></thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id}>
                    <td><strong>{order.orderNumber}</strong><small>{formatDate(order.createdAt)}</small></td>
                    <td>{order.customerName}<small>{order.customerEmail}</small></td>
                    <td>{formatEuro(order.totalPrice)}</td>
                    <td><span className="status-badge small">{statusLabel(order.status)}</span></td>
                    <td>
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => setDraft({ id: order.id, status: order.status, note: '' })}
                      >
                        Modifier le statut
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="form-context">Aucune commande renvoyée par l’API.</p>
        )}
      </div>
    </T>
  )
}
