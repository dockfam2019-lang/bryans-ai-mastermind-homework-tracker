import { useEffect, useState } from 'react'
import { repo } from '../data'

/** Object URL for a stored photo, released when the component unmounts. */
export function useBlobUrl(id?: string): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!id) { setUrl(undefined); return }
    let made: string | undefined
    let cancelled = false
    void repo.blobs.get(id).then((b) => {
      if (b && !cancelled) { made = URL.createObjectURL(b.blob); setUrl(made) }
    })
    return () => { cancelled = true; if (made) URL.revokeObjectURL(made) }
  }, [id])
  return url
}
