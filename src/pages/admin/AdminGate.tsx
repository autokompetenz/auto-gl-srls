import { useEffect, useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { AdminSection } from '../../hooks/useRoute'
import { errorMessage } from '../../lib/api'
import AdminLayout from './AdminLayout'
import AdminCars from './AdminCars'
import AdminClients from './AdminClients'
import AdminDashboard from './AdminDashboard'
import AdminOrders from './AdminOrders'
import AdminPayments from './AdminPayments'
import AdminSettings from './AdminSettings'

function Section({ section }: { section: AdminSection }) {
  if (section === 'vehicles') return <AdminCars />
  if (section === 'orders') return <AdminOrders />
  if (section === 'clients') return <AdminClients />
  if (section === 'payments') return <AdminPayments />
  if (section === 'settings') return <AdminSettings />
  return <AdminDashboard />
}

export default function AdminGate({ section }: { section: AdminSection }) {
  const { user, token, refresh, loginAdminCode, logout } = useAuth()
  const [checking, setChecking] = useState(Boolean(token))
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!token) {
      setChecking(false)
      return
    }
    setChecking(true)
    void refresh().then(verified => {
      if (!active) return
      setChecking(false)
      if (verified?.role !== 'ADMIN') logout()
    })
    return () => { active = false }
  }, [token, refresh, logout])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!code.trim()) {
      setStatus('error')
      setError('Renseignez le code d’accès administrateur.')
      return
    }
    setStatus('loading')
    setError('')
    try {
      const account = await loginAdminCode(code.trim())
      if (account.role !== 'ADMIN') {
        logout()
        setStatus('error')
        setError('Ce compte n’a pas accès à l’administration.')
        return
      }
      setCode('')
      setStatus('idle')
    } catch (caught) {
      setError(errorMessage(caught, 'Connexion administrateur indisponible.'))
      setStatus('error')
    }
  }

  if (checking) {
    return (
      <div className="page shell admin-gate">
        <p className="form-status" role="status">Vérification de vos droits d’accès…</p>
      </div>
    )
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="page shell admin-gate">
        <div className="account-card">
          <ShieldCheck size={32} aria-hidden="true" />
          <h1>Accès administrateur</h1>
          <p>Saisissez le code d’accès administrateur configuré sur le serveur.</p>
          <form className="account-form" onSubmit={event => void submit(event)} noValidate>
            <label>Code d’accès<input type="password" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value)} required /></label>
            <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Vérification…' : 'Accéder à l’administration'}
            </button>
            {status === 'error' && <p className="form-status error" role="alert">{error}</p>}
          </form>
          <a className="btn btn-ghost" href="/">Retour à l’accueil</a>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout section={section}>
      <Section section={section} />
    </AdminLayout>
  )
}
