import { useEffect, useState } from 'react'
import { apiFetch, errorMessage } from '../lib/api'
import { formatDate, formatEuro } from '../lib/format'
import type { BankInfo, OrderDTO, OrderStatus, PaymentDTO } from '../types/features'
import { T } from '../i18n'

const statusLabels: Record<string, string> = {
  PENDING: 'En attente de validation',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
}

const paymentLabels: Record<string, string> = {
  PENDING: 'En attente',
  COMPLETED: 'Payé',
  FAILED: 'Échec',
}

const planLabels: Record<string, string> = {
  full: 'Paiement intégral',
  deposit: 'Acompte',
  monthly: 'Mensualités',
}

function paymentRowLabel(payment: PaymentDTO): string {
  if (payment.installmentType === 'FULL') return 'Paiement intégral'
  if (payment.installmentType === 'MONTHLY') return 'Mensualité'
  if (payment.installmentNumber === 1) return 'Acompte'
  return 'Solde à la livraison'
}

const steps: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Commande reçue' },
  { status: 'CONFIRMED', label: 'Confirmée' },
  { status: 'PROCESSING', label: 'Préparation' },
  { status: 'SHIPPED', label: 'Expédition' },
  { status: 'DELIVERED', label: 'Livraison' },
]

export const isOrderConfirmed = (status: OrderStatus): boolean =>
  status === 'CONFIRMED' || status === 'PROCESSING' || status === 'SHIPPED' || status === 'DELIVERED'

export function statusLabel(status: string): string {
  return statusLabels[status] ?? status
}

export default function OrderDetail({ order }: { order: OrderDTO }) {
  const [bank, setBank] = useState<BankInfo | null>(null)
  const [bankError, setBankError] = useState('')
  const showBank = isOrderConfirmed(order.status)
  const currentStep = steps.findIndex(step => step.status === order.status)

  useEffect(() => {
    if (!showBank) return
    let active = true
    apiFetch<BankInfo | { bank?: BankInfo }>('/bank')
      .then(payload => {
        if (!active) return
        const info = payload && 'bank' in payload ? payload.bank ?? null : payload as BankInfo | null
        setBank(info)
      })
      .catch(caught => {
        if (active) setBankError(errorMessage(caught, 'Coordonnées bancaires indisponibles.'))
      })
    return () => { active = false }
  }, [showBank, order.id])

  return (
    <T>
    <div className="order-detail">
      <div className="order-detail-head">
        <div>
          <p className="eyebrow">Suivi de commande</p>
          <h2>{order.orderNumber}</h2>
          <p>Passée le {formatDate(order.createdAt)}</p>
        </div>
        <span className={order.status === 'CANCELLED' ? 'status-badge cancelled' : 'status-badge'}>
          {statusLabel(order.status)}
        </span>
      </div>

      <ol className="stepper" aria-label="Étapes de la commande">
        {steps.map((step, index) => {
          const state = order.status === 'CANCELLED' ? 'todo' : index < currentStep ? 'done' : index === currentStep ? 'current' : 'todo'
          return (
            <li key={step.status} className={`stepper-step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="stepper-dot" aria-hidden="true">{index + 1}</span>
              <span>{step.label}</span>
            </li>
          )
        })}
      </ol>
      {order.status === 'CANCELLED' && <p className="form-status error" role="status">Cette commande a été annulée.</p>}

      <div className="order-sections">
        <section className="order-section">
          <h3>Véhicules commandés</h3>
          <ul className="order-items">
            {order.items.map((item, index) => (
              <li key={`${item.vehicleId ?? 'item'}-${index}`}>
                <img src={item.image} alt="" loading="lazy" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.version} · quantité {item.quantity}</span>
                </div>
                <b>{formatEuro(item.unitPrice)}</b>
              </li>
            ))}
          </ul>
        </section>

        <section className="order-section">
          <h3>Récapitulatif financier</h3>
          <dl className="order-finance">
            <div><dt>Prix du véhicule</dt><dd>{formatEuro(order.totalPrice)}</dd></div>
            {order.discountAmount > 0 && <div><dt>Remise</dt><dd>-{formatEuro(order.discountAmount)}</dd></div>}
            <div><dt>Montant à payer</dt><dd>{formatEuro(order.amountDue ?? order.totalPrice)}</dd></div>
            {order.depositAmount > 0 && <div><dt>Acompte</dt><dd>{formatEuro(order.depositAmount)}</dd></div>}
            {order.monthlyAmount > 0 && <div><dt>Mensualité</dt><dd>{`${formatEuro(order.monthlyAmount)} sur ${order.monthlyDuration} mois`}</dd></div>}
            {order.balanceAmount > 0 && order.monthlyAmount === 0 && <div><dt>Solde à la livraison</dt><dd>{formatEuro(order.balanceAmount)}</dd></div>}
            <div><dt>Référence de paiement</dt><dd>{order.paymentReference || '—'}</dd></div>
          </dl>
        </section>

        <section className="order-section">
          <h3>Échéancier</h3>
          {order.payments.length ? (
            <div className="table-scroll">
              <table className="table-list">
                <thead><tr><th scope="col">Échéance</th><th scope="col">Type</th><th scope="col">Montant</th><th scope="col">Statut</th></tr></thead>
                <tbody>
                  {order.payments.map(payment => (
                    <tr key={payment.id}>
                      <td>
                        {formatDate(payment.dueDate)}
                        {payment.installmentNumber ? <small> · échéance {payment.installmentNumber}</small> : null}
                      </td>
                      <td>{paymentRowLabel(payment)}</td>
                      <td>{formatEuro(payment.amount)}</td>
                      <td><span className="status-badge small">{paymentLabels[payment.status] ?? payment.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="form-context">Aucun paiement prévu pour le moment.</p>
          )}
        </section>

        <section className="order-section">
          <h3>Historique</h3>
          <ol className="order-history">
            {order.tracking.map((entry, index) => (
              <li key={`${entry.createdAt}-${index}`}>
                <span className="status-badge small">{statusLabel(entry.status)}</span>
                <span>{entry.note || 'Aucune note'}</span>
                <time dateTime={entry.createdAt}>{formatDate(entry.createdAt)}</time>
              </li>
            ))}
          </ol>
        </section>

        <section className="order-section">
          <h3>Coordonnées</h3>
          <p>{order.customerName}<br />{order.address}, {order.postalCode} {order.city}<br />{order.customerEmail}{order.customerPhone ? ` · ${order.customerPhone}` : ''}</p>
          <p className="form-context">Mode de livraison : {order.deliveryType === 'RETRAIT' ? 'Retrait' : 'Livraison'} · paiement : {planLabels[order.paymentType] ?? order.paymentType}.</p>
        </section>

        {showBank && (
          <section className="order-section bank-card">
            <h3>Virement bancaire</h3>
            {bank ? (
              <dl>
                <div><dt>Bénéficiaire</dt><dd>{bank.beneficiary}</dd></div>
                <div><dt>IBAN</dt><dd>{bank.iban}</dd></div>
                <div><dt>BIC</dt><dd>{bank.bic}</dd></div>
                <div><dt>Type de virement</dt><dd>{bank.transferType}</dd></div>
              </dl>
            ) : (
              <p className="form-status">{bankError || 'Chargement des coordonnées bancaires…'}</p>
            )}
          </section>
        )}
      </div>
    </div>
    </T>
  )
}
