import type { Vehicle } from '../data/vehicles'

export type UserRole = 'CUSTOMER' | 'ADMIN'

export type User = {
  id: string
  name: string
  email: string
  role: UserRole
  phone?: string | null
  address?: string | null
  postalCode?: string | null
  city?: string | null
  country?: string
  createdAt?: string
}

export type VehicleDTO = Vehicle & {
  brandKey: string
  fuel: string
  transmission: string
  category: string
  isActive: boolean
  isFeatured: boolean
  isSold: boolean
  views: number
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'

export type OrderItemDTO = {
  vehicleId: string | null
  name: string
  version: string
  image: string
  quantity: number
  unitPrice: number
}

export type PaymentDTO = {
  id: string
  type: string
  status: string
  amount: number
  dueDate: string | null
  installmentNumber: number | null
  installmentType: string | null
}

export type TrackingDTO = {
  status: OrderStatus
  note: string | null
  createdAt: string
}

export type OrderDTO = {
  id: string
  orderNumber: string
  createdAt: string
  status: OrderStatus
  customerName: string
  customerEmail: string
  customerPhone: string | null
  address: string
  postalCode: string
  city: string
  country: string | null
  notes: string | null
  purchaseType: string
  deliveryType: string
  paymentType: string
  totalPrice: number
  discountAmount: number
  amountDue: number
  depositAmount: number
  balanceAmount: number
  monthlyAmount: number
  monthlyDuration: number
  paymentReference: string | null
  paymentBeneficiary: string | null
  paymentIban: string | null
  paymentBic: string | null
  paymentTransferType: string | null
  items: OrderItemDTO[]
  tracking: TrackingDTO[]
  payments: PaymentDTO[]
}

export type AlertFilters = {
  search?: string
  color?: string
  wheels?: string
  year?: number
  maxPrice?: number
  maxMileage?: number
  warrantyOnly?: boolean
  [key: string]: string | number | boolean | null | undefined
}

export type AlertDTO = {
  id: string
  token: string
  email: string
  name: string | null
  filters: AlertFilters
  active: boolean
  notifiedCount: number
  createdAt: string
  updatedAt?: string
}

export type AdminStats = {
  totalCars?: number
  totalVehicles?: number
  totalOrders?: number
  totalClients?: number
  totalRevenue?: number
  pendingOrders?: number
  soldVehicles?: number
  activeAlerts?: number
  [key: string]: unknown
}

export type BankInfo = {
  beneficiary: string
  iban: string
  bic: string
  transferType: string
}

export type SimulationResult = {
  salary: number
  maxMonthly: number
  maxAffordablePrice: number
  count: number
  vehicles: VehicleDTO[]
}
