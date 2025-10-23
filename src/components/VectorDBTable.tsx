import React, { useState, useMemo } from 'react'
import { Search, ArrowUp, ArrowDown, Filter, X } from 'lucide-react'

interface VectorItem {
  id: string
  content: string
  source: string
  timestamp: string
  score: number
  category: string
  tags: string[]
  metadata: Record<string, any>
}

interface VectorDBTableProps {
  data?: VectorItem[]
}

/**
 * Advanced Vector DB Table with column filtering and search
 */
export const VectorDBTable: React.FC<VectorDBTableProps> = ({ data: initialData }) => {
  // Mock data for demonstration
  const mockData: VectorItem[] = initialData || [
    {
      id: 'vec_001',
      content: 'Critical ransomware vulnerability detected in healthcare systems',
      source: 'CERT-EU',
      timestamp: '2025-10-18T10:30:00Z',
      score: 0.95,
      category: 'malware',
      tags: ['ransomware', 'healthcare', 'critical'],
      metadata: { severity: 'critical', verified: true }
    },
    {
      id: 'vec_002',
      content: 'New phishing campaign targeting financial institutions',
      source: 'ENISA',
      timestamp: '2025-10-18T09:15:00Z',
      score: 0.88,
      category: 'phishing',
      tags: ['phishing', 'finance', 'campaign'],
      metadata: { severity: 'high', verified: true }
    },
    {
      id: 'vec_003',
      content: 'Zero-day exploit found in popular enterprise software',
      source: 'NVD',
      timestamp: '2025-10-18T08:45:00Z',
      score: 0.92,
      category: 'vulnerability',
      tags: ['zero-day', 'exploit', 'enterprise'],
      metadata: { severity: 'critical', verified: true }
    },
    {
      id: 'vec_004',
      content: 'APT28 group activity increase in European networks',
      source: 'CFCS',
      timestamp: '2025-10-18T07:20:00Z',
      score: 0.85,
      category: 'threat-actor',
      tags: ['APT28', 'APT', 'europe'],
      metadata: { severity: 'high', verified: true }
    },
    {
      id: 'vec_005',
      content: 'Data breach exposes 500K user credentials',
      source: 'CISA',
      timestamp: '2025-10-18T06:00:00Z',
      score: 0.91,
      category: 'data-breach',
      tags: ['breach', 'credentials', 'leak'],
      metadata: { severity: 'high', verified: true }
    }
  ]

  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    source: '',
    category: '',
    tag: ''
  })
  const [sortColumn, setSortColumn] = useState<keyof VectorItem>('timestamp')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Filtered and sorted data
  const filteredData = useMemo(() => {
    let result = [...mockData]

    // Global search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        item.content.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Column filters
    if (filters.source) {
      result = result.filter(item =>
        item.source.toLowerCase().includes(filters.source.toLowerCase())
      )
    }
    if (filters.category) {
      result = result.filter(item =>
        item.category.toLowerCase().includes(filters.category.toLowerCase())
      )
    }
    if (filters.tag) {
      result = result.filter(item =>
        item.tags.some(tag => tag.toLowerCase().includes(filters.tag.toLowerCase()))
      )
    }

    // Sort
    result.sort((a, b) => {
      const aVal = a[sortColumn]
      const bVal = b[sortColumn]

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
      }
      return 0
    })

    return result
  }, [mockData, searchQuery, filters, sortColumn, sortDirection])

  const handleSort = (column: keyof VectorItem) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const clearFilter = (filterName: keyof typeof filters) => {
    setFilters({ ...filters, [filterName]: '' })
  }

  return (
    <div className="space-y-4">
      {/* Global Search */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Søg i vector database (content, source, category, tags...)"
            className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:border-cyber-blue focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Column Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Filter: Source</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filters.source}
              onChange={(e) => setFilters({ ...filters, source: e.target.value })}
              placeholder="e.g. CERT-EU"
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            />
            {filters.source && (
              <button onClick={() => clearFilter('source')} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Filter: Category</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              placeholder="e.g. malware"
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            />
            {filters.category && (
              <button onClick={() => clearFilter('category')} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Filter: Tag</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={filters.tag}
              onChange={(e) => setFilters({ ...filters, tag: e.target.value })}
              placeholder="e.g. ransomware"
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
            />
            {filters.tag && (
              <button onClick={() => clearFilter('tag')} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-gray-400">
        Viser {filteredData.length} af {mockData.length} vectors
      </div>

      {/* Advanced Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-700 rounded-lg">
          <thead className="bg-gray-800">
            <tr>
              {[
                { key: 'id' as const, label: 'ID' },
                { key: 'content' as const, label: 'Content' },
                { key: 'source' as const, label: 'Source' },
                { key: 'timestamp' as const, label: 'Timestamp' },
                { key: 'score' as const, label: 'Score' },
                { key: 'category' as const, label: 'Category' },
              ].map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortColumn === col.key && (
                      sortDirection === 'asc' ?
                        <ArrowUp className="w-3 h-3" /> :
                        <ArrowDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tags</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-700">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-800 transition-colors">
                <td className="px-4 py-3 text-xs text-gray-400 font-mono">{item.id}</td>
                <td className="px-4 py-3 text-sm text-white max-w-md">
                  <div className="line-clamp-2">{item.content}</div>
                </td>
                <td className="px-4 py-3 text-sm text-cyan-400">{item.source}</td>
                <td className="px-4 py-3 text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleString('da-DK')}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    item.score >= 0.9 ? 'bg-green-500/20 text-green-400' :
                    item.score >= 0.8 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {(item.score * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-300">
                  <span className="px-2 py-1 bg-gray-700 rounded text-xs">{item.category}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {item.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-cyber-blue/20 text-cyber-blue rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Filter className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Ingen vectors matcher dine filtre</p>
          <button
            onClick={() => {
              setSearchQuery('')
              setFilters({ source: '', category: '', tag: '' })
            }}
            className="mt-3 text-cyber-blue hover:text-cyber-blue/80 text-sm"
          >
            Ryd alle filtre
          </button>
        </div>
      )}
    </div>
  )
}
