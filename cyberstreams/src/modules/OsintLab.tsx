import { useEffect, useMemo, useState } from 'react'
import catalogData from '@data/osint_catalog.json'

export type CatalogEntry = {
  source_id: string
  name: string
  url: string
  category: string
  subcategory?: string | null
  license?: string | null
  description?: string | null
  tags: string[]
  reliability?: string | null
  sensitivity?: string | null
  playbook: string[]
  last_synced_at?: string | null
}

type RunRecord = {
  id: number
  source_id: string
  source_name: string
  action: string
  status: 'queued' | 'blocked'
  timestamp: string
  operator: string
  notes?: string | null
}

const STORAGE_KEY = 'osintLab.licenseAccepted'

const downloadBlob = (payload: string, filename: string, mime: string) => {
  const blob = new Blob([payload], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const toCsv = (entries: CatalogEntry[]) => {
  const header = ['Name', 'Category', 'Subcategory', 'License', 'Reliability', 'Sensitivity', 'URL', 'Tags']
  const rows = entries.map((entry) => [
    entry.name,
    entry.category,
    entry.subcategory ?? '',
    entry.license ?? '',
    entry.reliability ?? '',
    entry.sensitivity ?? '',
    entry.url,
    entry.tags.join('; '),
  ])
  return [header, ...rows].map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\n')
}

const uniqueValues = (entries: CatalogEntry[], selector: (entry: CatalogEntry) => string | undefined | null) => {
  const result = new Set<string>()
  entries.forEach((entry) => {
    const value = selector(entry)
    if (value) {
      result.add(value)
    }
  })
  return Array.from(result).sort((a, b) => a.localeCompare(b))
}

const typedCatalog = catalogData as CatalogEntry[]

const OsintLab = () => {
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [licenseFilter, setLicenseFilter] = useState('all')
  const [reliabilityFilter, setReliabilityFilter] = useState('all')
  const [sensitivityFilter, setSensitivityFilter] = useState('all')
  const [licenseAccepted, setLicenseAccepted] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  })
  const [selectedSource, setSelectedSource] = useState<CatalogEntry | null>(null)
  const [runHistory, setRunHistory] = useState<RunRecord[]>([])
  const [operator, setOperator] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(STORAGE_KEY, licenseAccepted ? 'true' : 'false')
  }, [licenseAccepted])

  const categories = useMemo(() => uniqueValues(typedCatalog, (entry) => entry.category), [])
  const licenses = useMemo(() => uniqueValues(typedCatalog, (entry) => entry.license ?? undefined), [])
  const reliabilities = useMemo(() => uniqueValues(typedCatalog, (entry) => entry.reliability ?? undefined), [])
  const sensitivities = useMemo(() => uniqueValues(typedCatalog, (entry) => entry.sensitivity ?? undefined), [])

  const filteredCatalog = useMemo(() => {
    return typedCatalog.filter((entry) => {
      const matchesQuery =
        !query ||
        entry.name.toLowerCase().includes(query.toLowerCase()) ||
        (entry.description ?? '').toLowerCase().includes(query.toLowerCase()) ||
        entry.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter
      const matchesLicense = licenseFilter === 'all' || entry.license === licenseFilter
      const matchesReliability = reliabilityFilter === 'all' || entry.reliability === reliabilityFilter
      const matchesSensitivity = sensitivityFilter === 'all' || entry.sensitivity === sensitivityFilter
      return matchesQuery && matchesCategory && matchesLicense && matchesReliability && matchesSensitivity
    })
  }, [query, categoryFilter, licenseFilter, reliabilityFilter, sensitivityFilter])

  const handleRun = (entry: CatalogEntry) => {
    if (!licenseAccepted) {
      alert('You must acknowledge the license policy before running playbooks.')
      return
    }
    const timestamp = new Date().toISOString()
    const run: RunRecord = {
      id: runHistory.length + 1,
      source_id: entry.source_id,
      source_name: entry.name,
      action: 'default',
      status: 'queued',
      timestamp,
      operator: operator || 'anonymous',
      notes: notes || undefined,
    }
    setRunHistory((history) => [run, ...history].slice(0, 25))
  }

  const handleExport = (format: 'json' | 'csv') => {
    if (format === 'json') {
      downloadBlob(JSON.stringify(filteredCatalog, null, 2), 'osint-catalog.json', 'application/json')
    } else {
      downloadBlob(toCsv(filteredCatalog), 'osint-catalog.csv', 'text/csv')
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-cyber-blue/20 bg-cyber-dark/60 p-6 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-cyber-blue">OsintLab</h2>
            <p className="text-sm text-gray-400">
              Search curated intelligence sources, review safety guardrails, and orchestrate compliant collection runs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('json')}
              className="rounded-lg border border-cyber-blue/40 px-4 py-2 text-sm font-medium text-cyber-blue transition hover:bg-cyber-blue/10"
            >
              Export JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="rounded-lg border border-cyber-purple/40 px-4 py-2 text-sm font-medium text-cyber-purple transition hover:bg-cyber-purple/10"
            >
              Export CSV
            </button>
          </div>
        </div>
      </header>

      <section className="grid gap-6 rounded-2xl border border-gray-800 bg-cyber-dark/40 p-6 shadow-inner lg:grid-cols-4">
        <div className="lg:col-span-2">
          <label className="block text-sm font-medium text-gray-300">Search</label>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, description, or tag"
            className="mt-2 w-full rounded-lg border border-gray-700 bg-cyber-darker px-4 py-2 text-sm text-white focus:border-cyber-blue focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Category</label>
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-700 bg-cyber-darker px-4 py-2 text-sm text-white focus:border-cyber-blue focus:outline-none"
          >
            <option value="all">All</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">License</label>
          <select
            value={licenseFilter}
            onChange={(event) => setLicenseFilter(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-700 bg-cyber-darker px-4 py-2 text-sm text-white focus:border-cyber-blue focus:outline-none"
          >
            <option value="all">All</option>
            {licenses.map((license) => (
              <option key={license} value={license}>
                {license}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Reliability</label>
          <select
            value={reliabilityFilter}
            onChange={(event) => setReliabilityFilter(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-700 bg-cyber-darker px-4 py-2 text-sm text-white focus:border-cyber-blue focus:outline-none"
          >
            <option value="all">All</option>
            {reliabilities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300">Sensitivity</label>
          <select
            value={sensitivityFilter}
            onChange={(event) => setSensitivityFilter(event.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-700 bg-cyber-darker px-4 py-2 text-sm text-white focus:border-cyber-blue focus:outline-none"
          >
            <option value="all">All</option>
            {sensitivities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-4 rounded-2xl border border-gray-800 bg-cyber-dark/40 p-6 shadow-inner lg:col-span-3">
          <h3 className="text-lg font-semibold text-white">Catalog</h3>
          <p className="text-xs text-gray-400">{filteredCatalog.length} sources match the applied filters.</p>
          <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: '32rem' }}>
            {filteredCatalog.map((entry) => (
              <button
                key={entry.source_id}
                onClick={() => setSelectedSource(entry)}
                className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                  selectedSource?.source_id === entry.source_id
                    ? 'border-cyber-blue bg-cyber-blue/10'
                    : 'border-gray-800 bg-cyber-darker/40 hover:border-cyber-blue/40 hover:bg-cyber-blue/5'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-white">{entry.name}</h4>
                    <p className="text-xs text-gray-400">{entry.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-cyber-blue/10 px-2 py-1 text-[10px] uppercase tracking-wide text-cyber-blue">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>{entry.category}</p>
                    {entry.subcategory && <p>{entry.subcategory}</p>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border border-cyber-blue/30 bg-cyber-dark/40 p-6 shadow-inner">
            <h3 className="text-lg font-semibold text-white">Safety & License Controls</h3>
            <p className="mt-2 text-xs text-gray-400">
              Cyberstreams enforces mandatory license acceptance and restricts execution of sensitive sources to
              compliance-approved operators. Review the policy checklist and acknowledge before triggering any playbooks.
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-300">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={licenseAccepted}
                  onChange={(event) => setLicenseAccepted(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-cyber-darker text-cyber-blue focus:ring-cyber-blue"
                />
                I acknowledge the vendor licensing requirements and agree to follow the Cyberstreams acceptable use
                policy.
              </label>
              <label className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-gray-400">Operator</span>
                <input
                  type="text"
                  value={operator}
                  onChange={(event) => setOperator(event.target.value)}
                  placeholder="Analyst handle"
                  className="flex-1 rounded-lg border border-gray-700 bg-cyber-darker px-3 py-2 text-sm text-white focus:border-cyber-blue focus:outline-none"
                />
              </label>
              <label className="flex items-start gap-2">
                <span className="mt-1 text-xs uppercase tracking-wider text-gray-400">Notes</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Optional collection notes"
                  className="flex-1 rounded-lg border border-gray-700 bg-cyber-darker px-3 py-2 text-sm text-white focus:border-cyber-blue focus:outline-none"
                  rows={3}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-cyber-dark/40 p-6 shadow-inner">
            <h3 className="text-lg font-semibold text-white">Run History</h3>
            <p className="text-xs text-gray-400">Recent orchestrations executed through OsintLab.</p>
            <div className="mt-3 space-y-3 text-sm text-gray-300">
              {runHistory.length === 0 ? (
                <p className="text-xs text-gray-500">No runs queued yet.</p>
              ) : (
                runHistory.map((run) => (
                  <div key={run.id} className="rounded-xl border border-gray-700 bg-cyber-darker/60 px-3 py-2">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{new Date(run.timestamp).toLocaleString()}</span>
                      <span className={run.status === 'queued' ? 'text-cyber-blue' : 'text-red-400'}>{run.status}</span>
                    </div>
                    <p className="mt-1 font-medium text-white">{run.source_name}</p>
                    <p className="text-xs text-gray-400">Action: {run.action}</p>
                    {run.notes && <p className="text-xs text-gray-500">Notes: {run.notes}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {selectedSource && (
        <section className="rounded-2xl border border-cyber-purple/30 bg-cyber-dark/40 p-6 shadow-inner">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-cyber-purple">{selectedSource.name}</h3>
              <p className="text-sm text-gray-300">{selectedSource.description}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-400">
                <span className="rounded-md border border-cyber-blue/40 px-2 py-1 text-cyber-blue">
                  {selectedSource.category}
                </span>
                {selectedSource.subcategory && (
                  <span className="rounded-md border border-cyber-purple/40 px-2 py-1 text-cyber-purple">
                    {selectedSource.subcategory}
                  </span>
                )}
                {selectedSource.license && <span className="rounded-md border border-gray-700 px-2 py-1">{selectedSource.license}</span>}
                {selectedSource.reliability && (
                  <span className="rounded-md border border-emerald-500/40 px-2 py-1 text-emerald-400">
                    Reliability: {selectedSource.reliability}
                  </span>
                )}
                {selectedSource.sensitivity && (
                  <span className="rounded-md border border-amber-500/40 px-2 py-1 text-amber-300">
                    Sensitivity: {selectedSource.sensitivity}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href={selectedSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-cyber-blue/40 px-4 py-2 text-sm font-medium text-cyber-blue transition hover:bg-cyber-blue/10"
              >
                Visit Source
              </a>
              <button
                onClick={() => handleRun(selectedSource)}
                disabled={!licenseAccepted}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  licenseAccepted
                    ? 'border border-cyber-purple/40 text-cyber-purple hover:bg-cyber-purple/10'
                    : 'cursor-not-allowed border border-gray-700 text-gray-500'
                }`}
              >
                Queue Run
              </button>
            </div>
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-white">Playbook Steps</h4>
              <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm text-gray-300">
                {selectedSource.playbook.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Operational Guidance</h4>
              <ul className="mt-2 space-y-2 text-sm text-gray-300">
                <li>Ensure compliance has approved sensitive collections before queueing restricted feeds.</li>
                <li>Audit logs are generated for every search, info lookup, and execution request.</li>
                <li>Export data only through sanctioned channels (JSON or CSV downloads capture applied filters).</li>
              </ul>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

export default OsintLab
