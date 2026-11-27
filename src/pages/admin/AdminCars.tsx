import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Pencil, Plus, Trash2, UploadCloud, X } from 'lucide-react'
import { adminList } from '../../lib/admin'
import { apiFetch, errorMessage } from '../../lib/api'
import { uploadImagesDirect } from '../../lib/cloudinaryUpload'
import { useVehicles } from '../../context/VehiclesContext'
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
  isActive: boolean
  isFeatured: boolean
  isSold: boolean
}

type PhotoPreview = { id: string; url: string; name: string; file: File }

const MAX_IMAGES = 20
const MAX_SOURCE_SIZE = 10 * 1024 * 1024

const emptyForm: CarForm = {
  id: '', name: '', version: '', year: String(new Date().getFullYear()), mileage: '0', price: '', color: 'Non précisé',
  image: '', wheels: 'Jantes alliage', location: 'Foggia, Italie', warranty: '12 mois', gearbox: 'Automatique',
  brandKey: 'AUTO GL', fuel: 'ELECTRIC', transmission: 'AUTOMATIC', category: 'CITY',
  badges: '', equipment: '', gallery: '', description: '', isActive: true, isFeatured: false, isSold: false,
}

const fuelOptions = [
  ['ELECTRIC', 'Électrique'], ['HYBRID', 'Hybride'], ['PETROL', 'Essence'], ['DIESEL', 'Diesel'], ['LPG', 'GPL'],
]
const transmissionOptions = [['AUTOMATIC', 'Automatique'], ['MANUAL', 'Manuelle']]
const categoryOptions = [
  ['CITY', 'Citadine'], ['COMPACT', 'Compacte'], ['SUV', 'SUV'], ['ESTATE', 'Break'], ['VAN', 'Utilitaire'], ['MOTORHOME', 'Camping-car'],
]

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
    isActive: car.isActive !== false,
    isFeatured: Boolean(car.isFeatured),
    isSold: Boolean(car.isSold),
  }
}

function toPayload(form: CarForm, gallery: { src: string; caption: string }[]) {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    version: form.version.trim(),
    year: Number(form.year),
    mileage: Number(form.mileage),
    price: Number(form.price),
    color: form.color.trim(),
    image: form.image.trim(),
    gallery,
    wheels: form.wheels.trim(),
    location: form.location.trim(),
    warranty: form.warranty.trim(),
    gearbox: form.gearbox.trim(),
    brandKey: form.brandKey.trim(),
    fuel: form.fuel.toUpperCase(),
    transmission: form.transmission.toUpperCase(),
    category: form.category.toUpperCase(),
    badges: lines(form.badges),
    equipment: lines(form.equipment),
    description: form.description,
    isActive: form.isActive,
    isFeatured: form.isFeatured,
    isSold: form.isSold,
  }
  if (form.id.trim()) payload.id = form.id.trim()
  return payload
}

