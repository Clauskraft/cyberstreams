/**
 * NEW SOURCE DISCOVERY MODULE
 * Analyserer links i eksisterende advisories for at opdage nye kilder
 * Anmoder bruger om godkendelse før tilføjelse til whitelist
 */

export interface DiscoveredSource {
  domain: string
  discoveredFrom: string // URL hvor linket blev fundet
  discoveredInTitle: string
  discoveredDate: Date
  linkCount: number // Hvor mange gange domænet er set
  
  // Metadata fra analyse
  potentialType: 'cert' | 'government' | 'vendor' | 'research' | 'news' | 'unknown'
  language: string[]
  country?: string
  trustIndicators: {
    hasHTTPS: boolean
    hasValidCert: boolean
    hasRSSFeed: boolean
    hasAPIDocumentation: boolean
    isGovernmentDomain: boolean
    isCERTDomain: boolean
  }
  
  // Risk assessment
  riskLevel: 'low' | 'medium' | 'high'
  riskFactors: string[]
}

export interface SourceApprovalRequest {
  source: DiscoveredSource
  recommendedAction: 'approve' | 'investigate' | 'reject'
  recommendation: string
  suggestedKeywords: string[]
  historicalDataEstimate: {
    availableDays: number
    estimatedItems: number
  }
}

export interface UserSourceDecision {
  domain: string
  approved: boolean
  fetchHistoricalData: boolean
  keywords: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
  updateFrequency: number // minutes
  notes?: string
}

export class NewSourceDiscovery {
  
  private discoveredSources: Map<string, DiscoveredSource> = new Map()
  private approvedSources: Set<string> = new Set()
  private rejectedSources: Set<string> = new Set()
  
  constructor(
    private webhookUrl: string,
    private existingDomains: Set<string> // Currently whitelisted domains
  ) {}
  
  /**
   * Analyze content and extract potential new sources
   */
  async analyzeContentForNewSources(
    content: string,
    title: string,
    sourceUrl: string
  ): Promise<DiscoveredSource[]> {
    
    const discoveredLinks = this.extractLinks(content)
    const newSources: DiscoveredSource[] = []
    
    for (const link of discoveredLinks) {
      try {
        const domain = this.extractDomain(link)
        
        // Skip if already known or is same domain
        if (this.existingDomains.has(domain) || 
            this.approvedSources.has(domain) ||
            this.rejectedSources.has(domain) ||
            domain === this.extractDomain(sourceUrl)) {
          continue
        }
        
        // Update existing discovery or create new
        const existing = this.discoveredSources.get(domain)
        if (existing) {
          existing.linkCount++
          existing.discoveredDate = new Date()
        } else {
          const discovered = await this.analyzeNewSource(domain, link, title, sourceUrl)
          if (discovered) {
            this.discoveredSources.set(domain, discovered)
            newSources.push(discovered)
          }
        }
        
      } catch (error) {
        console.error(`Error analyzing link ${link}:`, error)
      }
    }
    
    return newSources
  }
  
