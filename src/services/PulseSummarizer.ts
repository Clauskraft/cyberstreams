/**
 * DAGENS PULS - AI SUMMARIZATION SERVICE
 * GPT-4 powered summarisering med [Unverified] tagging og faktuel fokus
 */

interface SummarizationConfig {
  maxLength: number
  language: 'da' | 'en'
  includeContext: boolean
  markUnverified: boolean
  factualOnly: boolean
}

interface SummaryResult {
  summary: string
  confidence: number
  hasUnverifiedContent: boolean
  keyFacts: string[]
  suggestedActions: string[]
  sourceReliability: 'high' | 'medium' | 'low'
}

export class PulseSummarizer {
  private readonly openaiApiKey: string
  private readonly defaultConfig: SummarizationConfig

  constructor(apiKey?: string) {
    this.openaiApiKey = apiKey || '' // API key skal passes som parameter
    this.defaultConfig = {
      maxLength: 150,
      language: 'da',
      includeContext: true,
      markUnverified: true,
      factualOnly: true
    }
  }

  /**
   * Hovedfunktion til summarisering af sikkerhedsdokumenter
   */
  async summarizeSecurityDocument(
    document: any,
    config: Partial<SummarizationConfig> = {}
  ): Promise<SummaryResult> {
    const finalConfig = { ...this.defaultConfig, ...config }
    
    // Validate input
    if (!document.title && !document.content && !document.description) {
      throw new Error('Document must have title, content, or description')
    }

    const content = this.extractContent(document)
    const sourceInfo = this.analyzeSource(document)
    
    try {
      // Generate summary using GPT-4
      const summary = await this.generateSummary(content, sourceInfo, finalConfig)
      
      // Analyze for unverified content
      const confidence = this.calculateConfidence(document, sourceInfo)
      const hasUnverified = this.detectUnverifiedContent(content)
      
      // Extract key facts and actions
      const keyFacts = this.extractKeyFacts(content)
      const suggestedActions = this.generateActions(document, keyFacts)

      return {
        summary: hasUnverified ? this.addUnverifiedTags(summary) : summary,
        confidence,
        hasUnverifiedContent: hasUnverified,
        keyFacts,
        suggestedActions,
        sourceReliability: sourceInfo.reliability
      }
    } catch (error) {
      console.error('Summarization failed:', error)
      
      // Fallback to simple summarization
      return this.fallbackSummary(document, finalConfig)
    }
  }

