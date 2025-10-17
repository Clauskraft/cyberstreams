import { useState, useEffect, useCallback } from 'react'

interface UseDataFetchingOptions<T> {
  url: string
  fallbackData?: T[]
  transform?: (data: any) => T[]
  onError?: (error: Error) => void
}

interface UseDataFetchingReturn<T> {
  data: T[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for data fetching with loading and error states
 * Replaces repetitive useState/useEffect patterns
 */
export function useDataFetching<T>({
  url,
  fallbackData = [],
  transform = (data) => data,
  onError
}: UseDataFetchingOptions<T>): UseDataFetchingReturn<T> {
  const [data, setData] = useState<T[]>(fallbackData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        setData(transform(result.data))
      } else {
        throw new Error(result.error || 'Failed to fetch data')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [url, transform, onError])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch: fetchData }
}
