import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { vehicles as fallbackVehicles } from '../data/vehicles'
import { apiFetch } from '../lib/api'
import type { VehicleDTO } from '../types/features'

type VehicleSource = 'api' | 'fallback'

type VehiclesContextValue = {
  vehicles: VehicleDTO[]
  vehicleById: (id: string) => VehicleDTO | undefined
  loading: boolean
  source: VehicleSource
  refresh: () => void
}

const initialVehicles: VehicleDTO[] = fallbackVehicles.map((vehicle, index) => ({
  ...vehicle,
  brandKey: 'AUTO GL',
  fuel: 'ELECTRIC',
  transmission: 'AUTOMATIC',
  category: 'CITY',
  isActive: true,
  isFeatured: index < 3,
  isSold: false,
  views: 0,
}))

const VehiclesContext = createContext<VehiclesContextValue | null>(null)

function normalizeVehicle(raw: unknown): VehicleDTO | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Partial<VehicleDTO>
  if (typeof item.id !== 'string' || typeof item.name !== 'string' || typeof item.price !== 'number') return null
  return {
    ...(item as VehicleDTO),
    gallery: Array.isArray(item.gallery) ? item.gallery : [],
    badges: Array.isArray(item.badges) ? item.badges : [],
    equipment: Array.isArray(item.equipment) ? item.equipment : [],
    isActive: item.isActive !== false,
    isFeatured: Boolean(item.isFeatured),
    isSold: Boolean(item.isSold),
    views: typeof item.views === 'number' ? item.views : 0,
  }
}

/** Source publique unique : API d'abord, sélection locale en secours. */
export function VehiclesProvider({ children }: { children: ReactNode }) {
  const [vehicles, setVehicles] = useState<VehicleDTO[]>(initialVehicles)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<VehicleSource>('fallback')
  const mounted = useRef(true)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await apiFetch<{ items?: unknown }>('/cars?limit=100&sort=featured')
      if (!mounted.current || !Array.isArray(response?.items)) return
      const items = response.items.map(normalizeVehicle).filter((item): item is VehicleDTO => item !== null)
      setVehicles(items)
      setSource('api')
    } catch {
      if (mounted.current) setSource('fallback')
    } finally {
      if (mounted.current && !silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    void load()
    return () => {
      mounted.current = false
    }
  }, [load])

  // Le site est une SPA à hash : sans cela, un retour depuis l'admin garderait
  // l'ancienne liste en mémoire et masquerait les véhicules ajoutés.
  useEffect(() => {
    const refresh = () => {
      void load(true)
    }
    window.addEventListener('hashchange', refresh)
    return () => window.removeEventListener('hashchange', refresh)
  }, [load])

  const value = useMemo<VehiclesContextValue>(() => ({
    vehicles,
    vehicleById: (id) => vehicles.find((vehicle) => vehicle.id === id),
    loading,
    source,
    refresh: () => {
      void load(true)
    },
  }), [vehicles, loading, source, load])

  return <VehiclesContext.Provider value={value}>{children}</VehiclesContext.Provider>
}

export function useVehicles() {
  const context = useContext(VehiclesContext)
  if (!context) throw new Error('useVehicles doit être utilisé dans <VehiclesProvider>')
  return context
}
