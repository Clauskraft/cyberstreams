/**
 * DAGENS PULS - SCHEDULED DAILY JOB
 * Daglig job der kører kl. 07:00 CET og udvælger dagens vigtigste sikkerhedsnyheder
 */

// For now, use simple setTimeout instead of node-cron for browser compatibility
// In a real backend implementation, use node-cron

interface ScheduledTask {
  stop(): void
}

export class DailyPulseScheduler {
  private job: ScheduledTask | null = null
  private isRunning: boolean = false
  private lastRun: Date | null = null
  private nextRun: Date | null = null
  private timezone: string

  constructor() {
    this.timezone = 'Europe/Copenhagen'
  }

  /**
   * Starter den daglige scheduler (07:00 CET)
   */
  start() {
    if (this.job) {
      console.log('Daily Pulse Scheduler is already running')
      return
    }

    // Simplified scheduler using setTimeout for browser compatibility
    const scheduleNextRun = () => {
      const now = new Date()
      const target = new Date(now)
      target.setHours(7, 0, 0, 0)
      
      // If it's past 07:00 today, schedule for tomorrow
      if (now.getHours() >= 7) {
        target.setDate(target.getDate() + 1)
      }
      
      const msUntilTarget = target.getTime() - now.getTime()
      
      const timeoutId = setTimeout(async () => {
        await this.runDailyPulseGeneration()
        scheduleNextRun() // Schedule next run
      }, msUntilTarget)
      
      this.job = {
        stop: () => clearTimeout(timeoutId)
      }
      
      this.nextRun = target
    }

    scheduleNextRun()
    console.log(`Daily Pulse Scheduler started - next run: ${this.nextRun?.toLocaleString('da-DK')}`)
  }

  /**
   * Stopper scheduleren
   */
  stop() {
    if (this.job) {
      this.job.stop()
      this.job = null
      console.log('Daily Pulse Scheduler stopped')
    }
  }

  /**
   * Kører daglig puls generation manuelt
   */
  async runManually() {
    if (this.isRunning) {
      throw new Error('Daily pulse generation is already running')
    }

    return await this.runDailyPulseGeneration()
  }

  /**
   * Henter scheduler status
   */
  getStatus() {
    return {
      isScheduled: this.job !== null,
      isRunning: this.isRunning,
      lastRun: this.lastRun?.toISOString(),
      nextRun: this.nextRun?.toISOString(),
      timezone: 'Europe/Copenhagen'
    }
  }

  /**
   * Hovedfunktion der kører den daglige generation
   */
  private async runDailyPulseGeneration() {
    if (this.isRunning) {
      console.log('Daily pulse generation already in progress, skipping')
      return
    }

    console.log('🌅 Starting Daily Pulse Generation for', new Date().toLocaleDateString('da-DK'))
    this.isRunning = true
    this.lastRun = new Date()

    try {
      // 1. Hent fresh data fra alle autoriserede kilder
      const sourceData = await this.fetchFromAllSources()
      
      // 2. Kør kvalitetsfiltrering
      const validatedData = await this.runQualityFiltering(sourceData)
      
      // 3. Score og prioriter baseret på relevans
      const scoredData = await this.runRelevanceScoring(validatedData)
      
      // 4. Udvælg top 5-7 dokumenter
      const selectedDocuments = this.selectTopDocuments(scoredData, 7)
      
      // 5. Generer AI-summariseringer
      const summarizedDocuments = await this.generateAISummaries(selectedDocuments)
      
      // 6. Gem resultater til cache/database
      await this.cacheDailyPulse(summarizedDocuments)
      
      // 7. Send notifikationer hvis kritiske alerts
      await this.sendCriticalAlerts(summarizedDocuments)

      console.log(`✅ Daily Pulse Generation completed: ${summarizedDocuments.length} items selected`)
      
      // Beregn næste kørsel
      this.calculateNextRun()

      return {
        success: true,
        itemsSelected: summarizedDocuments.length,
        sourcesFetched: sourceData.length,
        validatedItems: validatedData.length,
        timestamp: new Date().toISOString()
      }

    } catch (error) {
      console.error('❌ Daily Pulse Generation failed:', error)
      
      // Send fejl-notifikation
      await this.sendErrorNotification(error)
      
      throw error
    } finally {
      this.isRunning = false
    }
  }

