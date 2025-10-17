import React from 'react'
import { Search, X } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
}

export interface FilterBarProps {
  searchValue: string
  onSearchChange: (value: string) => void
  filters?: Record<string, { value: string; options: FilterOption[] }>
  onFilterChange?: (filterName: string, value: string) => void
  placeholder?: string
  onClear?: () => void
}

/**
 * Reusable filter bar component
 * Combines search input with multiple filter dropdowns
 */
export const FilterBar: React.FC<FilterBarProps> = ({
  searchValue,
  onSearchChange,
  filters = {},
  onFilterChange,
  placeholder = 'Search...',
  onClear
}) => {
  const hasActiveFilters = searchValue || Object.values(filters).some((f) => f.value !== 'all')

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search Input */}
        <div className="flex-1 min-w-xs flex items-center px-3 py-2 bg-gray-800 rounded-lg border border-gray-700">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={placeholder}
            className="ml-2 bg-transparent outline-none flex-1 text-white placeholder-gray-500 text-sm"
          />
          {searchValue && (
            <button
              onClick={() => onSearchChange('')}
              className="ml-2 hover:text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        {Object.entries(filters).map(([filterName, { value, options }]) => (
          <select
            key={filterName}
            value={value}
            onChange={(e) => onFilterChange?.(filterName, e.target.value)}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 text-sm hover:border-gray-600 transition-colors focus:outline-none focus:border-cyber-blue"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {/* Clear Button */}
        {hasActiveFilters && onClear && (
          <button
            onClick={onClear}
            className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
