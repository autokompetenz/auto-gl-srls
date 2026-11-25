import { useCallback, useEffect, useState } from 'react'
import { adminRecord } from '../../lib/admin'
import { apiFetch, errorMessage } from '../../lib/api'
import type { BankInfo } from '../../types/features'

const emptyBank: BankInfo = { beneficiary: '', iban: '', bic: '', transferType: 'Virement' }

export default function AdminSettings() {
  const [bank, setBank] = useState<BankInfo>(emptyBank)
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    setMessage('')
    try {
      const response = await apiFetch<unknown>('/admin/bank')
      setBank(adminRecord<BankInfo>(response, ['bank', 'item', 'data']) ?? emptyBank)
      setStatus('idle')
    } catch (caught) {
      setMessage(errorMessage(caught, 'Coordonnées bancaires indisponibles.'))
      setIsError(true)
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage('')
    try {
      await apiFetch('/admin/bank', { method: 'PUT', body: bank })
      await load()
      setIsError(false)
      setMessage('Coordonnées bancaires enregistrées.')
    } catch (caught) {
      setIsError(true)
      setMessage(errorMessage(caught, 'Enregistrement indisponible.'))
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Paramètres</h2>
        <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={status === 'loading'}>
          {status === 'loading' ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>
      <form className="admin-form-card" onSubmit={event => void save(event)}>
        <h3>Coordonnées bancaires</h3>
        <p className="form-context">Ces informations sont enregistrées en base via cette page, renvoyées par l’API puis affichées au client une fois sa commande confirmée. Elles ne sont jamais lues depuis un fichier d’environnement.</p>
        <div className="form-grid">
          <label>Bénéficiaire<input type="text" value={bank.beneficiary} onChange={event => setBank({ ...bank, beneficiary: event.target.value })} /></label>
          <label>IBAN<input type="text" value={bank.iban} onChange={event => setBank({ ...bank, iban: event.target.value })} /></label>
          <label>BIC<input type="text" value={bank.bic} onChange={event => setBank({ ...bank, bic: event.target.value })} /></label>
          <label>Type de virement<input type="text" value={bank.transferType} onChange={event => setBank({ ...bank, transferType: event.target.value })} /></label>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>Enregistrer</button>
        </div>
        {message && <p className={isError ? 'form-status error' : 'form-status success'} role="status">{message}</p>}
      </form>
    </div>
  )
}
