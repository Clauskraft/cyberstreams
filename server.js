import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { randomUUID } from 'crypto'

import logger from './lib/logger.js'
import createMispClient from './lib/mispClient.js'
import createOpenCtiClient from './lib/openCtiClient.js'
import createVectorClient from './lib/vectorClient.js'
import {
  ensureSourcesTable,
  getAuthorizedSources,
  saveAuthorizedSources
} from './lib/authorizedSourceRepository.js'
import { closePool } from './lib/postgres.js'
import IntelScraperService from './lib/intelScraperService.js'
import {
  ensureIntegrationTables,
  listApiKeys,
  upsertApiKey,
  deleteApiKey,
  findApiKey
} from './lib/integrationSettingsRepository.js'

// Fallback sources used until the PostgreSQL repository is populated
const FALLBACK_AUTHORIZED_SOURCES = [
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
const PORT = Number(process.env.PORT || 3000)
const ALLOWED_MISP_OBSERVABLE_TYPES = [
  'ip-src',
  'ip-dst',
  'domain',
  'hostname',
  'url',
  'md5',
  'sha1',
  'sha256',
  'email-src',
  'email-dst'
]

const mispClient = createMispClient()
const openCtiClient = createOpenCtiClient()
const vectorClient = createVectorClient()

const shouldAutoStartIntelScraper = process.env.AUTO_START_INTEL_SCRAPER !== 'false'

const intelScraperService = new IntelScraperService({
  mispClient,
  openCtiClient,
  loadAuthorizedSources
})

try {
  await intelScraperService.init()
  if (shouldAutoStartIntelScraper) {
    intelScraperService
      .start()
      .then(() => {
        logger.info('Intel Scraper auto-started successfully on boot')
      })
      .catch((error) => {
        logger.error({ err: error }, 'Failed to auto-start Intel Scraper during initialization')
      })
  } else {
    logger.info('Intel Scraper auto-start disabled via AUTO_START_INTEL_SCRAPER=false')
  }
} catch (error) {
  logger.error({ err: error }, 'Failed to initialize Intel Scraper service')
}

try {
  const tablesReady = await ensureIntegrationTables()
  if (!tablesReady) {
    logger.warn('Using in-memory storage for integration API keys')
  }
} catch (error) {
  logger.error({ err: error }, 'Failed to ensure integration settings tables exist')
}

const MCP_SERVERS = [
  { id: 'openai', name: 'OpenAI (ChatGPT)' },
  { id: 'anthropic', name: 'Anthropic (Claude)' },
  { id: 'custom_mcp', name: 'Custom MCP Server' }
]

function maskApiKey(value) {
  if (!value) {
    return ''
  }

  const trimmed = value.trim()
  if (trimmed.length <= 4) {
    return '••••'
  }

  const visible = trimmed.slice(-4)
  return `${'•'.repeat(Math.max(4, trimmed.length - 4))}${visible}`
}

function validateMcpKeyFormat(serverId, key) {
  if (!key) {
    return false
  }

  const normalized = key.trim()
  switch (serverId) {
    case 'openai':
      return normalized.startsWith('sk-') && normalized.length > 20
    case 'anthropic':
      return (
        normalized.startsWith('sk-ant-') ||
        normalized.startsWith('anthropic-') ||
        normalized.startsWith('ak-')
      )
    default:
      return normalized.length >= 12
  }
}

// Initialize cache variables before functions that use them
let cachedSources = null
let cachedSourcesLoadedAt = 0
const CACHE_TTL_MS = 5 * 60 * 1000

async function loadAuthorizedSources() {
  const now = Date.now()
  if (cachedSources && now - cachedSourcesLoadedAt < CACHE_TTL_MS) {
    return cachedSources
  }

  try {
    await ensureSourcesTable()
    const sources = await getAuthorizedSources()

    if (!sources.length && process.env.AUTO_SEED_SOURCES !== 'false') {
      await saveAuthorizedSources(FALLBACK_AUTHORIZED_SOURCES)
      cachedSources = FALLBACK_AUTHORIZED_SOURCES
    } else if (!sources.length) {
      cachedSources = FALLBACK_AUTHORIZED_SOURCES
    } else {
      cachedSources = sources
    }

    cachedSourcesLoadedAt = now
    return cachedSources
  } catch (error) {
    logger.error({ err: error }, 'Failed to load authorized sources from PostgreSQL, using fallback list')
    cachedSources = FALLBACK_AUTHORIZED_SOURCES
    cachedSourcesLoadedAt = now
    return cachedSources
  }
}

app.use(cors())
app.use(express.json())

app.get('/api/keys', async (req, res) => {
  try {
    const keys = await listApiKeys()
    const sanitized = keys.map((key) => ({
      name: key.name,
      value: maskApiKey(key.value),
      created: key.created_at
    }))

    res.json({ success: true, data: sanitized })
  } catch (error) {
    logger.error({ err: error }, 'Failed to load integration API keys')
    res.status(500).json({ success: false, error: 'Failed to load API keys' })
  }
})

app.post('/api/keys', async (req, res) => {
  const { name, value } = req.body || {}

  if (typeof name !== 'string' || typeof value !== 'string') {
    return res.status(400).json({ success: false, error: 'name and value must be provided as strings' })
  }

  const trimmedName = name.trim()
  const trimmedValue = value.trim()

  if (!trimmedName || !trimmedValue) {
    return res.status(400).json({ success: false, error: 'Both name and value are required' })
  }

  try {
    const stored = await upsertApiKey(trimmedName, trimmedValue)
    res.status(201).json({
      success: true,
      data: {
        name: stored.name,
        value: maskApiKey(stored.value),
        created: stored.created_at
      }
    })
  } catch (error) {
    logger.error({ err: error, name: trimmedName }, 'Failed to store API key')
    res.status(500).json({ success: false, error: 'Failed to save API key' })
  }
})

app.delete('/api/keys/:name', async (req, res) => {
  const { name } = req.params
  if (!name) {
    return res.status(400).json({ success: false, error: 'Key name is required' })
  }

  try {
    const removed = await deleteApiKey(name)
    if (!removed) {
      return res.status(404).json({ success: false, error: 'API key not found' })
    }

    res.json({ success: true })
  } catch (error) {
    logger.error({ err: error, name }, 'Failed to delete API key')
    res.status(500).json({ success: false, error: 'Failed to delete API key' })
  }
})

app.get('/api/mcp/servers', async (req, res) => {
  try {
    const keys = await listApiKeys()
    const keyNames = new Set(keys.map((key) => key.name))

    const knownServers = MCP_SERVERS.map((server) => ({
      id: server.id,
      name: server.name,
      status: keyNames.has(server.id) ? 'configured' : 'not_configured'
    }))

    const extraServers = keys
      .filter((key) => !MCP_SERVERS.some((server) => server.id === key.name))
      .map((key) => ({
        id: key.name,
        name: `Custom integration (${key.name})`,
        status: 'configured'
      }))

    res.json({ success: true, data: [...knownServers, ...extraServers] })
  } catch (error) {
    logger.error({ err: error }, 'Failed to load MCP servers')
    res.status(500).json({ success: false, error: 'Failed to load MCP servers' })
  }
})

app.post('/api/mcp/test', async (req, res) => {
  const { server, apiKey } = req.body || {}
  const serverId = typeof server === 'string' && server.trim().toLowerCase()

  if (!serverId) {
    return res.status(400).json({ success: false, error: 'server identifier is required' })
  }

  try {
    const storedKey = await findApiKey(serverId)
    const keyToTest = (typeof apiKey === 'string' && apiKey.trim()) || storedKey?.value

    if (!keyToTest) {
      return res.status(400).json({ success: false, error: 'No API key available for validation' })
    }

    if (!validateMcpKeyFormat(serverId, keyToTest)) {
      return res.status(400).json({ success: false, error: 'API key format is invalid for the selected server' })
    }

    res.json({
      success: true,
      message: `API key for ${serverId} passed format validation`
    })
  } catch (error) {
    logger.error({ err: error, serverId }, 'Failed to validate MCP server key')
    res.status(500).json({ success: false, error: 'Failed to validate MCP server key' })
  }
})

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

app.get('/api/config/sources', async (req, res) => {
  try {
    const sources = await loadAuthorizedSources()
    res.json({ success: true, count: sources.length, data: sources })
  } catch (error) {
    logger.error({ err: error }, 'Failed to load authorized sources via API')
    res.status(500).json({ success: false, error: 'Unable to load authorized sources' })
  }
})

app.get('/api/cti/misp/events', async (req, res) => {
  if (!mispClient.isConfigured) {
    return res.status(503).json({ success: false, error: 'MISP integration is not configured' })
  }

  try {
    const events = await mispClient.listEvents({ limit: Number(req.query.limit) || 25 })
    res.json({ success: true, count: events.length, data: events })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch events from MISP via API')
    res.status(502).json({ success: false, error: 'Failed to reach MISP API' })
  }
})

app.get('/api/cti/opencti/observables', async (req, res) => {
  if (!openCtiClient.isConfigured) {
    return res.status(503).json({ success: false, error: 'OpenCTI integration is not configured' })
  }

  try {
    const observables = await openCtiClient.listObservables({
      search: req.query.search,
      first: Number(req.query.first) || 25
    })
    res.json({ success: true, count: observables.length, data: observables })
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch observables from OpenCTI via API')
    res.status(502).json({ success: false, error: 'Failed to reach OpenCTI API' })
  }
})

app.post('/api/cti/misp/observables', async (req, res) => {
  if (!mispClient.isConfigured) {
    return res.status(503).json({ success: false, error: 'MISP integration is not configured' })
  }

  const { value, type, comment, tags } = req.body || {}

  if (typeof value !== 'string' || typeof type !== 'string') {
    return res.status(400).json({ success: false, error: 'value and type must be strings' })
  }

  const trimmedValue = value.trim()
  const normalizedType = type.trim().toLowerCase()

  if (!trimmedValue || !normalizedType) {
    return res.status(400).json({ success: false, error: 'value and type are required fields' })
  }

  if (!ALLOWED_MISP_OBSERVABLE_TYPES.includes(normalizedType)) {
    return res.status(400).json({ success: false, error: 'Invalid observable type' })
  }

  if (comment != null && typeof comment !== 'string') {
    return res.status(400).json({ success: false, error: 'comment must be a string when provided' })
  }

  const sanitizedTags = Array.isArray(tags)
    ? tags
        .map((tag) => (typeof tag === 'string' ? tag.trim() : ''))
        .filter((tag) => Boolean(tag))
    : []

  const sanitizedComment = typeof comment === 'string' ? comment.trim() : undefined

  try {
    const response = await mispClient.pushObservable({
      uuid: randomUUID(),
      value: trimmedValue,
      type: normalizedType,
      comment: sanitizedComment,
      tags: sanitizedTags
    })

    res.status(201).json({ success: true, data: response })
  } catch (error) {
    logger.error({ err: error, value: trimmedValue, type: normalizedType }, 'Failed to create observable in MISP')
    res.status(502).json({ success: false, error: 'Failed to create observable in MISP' })
  }
})

// DAGENS PULS API - HØJTROVÆRDIGE KILDER
class DailyPulseGenerator {
  constructor() {
    this.timezone = 'Europe/Copenhagen'
  }

  // Hovedfunktion til at generere daglig puls
  async getDailyPulse() {
    try {
      const authorizedSources = await loadAuthorizedSources()

      // 1. Hent data fra autoriserede kilder
      const rawDocuments = await this.fetchFromAuthorizedSources(authorizedSources)

      // 2. Filtrer og valider kilder
      const validatedDocuments = this.validateAndFilterSources(rawDocuments, authorizedSources)
      
      // 3. Score og prioriter dokumenter
      const scoredDocuments = this.scoreDocuments(validatedDocuments, authorizedSources)
      
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
        totalSources: authorizedSources.length,
        validDocuments: validatedDocuments.length,
        selectedItems: enrichedPulseItems.length,
        data: enrichedPulseItems,
        lastUpdate: this.getLastUpdateTime(),
        nextUpdate: this.getNextUpdateTime()
      }
    } catch (error) {
      logger.error({ err: error }, 'DailyPulse generation failed')
      return {
        success: false,
        error: error.message,
        fallbackData: this.getFallbackData()
      }
    }
  }

  // Hent data fra autoriserede kilder via MISP, OpenCTI og fallback feeds
  async fetchFromAuthorizedSources(authorizedSources) {
    const [mispEvents, openCtiObservables] = await Promise.all([
      mispClient.listEvents({ limit: 40 }),
      openCtiClient.listObservables({ first: 40 })
    ])

    const mapAuthorizedSource = (domainOrName) => {
      if (!domainOrName) return null
      const normalized = domainOrName.toLowerCase()
      return authorizedSources.find((source) => {
        const domain = typeof source.domain === 'string' ? source.domain.toLowerCase() : ''
        const name = typeof source.name === 'string' ? source.name.toLowerCase() : ''
        return (domain && normalized.includes(domain)) || (name && normalized.includes(name))
      })
    }

    const normalizedMisp = mispEvents.map((event) => {
      const firstAttribute = event.attributes?.[0]
      const summary = event.attributes
        ?.slice(0, 5)
        .map((attr) => `${attr.type}: ${attr.value}`)
        .join('\n')

      const matchedSource = mapAuthorizedSource(event?.tags?.[0]?.name)

      const timestampMs = event.timestamp ? Number(event.timestamp) * 1000 : Date.now()

      return {
        id: event.id,
        title: event.title || 'MISP Event',
        description: summary || 'MISP event without detailed attributes',
        source: matchedSource?.name || 'MISP',
        sourceDomain: matchedSource?.domain || 'misp.internal',
        url: firstAttribute?.value || mispClient.baseUrl,
        timestamp: new Date(timestampMs).toISOString(),
        category: firstAttribute?.category || 'indicator',
        severity: 'high',
        tags: event.tags?.map((tag) => tag.name) || [],
        verified: true
      }
    })

    const normalizedOpenCti = openCtiObservables.map((observable) => {
      const matchedSource = mapAuthorizedSource(observable.creators?.[0])
      const timestamp = observable.updatedAt || observable.createdAt || new Date().toISOString()
      return {
        id: observable.id,
        title: `Observable: ${observable.value}`,
        description: `Observable of type ${observable.type} oprettet ${observable.createdAt}`,
        source: matchedSource?.name || 'OpenCTI',
        sourceDomain: matchedSource?.domain || 'opencti.internal',
        url: process.env.OPENCTI_PUBLIC_URL
          ? `${process.env.OPENCTI_PUBLIC_URL.replace(/\/$/, '')}/dashboard/id/${observable.id}`
          : null,
        timestamp,
        category: 'observable',
        severity: 'medium',
        verified: true
      }
    })

    const combined = [...normalizedMisp, ...normalizedOpenCti]

    if (!combined.length) {
      logger.warn('Falling back to mock documents because no CTI data was returned')
      return this.getFallbackDocuments()
    }

    return combined
  }

  // Validerer og filtrerer kilder for troværdighed
  validateAndFilterSources(documents, authorizedSources) {
    return documents.filter(doc => {
      // 1. Skal være fra autoriseret kilde
      const isAuthorized = authorizedSources.some(source =>
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
  scoreDocuments(documents, authorizedSources) {
    return documents.map(doc => {
      let score = 0

      // Kilde-score (0-40 points)
      const source = authorizedSources.find(s =>
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

  getFallbackDocuments() {
    const now = Date.now()

    return [
      {
        id: 'fallback_cfcs',
        title: 'CFCS udsender midlertidig trusselsopdatering',
        description:
          'Center for Cybersikkerhed opretholder forhøjet opmærksomhedsniveau. Ingen alvorlige hændelser registreret det seneste døgn.',
        source: 'Center for Cybersikkerhed (CFCS)',
        sourceDomain: 'cfcs.dk',
        url: 'https://www.cfcs.dk/',
        timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
        category: 'guidance',
        severity: 'medium',
        verified: true,
        qualityScore: 0.7,
        cves: [],
        cvssScore: 0,
        geography: ['Denmark'],
        affectedSectors: ['government']
      },
      {
        id: 'fallback_enisa',
        title: 'ENISA bekræfter stabil trusselsituation i EU',
        description:
          'ENISA rapporterer ingen kritiske afvigelser i den seneste overvågning af europæiske cybersikkerhedshændelser.',
        source: 'ENISA',
        sourceDomain: 'enisa.europa.eu',
        url: 'https://www.enisa.europa.eu/',
        timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        category: 'update',
        severity: 'low',
        verified: true,
        qualityScore: 0.6,
        cves: [],
        cvssScore: 0,
        geography: ['European Union'],
        affectedSectors: ['information_technology']
      },
      {
        id: 'fallback_cisa',
        title: 'CISA vedligeholder varsel om kendte sårbarheder',
        description:
          'CISA fastholder fokus på patching af kendte sårbarheder. Ingen nye kritiske CVE’er er tilføjet i dag.',
        source: 'CISA',
        sourceDomain: 'cisa.gov',
        url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
        timestamp: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
        category: 'vulnerability',
        severity: 'medium',
        verified: true,
        qualityScore: 0.65,
        cves: [],
        cvssScore: 7.1,
        geography: ['United States'],
        affectedSectors: ['critical_infrastructure']
      }
    ]
  }

  getFallbackData() {
    const data = this.getFallbackDocuments()

    return {
      success: true,
      timestamp: new Date().toISOString(),
      timezone: this.timezone,
      totalSources: FALLBACK_AUTHORIZED_SOURCES.length,
      validDocuments: data.length,
      selectedItems: data.length,
      data,
      lastUpdate: this.getLastUpdateTime(),
      nextUpdate: this.getNextUpdateTime(),
      isFallback: true
    }
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
    logger.error({ err: error }, 'Daily Pulse API error')
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily pulse',
      message: error.message
    })
  }
})

// Intel Scraper API Endpoints
app.get('/api/intel-scraper/status', async (req, res) => {
  try {
    const status = intelScraperService.getStatus()
    res.json({ success: true, data: status })
  } catch (error) {
    logger.error({ err: error }, 'Failed to load Intel Scraper status')
    res.status(500).json({ success: false, error: 'Failed to load Intel Scraper status' })
  }
})

app.post('/api/intel-scraper/start', async (req, res) => {
  try {
    const status = await intelScraperService.start()
    res.json({ success: true, message: 'Intel Scraper started successfully', data: status })
  } catch (error) {
    if (error.message.includes('already running')) {
      return res.status(400).json({ success: false, error: error.message })
    }
    logger.error({ err: error }, 'Failed to start Intel Scraper')
    res.status(500).json({ success: false, error: 'Failed to start Intel Scraper' })
  }
})

app.post('/api/intel-scraper/stop', async (req, res) => {
  try {
    const status = await intelScraperService.stop()
    res.json({ success: true, message: 'Intel Scraper stopped successfully', data: status })
  } catch (error) {
    if (error.message.includes('not running')) {
      return res.status(400).json({ success: false, error: error.message })
    }
    logger.error({ err: error }, 'Failed to stop Intel Scraper')
    res.status(500).json({ success: false, error: 'Failed to stop Intel Scraper' })
  }
})

app.post('/api/intel-scraper/run', async (req, res) => {
  try {
    const status = await intelScraperService.runNow('manual-trigger')
    res.json({ success: true, message: 'Intel Scraper run completed', data: status })
  } catch (error) {
    if (error.message.includes('already processing')) {
      return res.status(409).json({ success: false, error: error.message })
    }
    logger.error({ err: error }, 'Failed to execute manual Intel Scraper run')
    res.status(500).json({ success: false, error: 'Failed to execute manual run' })
  }
})

app.post('/api/intel-scraper/emergency-bypass', async (req, res) => {
  const { reason, duration = 3600000 } = req.body || {}

  if (typeof reason !== 'string' || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'Reason is required for emergency bypass' })
  }

  const durationMs = Number(duration)
  if (!Number.isFinite(durationMs) || durationMs <= 0) {
    return res.status(400).json({ success: false, error: 'duration must be a positive number of milliseconds' })
  }

  try {
    const status = await intelScraperService.enableEmergencyBypass({ reason: reason.trim(), durationMs })
    res.json({
      success: true,
      message: `Emergency bypass enabled for ${Math.round(durationMs / 1000)} seconds`,
      data: status
    })
  } catch (error) {
    if (error.message.includes('already active')) {
      return res.status(409).json({ success: false, error: error.message })
    }
    logger.error({ err: error }, 'Failed to enable emergency bypass')
    res.status(500).json({ success: false, error: 'Failed to enable emergency bypass' })
  }
})

app.get('/api/intel-scraper/approvals', (req, res) => {
  try {
    const approvals = intelScraperService.getPendingApprovals()
    res.json({ success: true, data: approvals })
  } catch (error) {
    logger.error({ err: error }, 'Failed to load scraper approvals')
    res.status(500).json({ success: false, error: 'Failed to load approvals' })
  }
})

app.post('/api/intel-scraper/approvals/:id', async (req, res) => {
  const { id } = req.params
  const { decision, reason } = req.body || {}

  if (!['approve', 'reject'].includes(decision)) {
    return res.status(400).json({ success: false, error: 'Decision must be either "approve" or "reject"' })
  }

  try {
    const result = await intelScraperService.resolveApproval(id, decision, reason)
    res.json({
      success: true,
      message: `Source ${decision}d successfully`,
      data: result.status
    })
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: 'Approval request not found' })
    }
    logger.error({ err: error, id }, 'Failed to process approval decision')
    res.status(500).json({ success: false, error: 'Failed to process approval decision' })
  }
})

