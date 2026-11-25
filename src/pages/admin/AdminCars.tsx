import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, Trash2, UploadCloud } from 'lucide-react'
import { adminList } from '../../lib/admin'
import { apiFetch, errorMessage } from '../../lib/api'
import { uploadImagesDirect } from '../../lib/cloudinaryUpload'
import { formatEuro, formatKm } from '../../lib/format'
import type { VehicleDTO } from '../../types/features'

type CarForm = {
  id: string
  name: string
  version: string
  year: string
  mileage: string
  price: string
  color: string
  image: string
  wheels: string
  location: string
  warranty: string
  gearbox: string
  brandKey: string
  fuel: string
  transmission: string
  category: string
  badges: string
  equipment: string
  gallery: string
  description: string
  isFeatured: boolean
  isSold: boolean
}

const emptyForm: CarForm = {
  id: '', name: '', version: '', year: '2024', mileage: '0', price: '', color: '',
  image: '', wheels: '', location: '', warranty: '12 mois', gearbox: 'Automatique',
  brandKey: 'AUTO GL', fuel: 'ELECTRIC', transmission: 'AUTOMATIC', category: 'CITY',
  badges: '', equipment: '', gallery: '', description: '', isFeatured: false, isSold: false,
}

const asLines = (value: unknown): string => Array.isArray(value) ? value.map(item => String(item)).join('\n') : ''
const lines = (value: string): string[] => value.split('\n').map(line => line.trim()).filter(Boolean)

const galleryEntries = (value: string) => lines(value).map(line => {
  const [src, ...rest] = line.split('|')
  return { src: src.trim(), caption: rest.join('|').trim() }
}).filter(item => item.src)

function toForm(car: VehicleDTO): CarForm {
  return {
    id: car.id,
    name: car.name,
    version: car.version,
    year: String(car.year),
    mileage: String(car.mileage),
    price: String(car.price),
    color: car.color,
    image: car.image,
    wheels: car.wheels,
    location: car.location,
    warranty: car.warranty,
    gearbox: car.gearbox,
    brandKey: car.brandKey || 'AUTO GL',
    fuel: car.fuel || 'ELECTRIC',
    transmission: car.transmission || 'AUTOMATIC',
    category: car.category || 'CITY',
    badges: asLines(car.badges),
    equipment: asLines(car.equipment),
    gallery: Array.isArray(car.gallery)
      ? car.gallery.map(item => `${item.src}|${item.caption}`).join('\n')
      : '',
    description: car.description,
    isFeatured: Boolean(car.isFeatured),
    isSold: Boolean(car.isSold),
  }
}

function toPayload(form: CarForm) {
  return {
    ...form,
    year: Number(form.year),
    mileage: Number(form.mileage),
    price: Number(form.price),
    fuel: form.fuel.toUpperCase(),
    transmission: form.transmission.toUpperCase(),
    category: form.category.toUpperCase(),
    badges: lines(form.badges),
    equipment: lines(form.equipment),
    gallery: galleryEntries(form.gallery),
  }
}

