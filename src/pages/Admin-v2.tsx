import React, { useState, useEffect } from 'react'
import { Card } from '@components/Card'
import { Text } from '@components/Text'
import { Button } from '@components/Button'

interface Keyword {
  id: string
  keyword: string
  category: string
  priority: number
  active: boolean
  createdAt: string
}

interface MonitoringSource {
  id: string
  sourceType: 'web' | 'social' | 'documents' | 'darkweb'
  url: string
  scanFrequency: number
  lastScanned: string | null
  active: boolean
}

interface RAGConfig {
  model: string
  temperature: number
  maxTokens: number
  vectorStoreProvider: string
  embeddingModel: string
}

export default function Admin() {
  const [status, setStatus] = useState<string>('')
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [sources, setSources] = useState<MonitoringSource[]>([])
  const [ragConfig, setRagConfig] = useState<RAGConfig>({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000,
    vectorStoreProvider: 'pinecone',
    embeddingModel: 'text-embedding-ada-002'
  })
  
  const [newKeyword, setNewKeyword] = useState({
    keyword: '',
    category: '',
    priority: 1
  })
  
  const [newSource, setNewSource] = useState({
    sourceType: 'web' as 'web' | 'social' | 'documents' | 'darkweb',
    url: '',
    scanFrequency: 3600
  })
  
  const [activeTab, setActiveTab] = useState<'keywords' | 'sources' | 'rag' | 'scraper'>('keywords')

  useEffect(() => {
    fetchKeywords()
    fetchSources()
    fetchRAGConfig()
  }, [])

  async function fetchKeywords() {
    try {
      const res = await fetch('/api/admin/keywords')
      if (res.ok) {
        const data = await res.json()
        setKeywords(data)
      }
    } catch (err) {
      console.error('Error fetching keywords:', err)
    }
  }

  async function fetchSources() {
    try {
      const res = await fetch('/api/admin/sources')
      if (res.ok) {
        const data = await res.json()
        setSources(data)
      }
    } catch (err) {
      console.error('Error fetching sources:', err)
    }
  }

  async function fetchRAGConfig() {
    try {
      const res = await fetch('/api/admin/rag-config')
      if (res.ok) {
        const data = await res.json()
        setRagConfig(data)
      }
    } catch (err) {
      console.error('Error fetching RAG config:', err)
    }
  }

  async function addKeyword() {
    try {
      const res = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newKeyword)
      })
      if (res.ok) {
        await fetchKeywords()
        setNewKeyword({ keyword: '', category: '', priority: 1 })
        setStatus('Søgeord tilføjet')
      }
    } catch (err) {
      setStatus('Fejl ved tilføjelse af søgeord')
    }
  }

  async function deleteKeyword(id: string) {
    try {
      const res = await fetch(`/api/admin/keywords/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchKeywords()
        setStatus('Søgeord slettet')
      }
    } catch (err) {
      setStatus('Fejl ved sletning af søgeord')
    }
  }

  async function toggleKeyword(id: string) {
    try {
      const res = await fetch(`/api/admin/keywords/${id}/toggle`, { method: 'PUT' })
      if (res.ok) {
        await fetchKeywords()
      }
    } catch (err) {
      console.error('Error toggling keyword:', err)
    }
  }

  async function addSource() {
    try {
      const res = await fetch('/api/admin/sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSource)
      })
      if (res.ok) {
        await fetchSources()
        setNewSource({ sourceType: 'web', url: '', scanFrequency: 3600 })
        setStatus('Kilde tilføjet')
      }
    } catch (err) {
      setStatus('Fejl ved tilføjelse af kilde')
    }
  }

  async function deleteSource(id: string) {
    try {
      const res = await fetch(`/api/admin/sources/${id}`, { method: 'DELETE' })
      if (res.ok) {
        await fetchSources()
        setStatus('Kilde slettet')
      }
    } catch (err) {
      setStatus('Fejl ved sletning af kilde')
    }
  }

  async function updateRAGConfig() {
    try {
      const res = await fetch('/api/admin/rag-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ragConfig)
      })
      if (res.ok) {
        setStatus('RAG konfiguration opdateret')
      }
    } catch (err) {
      setStatus('Fejl ved opdatering af RAG konfiguration')
    }
  }

  async function runScraper() {
    setStatus('Kører scraper og RAG processing...')
    try {
      const res = await fetch('/api/run-scraper', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setStatus(`Færdig: ${data.message ?? 'Scraper og RAG processing færdig.'}`)
      } else {
        setStatus(`Fejl: ${res.status} ${res.statusText}`)
      }
    } catch (err: any) {
      setStatus('Fejl: ' + err.message)
    }
  }

  async function runRAGAnalysis() {
    setStatus('Kører RAG analyse på seneste data...')
    try {
      const res = await fetch('/api/admin/run-rag-analysis', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setStatus(`RAG analyse færdig: ${data.processed} dokumenter processeret`)
      } else {
        setStatus(`Fejl: ${res.status} ${res.statusText}`)
      }
    } catch (err: any) {
      setStatus('Fejl: ' + err.message)
    }
  }

  const tabStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    background: isActive ? '#0066cc' : 'transparent',
    color: isActive ? 'white' : '#0066cc',
    border: '1px solid #0066cc',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '8px'
  })

  return (
    <div className="stack" style={{ display: 'grid', gap: '16px' }}>
      <Card>
        <Text variant="title">Administrator Panel</Text>
        <Text>
          Administrer søgeord, overvågningskilder, RAG konfiguration og kør dataindsamling.
        </Text>
        
        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button 
            style={tabStyle(activeTab === 'keywords')}
            onClick={() => setActiveTab('keywords')}
          >
            Søgeord
          </button>
          <button 
            style={tabStyle(activeTab === 'sources')}
            onClick={() => setActiveTab('sources')}
          >
            Kilder
          </button>
          <button 
            style={tabStyle(activeTab === 'rag')}
            onClick={() => setActiveTab('rag')}
          >
            RAG Config
          </button>
          <button 
            style={tabStyle(activeTab === 'scraper')}
            onClick={() => setActiveTab('scraper')}
          >
            Data Indsamling
          </button>
        </div>
        
        {status && (
          <div style={{ 
            marginTop: '16px', 
            padding: '8px', 
            background: status.includes('Fejl') ? '#ffebee' : '#e8f5e9',
            borderRadius: '4px' 
          }}>
            <Text>{status}</Text>
          </div>
        )}
      </Card>

      {activeTab === 'keywords' && (
        <Card>
          <Text variant="subtitle">Søgeord Overvågning</Text>
          
          <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
            <input
              type="text"
              placeholder="Søgeord"
              value={newKeyword.keyword}
              onChange={(e) => setNewKeyword({ ...newKeyword, keyword: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <input
              type="text"
              placeholder="Kategori (f.eks. ransomware, APT)"
              value={newKeyword.category}
              onChange={(e) => setNewKeyword({ ...newKeyword, category: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <select
              value={newKeyword.priority}
              onChange={(e) => setNewKeyword({ ...newKeyword, priority: parseInt(e.target.value) })}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="1">Prioritet: Lav</option>
              <option value="2">Prioritet: Medium</option>
              <option value="3">Prioritet: Høj</option>
            </select>
            <Button onClick={addKeyword}>Tilføj Søgeord</Button>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Text variant="subtitle">Aktive Søgeord</Text>
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Søgeord</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Kategori</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Prioritet</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Status</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {keywords.map(kw => (
                    <tr key={kw.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{kw.keyword}</td>
                      <td style={{ padding: '8px' }}>{kw.category}</td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: kw.priority === 3 ? '#ffebee' : kw.priority === 2 ? '#fff3e0' : '#e8f5e9',
                          fontSize: '0.875rem'
                        }}>
                          {kw.priority === 3 ? 'Høj' : kw.priority === 2 ? 'Medium' : 'Lav'}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: kw.active ? '#e8f5e9' : '#ffebee',
                          fontSize: '0.875rem'
                        }}>
                          {kw.active ? 'Aktiv' : 'Inaktiv'}
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button
                          onClick={() => toggleKeyword(kw.id)}
                          style={{ marginRight: '8px', padding: '4px 8px', cursor: 'pointer' }}
                        >
                          {kw.active ? 'Deaktiver' : 'Aktiver'}
                        </button>
                        <button
                          onClick={() => deleteKeyword(kw.id)}
                          style={{ padding: '4px 8px', cursor: 'pointer', color: 'red' }}
                        >
                          Slet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'sources' && (
        <Card>
          <Text variant="subtitle">Overvågningskilder</Text>
          
          <div style={{ marginTop: '16px', display: 'grid', gap: '8px' }}>
            <select
              value={newSource.sourceType}
              onChange={(e) => setNewSource({ ...newSource, sourceType: e.target.value as any })}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="web">Web</option>
              <option value="social">Social Media</option>
              <option value="documents">Dokumenter</option>
              <option value="darkweb">Dark Web</option>
            </select>
            <input
              type="text"
              placeholder="URL eller sti"
              value={newSource.url}
              onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <input
              type="number"
              placeholder="Scan frekvens (sekunder)"
              value={newSource.scanFrequency}
              onChange={(e) => setNewSource({ ...newSource, scanFrequency: parseInt(e.target.value) })}
              style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            <Button onClick={addSource}>Tilføj Kilde</Button>
          </div>

          <div style={{ marginTop: '24px' }}>
            <Text variant="subtitle">Konfigurerede Kilder</Text>
            <div style={{ overflowX: 'auto', marginTop: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #ddd' }}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>URL/Sti</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Frekvens</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Sidst Scannet</th>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Handlinger</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map(src => (
                    <tr key={src.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '8px' }}>{src.sourceType}</td>
                      <td style={{ padding: '8px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {src.url}
                      </td>
                      <td style={{ padding: '8px' }}>{src.scanFrequency}s</td>
                      <td style={{ padding: '8px' }}>
                        {src.lastScanned ? new Date(src.lastScanned).toLocaleString('da-DK') : 'Aldrig'}
                      </td>
                      <td style={{ padding: '8px' }}>
                        <button
                          onClick={() => deleteSource(src.id)}
                          style={{ padding: '4px 8px', cursor: 'pointer', color: 'red' }}
                        >
                          Slet
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'rag' && (
        <Card>
          <Text variant="subtitle">RAG Konfiguration</Text>
          
          <div style={{ marginTop: '16px', display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>LLM Model:</label>
              <select
                value={ragConfig.model}
                onChange={(e) => setRagConfig({ ...ragConfig, model: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="claude-3">Claude 3</option>
                <option value="llama-2">Llama 2 (Local)</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Temperature (0-1):</label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={ragConfig.temperature}
                onChange={(e) => setRagConfig({ ...ragConfig, temperature: parseFloat(e.target.value) })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Max Tokens:</label>
              <input
                type="number"
                value={ragConfig.maxTokens}
                onChange={(e) => setRagConfig({ ...ragConfig, maxTokens: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Vector Store:</label>
              <select
                value={ragConfig.vectorStoreProvider}
                onChange={(e) => setRagConfig({ ...ragConfig, vectorStoreProvider: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="pinecone">Pinecone</option>
                <option value="weaviate">Weaviate</option>
                <option value="chroma">Chroma</option>
                <option value="pgvector">PostgreSQL pgvector</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '4px' }}>Embedding Model:</label>
              <select
                value={ragConfig.embeddingModel}
                onChange={(e) => setRagConfig({ ...ragConfig, embeddingModel: e.target.value })}
                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="text-embedding-ada-002">OpenAI Ada-002</option>
                <option value="text-embedding-3-small">OpenAI Text-3-Small</option>
                <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (Local)</option>
              </select>
            </div>
            
            <Button onClick={updateRAGConfig}>Gem RAG Konfiguration</Button>
            <Button onClick={runRAGAnalysis}>Kør RAG Analyse Nu</Button>
          </div>
        </Card>
      )}

      {activeTab === 'scraper' && (
        <Card>
          <Text variant="subtitle">Data Indsamling & Processing</Text>
          <Text>
            Klik på knappen nedenfor for at starte dataindsamlingen. Systemet vil:
          </Text>
          <ul style={{ marginTop: '8px', marginBottom: '16px' }}>
            <li>Scanne alle konfigurerede kilder for nye data</li>
            <li>Matche indhold mod aktive søgeord</li>
            <li>Processere data gennem RAG pipeline</li>
            <li>Opdatere vector database med nye embeddings</li>
            <li>Generere alerts for high-priority matches</li>
          </ul>
          <Button onClick={runScraper}>Start Komplet Dataindsamling</Button>
        </Card>
      )}
    </div>
  )
}
