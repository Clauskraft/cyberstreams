import React, { useState } from 'react'
import { ExternalLink, CheckCircle, XCircle, Clock, AlertTriangle, Loader } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'

interface LinkResult {
  url: string
  valid: boolean
  reachable: boolean
  statusCode?: number
  responseTime?: number
  hasSSL: boolean
  error?: string
  contentType?: string
  redirectsTo?: string
}

/**
 * Link Checker Component
 * Validates URLs and shows detailed results
 */
export const LinkChecker: React.FC = () => {
  const [urlInput, setUrlInput] = useState('')
  const [bulkUrls, setBulkUrls] = useState('')
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<LinkResult[]>([])
  const [stats, setStats] = useState<{
    total: number
    valid: number
    reachable: number
  } | null>(null)

  const testSingleLink = async () => {
    if (!urlInput.trim()) return

    setTesting(true)
    try {
      const response = await fetch('/api/validate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput.trim() })
      })
      const result = await response.json()

      if (result.success) {
        setResults([result.data])
        setStats({ total: 1, valid: result.data.valid ? 1 : 0, reachable: result.data.reachable ? 1 : 0 })
      }
    } catch (error) {
      console.error('Link validation failed:', error)
    } finally {
      setTesting(false)
    }
  }

  const testBulkLinks = async () => {
    const urls = bulkUrls.split('\n').map(u => u.trim()).filter(u => u.length > 0)
    if (urls.length === 0) return

    setTesting(true)
    try {
      const response = await fetch('/api/validate-links-bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      })
      const result = await response.json()

      if (result.success) {
        setResults(result.data.results)
        setStats({
          total: result.data.total,
          valid: result.data.valid,
          reachable: result.data.reachable
        })
      }
    } catch (error) {
      console.error('Bulk validation failed:', error)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Single Link Test */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Test Enkelt Link</h3>
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && testSingleLink()}
            placeholder="https://example.com"
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-cyber-blue focus:outline-none"
          />
          <Button onClick={testSingleLink} disabled={testing}>
            {testing ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
            Test Link
          </Button>
        </div>
      </Card>

      {/* Bulk Link Test */}
      <Card>
        <h3 className="text-lg font-semibold mb-4">Test Flere Links (Bulk)</h3>
        <textarea
          value={bulkUrls}
          onChange={(e) => setBulkUrls(e.target.value)}
          placeholder="Indtast flere URLs (én per linje)&#10;https://example1.com&#10;https://example2.com&#10;https://example3.com"
          rows={6}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:border-cyber-blue focus:outline-none font-mono text-sm"
        />
        <div className="mt-3 flex justify-between items-center">
          <span className="text-sm text-gray-400">
            Max 50 links per request
          </span>
          <Button onClick={testBulkLinks} disabled={testing}>
            {testing ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <ExternalLink className="w-4 h-4 mr-2" />}
            Test Alle Links
          </Button>
        </div>
      </Card>

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Total Tested</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Valid URLs</div>
            <div className="text-2xl font-bold text-green-400">{stats.valid}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
            <div className="text-xs text-gray-400 mb-1">Reachable</div>
            <div className="text-2xl font-bold text-cyan-400">{stats.reachable}</div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold mb-4">Validation Results</h3>
          <div className="space-y-2">
            {results.map((result, idx) => (
              <div
                key={idx}
                className="bg-gray-800 p-3 rounded border border-gray-700 flex items-start gap-3"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 mt-1">
                  {result.reachable ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : result.valid ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>

                {/* URL and Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm text-white truncate">{result.url}</span>
                    {result.hasSSL && (
                      <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">SSL</span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    {result.statusCode && (
                      <span className="flex items-center gap-1">
                        Status: <span className={result.reachable ? 'text-green-400' : 'text-red-400'}>{result.statusCode}</span>
                      </span>
                    )}
                    {result.responseTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {result.responseTime}ms
                      </span>
                    )}
                    {result.contentType && (
                      <span>Type: {result.contentType.split(';')[0]}</span>
                    )}
                    {result.error && (
                      <span className="text-red-400">Error: {result.error}</span>
                    )}
                  </div>

                  {result.redirectsTo && (
                    <div className="mt-2 text-xs text-yellow-400">
                      → Redirects to: {result.redirectsTo}
                    </div>
                  )}
                </div>

                {/* Open Link */}
                <button
                  onClick={() => window.open(result.url, '_blank')}
                  className="flex-shrink-0 p-2 hover:bg-gray-700 rounded transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
