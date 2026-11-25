import { useCallback, useEffect, useState } from 'react'
import { vehicleById } from '../data/vehicles'

const STORAGE_KEY = 'auto-gl-srls:compare'
const MAX_COMPARE = 3

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    const valid = parsed.filter((id): id is string => typeof id === 'string' && Boolean(vehicleById(id)))
    return valid.slice(-MAX_COMPARE)
  } catch {
    return []
  }
}

export function useCompare() {
  const [ids, setIds] = useState<string[]>(read)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // Storage can be blocked; the in-memory list still works.
    }
  }, [ids])

  const toggle = useCallback((id: string) => {
    setIds(previous => previous.includes(id)
      ? previous.filter(item => item !== id)
      : [...previous, id].slice(-MAX_COMPARE))
  }, [])

  const remove = useCallback((id: string) => {
    setIds(previous => previous.filter(item => item !== id))
  }, [])

  const clear = useCallback(() => setIds([]), [])

  return {
    ids,
    max: MAX_COMPARE,
    toggle,
    remove,
    clear,
    has: (id: string) => ids.includes(id),
  }
}

export type Compare = ReturnType<typeof useCompare>