  /**
   * Henter data fra alle autoriserede kilder
   */
  private async fetchFromAllSources() {
    console.log('📡 Fetching from authorized sources...')
    
    // Simuleret data fetching - i rigtig implementation ville dette hente fra:
    // - RSS feeds (CFCS, ENISA, CERT-EU, etc.)
    // - API endpoints (NVD, CISA, etc.)
    // - Vector database queries
    const mockSourceData = [
      {
        id: `daily_${Date.now()}_1`,
        title: 'Kritisk sårbarhed opdaget i Microsoft Exchange',
        content: 'Microsoft har udgivet emergency patches for Exchange Server efter opdagelse af aktiv udnyttelse...',
        source: 'Microsoft Security Response Center',
        sourceDomain: 'msrc.microsoft.com',
        timestamp: new Date().toISOString(),
        category: 'vulnerability',
        severity: 'critical',
        verified: true,
        cves: ['CVE-2024-9999']
      },
      {
        id: `daily_${Date.now()}_2`,
        title: 'ENISA udgiver nye retningslinjer for AI-sikkerhed',
        content: 'European Union Agency for Cybersecurity har publiceret omfattende guidelines...',
        source: 'ENISA',
        sourceDomain: 'enisa.europa.eu',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        category: 'guidance',
        severity: 'medium',
        verified: true
      },
      {
        id: `daily_${Date.now()}_3`,
        title: 'CFCS advarer om målrettede angreb mod danske virksomheder',
        content: 'Center for Cybersikkerhed har identificeret en koordineret kampagne...',
        source: 'CFCS',
        sourceDomain: 'cfcs.dk',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        category: 'incident',
        severity: 'high',
        verified: true,
        geography: ['Denmark']
      }
    ]

    // Simuler netværksdelay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    console.log(`📊 Fetched ${mockSourceData.length} documents from sources`)
    return mockSourceData
  }

  /**
   * Kører kvalitetsfiltrering baseret på kilde-troværdighed
   */
  private async runQualityFiltering(sourceData: any[]) {
    console.log('🔍 Running quality filtering...')
    
    const AUTHORIZED_DOMAINS = [
      'cfcs.dk', 'enisa.europa.eu', 'cert.europa.eu', 
      'cisa.gov', 'nvd.nist.gov', 'msrc.microsoft.com'
    ]

    const filtered = sourceData.filter(item => {
      // 1. Skal være fra autoriseret domæne
      const isAuthorized = AUTHORIZED_DOMAINS.some(domain => 
        item.sourceDomain?.includes(domain)
      )
      
      // 2. Skal være verified
      if (!item.verified) return false
      
      // 3. Ikke ældre end 7 dage
      const age = Date.now() - new Date(item.timestamp).getTime()
      if (age > 7 * 24 * 60 * 60 * 1000) return false
      
      // 4. Filtrer mock/test data
      const content = (item.title + ' ' + item.content).toLowerCase()
      const mockIndicators = ['test', 'mock', 'dummy', 'example']
      if (mockIndicators.some(indicator => content.includes(indicator))) return false
      
      return isAuthorized
    })

    console.log(`✅ Quality filtering: ${filtered.length}/${sourceData.length} items passed`)
    return filtered
  }

  /**
   * Scorer dokumenter baseret på relevans for Danmark/EU
   */
  private async runRelevanceScoring(validatedData: any[]) {
    console.log('📈 Running relevance scoring...')
    
    const scored = validatedData.map(item => {
      let score = 0

      // Severity scoring (0-30 points)
      switch (item.severity) {
        case 'critical': score += 30; break
        case 'high': score += 20; break
        case 'medium': score += 10; break
        case 'low': score += 5; break
      }

      // Geographic relevance (0-25 points)
      if (item.geography?.includes('Denmark')) score += 25
      else if (item.geography?.includes('EU') || item.geography?.includes('European Union')) score += 20
      else if (item.geography?.includes('Global')) score += 10

      // Source credibility (0-20 points)
      const sourceScores: Record<string, number> = {
        'cfcs.dk': 20,
        'enisa.europa.eu': 19,
        'cert.europa.eu': 18,
        'cisa.gov': 17,
        'nvd.nist.gov': 19,
        'msrc.microsoft.com': 16
      }
      score += sourceScores[item.sourceDomain as keyof typeof sourceScores] || 10

      // Technical indicators (0-15 points)
      if (item.cves?.length > 0) score += 10
      if (item.cvssScore >= 9.0) score += 5

      // Timeliness (0-10 points)
      const age = Date.now() - new Date(item.timestamp).getTime()
      const hoursOld = age / (1000 * 60 * 60)
      if (hoursOld < 2) score += 10
      else if (hoursOld < 6) score += 8
      else if (hoursOld < 24) score += 5
      else if (hoursOld < 72) score += 2

      return { ...item, relevanceScore: score }
    })

    console.log('📊 Relevance scoring completed')
    return scored.sort((a, b) => b.relevanceScore - a.relevanceScore)
  }