  /**
   * Extract all HTTP/HTTPS links from content
   */
  private extractLinks(content: string): string[] {
    const linkRegex = /https?:\\/\\/[\\w\\-._~:/?#[\\]@!$&'()*+,;=%]+/gi
    const matches = content.match(linkRegex) || []
    
    // Deduplicate and filter
    return [...new Set(matches)]
      .filter(link => this.isValidLink(link))
      .slice(0, 50) // Limit to avoid excessive processing
  }
  
  /**
   * Check if link is worth analyzing
   */
  private isValidLink(link: string): boolean {
    const lowercaseLink = link.toLowerCase()
    
    // Skip common non-source links
    const skipPatterns = [
      'facebook.com', 'twitter.com', 'linkedin.com', 'youtube.com',
      'google.com', 'microsoft.com', 'amazon.com', 'github.com',
      '.jpg', '.png', '.gif', '.pdf', '.zip', '.exe'
    ]
    
    return !skipPatterns.some(pattern => lowercaseLink.includes(pattern))
  }
  
  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname.toLowerCase()
    } catch {
      return ''
    }
  }
  
  /**
   * Analyze a newly discovered source
   */
  private async analyzeNewSource(
    domain: string,
    originalUrl: string,
    discoveredInTitle: string,
    discoveredFrom: string
  ): Promise<DiscoveredSource | null> {
    
    try {
      // Basic domain analysis
      const potentialType = this.classifyDomain(domain)
      const language = this.detectLanguageFromDomain(domain)
      const country = this.detectCountryFromDomain(domain)
      
      // Trust indicators check
      const trustIndicators = await this.checkTrustIndicators(domain)
      
      // Risk assessment
      const { riskLevel, riskFactors } = this.assessRisk(domain, trustIndicators, potentialType)
      
      return {
        domain,
        discoveredFrom,
        discoveredInTitle,
        discoveredDate: new Date(),
        linkCount: 1,
        potentialType,
        language,
        country,
        trustIndicators,
        riskLevel,
        riskFactors
      }
      
    } catch (error) {
      console.error(`Failed to analyze source ${domain}:`, error)
      return null
    }
  }
  
  /**
   * Classify domain type based on patterns
   */
  private classifyDomain(domain: string): DiscoveredSource['potentialType'] {
    const domainLower = domain.toLowerCase()
    
    // Government patterns
    if (domainLower.includes('.gov') || 
        domainLower.includes('.gv.') ||
        domainLower.includes('government') ||
        domainLower.includes('admin.')) {
      return 'government'
    }
    
    // CERT patterns
    if (domainLower.includes('cert') || 
        domainLower.includes('csirt') ||
        domainLower.includes('incident') ||
        domainLower.includes('security')) {
      return 'cert'
    }
    
    // Research patterns
    if (domainLower.includes('.edu') ||
        domainLower.includes('.ac.') ||
        domainLower.includes('research') ||
        domainLower.includes('university')) {
      return 'research'
    }
    
    // Vendor patterns
    if (domainLower.includes('microsoft') ||
        domainLower.includes('adobe') ||
        domainLower.includes('oracle') ||
        domainLower.includes('cisco')) {
      return 'vendor'
    }
    
    // News patterns
    if (domainLower.includes('news') ||
        domainLower.includes('media') ||
        domainLower.includes('press')) {
      return 'news'
    }
    
    return 'unknown'
  }
  
  /**
   * Detect potential language from domain
   */
  private detectLanguageFromDomain(domain: string): string[] {
    const languages: string[] = []
    
    // Country code TLD mapping to common languages
    const tldLanguageMap: Record<string, string[]> = {
      '.dk': ['da', 'en'],
      '.se': ['sv', 'en'], 
      '.no': ['no', 'en'],
      '.fi': ['fi', 'en'],
      '.de': ['de', 'en'],
      '.fr': ['fr', 'en'],
      '.it': ['it', 'en'],
      '.es': ['es', 'en'],
      '.nl': ['nl', 'en'],
      '.be': ['nl', 'fr', 'en'],
      '.at': ['de', 'en'],
      '.ch': ['de', 'fr', 'it', 'en'],
      '.pl': ['pl', 'en'],
      '.cz': ['cs', 'en'],
      '.sk': ['sk', 'en'],
      '.hu': ['hu', 'en'],
      '.ro': ['ro', 'en'],
      '.bg': ['bg', 'en'],
      '.hr': ['hr', 'en'],
      '.si': ['sl', 'en'],
      '.ee': ['et', 'en'],
      '.lv': ['lv', 'en'],
      '.lt': ['lt', 'en'],
      '.lu': ['fr', 'de', 'en'],
      '.ie': ['en', 'ga'],
      '.gr': ['el', 'en'],
      '.pt': ['pt', 'en'],
      '.cy': ['el', 'tr', 'en'],
      '.mt': ['mt', 'en']
    }
    
    for (const [tld, langs] of Object.entries(tldLanguageMap)) {
      if (domain.endsWith(tld)) {
        languages.push(...langs)
        break
      }
    }
    
    // Default to English if no specific language detected
    if (languages.length === 0) {
      languages.push('en')
    }
    
    return [...new Set(languages)]
  }
  
  /**
   * Detect country from domain
   */
  private detectCountryFromDomain(domain: string): string | undefined {
    const countryTlds: Record<string, string> = {
      '.dk': 'DK', '.se': 'SE', '.no': 'NO', '.fi': 'FI',
      '.de': 'DE', '.fr': 'FR', '.it': 'IT', '.es': 'ES',
      '.nl': 'NL', '.be': 'BE', '.at': 'AT', '.ch': 'CH',
      '.pl': 'PL', '.cz': 'CZ', '.sk': 'SK', '.hu': 'HU',
      '.ro': 'RO', '.bg': 'BG', '.hr': 'HR', '.si': 'SI',
      '.ee': 'EE', '.lv': 'LV', '.lt': 'LT', '.lu': 'LU',
      '.ie': 'IE', '.gr': 'GR', '.pt': 'PT', '.cy': 'CY',
      '.mt': 'MT', '.uk': 'UK', '.eu': 'EU'
    }
    
    for (const [tld, country] of Object.entries(countryTlds)) {
      if (domain.endsWith(tld)) {
        return country
      }
    }
    
    return undefined
  }
  
  /**
   * Check trust indicators for domain
   */
  private async checkTrustIndicators(domain: string): Promise<DiscoveredSource['trustIndicators']> {
    const indicators = {
      hasHTTPS: false,
      hasValidCert: false,
      hasRSSFeed: false,
      hasAPIDocumentation: false,
      isGovernmentDomain: false,
      isCERTDomain: false
    }
    
    try {
      // Check HTTPS and certificate
      const httpsUrl = `https://${domain}`
      const response = await fetch(httpsUrl, { 
        method: 'HEAD',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })
      
      if (response.ok) {
        indicators.hasHTTPS = true
        indicators.hasValidCert = true // If fetch succeeds, cert is likely valid
      }
      
      // Check for RSS feeds
      const rssUrls = [
        `${httpsUrl}/rss`,
        `${httpsUrl}/rss.xml`,
        `${httpsUrl}/feed`,
        `${httpsUrl}/feed.xml`,
        `${httpsUrl}/atom.xml`
      ]
      
      for (const rssUrl of rssUrls) {
        try {
          const rssResponse = await fetch(rssUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          })
          if (rssResponse.ok) {
            indicators.hasRSSFeed = true
            break
          }
        } catch {
          // Ignore errors for RSS checks
        }
      }
      
      // Check domain patterns
      indicators.isGovernmentDomain = domain.includes('.gov') || 
                                     domain.includes('.gv.') ||
                                     domain.includes('government')
      
      indicators.isCERTDomain = domain.includes('cert') || 
                               domain.includes('csirt')
      
      // Check for API documentation (basic check)
      const apiUrls = [
        `${httpsUrl}/api`,
        `${httpsUrl}/docs`,
        `${httpsUrl}/api/docs`
      ]
      
      for (const apiUrl of apiUrls) {
        try {
          const apiResponse = await fetch(apiUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(3000)
          })
          if (apiResponse.ok) {
            indicators.hasAPIDocumentation = true
            break
          }
        } catch {
          // Ignore errors
        }
      }
      
    } catch (error) {
      console.error(`Trust indicator check failed for ${domain}:`, error)
    }
    
    return indicators
  }
  
  /**
   * Assess risk level for new source
   */
  private assessRisk(
    domain: string, 
    trustIndicators: DiscoveredSource['trustIndicators'],
    type: DiscoveredSource['potentialType']
  ): { riskLevel: DiscoveredSource['riskLevel'], riskFactors: string[] } {
    
    const riskFactors: string[] = []
    let riskScore = 0
    
    // Trust indicators reduce risk
    if (!trustIndicators.hasHTTPS) {
      riskFactors.push('Ingen HTTPS')
      riskScore += 2
    }
    
    if (!trustIndicators.hasValidCert) {
      riskFactors.push('Ugyldig SSL certifikat')
      riskScore += 2
    }
    
    // Government and CERT domains are lower risk
    if (trustIndicators.isGovernmentDomain) {
      riskScore -= 2
      riskFactors.push('Regering domæne (lavere risiko)')
    }
    
    if (trustIndicators.isCERTDomain) {
      riskScore -= 1
      riskFactors.push('CERT domæne (lavere risiko)')
    }
    
    // Type-based risk assessment
    switch (type) {
      case 'government':
      case 'cert':
        riskScore -= 1
        break
      case 'vendor':
      case 'research':
        // Neutral
        break
      case 'news':
        riskScore += 1
        riskFactors.push('News site (højere risiko for misinformation)')
        break
      case 'unknown':
        riskScore += 2
        riskFactors.push('Ukendt type (højere risiko)')
        break
    }
    
    // Determine final risk level
    let riskLevel: DiscoveredSource['riskLevel']
    if (riskScore <= 0) {
      riskLevel = 'low'
    } else if (riskScore <= 3) {
      riskLevel = 'medium'
    } else {
      riskLevel = 'high'
    }
    
    return { riskLevel, riskFactors }
  }
  
  /**
   * Generate approval request for user
   */
  async generateApprovalRequest(source: DiscoveredSource): Promise<SourceApprovalRequest> {
    
    // Determine recommendation based on risk and type
    let recommendedAction: SourceApprovalRequest['recommendedAction']
    let recommendation: string
    
    if (source.riskLevel === 'low' && 
        (source.potentialType === 'government' || source.potentialType === 'cert')) {
      recommendedAction = 'approve'
      recommendation = `Anbefaler godkendelse: ${source.potentialType} kilde med lav risiko`
    } else if (source.riskLevel === 'high' || source.potentialType === 'unknown') {
      recommendedAction = 'reject'
      recommendation = `Anbefaler afvisning: Høj risiko eller ukendt type`
    } else {
      recommendedAction = 'investigate'
      recommendation = `Anbefaler manuel vurdering: Medium risiko`
    }
    
    // Generate suggested keywords based on domain and type
    const suggestedKeywords = this.generateKeywords(source)
    
    // Estimate historical data
    const historicalDataEstimate = {
      availableDays: this.estimateDataAvailability(source),
      estimatedItems: this.estimateItemCount(source)
    }
    
    return {
      source,
      recommendedAction,
      recommendation,
      suggestedKeywords,
      historicalDataEstimate
    }
  }
  
  /**
   * Generate relevant keywords for source
   */
  private generateKeywords(source: DiscoveredSource): string[] {
    const keywords: string[] = []
    
    // Add type-based keywords
    switch (source.potentialType) {
      case 'cert':
        keywords.push('vulnerability', 'incident', 'advisory', 'alert')
        break
      case 'government':
        keywords.push('policy', 'regulation', 'strategy', 'directive')
        break
      case 'vendor':
        keywords.push('security update', 'patch', 'vulnerability')
        break
    }
    
    // Add country-specific keywords
    if (source.country) {
      keywords.push(source.country.toLowerCase())
    }
    
    // Add domain-based keywords
    if (source.domain.includes('cyber')) keywords.push('cybersecurity')
    if (source.domain.includes('security')) keywords.push('security')
    if (source.domain.includes('cert')) keywords.push('incident response')
    
    return [...new Set(keywords)]
  }
  
  private estimateDataAvailability(source: DiscoveredSource): number {
    // Government and CERT sources typically have more historical data
    if (source.potentialType === 'government' || source.potentialType === 'cert') {
      return 90 // 3 months
    }
    
    return 30 // 1 month default
  }
  
  private estimateItemCount(source: DiscoveredSource): number {
    // Rough estimates based on source type
    switch (source.potentialType) {
      case 'government': return 50
      case 'cert': return 100
      case 'vendor': return 200
      case 'research': return 20
      default: return 30
    }
  }
  
  /**
   * Send approval request webhook to user
   */
  async sendApprovalRequest(request: SourceApprovalRequest): Promise<void> {
    const payload = {
      type: 'new_source_discovered',
      request,
      userPrompt: this.generateApprovalPrompt(request),
      actions: {
        approve: `/api/sources/approve/${request.source.domain}`,
        reject: `/api/sources/reject/${request.source.domain}`,
        investigate: `/api/sources/investigate/${request.source.domain}`
      }
    }
    
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cyberstreams-Event': 'new_source_discovered'
        },
        body: JSON.stringify(payload)
      })
      
      console.log(`📧 New source approval request sent for ${request.source.domain}`)
      
    } catch (error) {
      console.error('Failed to send approval request:', error)
      
      // Fallback logging
      console.log(`\\n🆕 NY KILDE OPDAGET`)
      console.log(`Domæne: ${request.source.domain}`)
      console.log(`Type: ${request.source.potentialType}`)
      console.log(`Risiko: ${request.source.riskLevel}`)
      console.log(`Anbefaling: ${request.recommendation}`)
      console.log(`Foreslåede nøgleord: ${request.suggestedKeywords.join(', ')}`)
      console.log(`Historiske data: ~${request.historicalDataEstimate.estimatedItems} items, ${request.historicalDataEstimate.availableDays} dage`)
    }
  }
  
  private generateApprovalPrompt(request: SourceApprovalRequest): string {
    const source = request.source
    
    return `Ny potentiel kilde opdaget: ${source.domain}
    
Type: ${source.potentialType}
Risiko niveau: ${source.riskLevel}
Land: ${source.country || 'Ukendt'}
Sprog: ${source.language.join(', ')}

Trust indikatorer:
• HTTPS: ${source.trustIndicators.hasHTTPS ? '✅' : '❌'}
• SSL Certifikat: ${source.trustIndicators.hasValidCert ? '✅' : '❌'}  
• RSS Feed: ${source.trustIndicators.hasRSSFeed ? '✅' : '❌'}
• API Dokumentation: ${source.trustIndicators.hasAPIDocumentation ? '✅' : '❌'}

${request.recommendation}

Foreslåede nøgleord: ${request.suggestedKeywords.join(', ')}

Skal denne kilde tilføjes til whitelist?`
  }
  
  /**
   * Handle user decision on new source
   */
  async handleUserDecision(decision: UserSourceDecision): Promise<void> {
    if (decision.approved) {
      this.approvedSources.add(decision.domain)
      console.log(`✅ Source approved: ${decision.domain}`)
      
      // TODO: Add to AuthorizedSources.ts
      
    } else {
      this.rejectedSources.add(decision.domain)
      console.log(`❌ Source rejected: ${decision.domain}`)
    }
    
    // Remove from discovered
    this.discoveredSources.delete(decision.domain)
  }
  
  /**
   * Get discovery statistics
   */
  getDiscoveryStats(): {
    discoveredCount: number
    approvedCount: number
    rejectedCount: number
    pendingCount: number
    riskDistribution: Record<string, number>
  } {
    const riskDistribution = { low: 0, medium: 0, high: 0 }
    
    for (const source of this.discoveredSources.values()) {
      riskDistribution[source.riskLevel]++
    }
    
    return {
      discoveredCount: this.discoveredSources.size,
      approvedCount: this.approvedSources.size,
      rejectedCount: this.rejectedSources.size,
      pendingCount: this.discoveredSources.size,
      riskDistribution
    }
  }
}