export default function AdminCars() {
  const [cars, setCars] = useState<VehicleDTO[]>([])
  const [form, setForm] = useState<CarForm | null>(null)
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [actionError, setActionError] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    setStatus('loading')
    setActionError('')
    try {
      setCars(adminList<VehicleDTO>(await apiFetch<unknown>('/admin/cars')))
      setStatus('idle')
    } catch (caught) {
      setActionError(errorMessage(caught, 'Impossible de charger les véhicules.'))
      setStatus('error')
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const update = (field: keyof CarForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.type === 'checkbox'
      ? (event.target as HTMLInputElement).checked
      : event.target.value
    setForm(previous => previous ? { ...previous, [field]: value } : previous)
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form) return
    if (!form.id.trim() || !form.name.trim() || !Number.isFinite(Number(form.price))) {
      setActionError('L’identifiant, le nom et le prix sont obligatoires.')
      return
    }
    const editing = cars.some(car => car.id === form.id)
    setActionError('')
    try {
      await apiFetch(editing ? `/admin/cars/${encodeURIComponent(form.id)}` : '/admin/cars', {
        method: editing ? 'PUT' : 'POST',
        body: toPayload(form),
      })
      setForm(null)
      await load()
    } catch (caught) {
      setActionError(errorMessage(caught, 'Enregistrement indisponible.'))
    }
  }

  const remove = async (car: VehicleDTO) => {
    if (!window.confirm(`Supprimer ${car.name} (${car.id}) ?`)) return
    try {
      await apiFetch(`/admin/cars/${encodeURIComponent(car.id)}`, { method: 'DELETE' })
      await load()
    } catch (caught) {
      setActionError(errorMessage(caught, 'Suppression indisponible.'))
    }
  }

  const uploadGallery = async (files: FileList | null) => {
    if (!files?.length) return
    const selected = Array.from(files)
    setUploading(true)
    try {
      const uploaded = await uploadImagesDirect(selected)
      const urls = uploaded.map(item => item.url).filter(Boolean)
      if (!urls.length) throw new Error('Aucune URL d’image renvoyée.')

      setForm(previous => {
        if (!previous) return previous
        const existing = lines(previous.gallery)
        const added = urls.map((url, index) => `${url}|Vue ${existing.length + index + 1}`)
        return {
          ...previous,
          image: previous.image.trim() || urls[0],
          gallery: [...existing, ...added].join('\n'),
        }
      })
      setActionError('')
    } catch (caught) {
      setActionError(`Upload d’images indisponible : ${errorMessage(caught, 'erreur inconnue.')}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>Véhicules</h2>
        <div className="admin-actions">
          <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={status === 'loading'}>
            {status === 'loading' ? 'Chargement…' : 'Actualiser'}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => { setForm({ ...emptyForm }); setActionError('') }}>
            <Plus size={16} aria-hidden="true" /> Nouveau véhicule
          </button>
        </div>
      </div>
      {actionError && <p className="form-status error" role="alert">{actionError}</p>}

      {form && (
        <form className="admin-form-card" onSubmit={event => void save(event)} noValidate>
          <h3>{cars.some(car => car.id === form.id) ? 'Modifier' : 'Ajouter'} un véhicule</h3>
          <div className="form-grid">
            <label>Identifiant<input type="text" value={form.id} onChange={update('id')} readOnly={cars.some(car => car.id === form.id)} /></label>
            <label>Nom<input type="text" value={form.name} onChange={update('name')} /></label>
            <label>Version<input type="text" value={form.version} onChange={update('version')} /></label>
            <label>Année<input type="text" inputMode="numeric" value={form.year} onChange={update('year')} /></label>
            <label>Kilométrage<input type="text" inputMode="numeric" value={form.mileage} onChange={update('mileage')} /></label>
            <label>Prix (EUR)<input type="text" inputMode="numeric" value={form.price} onChange={update('price')} /></label>
            <label>Couleur<input type="text" value={form.color} onChange={update('color')} /></label>
            <label>Jantes<input type="text" value={form.wheels} onChange={update('wheels')} /></label>
            <label>Localisation<input type="text" value={form.location} onChange={update('location')} /></label>
            <label>Garantie<input type="text" value={form.warranty} onChange={update('warranty')} /></label>
            <label>Boîte<input type="text" value={form.gearbox} onChange={update('gearbox')} /></label>
            <label>Marque<input type="text" value={form.brandKey} onChange={update('brandKey')} /></label>
            <label>Énergie<input type="text" value={form.fuel} onChange={update('fuel')} /></label>
            <label>Transmission<input type="text" value={form.transmission} onChange={update('transmission')} /></label>
            <label>Catégorie<input type="text" value={form.category} onChange={update('category')} /></label>
          </div>
          <label>Image principale (URL)
            <input type="text" value={form.image} onChange={update('image')} placeholder="https://…" />
          </label>
          <label className="admin-upload">
            <UploadCloud size={17} aria-hidden="true" />
            {uploading ? 'Envoi en cours…' : 'Importer des photos (plusieurs fichiers)'}
            <input type="file" accept="image/*" multiple disabled={uploading} onChange={event => {
              void uploadGallery(event.target.files)
              event.target.value = ''
            }} />
          </label>
          <p className="form-context">Plusieurs images peuvent être sélectionnées : elles sont toutes ajoutées à la galerie. La première devient l’image principale si le champ est vide.</p>
          <label>Description
            <textarea
              rows={5}
              value={form.description}
              onChange={update('description')}
              placeholder="Une phrase par ligne. Les lignes commençant par - deviennent une liste."
            />
          </label>
          <p className="form-context">Mise en forme : chaque ligne devient un paragraphe, une ligne vide sépare les blocs, et les lignes commençant par « - » forment une liste à puces. Le texte est affiché tel quel, sans HTML.</p>
          <div className="form-grid">
            <label>Badges (un par ligne)<textarea rows={3} value={form.badges} onChange={update('badges')} /></label>
            <label>Équipements (un par ligne)<textarea rows={3} value={form.equipment} onChange={update('equipment')} /></label>
            <label>Galerie (src|légende par ligne)<textarea rows={3} value={form.gallery} onChange={update('gallery')} /></label>
          </div>
          {galleryEntries(form.gallery).length > 0 && (
            <div className="admin-gallery-preview" aria-label="Images de la galerie">
              {galleryEntries(form.gallery).map((item, index) => (
                <div className="admin-gallery-item" key={`${item.src}-${index}`}>
                  <img src={item.src} alt="" />
                  <span>{item.caption || `Vue ${index + 1}`}</span>
                  <button
                    type="button"
                    aria-label={`Retirer ${item.caption || `Vue ${index + 1}`}`}
                    onClick={() => setForm(previous => previous
                      ? { ...previous, gallery: lines(previous.gallery).filter((_, lineIndex) => lineIndex !== index).join('\n') }
                      : previous)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="checkbox-pair">
            <label className="checkbox-field"><input type="checkbox" checked={form.isFeatured} onChange={update('isFeatured')} /> À la une</label>
            <label className="checkbox-field"><input type="checkbox" checked={form.isSold} onChange={update('isSold')} /> Vendu</label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Enregistrer</button>
            <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Annuler</button>
          </div>
        </form>
      )}

      {status === 'loading' ? (
        <p className="form-status" role="status">Chargement des véhicules…</p>
      ) : cars.length ? (
        <div className="table-scroll">
          <table className="table-list">
            <thead><tr><th scope="col">Véhicule</th><th scope="col">Prix</th><th scope="col">Kilométrage</th><th scope="col">État</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {cars.map(car => (
                <tr key={car.id}>
                  <td><strong>{car.name}</strong><small>{car.id} · {car.version}</small></td>
                  <td>{formatEuro(car.price)}</td>
                  <td>{formatKm(car.mileage)}</td>
                  <td><span className="status-badge small">{car.isSold ? 'Vendu' : car.isFeatured ? 'À la une' : 'Disponible'}</span></td>
                  <td>
                    <button type="button" className="table-action" onClick={() => setForm(toForm(car))}>
                      <Pencil size={15} aria-hidden="true" /> Modifier
                    </button>
                    <button type="button" className="table-action danger" onClick={() => void remove(car)}>
                      <Trash2 size={15} aria-hidden="true" /> Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="form-context">Aucun véhicule renvoyé par l’API.</p>
      )}
    </div>
  )
}
