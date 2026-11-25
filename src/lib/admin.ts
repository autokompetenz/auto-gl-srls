export function adminList<T>(payload: unknown, keys: string[] = ['items', 'data', 'cars', 'orders', 'clients', 'payments']): T[] {
  if (Array.isArray(payload)) return payload as T[]
  if (typeof payload !== 'object' || payload === null) return []
  const record = payload as Record<string, unknown>
  for (const key of keys) {
    if (Array.isArray(record[key])) return record[key] as T[]
  }
  return []
}

export function adminRecord<T>(payload: unknown, keys: string[] = ['item', 'stats', 'bank', 'data']): T | null {
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>
    for (const key of keys) {
      if (record[key] && typeof record[key] === 'object') return record[key] as T
    }
    return payload as T
  }
  return null
}