  /**
   * GPT-4 summarisering med specialiserede prompts
   */
  private async generateSummary(
    content: string,
    sourceInfo: any,
    config: SummarizationConfig
  ): Promise<string> {
    const prompt = this.buildSummarizationPrompt(content, sourceInfo, config)
    
    if (!this.openaiApiKey) {
      console.warn('No OpenAI API key provided, using fallback summarization')
      return this.simpleSummary(content, config.maxLength)
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: this.getSystemPrompt(config.language)
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: config.maxLength + 50,
          temperature: 0.3 // Low temperature for factual content
        })
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices[0]?.message?.content?.trim() || this.simpleSummary(content, config.maxLength)
    } catch (error) {
      console.error('OpenAI API call failed:', error)
      return this.simpleSummary(content, config.maxLength)
    }
  }

  /**
   * System prompt for GPT-4 til cybersikkerhed
   */
  private getSystemPrompt(language: 'da' | 'en'): string {
    if (language === 'da') {
      return `Du er en ekspert i cybersikkerhed og threat intelligence. Din opgave er at lave korte, faktuelle sammendrag af sikkerhedsnyheder på dansk.

REGLER:
1. Maks 1-2 sætninger (under 150 karakterer)
2. Fokus på FAKTA - ingen spekulationer
3. Inkludér: Hvad skete, hvem påvirkes, anbefalet handling
4. Brug [Uverificeret] for usikre informationer
5. Brug klart, professionelt sprog
6. Ingen overdrivelser eller sensationalism
7. Medtag CVE-numre hvis relevante

FORMAT: "Kort faktuel beskrivelse. Anbefalet handling eller påvirkning."`
    } else {
      return `You are a cybersecurity and threat intelligence expert. Your task is to create brief, factual summaries of security news.

RULES:
1. Max 1-2 sentences (under 150 characters)
2. Focus on FACTS - no speculation
3. Include: What happened, who is affected, recommended action
4. Use [Unverified] for uncertain information
5. Use clear, professional language
6. No exaggeration or sensationalism
7. Include CVE numbers if relevant

FORMAT: "Brief factual description. Recommended action or impact."`
    }
  }

  /**
   * Bygger specifik prompt for dokumentet
   */
  private buildSummarizationPrompt(
    content: string,
    sourceInfo: any,
    config: SummarizationConfig
  ): string {
    const language = config.language === 'da' ? 'dansk' : 'english'
    
    return `Lav et kort sammendrag på ${language} af denne cybersikkerhedsnyhed:

KILDE: ${sourceInfo.name} (troværdighed: ${sourceInfo.reliability})
INDHOLD: ${content.substring(0, 2000)}

Fokus på: Hvad skete der, hvem påvirkes, og hvad skal gøres.
Maksimal længde: ${config.maxLength} karakterer.
${config.markUnverified ? 'Markér usikre informationer med [Uverificeret].' : ''}`
  }

  /**
   * Extraherer indhold fra dokument
   */
  private extractContent(document: any): string {
    const parts = [
      document.title || '',
      document.description || '',
      document.content || '',
      document.summary || ''
    ].filter(Boolean)

    return parts.join(' ').substring(0, 3000) // Limit for API calls
  }

  /**
   * Analyserer kilde-troværdighed
   */
  private analyzeSource(document: any): any {
    // Import SourceValidator dynamically to avoid circular imports
    const authorizedSources = [
      'cfcs.dk', 'enisa.europa.eu', 'cert.europa.eu', 'cisa.gov', 'nvd.nist.gov',
      'ncsc.nl', 'cert.se', 'msrc.microsoft.com', 'cve.mitre.org'
    ]

    const sourceDomain = this.extractDomain(document.url || document.source || '')
    const isAuthorized = authorizedSources.some(domain => sourceDomain.includes(domain))

    return {
      name: document.source || 'Unknown',
      domain: sourceDomain,
      reliability: isAuthorized ? 'high' : 'medium',
      isGovernment: sourceDomain.includes('.gov') || sourceDomain.includes('cert'),
      isVendor: ['microsoft', 'cisco', 'oracle', 'adobe'].some(v => sourceDomain.includes(v))
    }
  }

  /**
   * Beregner confidence score baseret på kilde og indhold
   */
  private calculateConfidence(document: any, sourceInfo: any): number {
    let confidence = 50 // Base score

    // Source reliability boost
    if (sourceInfo.reliability === 'high') confidence += 30
    else if (sourceInfo.reliability === 'medium') confidence += 15

    // Government/CERT sources are more reliable
    if (sourceInfo.isGovernment) confidence += 15

    // CVE references increase confidence
    if (document.cves && document.cves.length > 0) confidence += 10

    // Recent timestamp increases confidence
    if (document.timestamp) {
      const age = Date.now() - new Date(document.timestamp).getTime()
      const hoursOld = age / (1000 * 60 * 60)
      if (hoursOld < 24) confidence += 10
      else if (hoursOld < 168) confidence += 5 // Within a week
    }

    // Reduce confidence for suspicious patterns
    const content = this.extractContent(document).toLowerCase()
    const suspiciousPatterns = [
      'breaking', 'urgent', 'exclusive', 'insider', 'anonymous',
      'rumor', 'allegedly', 'reportedly', 'sources say'
    ]

    const suspiciousCount = suspiciousPatterns.filter(pattern => 
      content.includes(pattern)
    ).length

    confidence -= suspiciousCount * 5

    return Math.max(0, Math.min(100, confidence))
  }

  /**
   * Detekterer uverificeret indhold
   */
  private detectUnverifiedContent(content: string): boolean {
    const unverifiedIndicators = [
      'unconfirmed', 'alleged', 'rumor', 'speculation',
      'sources say', 'reportedly', 'claims', 'according to',
      'uverificeret', 'påstået', 'rygter', 'angiveligt'
    ]

    const lowerContent = content.toLowerCase()
    return unverifiedIndicators.some(indicator => lowerContent.includes(indicator))
  }

  /**
   * Tilføjer [Uverificeret] tags til summary
   */
  private addUnverifiedTags(summary: string): string {
    // Add tag at the end if not already present
    if (!summary.includes('[Uverificeret]') && !summary.includes('[Unverified]')) {
      return summary + ' [Uverificeret]'
    }
    return summary
  }

  /**
   * Extraherer nøglefakta
   */
  private extractKeyFacts(content: string): string[] {
    const facts: string[] = []

    // Extract CVE numbers
    const cveMatches = content.match(/CVE-\d{4}-\d{4,}/g)
    if (cveMatches) {
      facts.push(...cveMatches.map(cve => `Sårbarhed: ${cve}`))
    }

    // Extract CVSS scores
    const cvssMatches = content.match(/CVSS[:\s]+([\d.]+)/gi)
    if (cvssMatches) {
      facts.push(...cvssMatches.map(score => `CVSS Score: ${score.split(/[:\s]+/)[1]}`))
    }

    // Extract affected products (simplified)
    const productMatches = content.match(/(Windows|Linux|macOS|Android|iOS|Chrome|Firefox|Safari|Office|Adobe|Oracle)/gi)
    if (productMatches) {
      const uniqueProducts = [...new Set(productMatches)]
      if (uniqueProducts.length <= 3) {
        facts.push(`Berørte produkter: ${uniqueProducts.join(', ')}`)
      }
    }

    return facts.slice(0, 3) // Max 3 key facts
  }

  /**
   * Genererer anbefalede handlinger
   */
  private generateActions(document: any, keyFacts: string[]): string[] {
    const actions: string[] = []

    // Based on severity
    if (document.severity === 'critical') {
      actions.push('Øjeblikkelig handling påkrævet')
    } else if (document.severity === 'high') {
      actions.push('Prioriter patching inden 72 timer')
    }

    // Based on CVEs
    if (document.cves && document.cves.length > 0) {
      actions.push('Opdater berørte systemer')
    }

    // Based on content type
    const content = this.extractContent(document).toLowerCase()
    if (content.includes('ransomware')) {
      actions.push('Verificer backup-integritet')
    }
    if (content.includes('phishing')) {
      actions.push('Informer medarbejdere')
    }

    return actions.slice(0, 2) // Max 2 actions
  }

  /**
   * Fallback summarisering uden AI
   */
  private fallbackSummary(document: any, config: SummarizationConfig): SummaryResult {
    const content = this.extractContent(document)
    const summary = this.simpleSummary(content, config.maxLength)

    return {
      summary,
      confidence: 60, // Medium confidence for fallback
      hasUnverifiedContent: this.detectUnverifiedContent(content),
      keyFacts: this.extractKeyFacts(content),
      suggestedActions: this.generateActions(document, []),
      sourceReliability: 'medium'
    }
  }

  /**
   * Simpel tekst-summarisering
   */
  private simpleSummary(content: string, maxLength: number): string {
    // Remove HTML tags and extra whitespace
    const cleanContent = content
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    // Take first sentence or sentences up to maxLength
    const sentences = cleanContent.split(/[.!?]+/)
    let summary = ''
    
    for (const sentence of sentences) {
      if (sentence.trim().length === 0) continue
      
      const testSummary = summary + (summary ? '. ' : '') + sentence.trim()
      if (testSummary.length <= maxLength) {
        summary = testSummary
      } else {
        break
      }
    }

    return summary || cleanContent.substring(0, maxLength - 3) + '...'
  }

  /**
   * Extraherer domæne fra URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.toLowerCase()
    } catch {
      return url.toLowerCase()
    }
  }
}

export default PulseSummarizer