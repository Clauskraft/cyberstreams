/**
 * LOGIN/OAUTH DETECTION SYSTEM
 * Detekterer autentificeringskrav (401/302) og sender webhook til brugeren
 * Håndterer OAuth flows, API keys og certificates
 */

export interface AuthRequirement {
  sourceId: string
  sourceName: string
  domain: string
  authType: 'oauth' | 'basic' | 'api_key' | 'certificate' | 'session'
  detected: Date
  message: string
  loginUrl?: string
  requiredScopes?: string[]
  historicalDataAvailable?: boolean
}

export interface AuthWebhookPayload {
  type: 'auth_required' | 'auth_success' | 'auth_failed'
  requirement: AuthRequirement
  userPrompt: string
  actions: {
    approve: string // URL or action ID
    deny: string
    configure?: string
  }
}

export interface UserAuthResponse {
  sourceId: string
  approved: boolean
  fetchHistoricalData: boolean
  credentials?: {
    type: 'oauth' | 'basic' | 'api_key' | 'certificate'
    accessToken?: string
    refreshToken?: string
    username?: string
    password?: string
    apiKey?: string
    certificatePath?: string
    certificatePassword?: string
    expiresAt?: Date
  }
  keywords?: string[] // Optional keywords for filtering
}

export class AuthenticationDetector {
  
  private pendingAuth: Map<string, AuthRequirement> = new Map()
  private authenticatedSources: Map<string, UserAuthResponse> = new Map()
  
  constructor(private webhookUrl: string) {}
  
  /**
   * Check if source requires authentication by testing endpoints
   */
  async detectAuthRequirement(
    sourceId: string,
    sourceName: string, 
    domain: string,
    testUrls: string[]
  ): Promise<AuthRequirement | null> {
    
    for (const url of testUrls) {
      try {
        const authReq = await this.testEndpointAuth(url, sourceId, sourceName, domain)
        if (authReq) {
          return authReq
        }
      } catch (error) {
        console.error(`Auth test failed for ${url}:`, error)
      }
    }
    
    return null // No auth required
  }
  
  /**
   * Test individual endpoint for authentication requirements
   */
  private async testEndpointAuth(
    url: string, 
    sourceId: string, 
    sourceName: string, 
    domain: string
  ): Promise<AuthRequirement | null> {
    
    try {
      // First, try HEAD request to avoid downloading content
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'manual', // Don't follow redirects automatically
        headers: {
          'User-Agent': 'Cyberstreams Intelligence Platform 1.0'
        }
      })
      
      // Analyze response for authentication indicators
      const authReq = this.analyzeAuthResponse(response, sourceId, sourceName, domain, url)
      
      if (authReq) {
        console.log(`🔐 Authentication required for ${sourceName}: ${authReq.authType}`)
        return authReq
      }
      
      // If HEAD succeeds, try GET to check for session-based auth
      if (response.ok) {
        const getResponse = await fetch(url, {
          method: 'GET',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Cyberstreams Intelligence Platform 1.0'
          }
        })
        
