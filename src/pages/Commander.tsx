import { useState } from 'react'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useVehicles } from '../context/VehiclesContext'
import type { Navigate } from '../hooks/useRoute'
import { apiFetch, errorMessage } from '../lib/api'
import { formatEuro } from '../lib/format'
import type { OrderDTO } from '../types/features'

type FormValues = {
  customerName: string
  customerEmail: string
  customerPhone: string
  address: string
  postalCode: string
  city: string
  country: string
  notes: string
  purchaseType: string
  deliveryType: string
  paymentType: string
}

const initialValues: FormValues = {
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  address: '',
  postalCode: '',
  city: '',
  country: 'France',
  notes: '',
  purchaseType: 'ACHAT',
  deliveryType: 'LIVRAISON',
  paymentType: 'full',
}

export default function Commander({ id, navigate }: { id: string; navigate: Navigate }) {
  const { vehicleById, loading } = useVehicles()
  const [values, setValues] = useState<FormValues>(initialValues)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')
  const vehicle = vehicleById(id)

  const update = (field: keyof FormValues) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setValues(previous => ({ ...previous, [field]: event.target.value }))
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!vehicle) return
    if (values.customerName.trim().length < 2 || !values.customerEmail.trim() || values.address.trim().length < 3 || values.postalCode.trim().length < 2 || !values.city.trim()) {
      setError('Renseignez un nom complet, un e-mail, une adresse, un code postal et une ville valides.')
      setStatus('error')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.customerEmail.trim())) {
      setError('Vérifiez l’adresse e-mail saisie.')
      setStatus('error')
      return
    }

    setStatus('loading')
    setError('')
    try {
      const response = await apiFetch<{ order?: OrderDTO }>('/orders', {
        method: 'POST',
        body: {
          carId: vehicle.id,
          customerName: values.customerName.trim(),
          customerEmail: values.customerEmail.trim(),
          customerPhone: values.customerPhone.trim() || undefined,
          address: values.address.trim(),
          postalCode: values.postalCode.trim(),
          city: values.city.trim(),
          country: values.country.trim() || 'France',
          notes: values.notes.trim() || undefined,
          purchaseType: values.purchaseType,
          deliveryType: values.deliveryType,
          paymentType: values.paymentType,
        },
      })
      if (!response?.order?.orderNumber) throw new Error('La commande n’a pas pu être enregistrée.')
      navigate(`/commande-confirmee/${encodeURIComponent(response.order.orderNumber)}`)
    } catch (caught) {
      setError(errorMessage(caught, 'Commande indisponible pour le moment.'))
      setStatus('error')
    }
  }

  if (!vehicle && loading) {
    return (
      <div className="page shell empty-state">
        <p className="eyebrow">Chargement</p>
        <h1>Chargement du véhicule…</h1>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="page shell empty-state not-found">
        <p className="eyebrow">Véhicule introuvable</p>
        <h1>Ce véhicule n’est plus disponible.</h1>
        <p>Retrouvez les véhicules actuellement proposés dans le catalogue.</p>
        <a className="btn btn-primary" href="#/catalogue">Retour au catalogue</a>
      </div>
    )
  }

  return (
    <div className="page shell checkout-page">
      <a className="back-link" href={`#/vehicule/${encodeURIComponent(vehicle.id)}`}>
        <ArrowLeft size={17} aria-hidden="true" /> Retour au véhicule
      </a>
      <div className="page-head">
        <div>
          <p className="eyebrow">Commande</p>
          <h1>Finaliser votre commande.</h1>
          <p>Les informations sont transmises au serveur. La commande y est enregistrée avec un numéro de suivi.</p>
        </div>
      </div>

      <div className="checkout-layout">
        <form className="order-form" onSubmit={event => void submit(event)} noValidate>
          <fieldset className="form-grid">
            <legend>Vos coordonnées</legend>
            <label>Nom complet<input type="text" value={values.customerName} onChange={update('customerName')} autoComplete="name" required /></label>
            <label>E-mail<input type="email" value={values.customerEmail} onChange={update('customerEmail')} autoComplete="email" required /></label>
            <label>Téléphone <span className="optional">(facultatif)</span><input type="tel" value={values.customerPhone} onChange={update('customerPhone')} autoComplete="tel" /></label>
            <label>Pays<input type="text" value={values.country} onChange={update('country')} autoComplete="country-name" /></label>
          </fieldset>
          <fieldset className="form-grid">
            <legend>Adresse de livraison</legend>
            <label className="form-wide">Adresse<input type="text" value={values.address} onChange={update('address')} autoComplete="street-address" required /></label>
            <label>Code postal<input type="text" value={values.postalCode} onChange={update('postalCode')} autoComplete="postal-code" required /></label>
            <label>Ville<input type="text" value={values.city} onChange={update('city')} autoComplete="address-level2" required /></label>
          </fieldset>
          <fieldset className="form-grid">
            <legend>Options</legend>
            <label>Type d’achat
              <select value={values.purchaseType} onChange={update('purchaseType')}>
                <option value="ACHAT">Achat</option>
                <option value="LOCATION">Location</option>
              </select>
            </label>
            <label>Livraison
              <select value={values.deliveryType} onChange={update('deliveryType')}>
                <option value="LIVRAISON">Livraison</option>
                <option value="RETRAIT">Retrait</option>
              </select>
            </label>
            <label>Paiement
              <select value={values.paymentType} onChange={update('paymentType')}>
                <option value="full">Paiement intégral</option>
                <option value="deposit">Acompte</option>
                <option value="monthly">Mensualités</option>
              </select>
            </label>
            <label className="form-wide">Notes <span className="optional">(facultatif)</span>
              <textarea value={values.notes} onChange={update('notes')} rows={3} placeholder="Précisions sur la livraison ou le règlement…" />
            </label>
          </fieldset>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Enregistrement…' : 'Envoyer la commande'}
            </button>
            <a className="btn btn-ghost" href="#/catalogue">Annuler</a>
          </div>
          {status === 'error' && <p className="form-status error" role="alert">{error}</p>}
          <p className="form-context">
            <ShieldCheck size={15} aria-hidden="true" /> La commande est enregistrée côté serveur. Un e-mail sera envoyé si SMTP est configuré.
          </p>
        </form>

        <aside className="order-summary">
          <h2>Récapitulatif</h2>
          <img src={vehicle.image} alt={`${vehicle.name} ${vehicle.color}`} />
          <h3>{vehicle.name}</h3>
          <p>{vehicle.version} · {vehicle.year} · {vehicle.location}</p>
          <dl>
            <div><dt>Prix affiché</dt><dd>{formatEuro(vehicle.price)}</dd></div>
            <div><dt>Garantie</dt><dd>{vehicle.warranty}</dd></div>
          </dl>
          <p className="order-summary-note">Le montant définitif, les échéances et les coordonnées bancaires sont communiqués après validation de la commande par l’équipe.</p>
        </aside>
      </div>
    </div>
  )
}
