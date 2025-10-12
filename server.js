import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

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

app.listen(PORT, () => {
  console.log(`Cyberstreams API server running at http://localhost:${PORT}`)
})
