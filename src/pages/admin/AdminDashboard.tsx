import { useCallback, useEffect, useState } from 'react'
import { adminRecord } from '../../lib/admin'
import { apiFetch, errorMessage } from '../../lib/api'
import type { AdminStats } from '../../types/features'

const metrics: { key: keyof AdminStats; label: string }[] = [
  { key: 'totalCars', label: 'Véhicules' },
  { key: 'totalOrders', label: 'Commandes' },
  { key: 'pendingOrders', label: 'Commandes en attente' },
  { key: 'totalClients', label: 'Clients' },
  { key: 'totalRevenue', label: 'Chiffre d’affaires' },
  { key: 'activeAlerts', label: 'Alertes actives' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const response = await apiFetch<unknown>('/admin/stats')
      setStats(adminRecord<AdminStats>(response))
      setStatus('idle')
    } catch (caught) {
      setError(errorMessage(caught, 'Statistiques indisponibles.'))
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Statistiques</h2>
        <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={status === 'loading'}>
          {status === 'loading' ? 'Chargement…' : 'Actualiser'}
        </button>
      </div>
      {status === 'error' && <p className="form-status error" role="alert">{error}</p>}
      {status === 'loading' ? (
        <p className="form-status" role="status">Chargement des statistiques…</p>
      ) : (
        <div className="admin-metrics">
          {metrics.map(metric => {
            const value = stats?.[metric.key]
            return (
              <article className="admin-metric" key={metric.key}>
                <span>{metric.label}</span>
                <strong>{typeof value === 'number' ? value.toLocaleString('fr-FR') : '—'}</strong>
              </article>
            )
          })}
        </div>
      )}
      <nav className="admin-quick-links" aria-label="Accès rapide">
        <a className="btn btn-ghost" href="/admin/vehicules">Gérer les véhicules</a>
        <a className="btn btn-ghost" href="/admin/commandes">Traiter les commandes</a>
        <a className="btn btn-ghost" href="/admin/parametres">Coordonnées bancaires</a>
      </nav>
    </div>
  )
}
