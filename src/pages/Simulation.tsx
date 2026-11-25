import { useState } from 'react'
import { Calculator, RotateCcw, Search } from 'lucide-react'
import VehicleCard from '../components/VehicleCard'
import type { Compare } from '../hooks/useCompare'
import type { Favorites } from '../hooks/useFavorites'
import { apiFetch, errorMessage } from '../lib/api'
import { FINANCING_MONTHS, MONTHLY_INCOME_RATIO } from '../lib/finance'
import { formatEuro } from '../lib/format'
import type { SimulationResult } from '../types/features'

type Status = 'idle' | 'loading' | 'done' | 'error'

const digitsOnly = (value: string): string => value.replace(/\D/g, '')

export default function Simulation({ favorites, compare }: { favorites: Favorites; compare: Compare }) {
  const [salary, setSalary] = useState(2800)
  const [charges, setCharges] = useState(0)
  const [credit, setCredit] = useState(0)
  const [downPayment, setDownPayment] = useState(0)
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<SimulationResult | null>(null)
  const [error, setError] = useState('')

  const run = async () => {
    setStatus('loading')
    setError('')
    try {
      const response = await apiFetch<SimulationResult>('/simulation', {
        method: 'POST',
        body: {
          salary: Math.min(50000, Math.max(500, salary)),
          charges,
          credit,
          downPayment,
        },
      })
      if (!response || !Array.isArray(response.vehicles)) {
        throw new Error('Le simulateur n’a pas renvoyé de résultat exploitable.')
      }
      setResult(response)
      setStatus('done')
    } catch (caught) {
      setResult(null)
      setError(errorMessage(caught, 'Simulation indisponible pour le moment.'))
      setStatus('error')
    }
  }

  const setNumeric = (setter: (value: number) => void) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = digitsOnly(event.target.value)
    setter(cleaned ? Number(cleaned) : 0)
    if (status !== 'idle') {
      setStatus('idle')
      setError('')
    }
  }

  return (
    <div className="page shell simulation-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Simulation</p>
          <h1>Quel budget pouvez-vous envisager ?</h1>
          <p>Le serveur calcule une capacité mensuelle à partir de votre revenu et renvoie les véhicules de la sélection compatibles.</p>
        </div>
      </div>

      <div className="simulation-layout">
        <form
          className="simulation-form"
          onSubmit={event => { event.preventDefault(); void run() }}
          noValidate
        >
          <label className="filter-field">
            <span>Salaire net mensuel : <b>{formatEuro(salary)}</b></span>
            <input
              type="range"
              min={500}
              max={50000}
              step={100}
              value={Math.min(50000, Math.max(500, salary))}
              onChange={setNumeric(setSalary)}
            />
          </label>
          <label>
            Salaire net mensuel (EUR)
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={salary || ''}
              onChange={setNumeric(setSalary)}
              onBlur={() => setSalary(Math.min(50000, Math.max(500, salary)))}
              aria-label="Salaire net mensuel en euros"
            />
          </label>
          <div className="form-grid">
            <label>
              Charges mensuelles (EUR)
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={charges || ''} onChange={setNumeric(setCharges)} />
            </label>
            <label>
              Crédit en cours (EUR/mois)
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={credit || ''} onChange={setNumeric(setCredit)} />
            </label>
            <label>
              Apport disponible (EUR)
              <input type="text" inputMode="numeric" pattern="[0-9]*" value={downPayment || ''} onChange={setNumeric(setDownPayment)} />
            </label>
          </div>
          <p className="form-context">
            Hypothèse du serveur : capacité de {Math.round(MONTHLY_INCOME_RATIO * 100)} % du salaire, apport de 25 %, {FINANCING_MONTHS} mensualités à 6 % annuel.
          </p>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={status === 'loading'}>
              <Calculator size={17} aria-hidden="true" /> {status === 'loading' ? 'Calcul en cours…' : 'Simuler mon budget'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { setSalary(2800); setCharges(0); setCredit(0); setDownPayment(0); setResult(null); setStatus('idle'); setError('') }}
            >
              <RotateCcw size={16} aria-hidden="true" /> Réinitialiser
            </button>
          </div>
          {status === 'error' && (
            <div className="form-status error" role="alert">
              <p>Impossible d’obtenir la simulation : {error}</p>
              <button type="button" className="btn btn-ghost" onClick={() => void run()}>Réessayer</button>
            </div>
          )}
        </form>

        <section className="simulation-result" aria-live="polite">
          {status === 'done' && result ? (
            <>
              <h2>Résultat de votre simulation</h2>
              <div className="simulation-metrics">
                <div><span>Mensualité maximale</span><strong>{formatEuro(result.maxMonthly)}</strong></div>
                <div><span>Prix maximal estimé</span><strong>{formatEuro(result.maxAffordablePrice)}</strong></div>
                <div><span>Véhicules compatibles</span><strong>{result.count ?? result.vehicles.length}</strong></div>
              </div>
              {result.vehicles.length ? (
                <div className="vehicle-grid simulation-grid">
                  {result.vehicles.map(vehicle => (
                    <VehicleCard
                      key={vehicle.id}
                      vehicle={vehicle}
                      favorite={favorites.has(vehicle.id)}
                      onToggleFavorite={favorites.toggle}
                      compared={compare.has(vehicle.id)}
                      onToggleCompare={compare.toggle}
                    />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Search size={28} aria-hidden="true" />
                  <h3>Aucun véhicule ne correspond à ce budget.</h3>
                  <p>Essayez d’augmenter le salaire ou l’apport, puis relancez la simulation.</p>
                  <a className="btn btn-ghost" href="#/catalogue">Voir le catalogue</a>
                </div>
              )}
            </>
          ) : status === 'loading' ? (
            <p className="simulation-placeholder" role="status">Calcul de votre capacité d’achat…</p>
          ) : (
            <div className="empty-state">
              <Calculator size={30} aria-hidden="true" />
              <h2>Votre estimation apparaîtra ici.</h2>
              <p>Renseignez votre salaire puis lancez le calcul. Les résultats proviennent de l’API, aucune valeur n’est inventée côté navigateur.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
