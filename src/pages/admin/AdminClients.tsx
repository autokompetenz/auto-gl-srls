import { useCallback, useEffect, useState } from 'react'
import { adminList } from '../../lib/admin'
import { apiFetch, errorMessage } from '../../lib/api'
import { formatDate } from '../../lib/format'
import type { User } from '../../types/features'

export default function AdminClients() {
  const [clients, setClients] = useState<User[]>([])
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      setClients(adminList<User>(await apiFetch<unknown>('/admin/clients')))
      setStatus('idle')
    } catch (caught) {
      setError(errorMessage(caught, 'Impossible de charger les clients.'))
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Clients</h2>
        <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={status === 'loading'}>
          {status === 'loading' ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>
      {error && <p className="form-status error" role="alert">{error}</p>}
      {status === 'loading' ? (
        <p className="form-status" role="status">Chargement des clients…</p>
      ) : clients.length ? (
        <div className="table-scroll">
          <table className="table-list">
            <thead><tr><th scope="col">Nom</th><th scope="col">E-mail</th><th scope="col">Rôle</th><th scope="col">Inscription</th></tr></thead>
            <tbody>
              {clients.map(client => (
                <tr key={client.id}>
                  <td><strong>{client.name}</strong></td>
                  <td>{client.email}</td>
                  <td><span className="status-badge small">{client.role === 'ADMIN' ? 'Administrateur' : 'Client'}</span></td>
                  <td>{formatDate(client.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="form-context">Aucun client renvoyé par l’API.</p>
      )}
    </div>
  )
}
