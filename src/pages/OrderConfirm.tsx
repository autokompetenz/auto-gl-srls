import { CheckCircle2 } from 'lucide-react'

export default function OrderConfirm({ orderNumber }: { orderNumber: string }) {
  return (
    <div className="page shell order-confirm-page">
      <div className="order-confirm-card">
        <CheckCircle2 size={44} aria-hidden="true" />
        <p className="eyebrow">Commande enregistrée</p>
        <h1>Merci pour votre commande.</h1>
        <p>Votre commande est enregistrée côté serveur. Un e-mail sera envoyé si SMTP est configuré.</p>
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
  )
}
