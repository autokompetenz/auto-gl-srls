import { useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { apiFetch, errorMessage } from '../lib/api'

type Status = { kind: 'idle' | 'error' | 'success'; message: string }

export default function ContactForm({ vehicleLabel }: { vehicleLabel?: string }) {
  const [values, setValues] = useState({ name: '', email: '', phone: '', message: '' })
  const [status, setStatus] = useState<Status>({ kind: 'idle', message: '' })

  const update = (field: keyof typeof values) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues(previous => ({ ...previous, [field]: event.target.value }))
    if (status.kind !== 'idle') setStatus({ kind: 'idle', message: '' })
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!values.name.trim() || !values.email.trim() || !values.message.trim()) {
      setStatus({ kind: 'error', message: 'Renseignez votre nom, votre e-mail et votre message.' })
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      setStatus({ kind: 'error', message: 'Vérifiez l’adresse e-mail saisie.' })
      return
    }
    try {
      await apiFetch<{ ok?: boolean }>('/leads', {
        method: 'POST',
        body: {
          name: values.name.trim(),
          email: values.email.trim(),
          phone: values.phone.trim() || undefined,
          message: vehicleLabel ? `${values.message.trim()} (véhicule : ${vehicleLabel})` : values.message.trim(),
        },
      })
      setStatus({
        kind: 'success',
        message: vehicleLabel
          ? `Demande enregistrée pour ${vehicleLabel}. Un e-mail sera envoyé si SMTP est configuré.`
          : 'Demande enregistrée. Un e-mail sera envoyé si SMTP est configuré.',
      })
      setValues({ name: '', email: '', phone: '', message: '' })
    } catch (caught) {
      setStatus({ kind: 'error', message: errorMessage(caught, 'Envoi indisponible pour le moment.') })
    }
  }

  return (
    <form className="contact-form" onSubmit={event => void submit(event)} noValidate>
      {vehicleLabel && <p className="form-context">À propos de : <span>{vehicleLabel}</span></p>}
      <div className="form-row">
        <label>
          Nom
          <input type="text" value={values.name} onChange={update('name')} autoComplete="name" placeholder="Camille Martin" />
        </label>
        <label>
          E-mail
          <input type="email" value={values.email} onChange={update('email')} autoComplete="email" placeholder="camille@exemple.fr" />
        </label>
      </div>
      <label>
        Téléphone <span className="optional">(facultatif)</span>
        <input type="tel" value={values.phone} onChange={update('phone')} autoComplete="tel" placeholder="06 12 34 56 78" />
      </label>
      <label>
        Message
        <textarea value={values.message} onChange={update('message')} rows={4} placeholder="Je souhaite être rappelé pour organiser un essai…" />
      </label>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary">
          Envoyer la demande <ArrowRight size={17} aria-hidden="true" />
        </button>
        <p className={`form-status ${status.kind}`} role="status" aria-live="polite">
          {status.kind === 'success' && <CheckCircle2 size={16} aria-hidden="true" />}
          {status.message}
        </p>
      </div>
    </form>
  )
}