app.get('/api/intel-scraper/candidates', (req, res) => {
  try {
    const candidates = intelScraperService.getCandidates()
    res.json({ success: true, data: candidates })
  } catch (error) {
    logger.error({ err: error }, 'Failed to load candidate sources')
    res.status(500).json({ success: false, error: 'Failed to load source candidates' })
  }
})

app.post('/api/intel-scraper/discover', async (req, res) => {
  const { urls = [], keywords = [] } = req.body || {}

  try {
    const candidates = await intelScraperService.discover({
      urls: Array.isArray(urls) ? urls : [],
      keywords: Array.isArray(keywords) ? keywords : []
    })

    res.json({
      success: true,
      message: `Discovery scan completed with ${candidates.length} candidates`,
      data: candidates
    })
  } catch (error) {
    logger.error({ err: error }, 'Failed to run discovery scan')
    res.status(500).json({ success: false, error: 'Failed to run discovery scan' })
  }
})

app.post('/api/intel-scraper/candidates/accept', async (req, res) => {
  const { candidateId, autoApprove = false } = req.body || {}

  if (typeof candidateId !== 'string' || !candidateId.trim()) {
    return res.status(400).json({ success: false, error: 'candidateId is required' })
  }

  try {
    const status = await intelScraperService.acceptCandidate(candidateId.trim(), {
      autoApprove: Boolean(autoApprove)
    })
    res.json({ success: true, message: 'Candidate processed successfully', data: status })
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: 'Candidate not found' })
    }
    logger.error({ err: error, candidateId }, 'Failed to process candidate acceptance')
    res.status(500).json({ success: false, error: 'Failed to process candidate' })
  }
})