  /**
   * Udvælger top dokumenter baseret på score
   */
  private selectTopDocuments(scoredData: any[], maxCount: number = 7) {
    console.log(`🎯 Selecting top ${maxCount} documents...`)
    
    const selected = scoredData.slice(0, maxCount)
    
    console.log(`✅ Selected ${selected.length} top documents`)
    return selected
  }

  /**
   * Genererer AI-summariseringer
   */
  private async generateAISummaries(documents: any[]) {
    console.log('🤖 Generating AI summaries...')
    
    const summarized = documents.map(doc => {
      // Simuleret AI summarisering
      let summary = ''
      
      switch (doc.category) {
        case 'vulnerability':
          summary = `${doc.cves?.[0] || 'Kritisk sårbarhed'} kræver øjeblikkelig handling. ${doc.severity === 'critical' ? 'Patching påkrævet nu.' : 'Opdater snarest muligt.'}`
          break
        case 'incident':
          summary = `Sikkerhedsincident identificeret. ${doc.geography?.includes('Denmark') ? 'Danske organisationer i fokus.' : 'Internationale implikationer.'}`
          break
        case 'guidance':
          summary = `Nye sikkerhedsretningslinjer fra ${doc.source}. Praktiske anbefalinger til implementering.`
          break
        default:
          summary = doc.content?.substring(0, 120) + '...'
      }

      return {
        ...doc,
        summary,
        generatedAt: new Date().toISOString()
      }
    })

    console.log(`🤖 Generated summaries for ${summarized.length} documents`)
    return summarized
  }

  /**
   * Gemmer dagens puls til cache
   */
  private async cacheDailyPulse(documents: any[]) {
    console.log('💾 Caching daily pulse...')
    
    // I rigtig implementation ville dette gemme til database/cache
    const cacheData = {
      date: new Date().toISOString().split('T')[0],
      generatedAt: new Date().toISOString(),
      items: documents,
      itemCount: documents.length
    }

    // Simuler database write
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log(`💾 Cached daily pulse with ${documents.length} items`)
    return cacheData
  }

  /**
   * Sender kritiske alerts hvis nødvendigt
   */
  private async sendCriticalAlerts(documents: any[]) {
    const criticalItems = documents.filter(doc => doc.severity === 'critical')
    
    if (criticalItems.length > 0) {
      console.log(`🚨 Found ${criticalItems.length} critical alerts - sending notifications`)
      
      // I rigtig implementation ville dette sende:
      // - Slack notifications
      // - Email alerts  
      // - SMS til on-call team
      
      for (const item of criticalItems) {
        console.log(`🚨 CRITICAL ALERT: ${item.title}`)
      }
    }
  }

  /**
   * Sender fejl-notifikation
   */
  private async sendErrorNotification(error: any) {
    console.log('📧 Sending error notification...')
    
    // I rigtig implementation ville dette sende fejl-alerts
    console.log(`❌ Daily Pulse Generation Error: ${error.message}`)
  }

  /**
   * Beregner næste kørselstid
   */
  private calculateNextRun() {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(7, 0, 0, 0) // 07:00 næste dag
    
    this.nextRun = tomorrow
  }
}

// Eksporter singleton instance
export const dailyPulseScheduler = new DailyPulseScheduler()

// Auto-start scheduler (simplified for frontend)
// In real backend implementation, check NODE_ENV
try {
  dailyPulseScheduler.start()
  console.log('🌅 Daily Pulse Scheduler started')
} catch (error) {
  console.log('Scheduler not started in frontend environment')
}

export default dailyPulseScheduler