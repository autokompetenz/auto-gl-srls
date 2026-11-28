import { CheckCircle2 } from 'lucide-react'
import { T } from '../i18n'

export default function OrderConfirm({ orderNumber }: { orderNumber: string }) {
  return (
    <T>
    <div className="page shell order-confirm-page">
      <div className="order-confirm-card">
        <CheckCircle2 size={44} aria-hidden="true" />
        <p className="eyebrow">Commande enregistrée</p>
        <h1>Merci pour votre commande.</h1>
        <p>Votre commande a bien été enregistrée. Un e-mail de confirmation vous sera adressé.</p>
        <div className="order-number-block">
          <span>Numéro de commande</span>
          <strong>{orderNumber}</strong>
        </div>
        <p className="form-context">Conservez ce numéro : il permet de suivre l’avancement de votre commande avec votre adresse e-mail.</p>
        <div className="form-actions">
          <a className="btn btn-primary" href={`/suivi/${encodeURIComponent(orderNumber)}`}>Suivre ma commande</a>
          <a className="btn btn-ghost" href="/catalogue">Retour au catalogue</a>
        </div>
      </div>
    </div>
    </T>
  )
}