        return this.analyzeAuthResponse(getResponse, sourceId, sourceName, domain, url)
      }
      
    } catch (error) {
      console.error(`Network error testing ${url}:`, error)
    }
    
    return null
  }
  
  /**
   * Analyze HTTP response for authentication requirements
   */
  private analyzeAuthResponse(
    response: Response,
    sourceId: string,
    sourceName: string, 
    domain: string,
    testUrl: string
  ): AuthRequirement | null {
    
    // 401 Unauthorized - Authentication required
    if (response.status === 401) {
      const wwwAuth = response.headers.get('WWW-Authenticate')
      const authType = this.parseWWWAuthenticate(wwwAuth)
      
      return {
        sourceId,
        sourceName,
        domain,
        authType,
        detected: new Date(),
        message: `${sourceName} kræver ${authType} autentificering`,
        requiredScopes: this.extractScopes(wwwAuth),
        historicalDataAvailable: true
      }
    }
    
    // 302/303 Redirect - Check if it's auth-related
    if (response.status === 302 || response.status === 303) {
      const location = response.headers.get('Location')
      
      if (location && this.isAuthRedirect(location)) {
        return {
          sourceId,
          sourceName,
          domain,
          authType: this.detectRedirectAuthType(location),
          detected: new Date(),
          message: `${sourceName} omdirigerer til login side`,
          loginUrl: location,
          historicalDataAvailable: true
        }
      }
    }
    
    // 403 Forbidden - May require API key or higher privileges
    if (response.status === 403) {
      return {
        sourceId,
        sourceName,
        domain,
        authType: 'api_key',
        detected: new Date(),
        message: `${sourceName} kræver API nøgle eller certifikat`,
        historicalDataAvailable: false
      }
    }
    
    // Check response body for session-based auth indicators
    if (response.ok) {
      // This would require fetching the body, which we'll skip for HEAD requests
      // In a full implementation, you'd check for login forms, session cookies, etc.
    }
    
    return null
  }
  
  /**
   * Parse WWW-Authenticate header to determine auth type
   */
  private parseWWWAuthenticate(wwwAuth: string | null): AuthRequirement['authType'] {
    if (!wwwAuth) return 'basic'
    
    const authLower = wwwAuth.toLowerCase()
    
    if (authLower.includes('bearer')) return 'oauth'
    if (authLower.includes('basic')) return 'basic'
    if (authLower.includes('digest')) return 'basic'
    if (authLower.includes('certificate')) return 'certificate'
    
    return 'api_key'
  }
  
  /**
   * Extract OAuth scopes from WWW-Authenticate header
   */
  private extractScopes(wwwAuth: string | null): string[] {
    if (!wwwAuth) return []
    
    const scopeMatch = wwwAuth.match(/scope="([^"]+)"/i)
    if (scopeMatch) {
      return scopeMatch[1].split(' ')
    }
    
    return []
  }
  
  /**
   * Check if redirect URL indicates authentication
   */
  private isAuthRedirect(url: string): boolean {
    const authPatterns = [
      'login', 'auth', 'oauth', 'signin', 'sso', 'saml',
      'certificate', 'credentials', 'authenticate', 'session'
    ]
    
    const urlLower = url.toLowerCase()
    return authPatterns.some(pattern => urlLower.includes(pattern))
  }
  
  /**
   * Detect authentication type from redirect URL
   */
  private detectRedirectAuthType(url: string): AuthRequirement['authType'] {
    const urlLower = url.toLowerCase()
    
    if (urlLower.includes('oauth') || urlLower.includes('openid')) return 'oauth'
    if (urlLower.includes('saml') || urlLower.includes('sso')) return 'oauth'
    if (urlLower.includes('certificate') || urlLower.includes('cert')) return 'certificate'
    
    return 'session'
  }
  
  /**
   * Send webhook notification to user about authentication requirement
   */
  async notifyUserAuthRequired(authReq: AuthRequirement): Promise<void> {
    this.pendingAuth.set(authReq.sourceId, authReq)
    
    const webhookPayload: AuthWebhookPayload = {
      type: 'auth_required',
      requirement: authReq,
      userPrompt: this.generateUserPrompt(authReq),
      actions: {
        approve: `/api/auth/approve/${authReq.sourceId}`,
        deny: `/api/auth/deny/${authReq.sourceId}`,
        configure: `/api/auth/configure/${authReq.sourceId}`
      }
    }
    
    try {
      const response = await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cyberstreams-Event': 'auth_required'
        },
        body: JSON.stringify(webhookPayload)
      })
      
      if (response.ok) {
        console.log(`📧 Auth notification sent for ${authReq.sourceName}`)
      } else {
        console.error(`Failed to send auth notification: ${response.status}`)
      }
      
    } catch (error) {
      console.error('Webhook notification failed:', error)
      
      // Fallback: Log to console with formatted message
      console.log(`\\n🔐 AUTHENTICATION REQUIRED`)
      console.log(`Kilde: ${authReq.sourceName} (${authReq.domain})`)
      console.log(`Type: ${authReq.authType}`)
      console.log(`Besked: ${authReq.message}`)
      if (authReq.loginUrl) {
        console.log(`Login URL: ${authReq.loginUrl}`)
      }
      console.log(`Historiske data tilgængelige: ${authReq.historicalDataAvailable ? 'Ja' : 'Nej'}`)
      console.log(`\\nVil du:`)
      console.log(`1. Godkend og konfigurer login`)
      console.log(`2. Spring over (anbefales ikke for højt prioriterede kilder)`)
      console.log(`3. Konfigurer senere\\n`)
    }
  }
  
  /**
   * Generate user-friendly prompt message
   */
  private generateUserPrompt(authReq: AuthRequirement): string {
    const baseMessage = `Ny kilde fundet: ${authReq.sourceName} (${authReq.domain})`
    
    let authMessage = ''
    switch (authReq.authType) {
      case 'oauth':
        authMessage = 'Kræver OAuth/SSO login. Dette er sikkert og anbefales.'
        break
      case 'basic':
        authMessage = 'Kræver brugernavn og adgangskode.'
        break
      case 'api_key':
        authMessage = 'Kræver API nøgle. Kontakt leverandøren for adgang.'
        break
      case 'certificate':
        authMessage = 'Kræver digitalt certifikat. Kun for autoriserede organisationer.'
        break
      case 'session':
        authMessage = 'Kræver browser-baseret login med session cookies.'
        break
    }
    
    const historyMessage = authReq.historicalDataAvailable 
      ? '\\n\\nSkal historiske data (sidste 30 dage) også hentes?' 
      : ''
    
    const scopeMessage = authReq.requiredScopes?.length 
      ? `\\n\\nKrævede tilladelser: ${authReq.requiredScopes.join(', ')}` 
      : ''
    
    return `${baseMessage}\\n\\n${authMessage}${scopeMessage}${historyMessage}\\n\\nVil du godkende denne kilde?`
  }
  
  /**
   * Handle user response to authentication request
   */
  async handleUserResponse(response: UserAuthResponse): Promise<void> {
    const authReq = this.pendingAuth.get(response.sourceId)
    
    if (!authReq) {
      console.error(`No pending auth request for source: ${response.sourceId}`)
      return
    }
    
    if (response.approved) {
      // Store authentication info securely
      this.authenticatedSources.set(response.sourceId, response)
      
      console.log(`✅ Authentication approved for ${authReq.sourceName}`)
      
      if (response.fetchHistoricalData) {
        console.log(`📈 Historical data fetch enabled for ${authReq.sourceName}`)
      }
      
      // Send success webhook
      await this.sendSuccessWebhook(authReq, response)
      
    } else {
      console.log(`❌ Authentication denied for ${authReq.sourceName}`)
    }
    
    // Remove from pending
    this.pendingAuth.delete(response.sourceId)
  }
  
  /**
   * Send success webhook notification
   */
  private async sendSuccessWebhook(authReq: AuthRequirement, response: UserAuthResponse): Promise<void> {
    const payload: AuthWebhookPayload = {
      type: 'auth_success',
      requirement: authReq,
      userPrompt: `Autentificering konfigureret for ${authReq.sourceName}`,
      actions: {
        approve: '',
        deny: ''
      }
    }
    
    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Cyberstreams-Event': 'auth_success'
        },
        body: JSON.stringify(payload)
      })
    } catch (error) {
      console.error('Success webhook failed:', error)
    }
  }
  
  /**
   * Get authentication credentials for a source
   */
  getAuthCredentials(sourceId: string): UserAuthResponse | null {
    return this.authenticatedSources.get(sourceId) || null
  }
  
  /**
   * Check if source has pending authentication
   */
  hasAuthPending(sourceId: string): boolean {
    return this.pendingAuth.has(sourceId)
  }
  
  /**
   * Get all pending authentication requests
   */
  getPendingAuthRequests(): AuthRequirement[] {
    return Array.from(this.pendingAuth.values())
  }
  
  /**
   * Get authentication statistics
   */
  getAuthStats(): {
    pendingCount: number
    authenticatedCount: number
    pendingSources: string[]
    authenticatedSources: string[]
  } {
    return {
      pendingCount: this.pendingAuth.size,
      authenticatedCount: this.authenticatedSources.size,
      pendingSources: Array.from(this.pendingAuth.keys()),
      authenticatedSources: Array.from(this.authenticatedSources.keys())
    }
  }
  
  /**
   * Clear all authentication data (for testing/reset)
   */
  clearAllAuth(): void {
    this.pendingAuth.clear()
    this.authenticatedSources.clear()
    console.log('🧹 All authentication data cleared')
  }
}