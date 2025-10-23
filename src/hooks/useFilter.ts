import { useState, useMemo } from 'react'

interface UseFilterReturn<T, F> {
  filters: F
  setFilter: (key: keyof F, value: any) => void
  filteredData: T[]
  resetFilters: () => void
}

type FilterFunction<T, F> = (item: T, filters: F) => boolean

/**
 * Custom hook for filtering data with multiple filter states
 * Replaces repetitive filter logic in components
 */
export function useFilter<T, F extends Record<string, any>>(
  data: T[],
  initialFilters: F,
  filterFn?: FilterFunction<T, F>
): UseFilterReturn<T, F> {
  const [filters, setFilters] = useState<F>(initialFilters)

  const setFilter = (key: keyof F, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }))
  }

  const resetFilters = () => {
    setFilters(initialFilters)
  }

  const filteredData = useMemo(() => {
    if (!filterFn) {
      return data
    }

    return data.filter((item) => filterFn(item, filters))
  }, [data, filters, filterFn])

  return {
    filters,
    setFilter,
    filteredData,
    resetFilters
  }
}
