import { randomBytes } from 'node:crypto'
import { prisma } from './prisma.js'
import { HttpError, normalizeArray, slugify } from './helpers.js'

const NO_WARRANTY = ['', '-', 'aucune', 'aucun', 'non', '0 mois', 'sans garantie']

/** Mapping unique entre un enregistrement Prisma et le type `Vehicle` du front. */
export function toVehicleDTO(car) {
  // Une annonce peut n'avoir que son image principale : la galerie renvoyée
  // contient alors au moins cette image, et jamais d'entrée sans source.
  const storedGallery = normalizeArray(car.gallery).filter(
    (item) => item && typeof item.src === 'string' && item.src.trim(),
  )
  const gallery = storedGallery.length
    ? storedGallery
    : car.image
      ? [{ src: car.image, caption: car.name }]
      : []

  return {
    id: car.id,
    brandKey: car.brandKey,
    name: car.name,
    version: car.version,
    year: car.year,
    mileage: car.mileage,
    price: car.price,
    color: car.color,
    image: car.image,
    gallery,
    wheels: car.wheels,
    location: car.location,
    warranty: car.warranty,
    gearbox: car.gearbox,
    badges: normalizeArray(car.badges),
    description: car.description,
    equipment: normalizeArray(car.equipment),
    fuel: car.fuel,
    transmission: car.transmission,
    category: car.category,
    isActive: car.isActive,
    isFeatured: car.isFeatured,
    isSold: car.isSold,
    views: car.views,
  }
}

/**
 * Une seule définition des filtres catalogue : utilisée par GET /cars, par la
 * simulation et par le moteur d'alertes (notifyAlerts).
 */
export function buildVehicleWhere(filters = {}) {
  const where = { isActive: true }
  const search = typeof filters.search === 'string' ? filters.search.trim() : ''

  if (search) {
    where.OR = ['name', 'version', 'brandKey', 'color', 'wheels', 'location', 'gearbox', 'description'].map(
      (field) => ({ [field]: { contains: search, mode: 'insensitive' } }),
    )
  }
  if (filters.color) where.color = { equals: String(filters.color).trim(), mode: 'insensitive' }
  if (filters.wheels) where.wheels = { equals: String(filters.wheels).trim(), mode: 'insensitive' }
  if (filters.year !== undefined && filters.year !== null) where.year = Number(filters.year)
  if (filters.minPrice !== undefined && filters.minPrice !== null) {
    where.price = { ...(where.price || {}), gte: Number(filters.minPrice) }
  }
  if (filters.maxPrice !== undefined && filters.maxPrice !== null) {
    where.price = { ...(where.price || {}), lte: Number(filters.maxPrice) }
  }
  if (filters.maxMileage !== undefined && filters.maxMileage !== null) {
    where.mileage = { lte: Number(filters.maxMileage) }
  }
  if (filters.warrantyOnly) {
    where.warranty = { notIn: NO_WARRANTY }
  }
  return where
}

const SORTS = {
  'price-asc': [{ price: 'asc' }],
  'price-desc': [{ price: 'desc' }],
  'year-asc': [{ year: 'asc' }],
  'year-desc': [{ year: 'desc' }],
  'mileage-asc': [{ mileage: 'asc' }],
  'mileage-desc': [{ mileage: 'desc' }],
  'name-asc': [{ name: 'asc' }],
  'name-desc': [{ name: 'desc' }],
  recent: [{ createdAt: 'desc' }],
  featured: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
}

const DEFAULT_SORT = [{ isFeatured: 'desc' }, { createdAt: 'desc' }]

export function getSortOrder(sort) {
  return SORTS[sort] ?? DEFAULT_SORT
}

export async function listVehicles(query = {}) {
  const where = buildVehicleWhere(query)
  const [total, cars, facets] = await Promise.all([
    prisma.car.count({ where }),
    prisma.car.findMany({
      where,
      orderBy: getSortOrder(query.sort),
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
    prisma.car.findMany({
      where: { isActive: true },
      select: { color: true, wheels: true, year: true, price: true, mileage: true },
    }),
  ])

  const colors = [...new Set(facets.map((car) => car.color))].sort((a, b) => a.localeCompare(b, 'fr'))
  const wheels = [...new Set(facets.map((car) => car.wheels))].sort((a, b) => a.localeCompare(b, 'fr'))
  const years = [...new Set(facets.map((car) => car.year))].sort((a, b) => a - b)

  return {
    items: cars.map(toVehicleDTO),
    total,
    page: query.page,
    limit: query.limit,
    pages: Math.ceil(total / query.limit),
    filters: {
      colors,
      wheels,
      years,
      maxPrice: facets.reduce((max, car) => Math.max(max, car.price), 0),
      maxMileage: facets.reduce((max, car) => Math.max(max, car.mileage), 0),
    },
  }
}

export async function findVehicle(id) {
  if (!id) return null
  return prisma.car.findFirst({ where: { OR: [{ id }, { slug: id }] } })
}

/** Fiche publique : incrémente le compteur de vues. */
export async function getVehicleDTOById(id) {
  const car = await findVehicle(id)
  if (!car) throw new HttpError(404, 'Véhicule introuvable')
  const viewed = await prisma.car.update({
    where: { id: car.id },
    data: { views: { increment: 1 } },
  })
  return toVehicleDTO(viewed)
}

export async function requireVehicle(id) {
  const car = await findVehicle(id)
  if (!car) throw new HttpError(404, 'Véhicule introuvable')
  return car
}

export async function makeUniqueSlug(value, exceptId = null) {
  const base = slugify(value) || 'vehicule'
  let candidate = base
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const existing = await prisma.car.findUnique({ where: { slug: candidate } })
    if (!existing || existing.id === exceptId) return candidate
    candidate = `${base}-${randomBytes(3).toString('hex')}`
  }
  return `${base}-${randomBytes(6).toString('hex')}`
}
