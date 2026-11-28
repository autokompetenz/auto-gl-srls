import { ArrowRight, Trash2 } from 'lucide-react'
import { useVehicles } from '../context/VehiclesContext'
import type { Compare as CompareHook } from '../hooks/useCompare'
import { estimateMonthly } from '../lib/finance'
import { formatEuro, formatKm } from '../lib/format'
import type { VehicleDTO } from '../types/features'

type Row = { label: string; value: (vehicle: VehicleDTO) => string }

const rows: Row[] = [
  { label: 'Prix', value: vehicle => formatEuro(vehicle.price) },
  { label: 'Mensualité estimée', value: vehicle => `${formatEuro(estimateMonthly(vehicle.price))} / mois` },
  { label: 'Année', value: vehicle => String(vehicle.year) },
  { label: 'Kilométrage', value: vehicle => formatKm(vehicle.mileage) },
  { label: 'Énergie', value: () => 'Électrique' },
  { label: 'Boîte', value: vehicle => vehicle.gearbox },
  { label: 'Jantes', value: vehicle => vehicle.wheels },
  { label: 'Couleur', value: vehicle => vehicle.color },
  { label: 'Localisation', value: vehicle => vehicle.location },
  { label: 'Garantie', value: vehicle => vehicle.warranty },
]

export default function Compare({ compare }: { compare: CompareHook }) {
  const { vehicleById } = useVehicles()
  const selected = compare.ids.map(vehicleById).filter((vehicle): vehicle is VehicleDTO => Boolean(vehicle))

  return (
    <div className="page shell compare-page">
      <div className="page-head">
        <div>
          <p className="eyebrow">Comparateur</p>
          <h1>Comparez vos candidats.</h1>
          <p>Jusqu’à trois véhicules, côte à côte. Le comparateur reste enregistré dans ce navigateur.</p>
        </div>
        {selected.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={compare.clear}>
            <Trash2 size={16} aria-hidden="true" /> Tout retirer
          </button>
        )}
      </div>

      {selected.length ? (
        <>
          <div className="table-scroll">
            <table className="compare-table">
              <caption>Véhicules sélectionnés pour comparaison</caption>
              <thead>
                <tr>
                  <th scope="col">Critère</th>
                  {selected.map(vehicle => (
                    <th scope="col" key={vehicle.id}>
                      <img src={vehicle.image} alt="" loading="lazy" />
                      <span>{vehicle.name}</span>
                      <small>{vehicle.version}</small>
                      <button type="button" onClick={() => compare.remove(vehicle.id)}>
                        Retirer
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    {selected.map(vehicle => <td key={vehicle.id} data-vehicle={vehicle.name}>{row.value(vehicle)}</td>)}
                  </tr>
                ))}
                <tr>
                  <th scope="row">Action</th>
                  {selected.map(vehicle => (
                    <td key={vehicle.id} data-vehicle={vehicle.name}>
                      <a className="text-link" href={`/commander/${encodeURIComponent(vehicle.id)}`}>
                        Commander <ArrowRight size={15} aria-hidden="true" />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
          <p className="compare-note">Mensualité indicative calculée avec les hypothèses du simulateur : capacité 30 % du revenu, apport 25 %, 60 mensualités à 6 % annuel. Le montant définitif est calculé par l’API.</p>
        </>
      ) : (
        <div className="empty-state">
          <h2>Aucun véhicule à comparer.</h2>
          <p>Ajoutez jusqu’à trois véhicules depuis le catalogue ou une fiche véhicule.</p>
          <a className="btn btn-primary" href="/catalogue">Découvrir le catalogue</a>
        </div>
      )}
    </div>
  )
}
