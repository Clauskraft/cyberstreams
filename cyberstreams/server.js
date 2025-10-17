import express from 'express'
import cors from 'cors'

// Import our source validation (note: will need to be converted to JS or use babel)
// For now, inline the validation logic
const AUTHORIZED_SOURCES = [
  {
    id: 'cfcs_dk',
    name: 'Center for Cybersikkerhed (CFCS)',
    domain: 'cfcs.dk',
    credibilityScore: 98,
    verified: true,
    priority: 'critical'
  },
  {
    id: 'enisa_eu', 
    name: 'ENISA',
    domain: 'enisa.europa.eu',
    credibilityScore: 96,
    verified: true,
    priority: 'critical'
  },
  {
    id: 'cert_eu',
    name: 'CERT-EU', 
    domain: 'cert.europa.eu',
    credibilityScore: 94,
    verified: true,
    priority: 'high'
  },
  {
    id: 'cisa_us',
    name: 'CISA',
    domain: 'cisa.gov', 
    credibilityScore: 97,
    verified: true,
    priority: 'high'
  },
  {
    id: 'nvd_nist',
    name: 'National Vulnerability Database',
    domain: 'nvd.nist.gov',
    credibilityScore: 99,
    verified: true,
    priority: 'high'
  }
]

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

// DAGENS PULS API - HØJTROVÆRDIGE KILDER
class DailyPulseGenerator {
  constructor() {
    this.timezone = 'Europe/Copenhagen'
  }