export default function AdminCars() {
  const { refresh: refreshPublicCatalogue } = useVehicles()
  const [cars, setCars] = useState<VehicleDTO[]>([])
  const [form, setForm] = useState<CarForm | null>(null)
  const [previews, setPreviews] = useState<PhotoPreview[]>([])
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading')
  const [actionError, setActionError] = useState('')
  const [flash, setFlash] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const previewUrls = useRef<string[]>([])

  useEffect(() => () => {
    previewUrls.current.forEach(url => URL.revokeObjectURL(url))
  }, [])

  useEffect(() => {
    if (!flash) return
    const timer = setTimeout(() => setFlash(''), 6000)
    return () => clearTimeout(timer)
  }, [flash])

  const clearPreviews = useCallback(() => {
    previews.forEach(item => URL.revokeObjectURL(item.url))
    previewUrls.current = previewUrls.current.filter(url => !previews.some(item => item.url === url))
    setPreviews([])
  }, [previews])

  const openForm = (car?: VehicleDTO) => {
    clearPreviews()
    setForm(car ? toForm(car) : { ...emptyForm })
    setActionError('')
    setFlash('')
  }

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
    setForm(previous => {
      if (!previous) return previous
      const next = { ...previous, [field]: value }
      if (field === 'transmission' && typeof value === 'string') {
        next.gearbox = value === 'MANUAL' ? 'Manuelle' : 'Automatique'
      }
      return next
    })
  }

  const addPhotos = (files: FileList | null) => {
    if (!files?.length || !form) return
    const selected = Array.from(files)
    const currentCount = galleryEntries(form.gallery).length + previews.length
    if (currentCount + selected.length > MAX_IMAGES) {
      setActionError(`Maximum ${MAX_IMAGES} images autorisées (${currentCount}/${MAX_IMAGES} déjà sélectionnées).`)
      return
    }
    const oversized = selected.find(file => file.size > MAX_SOURCE_SIZE)
    if (oversized) {
      setActionError(`Image ${oversized.name} trop volumineuse (max 10 Mo).`)
      return
    }
    const added = selected.map((file, index) => {
      const url = URL.createObjectURL(file)
      previewUrls.current.push(url)
      return { id: `${Date.now()}-${index}-${crypto.randomUUID()}`, url, name: file.name, file }
    })
    setPreviews(previous => [...previous, ...added])
    setActionError('')
  }

  const removePreview = (id: string) => {
    const target = previews.find(item => item.id === id)
    if (target) {
      URL.revokeObjectURL(target.url)
      previewUrls.current = previewUrls.current.filter(url => url !== target.url)
    }
    setPreviews(previous => previous.filter(item => item.id !== id))
  }

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form || saving) return
    const name = form.name.trim()
    const year = Number(form.year)
    const price = Number(form.price)
    const mileage = Number(form.mileage)
    if (!name) {
      setActionError('Le nom du véhicule est obligatoire.')
      return
    }
    if (!form.version.trim()) {
      setActionError('La version du véhicule est obligatoire.')
      return
    }
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      setActionError('Renseignez une année valide.')
      return
    }
    if (!Number.isFinite(price) || price <= 0) {
      setActionError('Renseignez un prix valide.')
      return
    }
    if (!Number.isFinite(mileage) || mileage < 0) {
      setActionError('Renseignez un kilométrage valide.')
      return
    }

    const existingGallery = galleryEntries(form.gallery)
    if (!form.image.trim() && !existingGallery.length && !previews.length) {
      setActionError('Ajoutez au moins une image.')
      return
    }

    const editing = cars.some(car => car.id === form.id)
    setActionError('')
    setSaving(true)
    try {
      let uploaded: Awaited<ReturnType<typeof uploadImagesDirect>> = []
      if (previews.length) {
        setUploading(true)
        uploaded = await uploadImagesDirect(previews.map(item => item.file))
      }
      const gallery = [
        ...existingGallery,
        ...uploaded.map((item, index) => ({ src: item.url, caption: `Vue ${existingGallery.length + index + 1}` })),
      ]
      const image = form.image.trim() || gallery[0]?.src || ''
      await apiFetch(editing ? `/admin/cars/${encodeURIComponent(form.id)}` : '/admin/cars', {
        method: editing ? 'PUT' : 'POST',
        body: toPayload({ ...form, image }, gallery),
      })
      clearPreviews()
      setForm(null)
      setFlash(editing ? 'Véhicule mis à jour avec succès' : 'Véhicule créé avec succès')
      await load()
      refreshPublicCatalogue()
    } catch (caught) {
      setActionError(errorMessage(caught, 'Enregistrement indisponible.'))
    } finally {
      setUploading(false)
      setSaving(false)
    }
  }

  const toggleActive = async (car: VehicleDTO) => {
    if (!window.confirm(`${car.isActive === false ? 'Activer' : 'Désactiver'} ${car.name} (${car.id}) ?`)) return
    setActionError('')
    try {
      await apiFetch(`/admin/cars/${encodeURIComponent(car.id)}/toggle`, { method: 'PATCH' })
      setFlash(car.isActive === false ? 'Véhicule activé' : 'Véhicule désactivé')
      await load()
      refreshPublicCatalogue()
    } catch (caught) {
      setActionError(errorMessage(caught, 'Mise à jour indisponible.'))
    }
  }

  const remove = async (car: VehicleDTO) => {
    if (!window.confirm(`Supprimer ${car.name} (${car.id}) ?`)) return
    setActionError('')
    try {
      await apiFetch(`/admin/cars/${encodeURIComponent(car.id)}`, { method: 'DELETE' })
      setFlash('Véhicule supprimé')
      await load()
      refreshPublicCatalogue()
    } catch (caught) {
      setActionError(errorMessage(caught, 'Suppression indisponible.'))
    }
  }

  const photoCount = form ? galleryEntries(form.gallery).length + previews.length : 0

  return (
    <div className="admin-panel">
      <div className="admin-panel-head">
        <h2>{form ? (cars.some(car => car.id === form.id) ? 'Modifier le véhicule' : 'Nouveau véhicule') : 'Véhicules'}</h2>
        {!form && (
          <div className="admin-actions">
            <button type="button" className="btn btn-ghost" onClick={() => void load()} disabled={status === 'loading'}>
              {status === 'loading' ? 'Chargement…' : 'Actualiser'}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => openForm()}>
              <Plus size={16} aria-hidden="true" /> Ajouter un véhicule
            </button>
          </div>
        )}
      </div>

      {flash && <p className="form-status success" role="status">✓ {flash}</p>}
      {actionError && <p className="form-status error" role="alert">{actionError}</p>}

      {form ? (
        <form className="admin-form-card" onSubmit={event => void save(event)} noValidate>
          <section className="admin-form-section">
            <h3>Informations principales</h3>
            <div className="form-grid">
              <label>Identifiant (facultatif)<input type="text" value={form.id} onChange={update('id')} readOnly={cars.some(car => car.id === form.id)} placeholder="Généré automatiquement" /></label>
              <label>Nom <span className="required">*</span><input type="text" value={form.name} onChange={update('name')} placeholder="AUTO GL Studio Silver" /></label>
              <label>Version <span className="required">*</span><input type="text" value={form.version} onChange={update('version')} placeholder="Série 01 · Multi-spoke" /></label>
              <label>Année <span className="required">*</span><input type="number" min="1900" max="2100" value={form.year} onChange={update('year')} /></label>
              <label>Kilométrage<input type="number" min="0" value={form.mileage} onChange={update('mileage')} /></label>
              <label>Prix (EUR) <span className="required">*</span><input type="number" min="1" value={form.price} onChange={update('price')} placeholder="27900" /></label>
              <label>Couleur<input type="text" value={form.color} onChange={update('color')} placeholder="Studio Silver" /></label>
              <label>Jantes<input type="text" value={form.wheels} onChange={update('wheels')} /></label>
              <label>Localisation<input type="text" value={form.location} onChange={update('location')} /></label>
              <label>Marque<input type="text" value={form.brandKey} onChange={update('brandKey')} /></label>
            </div>
          </section>

          <section className="admin-form-section">
            <h3>Caractéristiques techniques</h3>
            <div className="form-grid">
              <label>Énergie<select value={form.fuel} onChange={update('fuel')}>{fuelOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Transmission<select value={form.transmission} onChange={update('transmission')}>{transmissionOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Catégorie<select value={form.category} onChange={update('category')}>{categoryOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Boîte<input type="text" value={form.gearbox} onChange={update('gearbox')} /></label>
              <label>Garantie<input type="text" value={form.warranty} onChange={update('warranty')} /></label>
            </div>
          </section>

          <section className="admin-form-section">
            <h3>Images</h3>
            <label>Image principale (URL)<input type="text" value={form.image} onChange={update('image')} placeholder="https://… ou chemin local" /></label>
            <label className="admin-upload">
              <UploadCloud size={17} aria-hidden="true" />
              {uploading ? 'Envoi en cours…' : `📷 Choisir des images (${photoCount}/${MAX_IMAGES})`}
              <input type="file" accept="image/*" multiple disabled={saving || uploading} onChange={event => {
                addPhotos(event.target.files)
                event.target.value = ''
              }} />
            </label>
            <p className="form-context">Jusqu’à 20 images, 10 Mo par fichier avant compression. La première image devient l’image principale si le champ est vide.</p>

            {photoCount > 0 && (
              <div className="admin-photo-grid" aria-label="Photos du véhicule">
                {galleryEntries(form.gallery).map((item, index) => (
                  <div className="admin-photo" key={`existing-${index}-${item.src}`}>
                    <img src={item.src} alt={item.caption || `Vue ${index + 1}`} />
                    <span>{index === 0 ? '★ ' : ''}{item.caption || `Vue ${index + 1}`}</span>
                    <button type="button" aria-label={`Retirer ${item.caption || `Vue ${index + 1}`}`} onClick={() => setForm(previous => previous
                      ? { ...previous, gallery: lines(previous.gallery).filter((_, lineIndex) => lineIndex !== index).join('\n') }
                      : previous)}>
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
                {previews.map((item, index) => (
                  <div className="admin-photo" key={item.id}>
                    <img src={item.url} alt={item.name} />
                    <span>{galleryEntries(form.gallery).length === 0 && index === 0 ? '★ ' : ''}{item.name}</span>
                    <button type="button" aria-label={`Retirer ${item.name}`} onClick={() => removePreview(item.id)}>
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="admin-form-section">
            <h3>Description et équipements</h3>
            <label>Description<textarea rows={5} value={form.description} onChange={update('description')} placeholder="Une phrase par ligne. Les lignes commençant par - deviennent une liste." /></label>
            <p className="form-context">Chaque ligne devient un paragraphe, une ligne vide sépare les blocs, et les lignes commençant par « - » forment une liste. Le texte est affiché tel quel, sans HTML.</p>
            <div className="form-grid">
              <label>Badges (un par ligne)<textarea rows={3} value={form.badges} onChange={update('badges')} /></label>
              <label>Équipements (un par ligne)<textarea rows={3} value={form.equipment} onChange={update('equipment')} /></label>
              <label>Galerie (src|légende par ligne)<textarea rows={3} value={form.gallery} onChange={update('gallery')} /></label>
            </div>
          </section>

          <section className="admin-form-section">
            <h3>Options</h3>
            <div className="checkbox-pair">
              <label className="checkbox-field"><input type="checkbox" checked={form.isActive} onChange={update('isActive')} /> Actif (visible en catalogue)</label>
              <label className="checkbox-field"><input type="checkbox" checked={form.isFeatured} onChange={update('isFeatured')} /> À la une</label>
              <label className="checkbox-field"><input type="checkbox" checked={form.isSold} onChange={update('isSold')} /> Vendu</label>
            </div>
          </section>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
              {saving ? 'Enregistrement…' : cars.some(car => car.id === form.id) ? '✓ Mettre à jour' : '+ Créer le véhicule'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => openForm()} disabled={saving}>Annuler</button>
          </div>
        </form>
      ) : status === 'loading' ? (
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
                  <td>
                    <span className="status-badge small">
                      {car.isActive === false ? 'Inactif' : car.isSold ? 'Vendu' : car.isFeatured ? 'À la une · TOP' : 'Disponible'}
                    </span>
                  </td>
                  <td>
                    <button type="button" className="table-action" onClick={() => openForm(car)}>
                      <Pencil size={15} aria-hidden="true" /> Modifier
                    </button>
                    <button type="button" className="table-action" onClick={() => void toggleActive(car)}>
                      {car.isActive === false ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
                      {car.isActive === false ? 'Activer' : 'Désactiver'}
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
        <p className="form-context">Aucun véhicule renvoyé par l’API. Ajoutez votre premier véhicule au catalogue.</p>
      )}
    </div>
  )
}