app.post('/api/intel-scraper/candidates/dismiss', (req, res) => {
  const { candidateId } = req.body || {}

  if (typeof candidateId !== 'string' || !candidateId.trim()) {
    return res.status(400).json({ success: false, error: 'candidateId is required' })
  }

  try {
    const status = intelScraperService.dismissCandidate(candidateId.trim())
    res.json({ success: true, message: 'Candidate dismissed', data: status })
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({ success: false, error: 'Candidate not found' })
    }
    logger.error({ err: error, candidateId }, 'Failed to dismiss candidate')
    res.status(500).json({ success: false, error: 'Failed to dismiss candidate' })
  }
})

// Serve static files from React app
app.use(express.static('dist'))

// Catch-all route - send all non-API requests to React app
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' })
  }
  res.sendFile('index.html', { root: 'dist' })
})

const server = app.listen(PORT, () => {
  logger.info(`Cyberstreams API server running at http://localhost:${PORT}`)
})

let shuttingDown = false
async function shutdown(signal) {
  if (shuttingDown) {
    return
  }
  shuttingDown = true

  logger.info({ signal }, 'Received shutdown signal, closing server')

  try {
    if (intelScraperService?.status?.isRunning) {
      await intelScraperService.stop()
    }
  } catch (error) {
    logger.warn({ err: error }, 'Failed to stop Intel Scraper gracefully during shutdown')
  }

  server.close(async (closeError) => {
    if (closeError) {
      logger.error({ err: closeError }, 'Error while closing HTTP server')
    }

    try {
      await closePool()
      logger.info('PostgreSQL connection pool closed')
    } catch (error) {
      logger.error({ err: error }, 'Failed to close PostgreSQL connection pool gracefully')
    } finally {
      process.exit(closeError ? 1 : 0)
    }
  })
}

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal).catch((error) => {
      logger.error({ err: error }, 'Unexpected error during shutdown')
      process.exit(1)
    })
  })
})
