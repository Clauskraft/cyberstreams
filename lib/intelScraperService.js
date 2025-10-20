import { randomUUID } from 'crypto'
import logger from './logger.js'
import { saveAuthorizedSources } from './authorizedSourceRepository.js'

function maskDomain(domain) {
  if (!domain) {
    return null
  }
  return domain.replace(/^[^a-z0-9]+/i, '').toLowerCase()
}

function resolveDomainFromUrl(url) {
  if (!url) {
    return null
  }

  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch (error) {
    return null
  }
}

function relativeTimestamp(date) {
  const now = Date.now()
  const timestamp = new Date(date).getTime()
  const diff = now - timestamp
  if (!Number.isFinite(diff)) {
    return 0
  }
  return diff
}

export class IntelScraperService {
  constructor({
    mispClient,
    openCtiClient,
    loadAuthorizedSources,
    pollIntervalMs = 15 * 60 * 1000,
    persistFindings
  }) {
    this.mispClient = mispClient
    this.openCtiClient = openCtiClient
    this.loadAuthorizedSources = loadAuthorizedSources
    this.pollIntervalMs = pollIntervalMs
    this.persistFindings = typeof persistFindings === 'function' ? persistFindings : async () => {}

    this.authorizedSources = []
    this.additionalAuthorizedSources = []
    this.latestFindings = []
    this.pendingApprovals = []
    this.candidates = []
    this.activityLog = []
    this.metrics = {
      totalRuns: 0,
      failedRuns: 0,
      totalDocumentsProcessed: 0,
      lastDocumentCount: 0,
      lastDurationMs: 0,
      averageDocumentsPerRun: 0,
      successRate: 100,
      uptimeStartedAt: null
    }

    this.status = {
      isRunning: false,
      lastActivity: null,
      lastRunAt: null,
      nextRun: null,
      activeJobs: 0,
      totalSources: 0,
      activeSources: 0,
      pendingApprovals: 0,
      complianceEnabled: true,
      emergencyBypass: false,
      emergencyBypassReason: null,
      emergencyBypassExpiresAt: null,
      lastError: null
    }

    this.intervalId = null
    this.emergencyTimer = null
    this.isProcessing = false
  }

  async init() {
    await this.refreshSources()
  }

  async refreshSources() {
    try {
      const sources = await this.loadAuthorizedSources()
      this.authorizedSources = Array.isArray(sources) ? sources : []
    } catch (error) {
      logger.error({ err: error }, 'Failed to refresh authorized sources for IntelScraperService')
      this.authorizedSources = []
    }

    const total = this.authorizedSources.length + this.additionalAuthorizedSources.length
    this.status.totalSources = total
    this.status.activeSources = total
  }

  getAllAuthorizedSources() {
    return [...this.authorizedSources, ...this.additionalAuthorizedSources]
  }

  recordActivity(action, status, details) {
    const entry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      status,
      details
    }

