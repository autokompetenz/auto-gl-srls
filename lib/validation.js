import { z } from 'zod'
import { HttpError } from './helpers.js'

/** Valide une entrée et transforme les erreurs Zod en erreur HTTP 400. */
export function validate(schema, value) {
  const result = schema.safeParse(value)
  if (!result.success) {
    throw new HttpError(400, 'Données invalides', result.error.flatten())
  }
  return result.data
}

const emailSchema = z.string().trim().toLowerCase().email().max(254)
const text = (min = 1, max = 200) => z.string().trim().min(min).max(max)
const optionalText = (max = 200) => z.string().trim().max(max).optional().nullable()

const first = (value) => (Array.isArray(value) ? value[0] : value)

const queryText = (max = 200) =>
  z.preprocess(first, z.string().trim().max(max).optional())

const queryInteger = (min = 0) =>
  z.preprocess(
    (value) => {
      const raw = first(value)
      if (raw === undefined || raw === null || raw === '') return undefined
      const number = Number(raw)
      return Number.isFinite(number) ? Math.trunc(number) : raw
    },
    z.number().int().min(min).optional(),
  )

const queryBoolean = z.preprocess(
  (value) => {
    const raw = first(value)
    if (raw === undefined || raw === null || raw === '') return false
    if (typeof raw === 'boolean') return raw
    return ['true', '1', 'yes', 'oui', 'on'].includes(String(raw).trim().toLowerCase())
  },
  z.boolean().default(false),
)

const pageNumber = z.preprocess(
  (value) => {
    const raw = first(value)
    if (raw === undefined || raw === null || raw === '') return 1
    const number = Number(raw)
    return Number.isFinite(number) ? Math.trunc(number) : raw
  },
  z.number().int().min(1).max(10000).default(1),
)

const limitNumber = z.preprocess(
  (value) => {
    const raw = first(value)
    if (raw === undefined || raw === null || raw === '') return 12
    const number = Number(raw)
    return Number.isFinite(number) ? Math.trunc(number) : raw
  },
  z.number().int().min(1).max(100).default(12),
)

export const registerSchema = z.object({
  name: text(2, 100),
  email: emailSchema,
  password: z.string().min(8).max(128),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
})

export const adminCodeSchema = z.object({
  code: z.string().trim().min(4).max(64),
})

export const adminLoginSchema = z.union([adminCodeSchema, loginSchema])

export const carQuerySchema = z.object({
  search: queryText(120),
  color: queryText(100),
  wheels: queryText(100),
  year: queryInteger(1900),
  minPrice: queryInteger(0),
  maxPrice: queryInteger(0),
  maxMileage: queryInteger(0),
  warrantyOnly: queryBoolean,
  sort: queryText(40),
  page: pageNumber,
  limit: limitNumber,
})

export const orderCreateSchema = z.object({
  carId: text(1, 120),
  customerName: text(2, 120),
  customerEmail: emailSchema,
  customerPhone: optionalText(40),
  address: text(3, 200),
  postalCode: text(2, 20),
  city: text(1, 100),
  country: text(1, 80).default('France'),
  notes: optionalText(2000),
  purchaseType: z.enum(['ACHAT', 'LOCATION']),
  deliveryType: z.enum(['LIVRAISON', 'RETRAIT']),
  paymentType: z.enum(['full', 'deposit', 'monthly']),
})

export const trackOrderSchema = z.object({
  orderNumber: text(1, 40),
  email: emailSchema,
})

export const simulationSchema = z.object({
  salary: z.number().finite().min(500).max(50000),
  charges: z.number().finite().min(0).max(50000).optional(),
  credit: z.number().finite().min(0).max(50000).optional(),
  downPayment: z.number().finite().min(0).max(500000).optional(),
})

export const leadSchema = z.object({
  name: text(2, 120),
  email: emailSchema,
  phone: optionalText(40),
  message: text(2, 5000),
})

export const bankInfoSchema = z.object({
  beneficiary: text(2, 200),
  iban: text(8, 64),
  bic: text(4, 64),
  transferType: text(1, 100).default('Virement'),
})

export const favoriteSchema = z.object({
  carId: text(1, 120),
})

export const alertFiltersSchema = z.object({
  search: text(1, 120).optional(),
  color: text(1, 100).optional(),
  wheels: text(1, 100).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  maxPrice: z.number().int().min(0).optional(),
  maxMileage: z.number().int().min(0).optional(),
  warrantyOnly: z.boolean().optional(),
})

export const alertCreateSchema = z.object({
  email: emailSchema,
  name: text(1, 100).optional().default(''),
  filters: alertFiltersSchema.default({}),
})

export const alertPatchSchema = z.object({
  active: z.boolean().optional(),
})

export const adminOrderPatchSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  note: optionalText(2000),
  bankInfo: z
    .object({
      beneficiary: text(1, 200).optional(),
      iban: text(1, 64).optional(),
      bic: text(1, 64).optional(),
      transferType: text(1, 100).optional(),
    })
    .optional(),
})

export const paymentPatchSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'FAILED']),
  paidAt: z.coerce.date().nullable().optional(),
})

const galleryItemSchema = z.object({
  src: text(1, 500),
  caption: text(0, 200).optional().default(''),
})

const carFields = {
  name: text(1, 200),
  version: text(1, 200),
  year: z.number().int().min(1900).max(2100),
  mileage: z.number().int().min(0),
  price: z.number().int().min(0),
  color: text(1, 100),
  image: text(1, 500),
  gallery: z.array(galleryItemSchema).default([]),
  wheels: text(1, 100),
  location: text(1, 150),
  warranty: text(0, 100).default(''),
  gearbox: text(1, 100),
  badges: z.array(z.string().max(100)).default([]),
  description: text(0, 5000).default(''),
  equipment: z.array(z.string().max(200)).default([]),
  technicalData: z.record(z.any()).optional().nullable(),
  fuel: z.enum(['ELECTRIC', 'HYBRID', 'PETROL', 'DIESEL', 'LPG']).default('ELECTRIC'),
  transmission: z.enum(['AUTOMATIC', 'MANUAL']).default('AUTOMATIC'),
  category: z.enum(['CITY', 'COMPACT', 'SUV', 'ESTATE', 'VAN', 'MOTORHOME']).default('CITY'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isSold: z.boolean().default(false),
}

export const carCreateSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(120)
    .regex(/^[a-zA-Z0-9-_]+$/, 'id doit contenir uniquement lettres, chiffres, tirets et underscores')
    .optional(),
  ...carFields,
})

export const carUpdateSchema = z.object(carFields).partial()