  // Hovedfunktion til at generere daglig puls
  async getDailyPulse() {
    try {
      // 1. Hent data fra autoriserede kilder
      const rawDocuments = await this.fetchFromAuthorizedSources()
      
      // 2. Filtrer og valider kilder
      const validatedDocuments = this.validateAndFilterSources(rawDocuments)
      
      // 3. Score og prioriter dokumenter
      const scoredDocuments = this.scoreDocuments(validatedDocuments)
      
      // 4. Udvælg top 5-7 dokumenter
      const selectedDocuments = this.selectTopDocuments(scoredDocuments, 7)
      
      // 5. Generér summariseringer
      const pulseItems = await this.generateSummaries(selectedDocuments)
      
      // 6. Tilføj visuelle metadata
      const enrichedPulseItems = this.enrichWithVisualAssets(pulseItems)
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        timezone: this.timezone,
        totalSources: AUTHORIZED_SOURCES.length,
        validDocuments: validatedDocuments.length,
        selectedItems: enrichedPulseItems.length,
        data: enrichedPulseItems,
        lastUpdate: this.getLastUpdateTime(),
        nextUpdate: this.getNextUpdateTime()
      }
    } catch (error) {
      console.error('DailyPulse generation failed:', error)
      return {
        success: false,
        error: error.message,
        fallbackData: this.getFallbackData()
      }
    }
  }

  // Hent data fra autoriserede kilder (simuleret)
  async fetchFromAuthorizedSources() {
    // I rigtig implementation ville dette hente fra RSS feeds, APIs, og vector database
    const mockDocuments = [
      {
        id: 'doc_1',
        title: 'Kritisk sårbarhed i Microsoft Exchange Server',
        description: 'Microsoft har udgivet en emergency patch til Exchange Server efter opdagelse af en zero-day sårbarhed der aktivt udnyttes.',
        content: 'CVE-2024-1234 er en kritisk remote code execution sårbarhed i Microsoft Exchange Server 2019 og 2022. Sårbarheden har en CVSS score på 9.8 og er aktivt udnyttet i the wild.',
        source: 'Microsoft Security Response Center',
        sourceDomain: 'msrc.microsoft.com',
        url: 'https://msrc.microsoft.com/update-guide/vulnerability/CVE-2024-1234',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'vulnerability',
        severity: 'critical',
        cves: ['CVE-2024-1234'],
        cvssScore: 9.8,
        affectedProducts: ['Exchange Server 2019', 'Exchange Server 2022'],
        verified: true
      },
      {
        id: 'doc_2', 
        title: 'ENISA udgiver ny guide til AI cybersikkerhed',
        description: 'ENISA har publiceret en omfattende guide til sikring af AI-systemer mod cybertrusler i EU.',
        source: 'ENISA',
        sourceDomain: 'enisa.europa.eu',
        url: 'https://enisa.europa.eu/publications/ai-cybersecurity-guidelines-2024',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        category: 'guidance',
        severity: 'medium',
        verified: true
      },
      {
        id: 'doc_3',
        title: 'Ny ransomware-kampagne retter mod danske kommuner', 
        description: 'CFCS advarer om målrettet ransomware-kampagne der udnytter VPN-sårbarheder i danske kommuner.',
        source: 'Center for Cybersikkerhed (CFCS)',
        sourceDomain: 'cfcs.dk',
        url: 'https://cfcs.dk/da/nyheder/ransomware-kommuner-2024',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        category: 'incident',
        severity: 'high',
        affectedSectors: ['government', 'municipal'],
        geography: ['Denmark'],
        verified: true
      },
      {
        id: 'doc_4',
        title: 'CISA udgiver Emergency Directive for kritisk infrastruktur',
        description: 'CISA har udstedt en binding sikkerhedsdirektiv efter opdagelse af aktive angreb mod energisektoren.',
        source: 'CISA',
        sourceDomain: 'cisa.gov',
        url: 'https://cisa.gov/emergency-directive-24-01',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        category: 'directive',
        severity: 'critical',
        affectedSectors: ['energy', 'critical_infrastructure'],
        geography: ['United States'],
        verified: true
      },
      {
        id: 'doc_5',
        title: 'NVD opdaterer CVSS score for kritiske sårbarheder',
        description: 'National Vulnerability Database har opdateret severitetsscores for flere høj-profil sårbarheder.',
        source: 'National Vulnerability Database',
        sourceDomain: 'nvd.nist.gov', 
        url: 'https://nvd.nist.gov/vuln/detail/CVE-2024-5678',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        category: 'update',
        severity: 'high',
        cves: ['CVE-2024-5678', 'CVE-2024-5679'],
        verified: true
      }
    ]

    return mockDocuments
  }

  // Validerer og filtrerer kilder for troværdighed
  validateAndFilterSources(documents) {
    return documents.filter(doc => {
      // 1. Skal være fra autoriseret kilde
      const isAuthorized = AUTHORIZED_SOURCES.some(source => 
        doc.sourceDomain.includes(source.domain) || 
        doc.source.toLowerCase().includes(source.name.toLowerCase())
      )
      
      if (!isAuthorized) return false

      // 2. Filtrer mock/test data ud
      const mockIndicators = ['mock', 'test', 'dummy', 'example', 'lorem']
      const text = (doc.title + ' ' + doc.description).toLowerCase()
      const isMockData = mockIndicators.some(indicator => text.includes(indicator))
      
      if (isMockData) return false

      // 3. Skal være verified
      if (!doc.verified) return false

      // 4. Ikke ældre end 7 dage
      const age = Date.now() - new Date(doc.timestamp).getTime()
      const daysOld = age / (1000 * 60 * 60 * 24)
      if (daysOld > 7) return false

      return true
    })
  }

  // Scorer dokumenter baseret på troværdighed og relevans
  scoreDocuments(documents) {
    return documents.map(doc => {
      let score = 0

      // Kilde-score (0-40 points)
      const source = AUTHORIZED_SOURCES.find(s => 
        doc.sourceDomain.includes(s.domain)
      )
      if (source) {
        score += Math.round((source.credibilityScore / 100) * 40)
        if (source.priority === 'critical') score += 10
        else if (source.priority === 'high') score += 5
      }

      // Severity score (0-30 points) 
      if (doc.severity === 'critical') score += 30
      else if (doc.severity === 'high') score += 20
      else if (doc.severity === 'medium') score += 10

      // Relevans score (0-20 points)
      if (doc.geography && doc.geography.includes('Denmark')) {
        score += 20
      } else if (doc.geography && doc.geography.includes('European Union')) {
        score += 15
      }

      // CVE score (0-10 points)
      if (doc.cves && doc.cves.length > 0) score += 10
      if (doc.cvssScore && doc.cvssScore >= 9.0) score += 5

      // Timeliness score (0-10 points)
      const age = Date.now() - new Date(doc.timestamp).getTime()
      const hoursOld = age / (1000 * 60 * 60)
      if (hoursOld < 2) score += 10
      else if (hoursOld < 6) score += 8
      else if (hoursOld < 24) score += 5

      return { ...doc, qualityScore: score }
    })
  }

  // Udvælger top dokumenter
  selectTopDocuments(scoredDocuments, maxCount = 7) {
    return scoredDocuments
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, maxCount)
  }

  // Genererer summariseringer (simuleret AI)
  async generateSummaries(documents) {
    return documents.map(doc => {
      let summary = ''
      
      // Generate contextual summary based on category and severity
      switch (doc.category) {
        case 'vulnerability':
          summary = `${doc.cves?.[0] || 'Sårbarhed'} i ${doc.affectedProducts?.[0] || 'flere systemer'}. ${doc.severity === 'critical' ? 'Øjeblikkelig patching påkrævet.' : 'Opdater snarest muligt.'}`
          break
        case 'incident':
          summary = `Sikkerhedsincident påvirker ${doc.affectedSectors?.[0] || 'organisationer'}. ${doc.geography?.[0] === 'Denmark' ? 'Danske virksomheder særligt i fokus.' : 'Internationale implikationer.'}`
          break
        case 'directive':
          summary = `Ny sikkerhedsdirektiv kræver handling inden ${doc.severity === 'critical' ? '72 timer' : 'nærmeste fremtid'}. Påvirker ${doc.affectedSectors?.[0] || 'kritisk infrastruktur'}.`
          break
        case 'guidance':
          summary = `Ny vejledning til ${doc.title.includes('AI') ? 'AI-sikkerhed' : 'cybersikkerhed'} fra ${doc.source}. Praktiske anbefalinger til implementering.`
          break
        default:
          summary = doc.description.substring(0, 120) + '...'
      }

      return {
        id: doc.id,
        title: doc.title,
        summary,
        category: doc.category,
        severity: doc.severity,
        source: doc.source,
        timestamp: doc.timestamp,
        relativeTime: this.getRelativeTime(doc.timestamp),
        url: doc.url,
        verified: doc.verified,
        qualityScore: doc.qualityScore,
        tags: this.generateTags(doc)
      }
    })
  }

  // Tilføjer visuelle assets
  enrichWithVisualAssets(pulseItems) {
    return pulseItems.map(item => ({
      ...item,
      categoryIcon: this.getCategoryIcon(item.category),
      severityColor: this.getSeverityColor(item.severity),
      sourceIcon: this.getSourceIcon(item.source)
    }))
  }

  // Helper funktioner
  getSourceIcon(sourceDomain) {
    const iconMap = {
      'cfcs.dk': 'shield',
      'enisa.europa.eu': 'shield-check', 
      'cert.europa.eu': 'shield-alert',
      'cisa.gov': 'flag',
      'nvd.nist.gov': 'database',
      'msrc.microsoft.com': 'building'
    }
    return iconMap[sourceDomain] || 'shield'
  }

  getCategoryIcon(category) {
    const iconMap = {
      'vulnerability': 'bug',
      'incident': 'alert-triangle', 
      'directive': 'megaphone',
      'guidance': 'book-open',
      'regulation': 'scale',
      'update': 'refresh-cw'
    }
    return iconMap[category] || 'info'
  }

  getSeverityColor(severity) {
    const colorMap = {
      'critical': 'bg-red-600',
      'high': 'bg-orange-500',
      'medium': 'bg-yellow-500', 
      'low': 'bg-blue-500'
    }
    return colorMap[severity] || 'bg-gray-500'
  }

  getRelativeTime(timestamp) {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now - time
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Mindre end 1 time siden'
    if (diffHours < 24) return `${diffHours} time${diffHours > 1 ? 'r' : ''} siden`
    if (diffDays < 7) return `${diffDays} dag${diffDays > 1 ? 'e' : ''} siden`
    return time.toLocaleDateString('da-DK')
  }

  generateTags(doc) {
    const tags = []
    if (doc.cves?.length > 0) tags.push('CVE')
    if (doc.cvssScore >= 9.0) tags.push('Critical CVSS')
    if (doc.geography?.includes('Denmark')) tags.push('Danmark')
    if (doc.affectedSectors?.includes('government')) tags.push('Offentlig sektor')
    return tags
  }

  getLastUpdateTime() {
    const today = new Date()
    const lastUpdate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0, 0)
    if (today.getHours() < 7) {
      lastUpdate.setDate(lastUpdate.getDate() - 1)
    }
    return lastUpdate.toISOString()
  }

  getNextUpdateTime() {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(7, 0, 0, 0)
    return tomorrow.toISOString()
  }

  getFallbackData() {
    return [{
      id: 'fallback_1',
      title: 'Dagens Puls midlertidigt utilgængelig',
      summary: 'Vi arbejder på at genoprettte dagens sikkerhedsoversigt. Tjek tilbage om lidt.',
      category: 'system',
      severity: 'low',
      source: 'Cyberstreams System',
      timestamp: new Date().toISOString(),
      verified: false
    }]
  }
}

