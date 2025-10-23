import { useState, useMemo } from 'react'

interface UseSearchReturn<T> {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredData: T[]
}

/**
 * Custom hook for searching/filtering data by multiple fields
 * Replaces repetitive filter logic in components
 */
export function useSearch<T extends Record<string, any>>(
  data: T[],
  searchFields: (keyof T)[],
  initialQuery = ''
): UseSearchReturn<T> {
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data
    }

    const query = searchQuery.toLowerCase()

    return data.filter((item) =>
      searchFields.some((field) => {
        const value = item[field]
        if (typeof value === 'string') {
          return value.toLowerCase().includes(query)
        }
        if (typeof value === 'number') {
          return String(value).includes(query)
        }
        return false
      })
    )
  }, [data, searchQuery, searchFields])

  return {
    searchQuery,
    setSearchQuery,
    filteredData
  }
}
