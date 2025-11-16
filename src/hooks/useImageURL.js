import { useEffect, useState } from 'react'
import { getImage } from '../utils/db'

// Hook: given an imageId, load blob from IndexedDB and return object URL
export function useImageURL(imageId) {
  const [url, setUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    let objectUrl = null

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const blob = await getImage(imageId)
        if (!active) return
        if (blob) {
          objectUrl = URL.createObjectURL(blob)
          setUrl(objectUrl)
        } else {
          setUrl(null)
        }
      } catch (e) {
        if (active) setError(e)
      } finally {
        if (active) setLoading(false)
      }
    }

    if (imageId) load()

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [imageId])

  return { url, loading, error }
}
