import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

/** Subscribes to a Dexie live query. Returns undefined until the first result arrives. */
export function useLive<T>(query: () => Promise<T> | T, deps: unknown[] = []): T | undefined {
  const [value, setValue] = useState<T | undefined>(undefined)
  useEffect(() => {
    const sub = liveQuery(query).subscribe({ next: setValue, error: (e) => console.error(e) })
    return () => sub.unsubscribe()
  }, deps)
  return value
}

/** Current time, refreshed every `ms` (default 30 seconds). */
export function useNow(ms = 30000): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), ms)
    return () => clearInterval(id)
  }, [ms])
  return now
}

export function useHashRoute(fallback: string): string {
  const read = () => window.location.hash.replace(/^#\/?/, '') || fallback
  const [route, setRoute] = useState(read)
  useEffect(() => {
    const onChange = () => setRoute(read())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
