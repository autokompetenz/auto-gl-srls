import { useCallback, useEffect, useState } from 'react'
import { adminList } from '../../lib/admin'
import { apiFetch, errorMessage } from '../../lib/api'
import { formatDate, formatEuro } from '../../lib/format'
import type { PaymentDTO } from '../../types/features'

type PaymentRow = PaymentDTO & { orderNumber?: string; customerName?: string }

const statuses = ['PENDING', 'COMPLETED', 'FAILED']

function flatten(payload: unknown): PaymentRow[] {
  const direct = adminList<PaymentRow>(payload)
  const flat = direct.flatMap(row => {
    const nested = (row as PaymentRow & { payments?: PaymentDTO[] }).payments
    return Array.isArray(nested) && nested.length
      ? nested.map(payment => ({ ...payment, orderNumber: row.orderNumber, customerName: row.customerName }))
      : [row]
  })
  return flat.filter(row => typeof row.id === 'string')
}

export default function AdminPayments() {
  const [payments, setPayments] = useState<PaymentRow[]>([])
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      setPayments(flatten(await apiFetch<unknown>('/admin/payments')))
      setStatus('idle')
    } catch (caught) {
      setError(errorMessage(caught, 'Impossible de charger les paiements.'))
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const update = async (payment: PaymentRow, nextStatus: string) => {
    setSavingId(payment.id)
    setError('')
    try {
      await apiFetch(`/admin/payments/${encodeURIComponent(payment.id)}`, {
        method: 'PATCH',
        body: { status: nextStatus },
      })
      await load()
    } catch (caught) {
      setError(errorMessage(caught, 'Changement de statut indisponible.'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Paiements</h2>
        <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={status === 'loading'}>
          {status === 'loading' ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>
      {error && <p className="form-status error" role="alert">{error}</p>}
      {status === 'loading' ? (
        <p className="form-status" role="status">Chargement des paiements…</p>
      ) : payments.length ? (
        <div className="table-scroll">
          <table className="table-list">
            <thead><tr><th scope="col">Référence</th><th scope="col">Commande</th><th scope="col">Échéance</th><th scope="col">Montant</th><th scope="col">Statut</th></tr></thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.id}>
                  <td><strong>{payment.installmentNumber ? `Échéance ${payment.installmentNumber}` : payment.type}</strong><small>{payment.id}</small></td>
                  <td>{payment.orderNumber || payment.customerName || '—'}</td>
                  <td>{formatDate(payment.dueDate)}</td>
                  <td>{formatEuro(payment.amount)}</td>
                  <td>
                    <select
                      value={payment.status}
                      disabled={savingId === payment.id}
                      onChange={event => void update(payment, event.target.value)}
                      aria-label={`Statut du paiement ${payment.id}`}
                    >
                      {statuses.map(item => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="form-context">Aucun paiement renvoyé par l’API.</p>
      )}
    </div>
  )
}
