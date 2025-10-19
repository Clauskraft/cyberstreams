/**
 * LINK VALIDATOR SERVICE
 * Validates URLs, checks if they're alive, and provides metadata
 */

export interface LinkValidationResult {
  url: string
  valid: boolean
  reachable: boolean
  statusCode?: number
  responseTime?: number
  hasSSL: boolean
  redirectsTo?: string
  contentType?: string
  title?: string
  error?: string
  checkedAt: Date
}

export interface BulkValidationResult {
  total: number
  valid: number
  invalid: number
  reachable: number
  unreachable: number
  results: LinkValidationResult[]
}

export class LinkValidator {
  private cache: Map<string, LinkValidationResult> = new Map()
  private cacheExpiry: number = 3600000 // 1 hour in ms

  /**
   * Validate a single URL
   */
  async validateUrl(url: string): Promise<LinkValidationResult> {
    const startTime = Date.now()

    try {
      // Check basic URL validity
      const urlObj = new URL(url)
      const hasSSL = urlObj.protocol === 'https:'

      // Check if URL is reachable (with timeout)
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

      try {
        const response = await fetch(url, {
          method: 'HEAD',
          signal: controller.signal,
          redirect: 'follow'
        })

        clearTimeout(timeout)

        const responseTime = Date.now() - startTime
        const redirected = response.url !== url

        return {
          url,
          valid: true,
          reachable: response.ok,
          statusCode: response.status,
          responseTime,
          hasSSL,
          redirectsTo: redirected ? response.url : undefined,
          contentType: response.headers.get('content-type') || undefined,
          checkedAt: new Date()
        }
      } catch (fetchError) {
        clearTimeout(timeout)

        return {
          url,
          valid: true,
          reachable: false,
          hasSSL,
          error: fetchError instanceof Error ? fetchError.message : 'Fetch failed',
          checkedAt: new Date()
        }
      }
    } catch (urlError) {
      return {
        url,
        valid: false,
        reachable: false,
        hasSSL: false,
        error: 'Invalid URL format',
        checkedAt: new Date()
      }
    }
  }

  /**
   * Validate multiple URLs with caching
   */
  async validateUrls(urls: string[]): Promise<BulkValidationResult> {
    const results: LinkValidationResult[] = []

    for (const url of urls) {
      // Check cache first
      const cached = this.getCached(url)
      if (cached) {
        results.push(cached)
        continue
      }

      // Validate and cache
      const result = await this.validateUrl(url)
      this.cache.set(url, result)
      results.push(result)

      // Small delay to avoid rate limiting
      await this.delay(200)
    }

    return {
      total: results.length,
      valid: results.filter(r => r.valid).length,
      invalid: results.filter(r => !r.valid).length,
      reachable: results.filter(r => r.reachable).length,
      unreachable: results.filter(r => !r.reachable).length,
      results
    }
  }

  /**
   * Get cached result if not expired
   */
  private getCached(url: string): LinkValidationResult | null {
    const cached = this.cache.get(url)
    if (!cached) return null

    const age = Date.now() - cached.checkedAt.getTime()
    if (age > this.cacheExpiry) {
      this.cache.delete(url)
      return null
    }

    return cached
  }

  /**
   * Extract domain from URL
   */
  extractDomain(url: string): string {
    try {
      const urlObj = new URL(url)
      return urlObj.hostname
    } catch {
      return ''
    }
  }

  /**
   * Check if URL is from trusted domain
   */
  isTrustedDomain(url: string): boolean {
    const trustedDomains = [
      'cert.europa.eu',
      'enisa.europa.eu',
      'cfcs.dk',
      'cisa.gov',
      'nvd.nist.gov',
      'cert.se',
      'ncsc.gov.uk',
      'bsi.bund.de',
      'anssi.gouv.fr',
      'european-union.europa.eu',
      'nato.int'
    ]

    const domain = this.extractDomain(url)
    return trustedDomains.some(trusted => domain.includes(trusted))
  }

  /**
   * Extract all URLs from HTML content
   */
  extractUrls(html: string): string[] {
    const urlRegex = /(https?:\/\/[^\s<>"{}|\\^`\[\]]+)/gi
    const matches = html.match(urlRegex) || []
    return [...new Set(matches)] // Remove duplicates
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache stats
   */
  getCacheStats(): { size: number; oldestEntry?: Date; newestEntry?: Date } {
    if (this.cache.size === 0) {
      return { size: 0 }
    }

    const dates = Array.from(this.cache.values()).map(r => r.checkedAt)
    return {
      size: this.cache.size,
      oldestEntry: new Date(Math.min(...dates.map(d => d.getTime()))),
      newestEntry: new Date(Math.max(...dates.map(d => d.getTime())))
    }
  }
}

// Singleton instance
export const linkValidator = new LinkValidator()