// Instantiate pulse generator
const pulseGenerator = new DailyPulseGenerator()

// API Endpoint for Daily Pulse
app.get('/api/daily-pulse', async (req, res) => {
  try {
    const pulseData = await pulseGenerator.getDailyPulse()
    res.json(pulseData)
  } catch (error) {
    console.error('Daily Pulse API error:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily pulse',
      message: error.message
    })
  }
})

// Intel Scraper API Endpoints
let intelScraperInstance = null
let scraperStatus = {
  isRunning: false,
  totalSources: 18,
  activeSources: 15,
  activeJobs: 0,
  pendingApprovals: 3,
  complianceEnabled: true,
  emergencyBypass: false,
  lastActivity: new Date().toISOString()
}

// Get Intel Scraper status
app.get('/api/intel-scraper/status', (req, res) => {
  res.json({
    success: true,
    data: scraperStatus
  })
})

// Start Intel Scraper
app.post('/api/intel-scraper/start', async (req, res) => {
  try {
    if (scraperStatus.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Intel Scraper is already running'
      })
    }

    // Simulate starting the scraper
    scraperStatus.isRunning = true
    scraperStatus.activeJobs = 2
    scraperStatus.lastActivity = new Date().toISOString()

    res.json({
      success: true,
      message: 'Intel Scraper started successfully',
      data: scraperStatus
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Stop Intel Scraper
app.post('/api/intel-scraper/stop', async (req, res) => {
  try {
    if (!scraperStatus.isRunning) {
      return res.status(400).json({
        success: false,
        error: 'Intel Scraper is not running'
      })
    }

    // Simulate stopping the scraper
    scraperStatus.isRunning = false
    scraperStatus.activeJobs = 0
    scraperStatus.lastActivity = new Date().toISOString()

    res.json({
      success: true,
      message: 'Intel Scraper stopped successfully',
      data: scraperStatus
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Emergency compliance bypass
app.post('/api/intel-scraper/emergency-bypass', async (req, res) => {
  try {
    const { reason, duration = 3600000 } = req.body

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Reason is required for emergency bypass'
      })
    }

    scraperStatus.emergencyBypass = true
    scraperStatus.complianceEnabled = false
    scraperStatus.lastActivity = new Date().toISOString()

    // Auto-disable after specified duration
    setTimeout(() => {
      scraperStatus.emergencyBypass = false
      scraperStatus.complianceEnabled = true
      scraperStatus.lastActivity = new Date().toISOString()
    }, duration)

    res.json({
      success: true,
      message: `Emergency bypass enabled for ${duration / 1000} seconds`,
      data: {
        ...scraperStatus,
        bypassReason: reason,
        bypassDuration: duration
      }
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Get pending approvals
app.get('/api/intel-scraper/approvals', (req, res) => {
  const mockApprovals = [
    {
      id: 'approval_1',
      type: 'new_source',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      data: {
        url: 'https://security-weekly.dk/threats',
        domain: 'security-weekly.dk',
        detectedPurpose: 'technical',
        initialRelevanceScore: 0.72,
        complianceRisk: 'low'
      },
      status: 'pending'
    },
    {
      id: 'approval_2',
      type: 'new_source',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
      data: {
        url: 'http://darkmarket.onion/intel',
        domain: 'darkmarket.onion',
        detectedPurpose: 'unknown',
        initialRelevanceScore: 0.45,
        complianceRisk: 'high'
      },
      status: 'pending'
    }
  ]

  res.json({
    success: true,
    data: mockApprovals
  })
})

// Process approval decision
app.post('/api/intel-scraper/approvals/:id', (req, res) => {
  const { id } = req.params
  const { decision, reason } = req.body

  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({
      success: false,
      error: 'Decision must be either "approve" or "reject"'
    })
  }

  // Simulate processing approval
  scraperStatus.pendingApprovals = Math.max(0, scraperStatus.pendingApprovals - 1)
  
  if (decision === 'approve') {
    scraperStatus.totalSources += 1
    scraperStatus.activeSources += 1
  }

  scraperStatus.lastActivity = new Date().toISOString()

  res.json({
    success: true,
    message: `Source ${decision}d successfully`,
    data: {
      approvalId: id,
      decision,
      reason,
      updatedStatus: scraperStatus
    }
  })
})

// Get source candidates
app.get('/api/intel-scraper/candidates', (req, res) => {
  const mockCandidates = [
    {
      url: 'https://cybersecurity-news.eu/rss',
      domain: 'cybersecurity-news.eu',
      detectedPurpose: 'technical',
      foundVia: 'https://cfcs.dk/threat-analysis-2024',
      initialRelevanceScore: 0.83,
      complianceRisk: 'low',
      suggestedKeywords: ['cybersecurity', 'threats', 'vulnerabilities']
    },
    {
      url: 'https://politiken.dk/indland/it-politik/rss',
      domain: 'politiken.dk',
      detectedPurpose: 'political',
      foundVia: 'auto_discovery',
      initialRelevanceScore: 0.67,
      complianceRisk: 'low',
      suggestedKeywords: ['it-politik', 'digitalisering', 'lovgivning']
    }
  ]

  res.json({
    success: true,
    data: mockCandidates
  })
})

// Run source discovery scan
app.post('/api/intel-scraper/discover', async (req, res) => {
  try {
    const { urls, keywords } = req.body

    // Simulate discovery process
    await new Promise(resolve => setTimeout(resolve, 2000))

    const discoveredSources = [
      {
        url: 'https://new-tech-blog.com/security',
        domain: 'new-tech-blog.com',
        detectedPurpose: 'technical',
        foundVia: urls?.[0] || 'manual_scan',
        initialRelevanceScore: 0.65,
        complianceRisk: 'low',
        suggestedKeywords: keywords || ['security', 'technology']
      }
    ]

    res.json({
      success: true,
      message: `Discovered ${discoveredSources.length} new source candidates`,
      data: discoveredSources
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.listen(PORT, () => {
  console.log(`Cyberstreams API server running at http://localhost:${PORT}`)
})
