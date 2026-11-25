import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'auto-gl-srls:favorites'

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is string => typeof id === 'string' && Boolean(id))
  } catch {
    return []
  }
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>(read)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // Private browsing can block storage; the in-memory list still works.
    }
  }, [ids])

  const toggle = useCallback((id: string) => {
    setIds(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id])
  }, [])

  const remove = useCallback((id: string) => {
    setIds(previous => previous.filter(item => item !== id))
  }, [])

  const clear = useCallback(() => setIds([]), [])

  return { ids, toggle, remove, clear, has: (id: string) => ids.includes(id) }
}

export type Favorites = ReturnType<typeof useFavorites>
