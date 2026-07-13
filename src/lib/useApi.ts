import { useState, useEffect } from 'react'

interface UseApiResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

/**
 * Generic hook for fetching data from the API.
 * Falls back to provided default data if the API is unavailable.
 */
export function useApi<T>(fetcher: () => Promise<{ success: boolean; data?: T; error?: { message: string } }>, defaultData?: T): UseApiResult<T> {
  const [data, setData] = useState<T | null>(defaultData ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      if (result.success && result.data) {
        setData(result.data)
      } else if (result.error) {
        setError(result.error.message)
        // Keep default/previous data on error
      }
    } catch (err) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, error, refetch: fetchData }
}
