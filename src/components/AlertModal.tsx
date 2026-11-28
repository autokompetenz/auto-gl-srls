import { useEffect, useRef, useState } from 'react'
import { BellRing, CheckCircle2, X } from 'lucide-react'
import { describeFilters } from '../lib/alerts'
import { apiFetch, errorMessage } from '../lib/api'
import type { AlertFilters } from '../types/features'

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function AlertModal({
  open,
  onClose,
  filters,
}: {
  open: boolean
  onClose: () => void
  filters: AlertFilters
}) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [existing, setExisting] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const chips = describeFilters(filters)

  useEffect(() => {
    if (!open) return
    emailRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setStatus('error')
      setError('Renseignez une adresse e-mail valide.')
      return
    }
    setStatus('loading')
    setError('')
    try {
      const response = await apiFetch<{ token?: string; existing?: boolean }>('/alerts', {
        method: 'POST',
        body: { email: email.trim(), name: name.trim() || undefined, filters },
      })
      if (!response?.token) throw new Error('L’alerte n’a pas pu être créée.')
      setToken(response.token)
      setExisting(Boolean(response.existing))
      setStatus('done')
    } catch (caught) {
      setError(errorMessage(caught, 'Création d’alerte indisponible.'))
      setStatus('error')
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="alert-modal-title">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer">
          <X size={18} aria-hidden="true" />
        </button>
        {status === 'done' ? (
          <>
            <CheckCircle2 size={34} aria-hidden="true" />
            <h2 id="alert-modal-title">Alerte enregistrée</h2>
            <p>{existing ? 'Cette alerte existait déjà : son lien de gestion est inchangé.' : 'Votre alerte a été créée.'} Vous recevrez un e-mail avec le lien pour la gérer.</p>
            <a className="btn btn-primary" href={`/alerte/${encodeURIComponent(token)}`}>Gérer mon alerte</a>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Fermer</button>
          </>
        ) : (
          <>
            <BellRing size={30} aria-hidden="true" />
            <h2 id="alert-modal-title">Créer une alerte</h2>
            <p>Vous recevrez une notification si un véhicule correspond à ces critères.</p>
            <ul className="filter-chips" aria-label="Critères de recherche">
              {chips.length ? chips.map(chip => (
                <li key={chip.key}>{chip.label} : {chip.value}</li>
              )) : <li>Tous les véhicules</li>}
            </ul>
            <form className="modal-form" onSubmit={event => void submit(event)} noValidate>
              <label>Votre e-mail
                <input ref={emailRef} type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required />
              </label>
              <label>Nom <span className="optional">(facultatif)</span>
                <input type="text" value={name} onChange={event => setName(event.target.value)} autoComplete="name" />
              </label>
              <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Enregistrement…' : 'Créer l’alerte'}
              </button>
              {status === 'error' && <p className="form-status error" role="alert">{error}</p>}
            </form>
          </>
        )}
      </div>
    </div>
  )
}
