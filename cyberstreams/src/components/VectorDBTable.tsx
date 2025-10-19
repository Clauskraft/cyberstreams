import React, { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Search, X } from 'lucide-react'

export interface VectorMetrics {
  score: number
  vectorDistance?: number
  bm25?: number
}

export interface VectorItem {
  id: string
  content: string
  source?: string
  timestamp?: string
  category?: string
  tags?: string[]
  metadata?: Record<string, unknown>
  metrics: VectorMetrics
  explanation?: string
}

interface VectorDBTableProps {
  data: VectorItem[]
  loading?: boolean
  error?: string | null
  selectedId?: string | null
  onSelectItem?: (item: VectorItem) => void
  onClearError?: () => void
}

export const VectorDBTable: React.FC<VectorDBTableProps> = ({
  data,
  loading = false,
  error = null,
  selectedId,
  onSelectItem,
  onClearError,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<keyof VectorItem>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [sourceFilter, setSourceFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const filteredData = useMemo(() => {
    let result = [...data]
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        item.content.toLowerCase().includes(query) ||
        (item.source ?? '').toLowerCase().includes(query) ||
        (item.category ?? '').toLowerCase().includes(query) ||
        (item.tags ?? []).some(tag => tag.toLowerCase().includes(query)),
      )
    }
    if (sourceFilter) {
      result = result.filter(item => (item.source ?? '').toLowerCase().includes(sourceFilter.toLowerCase()))
    }
    if (categoryFilter) {
      result = result.filter(item => (item.category ?? '').toLowerCase().includes(categoryFilter.toLowerCase()))
    }

    result.sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }

      if (sortColumn === 'metrics') {
        const aScore = a.metrics?.score ?? 0
        const bScore = b.metrics?.score ?? 0
        return sortDirection === 'asc' ? aScore - bScore : bScore - aScore
      }

      return 0
    })

    return result
  }, [data, searchQuery, sourceFilter, categoryFilter, sortColumn, sortDirection])

  const handleSort = (column: keyof VectorItem) => {
    if (sortColumn === column) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center text-sm text-gray-400">
        Indlæser resultater fra vector database...
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-sm text-red-200 space-y-2">
        <div className="font-medium">Vector database fejl</div>
        <div>{error}</div>
        {onClearError && (
          <button
            type="button"
            onClick={onClearError}
            className="px-3 py-1 bg-red-700/40 hover:bg-red-700/60 rounded"
          >
            Ryd fejl
          </button>
        )}
      </div>
    )
  }

  if (!filteredData.length) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 text-center text-sm text-gray-400">
        Ingen resultater endnu. Kør en søgning eller seed vector databasen.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            className="flex-1 bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white"
            placeholder="Søg i indhold, kilder eller tags"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <input
          className="bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white"
          placeholder="Filter kilde"
          value={sourceFilter}
          onChange={event => setSourceFilter(event.target.value)}
        />
        <input
          className="bg-gray-950 border border-gray-700 rounded px-3 py-2 text-sm text-white"
          placeholder="Filter kategori"
          value={categoryFilter}
          onChange={event => setCategoryFilter(event.target.value)}
        />
      </div>

      <div className="overflow-x-auto border border-gray-800 rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/60 text-gray-400 uppercase text-xs tracking-wide">
            <tr>
              <SortableHeader
                label="Score"
                column="metrics"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Indhold"
                column="content"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Kilde"
                column="source"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Kategori"
                column="category"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <SortableHeader
                label="Tid"
                column="timestamp"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
              />
              <th className="px-4 py-3 text-left">Why surfaced?</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map(item => (
              <tr
                key={item.id}
                className={`border-t border-gray-800 hover:bg-gray-900/60 transition-colors cursor-pointer ${
                  selectedId === item.id ? 'bg-gray-900/80' : ''
                }`}
                onClick={() => onSelectItem?.(item)}
              >
                <td className="px-4 py-3 align-top">
                  <div className="font-semibold text-white">{item.metrics.score.toFixed(3)}</div>
                  <div className="text-xs text-gray-500">
                    {item.metrics.vectorDistance !== undefined && (
                      <div>Vector: {item.metrics.vectorDistance.toFixed(3)}</div>
                    )}
                    {item.metrics.bm25 !== undefined && <div>BM25: {item.metrics.bm25.toFixed(3)}</div>}
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="font-medium text-white line-clamp-2">{item.content}</div>
                  {item.tags && (
                    <div className="mt-2 flex flex-wrap gap-1 text-xs text-cyber-blue">
                      {item.tags.map(tag => (
                        <span key={tag} className="bg-cyber-blue/10 px-2 py-0.5 rounded-full">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <div className="text-white">{item.source ?? '—'}</div>
                </td>
                <td className="px-4 py-3 align-top text-white">{item.category ?? '—'}</td>
                <td className="px-4 py-3 align-top text-white">
                  {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3 align-top text-sm text-gray-300 whitespace-pre-wrap">
                  {item.explanation ?? 'Ingen forklaring tilgængelig'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface SortableHeaderProps {
  label: string
  column: keyof VectorItem
  sortColumn: keyof VectorItem
  sortDirection: 'asc' | 'desc'
  onSort: (column: keyof VectorItem) => void
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ label, column, sortColumn, sortDirection, onSort }) => {
  const isActive = sortColumn === column
  return (
    <th
      className="px-4 py-3 text-left font-medium"
      onClick={() => onSort(column)}
      role="button"
      aria-pressed={isActive}
    >
      <span className="inline-flex items-center gap-1 text-gray-300">
        {label}
        {isActive ? (
          sortDirection === 'asc' ? (
            <ArrowUp className="w-3 h-3" />
          ) : (
            <ArrowDown className="w-3 h-3" />
          )
        ) : null}
      </span>
    </th>
  )
}
