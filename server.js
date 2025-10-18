import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// In-memory storage for API keys (use database in production)
const apiKeys = new Map()

// Mock data for pulse endpoint
const mockPulseData = [
  {
    id: '1',
    title: 'New Ransomware Strain Targeting Healthcare',
    category: 'Ransomware',
    severity: 'critical',
    source: 'Dark Web Forum Alpha',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    description: 'A new ransomware variant specifically targeting hospital systems has been detected.',
  },
  {
    id: '2',
    title: 'Major Data Breach: 500K User Records Leaked',
    category: 'Data Leak',
    severity: 'high',
    source: 'Breach Database',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    description: 'Credentials from a major e-commerce platform have surfaced on underground markets.',
  },
  {
    id: '3',
    title: 'Zero-Day Exploit Being Sold',
    category: 'Exploit',
    severity: 'critical',
    source: 'Exploit Market',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    description: 'A previously unknown vulnerability in common enterprise software is being auctioned.',
  },
  {
    id: '4',
    title: 'Phishing Campaign Targeting Financial Sector',
    category: 'Phishing',
    severity: 'high',
    source: 'Threat Intelligence Feed',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    description: 'Sophisticated phishing emails mimicking bank communications detected.',
  },
  {
    id: '5',
    title: 'Botnet Infrastructure Update',
    category: 'Malware',
    severity: 'medium',
    source: 'C2 Tracker',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    description: 'Major botnet has shifted to new command and control servers.',
  },
]

// API Routes
app.get('/api/pulse', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: mockPulseData,
    count: mockPulseData.length,
  })
})

app.get('/api/daily-pulse', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    timezone: 'Europe/Copenhagen',
    totalSources: 5,
    validDocuments: mockPulseData.length,
    selectedItems: mockPulseData.length,
    data: mockPulseData.map(item => ({
      ...item,
      summary: item.description,
      category: 'incident',
      sourceIcon: 'shield',
      categoryIcon: 'alert-triangle',
      severityColor: 'bg-red-500',
      relativeTime: item.timestamp,
      url: item.url || '#',
      verified: true,
      qualityScore: 95,
      tags: [item.category]
    })),
    lastUpdate: new Date().toISOString(),
    nextUpdate: new Date(Date.now() + 60 * 60 * 1000).toISOString()
  })
})

app.get('/api/threats', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      total: 156,
      critical: 12,
      high: 34,
      medium: 78,
      low: 32,
    },
  })
})

app.get('/api/stats', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      activeSources: 89,
      protectedSystems: 2400,
      trendScore: 94,
      lastUpdate: new Date().toISOString(),
    },
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    status: 'operational',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  })
})

// API Key Management Endpoints
app.get('/api/keys', (req, res) => {
  const keys = Array.from(apiKeys.entries()).map(([name, key]) => ({
    name,
    value: key.substring(0, 10) + '...' + key.substring(key.length - 4), // Masked
    created: new Date().toISOString()
  }))
  res.json({ success: true, data: keys })
})

app.post('/api/keys', (req, res) => {
  const { name, value } = req.body
  if (!name || !value) {
    return res.status(400).json({ success: false, error: 'Name and value required' })
  }
  apiKeys.set(name, value)
  res.json({ success: true, message: 'API key saved successfully' })
})

app.delete('/api/keys/:name', (req, res) => {
  const { name } = req.params
  if (apiKeys.has(name)) {
    apiKeys.delete(name)
    res.json({ success: true, message: 'API key deleted' })
  } else {
    res.status(404).json({ success: false, error: 'Key not found' })
  }
})

// MCP Server Integration Endpoints
app.get('/api/mcp/servers', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'openai', name: 'OpenAI (ChatGPT)', status: apiKeys.has('openai') ? 'configured' : 'not_configured' },
      { id: 'anthropic', name: 'Anthropic (Claude)', status: apiKeys.has('anthropic') ? 'configured' : 'not_configured' },
      { id: 'custom_mcp', name: 'Custom MCP Server', status: apiKeys.has('custom_mcp') ? 'configured' : 'not_configured' }
    ]
  })
})

app.post('/api/mcp/test', (req, res) => {
  const { server, apiKey } = req.body
  // Simulate MCP test
  res.json({
    success: true,
    message: `Connection to ${server} tested successfully`,
    data: { latency: '45ms', status: 'operational' }
  })
})

// Serve static files from dist directory (MUST be after API routes)
app.use(express.static(path.join(__dirname, 'dist')))

// Serve index.html for all non-API routes (React Router catch-all)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Cyberstreams API server running at http://localhost:${PORT}`)
})
