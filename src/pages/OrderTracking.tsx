import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import OrderDetail from '../components/OrderDetail'
import { apiFetch, errorMessage } from '../lib/api'
import type { OrderDTO } from '../types/features'

export default function OrderTracking({ orderNumber }: { orderNumber: string | null }) {
  const [number, setNumber] = useState(orderNumber ?? '')
  const [email, setEmail] = useState('')
  const [order, setOrder] = useState<OrderDTO | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    setNumber(orderNumber ?? '')
    setOrder(null)
    setStatus('idle')
    setError('')
  }, [orderNumber])

  const track = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!number.trim() || !email.trim()) {
      setStatus('error')
      setError('Renseignez le numéro de commande et l’adresse e-mail utilisée lors de la commande.')
      return
    }
    setStatus('loading')
    setError('')
    try {
      const found = await apiFetch<OrderDTO>('/orders/track', {
        method: 'POST',
        body: { orderNumber: number.trim(), email: email.trim() },
      })
      if (!found?.orderNumber) throw new Error('Commande introuvable.')
      setOrder(found)
      setStatus('idle')
    } catch (caught) {
      setOrder(null)
      setError(errorMessage(caught, 'Suivi indisponible pour le moment.'))
      setStatus('error')
    }
  }

  return (
    <div className="page shell tracking-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Suivi</p>
          <h1>Où en est votre commande ?</h1>
          <p>Indiquez le numéro de commande et l’e-mail utilisés lors de la commande.</p>
        </div>
      </div>

      <form className="tracking-form" onSubmit={event => void track(event)} noValidate>
        <div className="form-row">
          <label>Numéro de commande<input type="text" value={number} onChange={event => setNumber(event.target.value)} placeholder="AGL-…" required /></label>
          <label>Adresse e-mail<input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required /></label>
        </div>
        <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
          <Search size={17} aria-hidden="true" /> {status === 'loading' ? 'Recherche…' : 'Suivre la commande'}
        </button>
        {status === 'error' && <p className="form-status error" role="alert">{error}</p>}
      </form>

      {order ? (
        <section className="order-card" aria-label="Détail de la commande">
          <OrderDetail order={order} />
        </section>
      ) : (
        <p className="form-context">Les informations de suivi proviennent de l’API ; aucune commande n’est affichée sans vérification.</p>
      )}
    </div>
  )
}