    this.activityLog.unshift(entry)
    if (this.activityLog.length > 50) {
      this.activityLog = this.activityLog.slice(0, 50)
    }
    return entry
  }

  async start() {
    if (this.status.isRunning) {
      throw new Error('Intel Scraper is already running')
    }

    await this.refreshSources()
    this.status.isRunning = true
    this.status.lastActivity = new Date().toISOString()
    this.metrics.uptimeStartedAt = Date.now()

    try {
      await this.executeCycle('manual-start')
    } catch (error) {
      this.status.isRunning = false
      this.metrics.uptimeStartedAt = null
      throw error
    }

    this.scheduleNextRun()
    this.recordActivity('Intel Scraper started', 'success', 'Scheduler enabled')
    return this.getStatus()
  }

  scheduleNextRun() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    if (!this.status.isRunning) {
      this.status.nextRun = null
      return
    }

    this.intervalId = setInterval(() => {
      this.executeCycle('scheduled-run').catch((error) => {
        logger.error({ err: error }, 'Scheduled Intel Scraper run failed')
      })
    }, this.pollIntervalMs)

    this.status.nextRun = new Date(Date.now() + this.pollIntervalMs).toISOString()
  }

  async stop() {
    if (!this.status.isRunning) {
      throw new Error('Intel Scraper is not running')
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.status.isRunning = false
    this.status.activeJobs = 0
    this.status.nextRun = null
    this.status.lastActivity = new Date().toISOString()
    this.metrics.uptimeStartedAt = null

    this.recordActivity('Intel Scraper stopped', 'warning', 'Scheduler disabled by administrator')
    return this.getStatus()
  }

  async runNow(trigger = 'manual-run') {
    await this.refreshSources()
    await this.executeCycle(trigger)
    if (this.status.isRunning) {
      this.scheduleNextRun()
    }
    return this.getStatus()
  }

  async executeCycle(trigger) {
    if (this.isProcessing) {
      throw new Error('Intel Scraper is already processing a job')
    }

    this.isProcessing = true
    this.status.activeJobs = 1
    const start = Date.now()
    const activity = this.recordActivity(`Executing ${trigger}`, 'pending', 'Collecting CTI data')

    try {
      const results = await this.collectIntel()
      this.latestFindings = results

      if (this.persistFindings) {
        try {
          await this.persistFindings(results)
        } catch (persistError) {
          logger.error({ err: persistError }, 'Failed to persist Intel Scraper findings')
          throw persistError
        }
      }

      this.metrics.totalRuns += 1
      this.metrics.totalDocumentsProcessed += this.latestFindings.length
      this.metrics.lastDocumentCount = this.latestFindings.length
      this.metrics.lastDurationMs = Date.now() - start
      this.metrics.averageDocumentsPerRun = Math.round(
        this.metrics.totalDocumentsProcessed / this.metrics.totalRuns
      )
      this.metrics.successRate = Math.round(
        ((this.metrics.totalRuns - this.metrics.failedRuns) / this.metrics.totalRuns) * 1000
      ) / 10

      this.status.lastRunAt = new Date().toISOString()
      this.status.lastActivity = this.status.lastRunAt
      this.status.lastError = null
      this.status.pendingApprovals = this.pendingApprovals.length
      activity.status = 'success'
      activity.details = `Collected ${this.latestFindings.length} documents`
    } catch (error) {
      logger.error({ err: error }, 'Intel Scraper cycle failed')
      this.metrics.failedRuns += 1
      this.status.lastError = error.message
      activity.status = 'error'
      activity.details = error.message
      throw error
    } finally {
      this.status.activeJobs = 0
      this.isProcessing = false
    }
  }

  async collectIntel() {
    const authorizedSources = this.getAllAuthorizedSources()

    const mapAuthorizedSource = (domainOrName) => {
      if (!domainOrName) {
        return null
      }

      const normalized = String(domainOrName).toLowerCase()
      return authorizedSources.find((source) => {
        const domain = typeof source.domain === 'string' ? source.domain.toLowerCase() : ''
        const name = typeof source.name === 'string' ? source.name.toLowerCase() : ''
        return (domain && normalized.includes(domain)) || (name && normalized.includes(name))
      })
    }

    const mispPromise = this.mispClient?.isConfigured
      ? this.mispClient.listEvents({ limit: 40 })
      : Promise.resolve([])
    const openCtiPromise = this.openCtiClient?.isConfigured
      ? this.openCtiClient.listObservables({ first: 40 })
      : Promise.resolve([])

    const [mispEvents, openCtiObservables] = await Promise.all([mispPromise, openCtiPromise])

    const normalizedMisp = (mispEvents || []).map((event) => {
      const firstAttribute = event.attributes?.[0]
      const summary = event.attributes
        ?.slice(0, 5)
        .map((attr) => `${attr.type}: ${attr.value}`)
        .join('\n')

      const matchedSource = mapAuthorizedSource(event?.tags?.[0]?.name)
      const timestampMs = event.timestamp ? Number(event.timestamp) * 1000 : Date.now()

      const url = firstAttribute?.value && typeof firstAttribute.value === 'string'
        ? firstAttribute.value
        : this.mispClient?.baseUrl || null

      return {
        id: event.id || event.uuid || `misp-${randomUUID()}`,
        title: event.title || event.name || 'MISP Event',
        description: summary || 'MISP event without detailed attributes',
        source: matchedSource?.name || 'MISP',
        sourceDomain: matchedSource?.domain || maskDomain(resolveDomainFromUrl(url)) || 'misp.local',
        url,
        timestamp: new Date(timestampMs).toISOString(),
        category: [firstAttribute?.category || 'indicator'],
        severity: 'high',
        verified: true,
        tags: event.tags?.map((tag) => tag.name) || [],
        cves: (event.attributes || [])
          .filter((attr) => attr.type === 'vulnerability' && typeof attr.value === 'string')
          .map((attr) => attr.value),
        iocs: (event.attributes || [])
          .filter((attr) => typeof attr.value === 'string')
          .map((attr) => attr.value),
        origin: 'misp',
        confidence: 70
      }
    })

    const normalizedOpenCti = (openCtiObservables || []).map((observable) => {
      const domain = resolveDomainFromUrl(observable.value)
      const matchedSource = mapAuthorizedSource(observable.creators?.[0])
      const timestamp = observable.updatedAt || observable.createdAt || new Date().toISOString()

      return {
        id: observable.id || `opencti-${randomUUID()}`,
        title: `Observable: ${observable.value}`,
        description: `Observable of type ${observable.type || observable.entity_type}`,
        source: matchedSource?.name || 'OpenCTI',
        sourceDomain: matchedSource?.domain || maskDomain(domain) || 'opencti.local',
        url: null,
        timestamp,
        category: ['observable'],
        severity: 'medium',
        verified: true,
        tags: observable.creators || [],
        cves: [],
        iocs: observable.value ? [observable.value] : [],
        origin: 'opencti',
        confidence: 60
      }
    })

    const combined = [...normalizedMisp, ...normalizedOpenCti]

    this.generateApprovalsAndCandidates(combined, authorizedSources)
    return combined
  }

  generateApprovalsAndCandidates(documents, authorizedSources) {
    const knownDomains = new Set(
      authorizedSources
        .map((source) => maskDomain(source.domain))
        .filter(Boolean)
    )

    const potentialNewSources = documents.filter((doc) => {
      const domain = maskDomain(doc.sourceDomain) || maskDomain(resolveDomainFromUrl(doc.url))
      if (!domain) {
        return false
      }
      return !knownDomains.has(domain)
    })

    this.pendingApprovals = potentialNewSources.slice(0, 5).map((doc) => ({
      id: `approval-${randomUUID()}`,
      type: 'new_source',
      timestamp: doc.timestamp,
      data: {
        url: doc.url || null,
        domain: doc.sourceDomain,
        detectedPurpose: doc.origin === 'misp' ? 'technical' : 'osint',
        initialRelevanceScore: Math.min(0.95, Math.max(0.1, (doc.confidence || 50) / 100)),
        complianceRisk: doc.origin === 'misp' ? 'low' : 'medium'
      },
      status: 'pending'
    }))

    const candidateMap = new Map()
    potentialNewSources.forEach((doc) => {
      const domain = maskDomain(doc.sourceDomain) || maskDomain(resolveDomainFromUrl(doc.url))
      if (!domain || candidateMap.has(domain)) {
        return
      }

      candidateMap.set(domain, {
        id: `candidate-${randomUUID()}`,
        url: doc.url || `https://${domain}`,
        domain,
        detectedPurpose: doc.origin === 'opencti' ? 'technical' : 'osint',
        foundVia: doc.source,
        initialRelevanceScore: Math.min(0.95, Math.max(0.1, (doc.confidence || 50) / 100)),
        complianceRisk: 'medium',
        suggestedKeywords: doc.tags?.slice(0, 5) || []
      })
    })

    this.candidates = Array.from(candidateMap.values())
    this.status.pendingApprovals = this.pendingApprovals.length
  }

  async enableEmergencyBypass({ reason, durationMs }) {
    if (this.status.emergencyBypass) {
      throw new Error('Emergency bypass is already active')
    }

    this.status.emergencyBypass = true
    this.status.complianceEnabled = false
    this.status.emergencyBypassReason = reason
    this.status.emergencyBypassExpiresAt = new Date(Date.now() + durationMs).toISOString()
    this.status.lastActivity = new Date().toISOString()

    if (this.emergencyTimer) {
      clearTimeout(this.emergencyTimer)
    }

    this.emergencyTimer = setTimeout(() => {
      this.disableEmergencyBypass('Automatic timeout reached')
    }, durationMs)

    this.recordActivity('Emergency bypass enabled', 'warning', reason)
    return this.getStatus()
  }

  disableEmergencyBypass(message = 'Emergency bypass disabled') {
    if (this.emergencyTimer) {
      clearTimeout(this.emergencyTimer)
      this.emergencyTimer = null
    }

    this.status.emergencyBypass = false
    this.status.complianceEnabled = true
    this.status.emergencyBypassReason = null
    this.status.emergencyBypassExpiresAt = null
    this.status.lastActivity = new Date().toISOString()

    this.recordActivity('Emergency bypass disabled', 'success', message)
    return this.getStatus()
  }

  getStatus() {
    const uptimeSeconds = this.metrics.uptimeStartedAt
      ? Math.floor((Date.now() - this.metrics.uptimeStartedAt) / 1000)
      : 0

    return {
      ...this.status,
      metrics: {
        totalRuns: this.metrics.totalRuns,
        failedRuns: this.metrics.failedRuns,
        totalDocumentsProcessed: this.metrics.totalDocumentsProcessed,
        lastDocumentCount: this.metrics.lastDocumentCount,
        lastDurationMs: this.metrics.lastDurationMs,
        averageDocumentsPerRun: this.metrics.averageDocumentsPerRun,
        successRate: this.metrics.successRate,
        uptimeSeconds
      },
      activity: [...this.activityLog],
      latestFindings: [...this.latestFindings],
      pendingApprovals: [...this.pendingApprovals],
      candidates: [...this.candidates]
    }
  }

  getPendingApprovals() {
    return [...this.pendingApprovals]
  }

  async resolveApproval(id, decision, reason) {
    const approvalIndex = this.pendingApprovals.findIndex((item) => item.id === id)
    if (approvalIndex === -1) {
      throw new Error('Approval request not found')
    }

    const approval = this.pendingApprovals[approvalIndex]
    this.pendingApprovals.splice(approvalIndex, 1)
    this.status.pendingApprovals = this.pendingApprovals.length

    if (decision === 'approve') {
      const domain = approval.data?.domain || resolveDomainFromUrl(approval.data?.url)
      if (domain) {
        const newSource = {
          id: `auto_${domain}_${Date.now()}`,
          name: domain,
          domain,
          type: approval.data?.detectedPurpose === 'technical' ? 'rss' : 'osint',
          credibilityScore: Math.round((approval.data?.initialRelevanceScore || 0.5) * 100),
          timelinessScore: 60,
          accuracyScore: 60,
          contextScore: 50,
          relevanceScore: Math.round((approval.data?.initialRelevanceScore || 0.5) * 100),
          rssUrl: approval.data?.url,
          apiUrl: null,
          formats: ['html'],
          updateFrequency: 60,
          logoUrl: null,
          verified: true,
          priority: 'medium',
          geography: [],
          sectors: [],
          languages: []
        }

        this.additionalAuthorizedSources.push(newSource)
        try {
          await saveAuthorizedSources([newSource])
        } catch (error) {
          logger.warn({ err: error }, 'Failed to persist newly approved source')
        }

        await this.refreshSources()
      }

      this.recordActivity('Source approval granted', 'success', `${approval.data?.domain || 'unknown'} approved`)
    } else {
      this.recordActivity('Source approval rejected', 'warning', `${approval.data?.domain || 'unknown'} rejected`)
    }

    return {
      decision,
      reason: reason || null,
      status: this.getStatus()
    }
  }

  getCandidates() {
    return [...this.candidates]
  }

  async discover({ urls = [], keywords = [] }) {
    const generated = []

    urls.forEach((url) => {
      const domain = maskDomain(resolveDomainFromUrl(url))
      if (!domain) {
        return
      }
      generated.push({
        id: `candidate-${randomUUID()}`,
        url,
        domain,
        detectedPurpose: 'technical',
        foundVia: 'manual_discovery',
        initialRelevanceScore: 0.6,
        complianceRisk: 'medium',
        suggestedKeywords: keywords || []
      })
    })

    if (!generated.length && keywords.length) {
      this.latestFindings
        .filter((finding) => {
          const text = `${finding.title} ${finding.description}`.toLowerCase()
          return keywords.some((keyword) => text.includes(keyword.toLowerCase()))
        })
        .forEach((finding) => {
          const domain = maskDomain(finding.sourceDomain) || maskDomain(resolveDomainFromUrl(finding.url))
          if (!domain) {
            return
          }

          generated.push({
            id: `candidate-${randomUUID()}`,
            url: finding.url || `https://${domain}`,
            domain,
            detectedPurpose: finding.origin === 'opencti' ? 'technical' : 'osint',
            foundVia: 'keyword_match',
            initialRelevanceScore: Math.min(0.95, Math.max(0.2, (finding.confidence || 50) / 100)),
            complianceRisk: 'medium',
            suggestedKeywords: keywords
          })
        })
    }

    if (generated.length) {
      const merged = [...generated, ...this.candidates]
      const uniqueByDomain = new Map()
      merged.forEach((candidate) => {
        if (!uniqueByDomain.has(candidate.domain)) {
          uniqueByDomain.set(candidate.domain, candidate)
        }
      })
      this.candidates = Array.from(uniqueByDomain.values())
      this.recordActivity('Discovery scan completed', 'success', `${generated.length} candidates added`)
    } else {
      this.recordActivity('Discovery scan completed', 'warning', 'No new candidates discovered')
    }

    return this.getCandidates()
  }

  async acceptCandidate(candidateId, { autoApprove = false } = {}) {
    const index = this.candidates.findIndex((candidate) => candidate.id === candidateId)
    if (index === -1) {
      throw new Error('Candidate not found')
    }

    const candidate = this.candidates[index]
    this.candidates.splice(index, 1)

    if (autoApprove) {
      const newSource = {
        id: `auto_${candidate.domain}_${Date.now()}`,
        name: candidate.domain,
        domain: candidate.domain,
        type: candidate.detectedPurpose === 'technical' ? 'rss' : 'osint',
        credibilityScore: Math.round((candidate.initialRelevanceScore || 0.5) * 100),
        timelinessScore: 60,
        accuracyScore: 60,
        contextScore: 50,
        relevanceScore: Math.round((candidate.initialRelevanceScore || 0.5) * 100),
        rssUrl: candidate.url,
        apiUrl: null,
        formats: ['html'],
        updateFrequency: 60,
        logoUrl: null,
        verified: true,
        priority: 'medium',
        geography: [],
        sectors: [],
        languages: []
      }

      this.additionalAuthorizedSources.push(newSource)
      try {
        await saveAuthorizedSources([newSource])
      } catch (error) {
        logger.warn({ err: error }, 'Failed to persist auto-approved candidate source')
      }

      await this.refreshSources()
      this.recordActivity('Candidate auto-approved', 'success', `${candidate.domain} added directly`)
    } else {
      const approval = {
        id: `approval-${randomUUID()}`,
        type: 'new_source',
        timestamp: new Date().toISOString(),
        data: {
          url: candidate.url,
          domain: candidate.domain,
          detectedPurpose: candidate.detectedPurpose,
          initialRelevanceScore: candidate.initialRelevanceScore,
          complianceRisk: candidate.complianceRisk
        },
        status: 'pending'
      }
      this.pendingApprovals.push(approval)
      this.status.pendingApprovals = this.pendingApprovals.length
      this.recordActivity('Candidate submitted for approval', 'pending', `${candidate.domain} awaiting review`)
    }

    return this.getStatus()
  }

  dismissCandidate(candidateId) {
    const index = this.candidates.findIndex((candidate) => candidate.id === candidateId)
    if (index === -1) {
      throw new Error('Candidate not found')
    }

    const [candidate] = this.candidates.splice(index, 1)
    this.recordActivity('Candidate dismissed', 'warning', `${candidate.domain} removed from queue`)
    return this.getStatus()
  }
}

export default IntelScraperService
