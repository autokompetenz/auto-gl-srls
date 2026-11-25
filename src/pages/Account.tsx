import { useEffect, useState } from 'react'
import { LogOut, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { errorMessage } from '../lib/api'
import type { Navigate } from '../hooks/useRoute'

export default function Account({ navigate }: { navigate: Navigate }) {
  const { user, login, register, logout } = useAuth()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role === 'ADMIN') navigate('/admin')
    // Redirect only when the role changes, not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role])

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!email.trim() || !password || (tab === 'register' && !name.trim())) {
      setStatus('error')
      setError('Renseignez tous les champs obligatoires.')
      return
    }
    setStatus('loading')
    setError('')
    try {
      const account = tab === 'login'
        ? await login(email.trim(), password)
        : await register(name.trim(), email.trim(), password)
      setPassword('')
      setStatus('idle')
      if (account.role === 'ADMIN') navigate('/admin')
    } catch (caught) {
      setError(errorMessage(caught, 'Authentification indisponible.'))
      setStatus('error')
    }
  }

  return (
    <div className="page shell account-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Votre compte</p>
          <h1>{user ? 'Bienvenue.' : 'Connectez-vous ou créez un compte.'}</h1>
          <p>Un compte permet de retrouver ses commandes et d’enregistrer des alertes de recherche.</p>
        </div>
      </div>

      {user ? (
        <div className="account-card">
          <h2>{user.name}</h2>
          <p>{user.email}</p>
          <p className="form-context">Rôle : {user.role === 'ADMIN' ? 'Administrateur' : 'Client'}</p>
          <div className="form-actions">
            <a className="btn btn-primary" href="#/mes-commandes">Mes commandes</a>
            {user.role === 'ADMIN' && (
              <a className="btn btn-ghost" href="#/admin"><ShieldCheck size={16} aria-hidden="true" /> Espace admin</a>
            )}
            <button type="button" className="btn btn-ghost" onClick={logout}>
              <LogOut size={16} aria-hidden="true" /> Se déconnecter
            </button>
          </div>
        </div>
      ) : (
        <div className="account-card">
          <div className="tabs" role="tablist" aria-label="Accès au compte">
            <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'tab active' : 'tab'} onClick={() => { setTab('login'); setStatus('idle'); setError('') }}>
              Connexion
            </button>
            <button type="button" role="tab" aria-selected={tab === 'register'} className={tab === 'register' ? 'tab active' : 'tab'} onClick={() => { setTab('register'); setStatus('idle'); setError('') }}>
              Inscription
            </button>
          </div>
          <form className="account-form" onSubmit={event => void submit(event)} noValidate>
            {tab === 'register' && (
              <label>Nom
                <input type="text" value={name} onChange={event => setName(event.target.value)} autoComplete="name" required />
              </label>
            )}
            <label>E-mail
              <input type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <label>Mot de passe
              <input type="password" value={password} onChange={event => setPassword(event.target.value)} autoComplete={tab === 'login' ? 'current-password' : 'new-password'} required />
            </label>
            <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              {status === 'loading' ? 'Veuillez patienter…' : tab === 'login' ? 'Se connecter' : 'Créer mon compte'}
            </button>
            {status === 'error' && <p className="form-status error" role="alert">{error}</p>}
          </form>
          <p className="form-context">La connexion administrateur se fait depuis l’espace admin, sans code embarqué dans le site.</p>
        </div>
      )}
    </div>
  )
}
