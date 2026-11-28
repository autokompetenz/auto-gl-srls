import { useCallback, useEffect, useState } from 'react'
import { BellOff, CheckCircle2, Trash2 } from 'lucide-react'
import type { Navigate } from '../hooks/useRoute'
import { T, useLocale } from '../i18n'
import { describeFilters } from '../lib/alerts'
import { apiFetch, errorMessage } from '../lib/api'
import { formatDate } from '../lib/format'
import type { AlertDTO } from '../types/features'

export default function AlertManage({ token, navigate }: { token: string; navigate: Navigate }) {
  const { t } = useLocale()
  const [alert, setAlert] = useState<AlertDTO | null>(null)
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [error, setError] = useState('')
  const path = `/alerts/${encodeURIComponent(token)}`

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const response = await apiFetch<AlertDTO | { alert?: AlertDTO }>(path)
      const found = response && 'alert' in response ? response.alert ?? null : response as AlertDTO | null
      if (!found) throw new Error('Alerte introuvable.')
      setAlert(found)
      setStatus('idle')
    } catch (caught) {
      setAlert(null)
      setError(errorMessage(caught, 'Impossible de charger cette alerte.'))
      setStatus('error')
    }
  }, [path])

  useEffect(() => { void load() }, [load])

  const toggle = async () => {
    if (!alert) return
    try {
      const response = await apiFetch<AlertDTO | { alert?: AlertDTO }>(path, {
        method: 'PATCH',
        body: { active: !alert.active },
      })
      const updated = response && 'alert' in response ? response.alert ?? null : response as AlertDTO | null
      if (updated) setAlert(updated)
      else await load()
    } catch (caught) {
      setError(errorMessage(caught, 'Mise à jour indisponible.'))
    }
  }

  const remove = async () => {
    if (!window.confirm(t('Supprimer définitivement cette alerte ?'))) return
    try {
      await apiFetch(path, { method: 'DELETE' })
      navigate('/catalogue')
    } catch (caught) {
      setError(errorMessage(caught, 'Suppression indisponible.'))
    }
  }

  return (
    <T>
    <div className="page shell alert-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Gestion d’alerte</p>
          <h1>Votre alerte de recherche.</h1>
          <p>Cette page utilise le lien privé que vous avez reçu : aucun mot de passe n’est demandé.</p>
        </div>
      </div>

      {status === 'loading' && <p className="form-status" role="status">Chargement de l’alerte…</p>}
      {status === 'error' && (
        <div className="empty-state">
          <BellOff size={30} aria-hidden="true" />
          <h2>Alerte indisponible.</h2>
          <p>{error}</p>
          <button type="button" className="btn btn-primary" onClick={() => void load()}>Réessayer</button>
        </div>
      )}
      {status === 'idle' && alert && (
        <div className="alert-card">
          <div className="alert-card-head">
            <div>
              <h2>{alert.name || 'Alerte sans nom'}</h2>
              <p>{alert.email} · créée le {formatDate(alert.createdAt)}</p>
            </div>
            <span className={alert.active ? 'status-badge' : 'status-badge cancelled'}>
              {alert.active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <ul className="filter-chips" aria-label="Critères de l’alerte">
            {describeFilters(alert.filters ?? {}).map(chip => (
              <li key={chip.key}>{chip.label} : {chip.value}</li>
            ))}
          </ul>
          <p className="form-context">Véhicules signalés jusqu’ici : {alert.notifiedCount ?? 0}</p>
          {error && <p className="form-status error" role="alert">{error}</p>}
          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={() => void toggle()}>
              <CheckCircle2 size={16} aria-hidden="true" /> {alert.active ? 'Désactiver' : 'Réactiver'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void remove()}>
              <Trash2 size={16} aria-hidden="true" /> Supprimer l’alerte
            </button>
            <a className="btn btn-ghost" href="/catalogue">Retour au catalogue</a>
          </div>
        </div>
      )}
    </div>
    </T>
  )
}
