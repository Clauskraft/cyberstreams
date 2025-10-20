import React, { useState, useEffect } from 'react'
import { Settings, Database, Search, Play, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'

interface Keyword {
  id: number
  keyword: string
  category: string
  priority: number
  active: boolean
  created_at: string
}

interface Source {
  id: number
  source_type: string
  url: string
  scan_frequency: number
  last_scanned: string | null
  active: boolean
  created_at: string
}

interface RAGConfig {
  model: string
  temperature: string
  max_tokens: string
  vector_store_provider: string
  embedding_model: string
}

export default function AdminV2Page() {
  const [activeTab, setActiveTab] = useState<'keywords' | 'sources' | 'rag' | 'analysis'>('keywords')
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [sources, setSources] = useState<Source[]>([])
  const [ragConfig, setRagConfig] = useState<RAGConfig>({
    model: 'gpt-4',
    temperature: '0.7',
    max_tokens: '2000',
    vector_store_provider: 'pgvector',
    embedding_model: 'text-embedding-ada-002'
  })
  const [loading, setLoading] = useState(false)
  const [newKeyword, setNewKeyword] = useState({ keyword: '', category: '', priority: 1 })
  const [newSource, setNewSource] = useState({ sourceType: '', url: '', scanFrequency: 3600 })

  // Load data on component mount
  useEffect(() => {
    loadKeywords()
    loadSources()
    loadRAGConfig()
  }, [])

  const loadKeywords = async () => {
    try {
      const response = await fetch('/api/admin/keywords')
      const data = await response.json()
      if (data.success) {
        setKeywords(data.data)
      }
    } catch (error) {
      console.error('Error loading keywords:', error)
    }
  }

  const loadSources = async () => {
    try {
      const response = await fetch('/api/admin/sources')
      const data = await response.json()
      if (data.success) {
        setSources(data.data)
      }
    } catch (error) {
      console.error('Error loading sources:', error)
    }
  }

  const loadRAGConfig = async () => {
    try {
      const response = await fetch('/api/admin/rag-config')
      const data = await response.json()
      if (data.success) {
        setRagConfig(data.data)
      }
    } catch (error) {
      console.error('Error loading RAG config:', error)
    }
  }

  const addKeyword = async () => {
    if (!newKeyword.keyword.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyword)
      })
      const data = await response.json()
      if (data.success) {
        setKeywords([data.data, ...keywords])
        setNewKeyword({ keyword: '', category: '', priority: 1 })
      }
    } catch (error) {
      console.error('Error adding keyword:', error)
    } finally {
      setLoading(false)
    }
  }

  const addSource = async () => {
    if (!newSource.url.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      })
      const data = await response.json()
      if (data.success) {
        setSources([data.data, ...sources])
        setNewSource({ sourceType: '', url: '', scanFrequency: 3600 })
      }
    } catch (error) {
      console.error('Error adding source:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteKeyword = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/keywords/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setKeywords(keywords.filter(k => k.id !== id))
      }
    } catch (error) {
      console.error('Error deleting keyword:', error)
    }
  }

  const deleteSource = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/sources/${id}`, { method: 'DELETE' })
      if (response.ok) {
        setSources(sources.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('Error deleting source:', error)
    }
  }

  const toggleKeyword = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/keywords/${id}/toggle`, { method: 'PUT' })
      const data = await response.json()
      if (data.success) {
        setKeywords(keywords.map(k => k.id === id ? data.data : k))
      }
    } catch (error) {
      console.error('Error toggling keyword:', error)
    }
  }

  const updateRAGConfig = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/rag-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ragConfig)
      })
      if (response.ok) {
        alert('RAG configuration updated successfully')
      }
    } catch (error) {
      console.error('Error updating RAG config:', error)
    } finally {
      setLoading(false)
    }
  }

  const runRAGAnalysis = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/run-rag-analysis', { method: 'POST' })
      const data = await response.json()
      if (data.success) {
        alert('RAG analysis completed successfully')
      }
    } catch (error) {
      console.error('Error running RAG analysis:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin v2.0</h1>
          <p className="text-gray-600">Advanced configuration and management for Cyberstreams v2.0</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'keywords', label: 'Keywords', icon: Search },
                { id: 'sources', label: 'Sources', icon: Database },
                { id: 'rag', label: 'RAG Config', icon: Settings },
                { id: 'analysis', label: 'Analysis', icon: Play }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Keywords Tab */}
            {activeTab === 'keywords' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Monitoring Keywords</h2>
                  <div className="flex space-x-3">
                    <input
                      type="text"
                      placeholder="Keyword"
                      value={newKeyword.keyword}
                      onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      value={newKeyword.category}
                      onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      placeholder="Priority"
                      value={newKeyword.priority}
                      onChange={(e) => setNewKeyword({ ...newKeyword, priority: parseInt(e.target.value) || 1 })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-20"
                    />
                    <button
                      onClick={addKeyword}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-4">
                    {keywords.map((keyword) => (
                      <div key={keyword.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => toggleKeyword(keyword.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            {keyword.active ? (
                              <ToggleRight className="w-5 h-5 text-green-500" />
                            ) : (
                              <ToggleLeft className="w-5 h-5" />
                            )}
                          </button>
                          <div>
                            <div className="font-medium text-gray-900">{keyword.keyword}</div>
                            <div className="text-sm text-gray-500">
                              {keyword.category} • Priority: {keyword.priority}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteKeyword(keyword.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Sources Tab */}
            {activeTab === 'sources' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Monitoring Sources</h2>
                  <div className="flex space-x-3">
                    <select
                      value={newSource.sourceType}
                      onChange={(e) => setNewSource({ ...newSource, sourceType: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      <option value="rss">RSS Feed</option>
                      <option value="twitter">Twitter</option>
                      <option value="website">Website</option>
                      <option value="api">API</option>
                    </select>
                    <input
                      type="url"
                      placeholder="URL"
                      value={newSource.url}
                      onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                    />
                    <input
                      type="number"
                      placeholder="Frequency (seconds)"
                      value={newSource.scanFrequency}
                      onChange={(e) => setNewSource({ ...newSource, scanFrequency: parseInt(e.target.value) || 3600 })}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-32"
                    />
                    <button
                      onClick={addSource}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 gap-4">
                    {sources.map((source) => (
                      <div key={source.id} className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{source.source_type}</div>
                          <div className="text-sm text-gray-500">{source.url}</div>
                          <div className="text-xs text-gray-400">
                            Frequency: {source.scan_frequency}s • 
                            Last scanned: {source.last_scanned ? new Date(source.last_scanned).toLocaleString() : 'Never'}
                          </div>
                        </div>
                        <button
                          onClick={() => deleteSource(source.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* RAG Config Tab */}
            {activeTab === 'rag' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">RAG Configuration</h2>
                  <button
                    onClick={updateRAGConfig}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Save Configuration
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <select
                      value={ragConfig.model}
                      onChange={(e) => setRagConfig({ ...ragConfig, model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="2"
                      value={ragConfig.temperature}
                      onChange={(e) => setRagConfig({ ...ragConfig, temperature: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
                    <input
                      type="number"
                      value={ragConfig.max_tokens}
                      onChange={(e) => setRagConfig({ ...ragConfig, max_tokens: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vector Store Provider</label>
                    <select
                      value={ragConfig.vector_store_provider}
                      onChange={(e) => setRagConfig({ ...ragConfig, vector_store_provider: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="pgvector">PostgreSQL + pgvector</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Embedding Model</label>
                    <select
                      value={ragConfig.embedding_model}
                      onChange={(e) => setRagConfig({ ...ragConfig, embedding_model: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="text-embedding-ada-002">text-embedding-ada-002</option>
                      <option value="text-embedding-3-small">text-embedding-3-small</option>
                      <option value="text-embedding-3-large">text-embedding-3-large</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Tab */}
            {activeTab === 'analysis' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">RAG Analysis</h2>
                  <button
                    onClick={runRAGAnalysis}
                    disabled={loading}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>Run Analysis</span>
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="text-center">
                    <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Run RAG Analysis</h3>
                    <p className="text-gray-600 mb-4">
                      Execute RAG analysis on configured keywords and sources to generate intelligence insights.
                    </p>
                    <div className="text-sm text-gray-500">
                      This will process all active keywords against configured sources and generate AI-powered analysis.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
