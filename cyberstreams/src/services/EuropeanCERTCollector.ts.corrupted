/**/**import { EventEmitter } from 'events';

 * EUROPEAN CERT CONTENT COLLECTOR

 * Indsamler data fra 30+ europæiske CERT/CSIRT kilder * EUROPEAN CERT CONTENT COLLECTOR

 * Kategoriserer: sårbarhed, incident, politik

 * Håndterer: RSS, API, HTML scraping med login detection * Indsamler data fra 30+ europæiske CERT/CSIRT kilderinterface CERTSource {

 */

 * Kategoriserer: sårbarhed, incident, politik  id: string;

import { AuthorizedSource, AUTHORIZED_SOURCES } from './AuthorizedSources'

import { SearchTermCombiner, CYBERSECURITY_SEARCH_TERMS } from './SearchTermsDatabase' * Håndterer: RSS, API, HTML scraping  name: string;



export interface CollectedContent { */  country: string;

  id: string

  title: string  url: string;

  source: string

  sourceId: stringimport { AuthorizedSource, AUTHORIZED_SOURCES } from './AuthorizedSources'  rssUrl?: string;

  timestamp: Date

  summary: stringimport { SearchTermCombiner, CYBERSECURITY_SEARCH_TERMS } from './SearchTermsDatabase'  apiUrl?: string;

  url: string

  imageUrl?: string  apiKey?: string;

  category: 'vulnerability' | 'incident' | 'policy' | 'advisory' | 'alert'

  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'export interface CollectedContent {  requiresLogin: boolean;

  rawContent?: string

  metadata: {  id: string  tier: 1 | 2 | 3;

    feedType: 'rss' | 'api' | 'scraper'

    language: string  title: string  trustLevel: number;

    tags: string[]

    cvssScore?: number  source: string  language: string[];

    cveIds?: string[]

    affectedSystems?: string[]  sourceId: string  specialties: string[];

    sourceCredibility?: number

    sourceRelevance?: number  timestamp: Date  updateInterval: number; // minutes

    geography?: string[]

    sectors?: string[]  summary: string  lastChecked?: Date;

  }

}  url: string  isActive: boolean;



export interface CollectionResult {  imageUrl?: string  status: 'online' | 'offline' | 'error' | 'maintenance';

  success: boolean

  sourceId: string  category: 'vulnerability' | 'incident' | 'policy' | 'advisory' | 'alert'  errorCount: number;

  itemsCollected: number

  items: CollectedContent[]  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'  lastError?: string;

  errors?: string[]

  requiresAuth?: boolean  rawContent?: string}

  authType?: 'oauth' | 'basic' | 'api_key' | 'certificate'

}  metadata: {



export interface AuthWebhookRequest {    feedType: 'rss' | 'api' | 'scraper'interface CERTAlert {

  sourceId: string

  sourceName: string    language: string  id: string;

  domain: string

  authType: 'oauth' | 'basic' | 'api_key' | 'certificate'    tags: string[]  sourceId: string;

  message: string

  loginUrl?: string    cvssScore?: number  title: string;

  requiresHistoricalData?: boolean

}    cveIds?: string[]  description: string;



export class EuropeanCERTCollector {    affectedSystems?: string[]  severity: 'critical' | 'high' | 'medium' | 'low';

  

  private sources: AuthorizedSource[]  }  category: string[];

  private activeJobs: Map<string, number> = new Map() // Browser-compatible timer IDs

  private authPendingSources: Set<string> = new Set()}  keywords: string[];

  

  constructor(  publishDate: Date;

    private webhookUrl?: string // Optional webhook for auth notifications

  ) {export interface CollectionResult {  lastUpdated: Date;

    this.sources = AUTHORIZED_SOURCES.filter(s => 

      s.type === 'cert' || s.type === 'government'  success: boolean  sourceUrl: string;

    )

  }  sourceId: string  rawContent: string;

  

  /**  itemsCollected: number  language: string;

   * Start periodic collection for all European CERT sources

   */  items: CollectedContent[]  trustScore: number;

  async startPeriodicCollection(): Promise<void> {

    console.log(`🚀 Starting periodic collection for ${this.sources.length} European CERT sources`)  errors?: string[]  isVerified: boolean;

    

    for (const source of this.sources) {  requiresAuth?: boolean  relatedAlerts: string[];

      await this.scheduleSourceCollection(source)

    }  authType?: 'oauth' | 'basic' | 'api_key' | 'certificate'}

  }

  }

  /**

   * Schedule collection for a specific sourceinterface CollectionMetrics {

   */

  private async scheduleSourceCollection(source: AuthorizedSource): Promise<void> {export class EuropeanCERTCollector {  totalSources: number;

    // Initial collection

    await this.collectFromSource(source)    activeSources: number;

    

    // Schedule periodic updates with browser-compatible timers  private sources: AuthorizedSource[]  tier1Sources: number;

    const intervalMs = source.updateFrequency * 60 * 1000 // Convert minutes to ms

      private activeJobs: Map<string, NodeJS.Timer> = new Map()  tier2Sources: number;

    const timerId = window.setInterval(async () => {

      await this.collectFromSource(source)    tier3Sources: number;

    }, intervalMs)

      constructor() {  alertsLast24h: number;

    this.activeJobs.set(source.id, timerId)

    console.log(`⏰ Scheduled ${source.name} for updates every ${source.updateFrequency} minutes`)    this.sources = AUTHORIZED_SOURCES.filter(s =>   criticalAlertsLast24h: number;

  }

        s.type === 'cert' || s.type === 'government'  averageResponseTime: number;

  /**

   * Collect content from a specific source    )  successRate: number;

   */

  async collectFromSource(source: AuthorizedSource): Promise<CollectionResult> {  }  lastUpdateTime: Date;

    console.log(`📡 Collecting from ${source.name} (${source.domain})`)

      }

    // Skip if auth is pending for this source

    if (this.authPendingSources.has(source.id)) {  /**

      console.log(`⏳ Skipping ${source.name} - authentication pending`)

      return {   * Start periodic collection for all European CERT sourcesclass EuropeanCERTCollector extends EventEmitter {

        success: false,

        sourceId: source.id,   */  private sources: Map<string, CERTSource> = new Map();

        itemsCollected: 0,

        items: [],  async startPeriodicCollection(): Promise<void> {  private activeJobs: Map<string, NodeJS.Timer> = new Map();

        errors: ['Authentication pending user response'],

        requiresAuth: true    console.log(`🚀 Starting periodic collection for ${this.sources.length} European CERT sources`)  private alerts: Map<string, CERTAlert> = new Map();

      }

    }      private metrics: CollectionMetrics;

    

    try {    for (const source of this.sources) {  private isRunning: boolean = false;

      // Check if source requires authentication

      const authResult = await this.checkAuthentication(source)      await this.scheduleSourceCollection(source)  private danishKeywords: string[] = [];

      if (!authResult.success) {

        await this.handleAuthenticationRequired(source, authResult)    }  private englishKeywords: string[] = [];

        return {

          success: false,  }

          sourceId: source.id,

          itemsCollected: 0,    constructor() {

          items: [],

          errors: [authResult.error || 'Authentication required'],  /**    super();

          requiresAuth: true,

          authType: authResult.authType   * Schedule collection for a specific source    this.initializeSources();

        }

      }   */    this.initializeKeywords();

      

      let items: CollectedContent[] = []  private async scheduleSourceCollection(source: AuthorizedSource): Promise<void> {    this.initializeMetrics();

      

      // Try RSS first if available    // Initial collection  }

      if (source.rssUrl) {

        const rssItems = await this.collectFromRSS(source)    await this.collectFromSource(source)

        items.push(...rssItems)

      }      private initializeSources(): void {

      

      // Try API if available    // Schedule periodic updates    // TIER 1 Sources (15min intervals)

      if (source.apiUrl) {

        const apiItems = await this.collectFromAPI(source)    const intervalMs = source.updateFrequency * 60 * 1000 // Convert minutes to ms    this.addSource({

        items.push(...apiItems)

      }    const timer = setInterval(async () => {      id: 'ncsc-uk',

      

      // Fallback to HTML scraping if no feeds work      await this.collectFromSource(source)      name: 'NCSC UK',

      if (items.length === 0) {

        const scrapedItems = await this.collectFromWebsite(source)    }, intervalMs)      country: 'United Kingdom',

        items.push(...scrapedItems)

      }          url: 'https://ncsc.gov.uk/',

      

      // Process and categorize items    this.activeJobs.set(source.id, timer)      rssUrl: 'https://ncsc.gov.uk/api/1/services/v1/all-rss-feed.xml',

      const processedItems = await this.processCollectedItems(items, source)

          console.log(`⏰ Scheduled ${source.name} for updates every ${source.updateFrequency} minutes`)      apiUrl: 'https://ncsc.gov.uk/api/v2',

      console.log(`✅ Collected ${processedItems.length} items from ${source.name}`)

        }      requiresLogin: false,

      return {

        success: true,        tier: 1,

        sourceId: source.id,

        itemsCollected: processedItems.length,  /**      trustLevel: 98,

        items: processedItems

      }   * Collect content from a specific source      language: ['en'],

      

    } catch (error) {   */      specialties: ['APT attribution', 'state-sponsored attacks', 'threat intelligence'],

      console.error(`❌ Error collecting from ${source.name}:`, error)

      return {  async collectFromSource(source: AuthorizedSource): Promise<CollectionResult> {      updateInterval: 15,

        success: false,

        sourceId: source.id,    console.log(`📡 Collecting from ${source.name} (${source.domain})`)      isActive: true,

        itemsCollected: 0,

        items: [],          status: 'online',

        errors: [error instanceof Error ? error.message : 'Unknown error']

      }    try {      errorCount: 0

    }

  }      // Check if source requires authentication    });

  

  /**      if (source.requiresAuth) {

   * Check authentication status for a source (detects 401/302)

   */        const authResult = await this.checkAuthentication(source)    this.addSource({

  private async checkAuthentication(source: AuthorizedSource): Promise<{

    success: boolean        if (!authResult.success) {      id: 'bsi-cert-bund',

    error?: string

    authType?: 'oauth' | 'basic' | 'api_key' | 'certificate'          return {      name: 'BSI CERT-Bund',

    loginUrl?: string

  }> {            success: false,      country: 'Germany',

    try {

      // Test basic connectivity first            sourceId: source.id,      url: 'https://bsi.bund.de/',

      const testUrl = source.rssUrl || source.apiUrl || `https://${source.domain}`

      const response = await fetch(testUrl, {             itemsCollected: 0,      rssUrl: 'https://bsi.bund.de/rss/advisories',

        method: 'HEAD',

        redirect: 'manual' // Don't follow redirects to detect auth redirects            items: [],      apiUrl: 'https://bsi.bund.de/api/v1',

      })

                  errors: [authResult.error || 'Authentication required'],      requiresLogin: false,

      // Check for authentication requirements

      if (response.status === 401) {            requiresAuth: true,      tier: 1,

        return {

          success: false,            authType: authResult.authType      trustLevel: 97,

          error: 'Authentication required (401 Unauthorized)',

          authType: this.detectAuthType(response),          }      language: ['de', 'en'],

        }

      }        }      specialties: ['industrial control systems', 'automotive security', 'critical infrastructure'],

      

      if (response.status === 302 || response.status === 303) {      }      updateInterval: 15,

        const location = response.headers.get('Location')

        if (location && this.isAuthRedirect(location)) {            isActive: true,

          return {

            success: false,      let items: CollectedContent[] = []      status: 'online',

            error: 'Authentication required (redirect to login)',

            authType: location.includes('oauth') ? 'oauth' : 'basic',            errorCount: 0

            loginUrl: location

          }      // Try RSS first if available    });

        }

      }      if (source.rssUrl) {

      

      if (response.status === 403) {        const rssItems = await this.collectFromRSS(source)    this.addSource({

        return {

          success: false,        items.push(...rssItems)      id: 'cert-dk-cfcs',

          error: 'Access forbidden (403) - may require API key or certificate',

          authType: 'api_key'      }      name: 'CERT.dk / CFCS',

        }

      }            country: 'Denmark',

      

      return { success: true }      // Try API if available      url: 'https://cfcs.dk/',

      

    } catch (error) {      if (source.apiUrl) {      rssUrl: 'https://cfcs.dk/da/nyheder/rss',

      return {

        success: false,        const apiItems = await this.collectFromAPI(source)      apiUrl: 'https://cfcs.dk/api/v1',

        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`

      }        items.push(...apiItems)      requiresLogin: false,

    }

  }      }      tier: 1,

  

  /**            trustLevel: 97,

   * Detect authentication type from response headers

   */      // Fallback to HTML scraping if no feeds work      language: ['da', 'en'],

  private detectAuthType(response: Response): 'oauth' | 'basic' | 'api_key' | 'certificate' {

    const wwwAuth = response.headers.get('WWW-Authenticate')      if (items.length === 0) {      specialties: ['APT tracking', 'hybrid threats', 'disinformation', 'state-sponsored'],

    

    if (wwwAuth?.toLowerCase().includes('bearer')) {        const scrapedItems = await this.collectFromWebsite(source)      updateInterval: 15,

      return 'oauth'

    }        items.push(...scrapedItems)      isActive: true,

    

    if (wwwAuth?.toLowerCase().includes('basic')) {      }      status: 'online',

      return 'basic'

    }            errorCount: 0

    

    return 'api_key'      // Process and categorize items    });

  }

        const processedItems = await this.processCollectedItems(items, source)

  /**

   * Check if redirect URL is authentication-related          this.addSource({

   */

  private isAuthRedirect(url: string): boolean {      console.log(`✅ Collected ${processedItems.length} items from ${source.name}`)      id: 'circl-lu',

    const authPatterns = [

      'login', 'auth', 'oauth', 'signin', 'sso', 'saml',             name: 'CIRCL Luxembourg',

      'certificate', 'credentials', 'authenticate'

    ]      return {      country: 'Luxembourg',

    

    return authPatterns.some(pattern =>         success: true,      url: 'https://circl.lu/',

      url.toLowerCase().includes(pattern)

    )        sourceId: source.id,      rssUrl: 'https://circl.lu/rss/advisories',

  }

          itemsCollected: processedItems.length,      apiUrl: 'https://circl.lu/api/v1',

  /**

   * Handle authentication required - send webhook to user        items: processedItems      requiresLogin: false,

   */

  private async handleAuthenticationRequired(      }      tier: 1,

    source: AuthorizedSource, 

    authResult: { authType?: string; loginUrl?: string; error?: string }            trustLevel: 97,

  ): Promise<void> {

    this.authPendingSources.add(source.id)    } catch (error) {      language: ['en', 'fr'],

    

    const webhookRequest: AuthWebhookRequest = {      console.error(`❌ Error collecting from ${source.name}:`, error)      specialties: ['MISP development', 'threat intel sharing', 'malware analysis'],

      sourceId: source.id,

      sourceName: source.name,      return {      updateInterval: 15,

      domain: source.domain,

      authType: authResult.authType as any || 'basic',        success: false,      isActive: true,

      message: `Kilde "${source.name}" kræver login/OAuth. Vil du logge ind nu, og skal historiske data hentes?`,

      loginUrl: authResult.loginUrl,        sourceId: source.id,      status: 'online',

      requiresHistoricalData: true

    }        itemsCollected: 0,      errorCount: 0

    

    if (this.webhookUrl) {        items: [],    });

      try {

        await fetch(this.webhookUrl, {        errors: [error instanceof Error ? error.message : 'Unknown error']

          method: 'POST',

          headers: { 'Content-Type': 'application/json' },      }    this.addSource({

          body: JSON.stringify(webhookRequest)

        })    }      id: 'cert-fi',

        console.log(`📧 Sent auth webhook for ${source.name}`)

      } catch (error) {  }      name: 'CERT.fi / NCSC-FI',

        console.error(`Failed to send auth webhook:`, error)

      }        country: 'Finland',

    } else {

      console.log(`🔐 ${source.name} requires authentication:`, webhookRequest)  /**      url: 'https://traficom.fi/ncsc-fi',

    }

  }   * Check authentication status for a source      rssUrl: 'https://traficom.fi/en/rss/cyber-security',

  

  /**   */      apiUrl: 'https://traficom.fi/api/ncsc',

   * User response to authentication request

   */  private async checkAuthentication(source: AuthorizedSource): Promise<{      requiresLogin: false,

  async handleAuthResponse(

    sourceId: string,     success: boolean      tier: 1,

    approved: boolean, 

    credentials?: {     error?: string      trustLevel: 96,

      type: 'oauth' | 'basic' | 'api_key'

      token?: string    authType?: 'oauth' | 'basic' | 'api_key' | 'certificate'      language: ['fi', 'sv', 'en'],

      username?: string

      password?: string  }> {      specialties: ['telecom security', '5G infrastructure', 'Nokia expertise'],

      apiKey?: string

    }    try {      updateInterval: 15,

  ): Promise<void> {

    if (approved && credentials) {      // Test basic connectivity first      isActive: true,

      // Store credentials securely (implement proper encryption in production)

      console.log(`✅ Authentication approved for ${sourceId}`)      const testUrl = source.rssUrl || source.apiUrl || `https://${source.domain}`      status: 'online',

      // TODO: Store credentials in secure vault

    }      const response = await fetch(testUrl, {       errorCount: 0

    

    this.authPendingSources.delete(sourceId)        method: 'HEAD',    });

  }

          redirect: 'manual' // Don't follow redirects to detect auth redirects

  /**

   * Collect from RSS/Atom feeds      })    this.addSource({

   */

  private async collectFromRSS(source: AuthorizedSource): Promise<CollectedContent[]> {            id: 'cert-ee',

    if (!source.rssUrl) return []

          // Check for authentication requirements      name: 'CERT.ee',

    try {

      const response = await fetch(source.rssUrl, {      if (response.status === 401) {      country: 'Estonia',

        headers: {

          'User-Agent': 'Cyberstreams Intelligence Platform 1.0',        return {      url: 'https://cert.ee/',

          'Accept': 'application/rss+xml, application/xml, text/xml'

        }          success: false,      rssUrl: 'https://cert.ee/en/rss/advisories',

      })

                error: 'Authentication required (401 Unauthorized)',      apiUrl: 'https://cert.ee/api/v1',

      if (!response.ok) {

        throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`)          authType: 'basic'      requiresLogin: false,

      }

              }      tier: 1,

      const xml = await response.text()

      return this.parseRSSFeed(xml, source)      }      trustLevel: 95,

      

    } catch (error) {            language: ['et', 'en'],

      console.error(`RSS collection failed for ${source.name}:`, error)

      return []      if (response.status === 302 || response.status === 303) {      specialties: ['e-governance', 'digital identity', 'e-Residency', 'digital society'],

    }

  }        const location = response.headers.get('Location')      updateInterval: 15,

  

  /**        if (location?.includes('login') || location?.includes('auth') || location?.includes('oauth')) {      isActive: true,

   * Parse RSS/Atom feed XML

   */          return {      status: 'online',

  private parseRSSFeed(xml: string, source: AuthorizedSource): CollectedContent[] {

    const items: CollectedContent[] = []            success: false,      errorCount: 0

    

    try {            error: 'Authentication required (redirect to login)',    });

      // Simple XML parsing (in production, use proper XML parser)

      const itemMatches = xml.match(/<item[^>]*>([\\s\\S]*?)<\\/item>/gi) || []            authType: location.includes('oauth') ? 'oauth' : 'basic'

      

      for (const itemXml of itemMatches.slice(0, 20)) { // Limit to latest 20          }    // TIER 2 Sources (1h intervals)

        const item = this.parseRSSItem(itemXml, source)

        if (item) items.push(item)        }    this.addSource({

      }

            }      id: 'cert-at',

    } catch (error) {

      console.error(`RSS parsing failed for ${source.name}:`, error)            name: 'CERT.at',

    }

          if (response.status === 403) {      country: 'Austria',

    return items

  }        return {      url: 'https://cert.at/',

  

  /**          success: false,      rssUrl: 'https://cert.at/feeds/advisories.xml',

   * Parse individual RSS item

   */          error: 'Access forbidden (403) - may require API key or certificate',      requiresLogin: false,

  private parseRSSItem(itemXml: string, source: AuthorizedSource): CollectedContent | null {

    try {          authType: 'api_key'      tier: 2,

      const title = this.extractXMLContent(itemXml, 'title')

      const link = this.extractXMLContent(itemXml, 'link')        }      trustLevel: 95,

      const description = this.extractXMLContent(itemXml, 'description')

      const pubDate = this.extractXMLContent(itemXml, 'pubDate')      }      language: ['de', 'en'],

      

      if (!title || !link) return null            specialties: ['EU policy', '0-day vulnerabilities', 'Fortinet analysis'],

      

      const category = this.categorizeContent(title, description)      return { success: true }      updateInterval: 60,

      const severity = this.determineSeverity(title, description, source)

                  isActive: true,

      return {

        id: `${source.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,    } catch (error) {      status: 'online',

        title: this.cleanText(title),

        source: source.name,      return {      errorCount: 0

        sourceId: source.id,

        timestamp: pubDate ? new Date(pubDate) : new Date(),        success: false,    });

        summary: this.cleanText(description) || title,

        url: link,        error: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`

        imageUrl: source.logoUrl,

        category,      }    this.addSource({

        severity,

        metadata: {    }      id: 'csirt-italia',

          feedType: 'rss',

          language: source.languages[0] || 'en',  }      name: 'CSIRT Italia',

          tags: this.extractTags(title, description)

        }        country: 'Italy',

      }

        /**      url: 'https://csirt.gov.it/',

    } catch (error) {

      console.error('RSS item parsing failed:', error)   * Collect from RSS/Atom feeds      rssUrl: 'https://csirt.gov.it/rss/advisories',

      return null

    }   */      apiUrl: 'https://csirt.gov.it/api/v1',

  }

    private async collectFromRSS(source: AuthorizedSource): Promise<CollectedContent[]> {      requiresLogin: false,

  // [Additional methods: collectFromAPI, parseAPIResponse, categorizeContent, etc.]

  // Truncated for brevity - same implementation as before    if (!source.rssUrl) return []      tier: 2,

  

  /**          trustLevel: 94,

   * Categorize content based on title and description

   */    try {      language: ['it', 'en'],

  private categorizeContent(title: string, description: string): CollectedContent['category'] {

    const content = `${title} ${description}`.toLowerCase()      const response = await fetch(source.rssUrl, {      specialties: ['critical infrastructure', 'government incidents', 'EU coordination'],

    

    if (content.match(/cve-|vulnerability|exploit|patch|security update|zero.day/)) {        headers: {      updateInterval: 60,

      return 'vulnerability'

    }          'User-Agent': 'Cyberstreams Intelligence Platform 1.0',      isActive: true,

    if (content.match(/incident|breach|attack|malware|ransomware|compromise/)) {

      return 'incident'          'Accept': 'application/rss+xml, application/xml, text/xml'      status: 'online',

    }

    if (content.match(/policy|regulation|directive|strategy|framework|guidance/)) {        }      errorCount: 0

      return 'policy'

    }      })    });

    if (content.match(/advisory|warning|alert|notice|bulletin/)) {

      return 'advisory'      

    }

          if (!response.ok) {    this.addSource({

    return 'alert'

  }        throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`)      id: 'ncsc-nl',

  

  /**      }      name: 'NCSC.nl / GovCERT.NL',

   * Determine severity

   */            country: 'Netherlands',

  private determineSeverity(title: string, description: string, source: AuthorizedSource): CollectedContent['severity'] {

    const content = `${title} ${description}`.toLowerCase()      const xml = await response.text()      url: 'https://ncsc.nl/',

    

    if (content.match(/critical|emergency|urgent|zero.day|actively exploited/)) {      return this.parseRSSFeed(xml, source)      rssUrl: 'https://ncsc.nl/rss/advisories',

      return 'critical'

    }            apiUrl: 'https://ncsc.nl/api/v2',

    if (content.match(/high|important|severe|widespread|significant impact/)) {

      return 'high'    } catch (error) {      requiresLogin: false,

    }

    if (content.match(/medium|moderate|limited impact|patch available/)) {      console.error(`RSS collection failed for ${source.name}:`, error)      tier: 2,

      return 'medium'

    }      return []      trustLevel: 95,

    if (content.match(/low|minor|information|advisory only/)) {

      return 'low'    }      language: ['nl', 'en'],

    }

      }      specialties: ['port infrastructure', 'maritime security', 'logistics'],

    return source.priority === 'critical' ? 'high' : 'medium'

  }        updateInterval: 60,

  

  /**  /**      isActive: true,

   * Extract tags from content

   */   * Parse RSS/Atom feed XML      status: 'online',

  private extractTags(title: string, description: string): string[] {

    const content = `${title} ${description}`.toLowerCase()   */      errorCount: 0

    const tags: string[] = []

      private parseRSSFeed(xml: string, source: AuthorizedSource): CollectedContent[] {    });

    for (const searchTerm of CYBERSECURITY_SEARCH_TERMS) {

      if (content.includes(searchTerm.english.toLowerCase()) ||    const items: CollectedContent[] = []

          content.includes(searchTerm.danish.toLowerCase())) {

        tags.push(searchTerm.english)        this.addSource({

      }

    }    try {      id: 'cert-be',

    

    return [...new Set(tags)]      // Simple XML parsing (in production, use proper XML parser like 'fast-xml-parser')      name: 'CERT.be',

  }

        const itemMatches = xml.match(/<item[^>]*>([\\s\\S]*?)<\\/item>/gi) || []      country: 'Belgium',

  private async processCollectedItems(items: CollectedContent[], source: AuthorizedSource): Promise<CollectedContent[]> {

    return items            url: 'https://cert.be/',

      .filter(item => this.isValidItem(item))

      .map(item => this.enrichItem(item, source))      for (const itemXml of itemMatches.slice(0, 20)) { // Limit to latest 20 items      rssUrl: 'https://cert.be/en/rss/advisories',

      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  }        const item = this.parseRSSItem(itemXml, source)      apiUrl: 'https://cert.be/api/v1',

  

  private isValidItem(item: CollectedContent): boolean {        if (item) items.push(item)      requiresLogin: false,

    return !!(

      item.title &&      }      tier: 2,

      item.url &&

      item.title.length > 5 &&            trustLevel: 94,

      !item.title.toLowerCase().includes('test') &&

      !item.title.toLowerCase().includes('mock')    } catch (error) {      language: ['nl', 'fr', 'en'],

    )

  }      console.error(`RSS parsing failed for ${source.name}:`, error)      specialties: ['EU institutions', 'financial sector', 'EU hub position'],

  

  private enrichItem(item: CollectedContent, source: AuthorizedSource): CollectedContent {    }      updateInterval: 60,

    return {

      ...item,          isActive: true,

      metadata: {

        ...item.metadata,    return items      status: 'online',

        sourceCredibility: source.credibilityScore,

        sourceRelevance: source.relevanceScore,  }      errorCount: 0

        geography: source.geography,

        sectors: source.sectors      });

      }

    }  /**

  }

     * Parse individual RSS item    this.addSource({

  private extractXMLContent(xml: string, tag: string): string {

    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))   */      id: 'govcert-lu',

    return match ? match[1].trim() : ''

  }  private parseRSSItem(itemXml: string, source: AuthorizedSource): CollectedContent | null {      name: 'GovCERT Luxembourg',

  

  private cleanText(text: string): string {    try {      country: 'Luxembourg',

    return text

      .replace(/<[^>]*>/g, '')      const title = this.extractXMLContent(itemXml, 'title')      url: 'https://govcert.lu/',

      .replace(/&[^;]+;/g, ' ')

      .replace(/\\s+/g, ' ')      const link = this.extractXMLContent(itemXml, 'link')      rssUrl: 'https://govcert.lu/en/advisories.rss',

      .trim()

  }      const description = this.extractXMLContent(itemXml, 'description')      apiUrl: 'https://govcert.lu/api/misp',

  

  stopPeriodicCollection(): void {      const pubDate = this.extractXMLContent(itemXml, 'pubDate')      requiresLogin: false,

    for (const [sourceId, timerId] of this.activeJobs) {

      window.clearInterval(timerId)            tier: 2,

      console.log(`⏹️ Stopped periodic collection for ${sourceId}`)

    }      if (!title || !link) return null      trustLevel: 96,

    this.activeJobs.clear()

  }            language: ['fr', 'en'],

  

  getCollectionStats() {      // Categorize based on title and description      specialties: ['financial services', 'EU banking', 'MISP integration'],

    return {

      activeSources: this.sources.length,      const category = this.categorizeContent(title, description)      updateInterval: 60,

      scheduledJobs: this.activeJobs.size,

      authPendingSources: this.authPendingSources.size,      const severity = this.determineSeverity(title, description, source)      isActive: true,

      lastCollectionTime: new Date()

    }            status: 'online',

  }

}      return {      errorCount: 0

        id: `${source.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,    });

        title: this.cleanText(title),

        source: source.name,    this.addSource({

        sourceId: source.id,      id: 'csirt-ie',

        timestamp: pubDate ? new Date(pubDate) : new Date(),      name: 'CSIRT-IE',

        summary: this.cleanText(description) || title,      country: 'Ireland',

        url: link,      url: 'https://ncsc.gov.ie/',

        imageUrl: source.logoUrl,      rssUrl: 'https://ncsc.gov.ie/rss/advisories',

        category,      apiUrl: 'https://ncsc.gov.ie/api/v1',

        severity,      requiresLogin: false,

        metadata: {      tier: 2,

          feedType: 'rss',      trustLevel: 93,

          language: source.languages[0] || 'en',      language: ['en'],

          tags: this.extractTags(title, description)      specialties: ['data centers', 'US tech companies EU operations', 'cloud security'],

        }      updateInterval: 60,

      }      isActive: true,

            status: 'online',

    } catch (error) {      errorCount: 0

      console.error('RSS item parsing failed:', error)    });

      return null

    }    // Additional TIER 3 sources would be added here...

  }    this.addTier3Sources();

    }

  /**

   * Collect from API endpoints  private addTier3Sources(): void {

   */    const tier3Sources = [

  private async collectFromAPI(source: AuthorizedSource): Promise<CollectedContent[]> {      {

    if (!source.apiUrl) return []        id: 'cert-pl',

            name: 'CERT.pl',

    try {        country: 'Poland',

      const response = await fetch(source.apiUrl, {        url: 'https://cert.pl/',

        headers: {        rssUrl: 'https://cert.pl/en/rss/advisories',

          'User-Agent': 'Cyberstreams Intelligence Platform 1.0',        specialties: ['banking malware', 'APT tracking', 'malware research']

          'Accept': 'application/json',      },

          'Content-Type': 'application/json'      {

        }        id: 'cert-ro',

      })        name: 'CERT-RO',

              country: 'Romania',

      if (!response.ok) {        url: 'https://cert.ro/',

        throw new Error(`API fetch failed: ${response.status} ${response.statusText}`)        rssUrl: 'https://cert.ro/rss/alerts',

      }        specialties: ['Eastern European APTs', 'ransomware', 'regional threats']

            },

      const data = await response.json()      {

      return this.parseAPIResponse(data, source)        id: 'csirt-cz',

              name: 'CSIRT.cz',

    } catch (error) {        country: 'Czech Republic',

      console.error(`API collection failed for ${source.name}:`, error)        url: 'https://csirt.cz/',

      return []        rssUrl: 'https://csirt.cz/en/rss/advisories',

    }        specialties: ['government cybersecurity', 'EU cooperation']

  }      }

        // Add remaining 15 Tier 3 sources...

  /**    ];

   * Parse API response (structure varies by source)

   */    tier3Sources.forEach(source => {

  private parseAPIResponse(data: any, source: AuthorizedSource): CollectedContent[] {      this.addSource({

    const items: CollectedContent[] = []        id: source.id,

            name: source.name,

    try {        country: source.country,

      // Handle different API response structures        url: source.url,

      let dataArray: any[] = []        rssUrl: source.rssUrl,

              requiresLogin: false,

      if (Array.isArray(data)) {        tier: 3,

        dataArray = data        trustLevel: 88,

      } else if (data.items) {        language: ['en'],

        dataArray = data.items        specialties: source.specialties,

      } else if (data.advisories) {        updateInterval: 360, // 6 hours

        dataArray = data.advisories        isActive: true,

      } else if (data.alerts) {        status: 'online',

        dataArray = data.alerts        errorCount: 0

      }      });

          });

      for (const item of dataArray.slice(0, 20)) {  }

        const parsedItem = this.parseAPIItem(item, source)

        if (parsedItem) items.push(parsedItem)  private initializeKeywords(): void {

      }    this.danishKeywords = [

            'cybersikkerhed', 'IT-sikkerhed', 'cyberangreb', 'ransomware', 

    } catch (error) {      'digital suverænitet', 'lovforslag', 'kritisk infrastruktur',

      console.error(`API parsing failed for ${source.name}:`, error)      'kunstig intelligens', 'AI-sikkerhed', 'databeskyttelse', 'GDPR',

    }      'hybride trusler', 'desinformation', 'APT', 'malware',

          'phishing', 'social engineering', 'DDoS', 'botnet',

    return items      'zero-day', 'sårbarhed', 'patch', 'opdatering',

  }      'backup', 'kryptering', 'to-faktor', 'adgangskontrol',

        'netværkssikkerhed', 'firewalls', 'intrusion detection',

  /**      'incident response', 'sikkerhedshændelse', 'cyberkrigsførelse',

   * Parse individual API item      'statssponsoreret', 'cyberspionage', 'industrispionage'

   */    ];

  private parseAPIItem(item: any, source: AuthorizedSource): CollectedContent | null {

    try {    this.englishKeywords = [

      const title = item.title || item.name || item.summary      'cyber security', 'information security', 'cyber attack', 'ransomware',

      const url = item.url || item.link || item.href      'digital sovereignty', 'legislative proposal', 'critical infrastructure',

      const description = item.description || item.summary || item.content      'artificial intelligence', 'AI security', 'data protection', 'GDPR',

      const timestamp = item.timestamp || item.published || item.created || item.date      'hybrid threats', 'disinformation', 'APT', 'malware',

            'phishing', 'social engineering', 'DDoS', 'botnet',

      if (!title || !url) return null      'zero-day', 'vulnerability', 'patch', 'update',

            'backup', 'encryption', 'two-factor', 'access control',

      const category = this.categorizeContent(title, description)      'network security', 'firewalls', 'intrusion detection',

      const severity = this.determineSeverity(title, description, source)      'incident response', 'security incident', 'cyber warfare',

            'state-sponsored', 'cyber espionage', 'industrial espionage',

      return {      'supply chain', 'IoT security', '5G security', 'cloud security'

        id: `${source.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,    ];

        title: this.cleanText(title),  }

        source: source.name,

        sourceId: source.id,  private initializeMetrics(): void {

        timestamp: timestamp ? new Date(timestamp) : new Date(),    this.metrics = {

        summary: this.cleanText(description) || title,      totalSources: this.sources.size,

        url: url,      activeSources: 0,

        imageUrl: source.logoUrl,      tier1Sources: 0,

        category,      tier2Sources: 0,

        severity,      tier3Sources: 0,

        metadata: {      alertsLast24h: 0,

          feedType: 'api',      criticalAlertsLast24h: 0,

          language: source.languages[0] || 'en',      averageResponseTime: 0,

          tags: this.extractTags(title, description),      successRate: 0,

          cvssScore: item.cvss_score || item.cvssScore,      lastUpdateTime: new Date()

          cveIds: item.cve_ids || item.cveIds || []    };

        }    this.updateMetrics();

      }  }

      

    } catch (error) {  private addSource(source: Omit<CERTSource, 'lastChecked'>): void {

      console.error('API item parsing failed:', error)    this.sources.set(source.id, {

      return null      ...source,

    }      lastChecked: undefined

  }    });

    }

  /**

   * Collect from website (HTML scraping fallback)  public async startCollection(): Promise<void> {

   */    if (this.isRunning) {

  private async collectFromWebsite(source: AuthorizedSource): Promise<CollectedContent[]> {      throw new Error('Collection already running');

    try {    }

      const response = await fetch(`https://${source.domain}`, {

        headers: {    console.log('🚀 Starting European CERT Collection System...');

          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'    this.isRunning = true;

        }

      })    // Start collection jobs for each tier

          await this.startTierCollection(1);

      if (!response.ok) {    await this.startTierCollection(2);

        throw new Error(`Website fetch failed: ${response.status}`)    await this.startTierCollection(3);

      }

          this.emit('collectionStarted', {

      const html = await response.text()      sources: this.sources.size,

      return this.parseWebsiteHTML(html, source)      timestamp: new Date()

          });

    } catch (error) {

      console.error(`Website scraping failed for ${source.name}:`, error)    console.log(`✅ Started collection for ${this.sources.size} CERT sources`);

      return []  }

    }

  }  public async stopCollection(): Promise<void> {

      if (!this.isRunning) {

  /**      return;

   * Parse website HTML for advisories/alerts    }

   */

  private parseWebsiteHTML(html: string, source: AuthorizedSource): CollectedContent[] {    console.log('🛑 Stopping European CERT Collection System...');

    const items: CollectedContent[] = []    this.isRunning = false;

    

    try {    // Clear all active jobs

      // Look for common patterns in CERT websites    for (const [sourceId, timer] of this.activeJobs) {

      const patterns = [      clearInterval(timer);

        /<article[^>]*>([\\s\\S]*?)<\\/article>/gi,      this.activeJobs.delete(sourceId);

        /<div[^>]*class[^>]*(?:advisory|alert|news)[^>]*>([\\s\\S]*?)<\\/div>/gi,    }

        /<li[^>]*>.*?<a[^>]*href="([^"]*)"[^>]*>([^<]+)<\\/a>.*?<\\/li>/gi

      ]    this.emit('collectionStopped', {

            sources: this.sources.size,

      for (const pattern of patterns) {      timestamp: new Date()

        const matches = html.match(pattern) || []    });

        for (const match of matches.slice(0, 10)) {

          const item = this.parseHTMLItem(match, source)    console.log('✅ Collection stopped');

          if (item) items.push(item)  }

        }

      }  private async startTierCollection(tier: 1 | 2 | 3): Promise<void> {

          const tierSources = Array.from(this.sources.values()).filter(s => s.tier === tier && s.isActive);

    } catch (error) {    

      console.error(`HTML parsing failed for ${source.name}:`, error)    console.log(`📊 Starting Tier ${tier} collection (${tierSources.length} sources, ${tierSources[0]?.updateInterval}min intervals)`);

    }

        for (const source of tierSources) {

    return items      await this.scheduleSourceCollection(source);

  }    }

    }

  /**

   * Parse individual HTML item  private async scheduleSourceCollection(source: CERTSource): Promise<void> {

   */    // Immediate first collection

  private parseHTMLItem(html: string, source: AuthorizedSource): CollectedContent | null {    await this.collectFromSource(source);

    try {

      // Extract title and link using regex    // Schedule recurring collection

      const titleMatch = html.match(/<h[1-6][^>]*>([^<]+)<\\/h[1-6]>/) ||    const timer = setInterval(async () => {

                        html.match(/<a[^>]*>([^<]+)<\\/a>/)      await this.collectFromSource(source);

      const linkMatch = html.match(/href="([^"]+)"/)    }, source.updateInterval * 60 * 1000);

      

      if (!titleMatch || !linkMatch) return null    this.activeJobs.set(source.id, timer);

        }

      const title = titleMatch[1].trim()

      const relativeUrl = linkMatch[1]  private async collectFromSource(source: CERTSource): Promise<void> {

      const fullUrl = relativeUrl.startsWith('http') ? relativeUrl : `https://${source.domain}${relativeUrl}`    const startTime = Date.now();

          

      const category = this.categorizeContent(title, '')    try {

      const severity = this.determineSeverity(title, '', source)      console.log(`🔍 Collecting from ${source.name} (${source.country})...`);

            

      return {      let alerts: CERTAlert[] = [];

        id: `${source.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,

        title: this.cleanText(title),      // Try RSS first, then API if available

        source: source.name,      if (source.rssUrl) {

        sourceId: source.id,        alerts = await this.collectFromRSS(source);

        timestamp: new Date(),      } else if (source.apiUrl) {

        summary: title,        alerts = await this.collectFromAPI(source);

        url: fullUrl,      } else {

        imageUrl: source.logoUrl,        alerts = await this.collectFromHTML(source);

        category,      }

        severity,

        metadata: {      // Filter and process alerts

          feedType: 'scraper',      const relevantAlerts = await this.filterRelevantAlerts(alerts, source);

          language: source.languages[0] || 'en',      

          tags: this.extractTags(title, '')      // Store new alerts

        }      for (const alert of relevantAlerts) {

      }        this.alerts.set(alert.id, alert);

            }

    } catch (error) {

      console.error('HTML item parsing failed:', error)      // Update source status

      return null      source.lastChecked = new Date();

    }      source.status = 'online';

  }      source.errorCount = 0;

  

  /**      const responseTime = Date.now() - startTime;

   * Categorize content based on title and description      

   */      this.emit('sourceCollected', {

  private categorizeContent(title: string, description: string): CollectedContent['category'] {        sourceId: source.id,

    const content = `${title} ${description}`.toLowerCase()        sourceName: source.name,

            alertsFound: alerts.length,

    // Vulnerability patterns        relevantAlerts: relevantAlerts.length,

    if (content.match(/cve-|vulnerability|exploit|patch|security update|zero.day/)) {        responseTime,

      return 'vulnerability'        timestamp: new Date()

    }      });

    

    // Incident patterns        if (relevantAlerts.length > 0) {

    if (content.match(/incident|breach|attack|malware|ransomware|compromise/)) {        console.log(`✅ ${source.name}: ${relevantAlerts.length} relevant alerts found (${responseTime}ms)`);

      return 'incident'      }

    }

        } catch (error) {

    // Policy patterns      console.error(`❌ Error collecting from ${source.name}:`, error);

    if (content.match(/policy|regulation|directive|strategy|framework|guidance/)) {      

      return 'policy'      source.errorCount++;

    }      source.lastError = error.message;

          source.status = source.errorCount >= 3 ? 'error' : 'online';

    // Advisory patterns      

    if (content.match(/advisory|warning|alert|notice|bulletin/)) {      this.emit('sourceError', {

      return 'advisory'        sourceId: source.id,

    }        sourceName: source.name,

            error: error.message,

    return 'alert' // Default        errorCount: source.errorCount,

  }        timestamp: new Date()

        });

  /**    }

   * Determine severity based on content and source priority  }

   */

  private determineSeverity(title: string, description: string, source: AuthorizedSource): CollectedContent['severity'] {  private async collectFromRSS(source: CERTSource): Promise<CERTAlert[]> {

    const content = `${title} ${description}`.toLowerCase()    // RSS collection implementation

        const response = await fetch(source.rssUrl!, {

    // Critical patterns      headers: {

    if (content.match(/critical|emergency|urgent|zero.day|actively exploited|immediate action/)) {        'User-Agent': 'CyberStreams-CERT-Collector/1.0',

      return 'critical'        'Accept': 'application/rss+xml, application/xml, text/xml'

    }      }

        });

    // High patterns

    if (content.match(/high|important|severe|widespread|significant impact/)) {    if (!response.ok) {

      return 'high'      throw new Error(`RSS fetch failed: ${response.status} ${response.statusText}`);

    }    }

    

    // Medium patterns    const rssContent = await response.text();

    if (content.match(/medium|moderate|limited impact|patch available/)) {    return this.parseRSSContent(rssContent, source);

      return 'medium'  }

    }

      private async collectFromAPI(source: CERTSource): Promise<CERTAlert[]> {

    // Low patterns    // API collection implementation

    if (content.match(/low|minor|information|advisory only/)) {    const headers: Record<string, string> = {

      return 'low'      'User-Agent': 'CyberStreams-CERT-Collector/1.0',

    }      'Accept': 'application/json'

        };

    // Default based on source priority

    switch (source.priority) {    if (source.apiKey) {

      case 'critical': return 'high'      headers['Authorization'] = `Bearer ${source.apiKey}`;

      case 'high': return 'medium'    }

      case 'medium': return 'low'

      default: return 'info'    const response = await fetch(source.apiUrl!, { headers });

    }

  }    if (!response.ok) {

        throw new Error(`API fetch failed: ${response.status} ${response.statusText}`);

  /**    }

   * Extract relevant tags from content

   */    const apiData = await response.json();

  private extractTags(title: string, description: string): string[] {    return this.parseAPIContent(apiData, source);

    const content = `${title} ${description}`.toLowerCase()  }

    const tags: string[] = []

      private async collectFromHTML(source: CERTSource): Promise<CERTAlert[]> {

    // Check against search terms    // HTML scraping implementation for sources without RSS/API

    for (const searchTerm of CYBERSECURITY_SEARCH_TERMS) {    const response = await fetch(source.url, {

      if (content.includes(searchTerm.english.toLowerCase()) ||      headers: {

          content.includes(searchTerm.danish.toLowerCase())) {        'User-Agent': 'CyberStreams-CERT-Collector/1.0',

        tags.push(searchTerm.english)        'Accept': 'text/html'

      }      }

    }    });

    

    return [...new Set(tags)] // Remove duplicates    if (!response.ok) {

  }      throw new Error(`HTML fetch failed: ${response.status} ${response.statusText}`);

      }

  /**

   * Process and enrich collected items    const htmlContent = await response.text();

   */    return this.parseHTMLContent(htmlContent, source);

  private async processCollectedItems(items: CollectedContent[], source: AuthorizedSource): Promise<CollectedContent[]> {  }

    return items

      .filter(item => this.isValidItem(item))  private parseRSSContent(rssContent: string, source: CERTSource): CERTAlert[] {

      .map(item => this.enrichItem(item, source))    // Basic RSS parsing - in production, use a proper RSS parser

      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())    const alerts: CERTAlert[] = [];

  }    

      // This is a simplified implementation

  /**    // In production, use xml2js or similar RSS parser

   * Validate collected item    const itemMatches = rssContent.match(/<item[^>]*>[\s\S]*?<\/item>/gi);

   */    

  private isValidItem(item: CollectedContent): boolean {    if (itemMatches) {

    return !!(      for (const itemMatch of itemMatches.slice(0, 10)) { // Limit to 10 most recent

      item.title &&        const alert = this.parseRSSItem(itemMatch, source);

      item.url &&        if (alert) {

      item.title.length > 5 &&          alerts.push(alert);

      !item.title.toLowerCase().includes('test') &&        }

      !item.title.toLowerCase().includes('mock')      }

    )    }

  }

      return alerts;

  /**  }

   * Enrich item with additional metadata

   */  private parseRSSItem(itemContent: string, source: CERTSource): CERTAlert | null {

  private enrichItem(item: CollectedContent, source: AuthorizedSource): CollectedContent {    try {

    return {      const titleMatch = itemContent.match(/<title[^>]*><!\[CDATA\[(.*?)\]\]><\/title>|<title[^>]*>(.*?)<\/title>/i);

      ...item,      const descMatch = itemContent.match(/<description[^>]*><!\[CDATA\[(.*?)\]\]><\/description>|<description[^>]*>(.*?)<\/description>/i);

      metadata: {      const linkMatch = itemContent.match(/<link[^>]*>(.*?)<\/link>/i);

        ...item.metadata,      const pubDateMatch = itemContent.match(/<pubDate[^>]*>(.*?)<\/pubDate>/i);

        sourceCredibility: source.credibilityScore,

        sourceRelevance: source.relevanceScore,      if (!titleMatch) return null;

        geography: source.geography,

        sectors: source.sectors      const title = titleMatch[1] || titleMatch[2] || '';

      }      const description = descMatch?.[1] || descMatch?.[2] || '';

    }      const sourceUrl = linkMatch?.[1] || source.url;

  }      const publishDate = pubDateMatch?.[1] ? new Date(pubDateMatch[1]) : new Date();

  

  // UTILITY METHODS      const alert: CERTAlert = {

          id: `${source.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,

  private extractXMLContent(xml: string, tag: string): string {        sourceId: source.id,

    const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))        title: this.cleanText(title),

    return match ? match[1].trim() : ''        description: this.cleanText(description),

  }        severity: this.determineSeverity(title, description),

          category: this.extractCategories(title, description),

  private cleanText(text: string): string {        keywords: this.extractKeywords(title, description),

    return text        publishDate,

      .replace(/<[^>]*>/g, '') // Remove HTML tags        lastUpdated: new Date(),

      .replace(/&[^;]+;/g, ' ') // Remove HTML entities        sourceUrl,

      .replace(/\\s+/g, ' ') // Normalize whitespace        rawContent: itemContent,

      .trim()        language: this.detectLanguage(title, description),

  }        trustScore: source.trustLevel,

          isVerified: false,

  /**        relatedAlerts: []

   * Stop all periodic collection jobs      };

   */

  stopPeriodicCollection(): void {      return alert;

    for (const [sourceId, timer] of this.activeJobs) {    } catch (error) {

      clearInterval(timer)      console.error('Error parsing RSS item:', error);

      console.log(`⏹️ Stopped periodic collection for ${sourceId}`)      return null;

    }    }

    this.activeJobs.clear()  }

  }

    private parseAPIContent(apiData: any, source: CERTSource): CERTAlert[] {

  /**    // API parsing implementation - varies by source

   * Get collection statistics    const alerts: CERTAlert[] = [];

   */    

  getCollectionStats(): {    // This would be customized for each API format

    activeSources: number    if (Array.isArray(apiData.alerts)) {

    scheduledJobs: number      for (const item of apiData.alerts.slice(0, 10)) {

    lastCollectionTime: Date | null        const alert = this.parseAPIItem(item, source);

  } {        if (alert) {

    return {          alerts.push(alert);

      activeSources: this.sources.length,        }

      scheduledJobs: this.activeJobs.size,      }

      lastCollectionTime: new Date() // In production, track actual last collection times    }

    }

  }    return alerts;

}  }

  private parseAPIItem(item: any, source: CERTSource): CERTAlert | null {
    // API item parsing - customize per source
    try {
      const alert: CERTAlert = {
        id: `${source.id}-${item.id || Date.now()}`,
        sourceId: source.id,
        title: this.cleanText(item.title || item.name || ''),
        description: this.cleanText(item.description || item.summary || ''),
        severity: item.severity || this.determineSeverity(item.title, item.description),
        category: item.categories || this.extractCategories(item.title, item.description),
        keywords: item.keywords || this.extractKeywords(item.title, item.description),
        publishDate: new Date(item.published || item.created || Date.now()),
        lastUpdated: new Date(item.updated || Date.now()),
        sourceUrl: item.url || source.url,
        rawContent: JSON.stringify(item),
        language: item.language || this.detectLanguage(item.title, item.description),
        trustScore: source.trustLevel,
        isVerified: false,
        relatedAlerts: []
      };

      return alert;
    } catch (error) {
      console.error('Error parsing API item:', error);
      return null;
    }
  }

  private parseHTMLContent(htmlContent: string, source: CERTSource): CERTAlert[] {
    // HTML parsing implementation for sources without structured feeds
    const alerts: CERTAlert[] = [];
    
    // This would use cheerio or similar HTML parser in production
    // Simplified implementation for demonstration
    const newsMatches = htmlContent.match(/<article[^>]*>[\s\S]*?<\/article>|<div[^>]*class="[^"]*news[^"]*"[^>]*>[\s\S]*?<\/div>/gi);
    
    if (newsMatches) {
      for (const newsMatch of newsMatches.slice(0, 5)) { // Limit to 5 most recent
        const alert = this.parseHTMLItem(newsMatch, source);
        if (alert) {
          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  private parseHTMLItem(htmlContent: string, source: CERTSource): CERTAlert | null {
    // HTML item parsing - very basic implementation
    try {
      const titleMatch = htmlContent.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/i);
      const textMatch = htmlContent.match(/<p[^>]*>(.*?)<\/p>/i);
      
      if (!titleMatch) return null;

      const title = this.cleanText(titleMatch[1]);
      const description = this.cleanText(textMatch?.[1] || '');

      const alert: CERTAlert = {
        id: `${source.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sourceId: source.id,
        title,
        description,
        severity: this.determineSeverity(title, description),
        category: this.extractCategories(title, description),
        keywords: this.extractKeywords(title, description),
        publishDate: new Date(),
        lastUpdated: new Date(),
        sourceUrl: source.url,
        rawContent: htmlContent,
        language: this.detectLanguage(title, description),
        trustScore: source.trustLevel * 0.8, // Lower trust for HTML scraping
        isVerified: false,
        relatedAlerts: []
      };

      return alert;
    } catch (error) {
      console.error('Error parsing HTML item:', error);
      return null;
    }
  }

  private async filterRelevantAlerts(alerts: CERTAlert[], source: CERTSource): Promise<CERTAlert[]> {
    const relevantAlerts: CERTAlert[] = [];

    for (const alert of alerts) {
      let relevanceScore = 0;

      // Check for Danish keywords
      const danishMatches = this.countKeywordMatches(alert.title + ' ' + alert.description, this.danishKeywords);
      relevanceScore += danishMatches * 2; // Higher weight for Danish

      // Check for English keywords
      const englishMatches = this.countKeywordMatches(alert.title + ' ' + alert.description, this.englishKeywords);
      relevanceScore += englishMatches;

      // Source trust level factor
      relevanceScore += source.trustLevel / 20;

      // Severity factor
      const severityWeights = { critical: 10, high: 5, medium: 2, low: 1 };
      relevanceScore += severityWeights[alert.severity];

      // Time factor (newer is more relevant)
      const hoursSincePublished = (Date.now() - alert.publishDate.getTime()) / (1000 * 60 * 60);
      if (hoursSincePublished < 24) relevanceScore += 5;
      else if (hoursSincePublished < 168) relevanceScore += 2; // Within a week

      // Minimum relevance threshold
      if (relevanceScore >= 3) {
        alert.trustScore = Math.min(100, alert.trustScore + relevanceScore);
        relevantAlerts.push(alert);
      }
    }

    return relevantAlerts.sort((a, b) => b.trustScore - a.trustScore);
  }

  private countKeywordMatches(text: string, keywords: string[]): number {
    const lowerText = text.toLowerCase();
    return keywords.filter(keyword => lowerText.includes(keyword.toLowerCase())).length;
  }

  private determineSeverity(title: string, description: string): 'critical' | 'high' | 'medium' | 'low' {
    const content = (title + ' ' + description).toLowerCase();
    
    const criticalKeywords = ['critical', 'kritisk', 'emergency', 'nødsituation', 'zero-day', 'active attack', 'aktiv angreb'];
    const highKeywords = ['high', 'høj', 'severe', 'alvorlig', 'ransomware', 'apt', 'breach', 'brud'];
    const mediumKeywords = ['medium', 'mellem', 'moderate', 'moderat', 'vulnerability', 'sårbarhed'];

    if (criticalKeywords.some(kw => content.includes(kw))) return 'critical';
    if (highKeywords.some(kw => content.includes(kw))) return 'high';
    if (mediumKeywords.some(kw => content.includes(kw))) return 'medium';
    return 'low';
  }

  private extractCategories(title: string, description: string): string[] {
    const content = (title + ' ' + description).toLowerCase();
    const categories: string[] = [];

    const categoryMap = {
      'malware': ['malware', 'virus', 'trojan', 'ransomware', 'spyware'],
      'vulnerability': ['vulnerability', 'sårbarhed', 'patch', 'opdatering', 'cve'],
      'phishing': ['phishing', 'social engineering', 'fraud', 'svindel'],
      'ddos': ['ddos', 'botnet', 'denial of service'],
      'apt': ['apt', 'advanced persistent threat', 'state-sponsored', 'statssponseret'],
      'data breach': ['data breach', 'databrud', 'leak', 'lækage'],
      'infrastructure': ['infrastructure', 'infrastruktur', 'scada', 'ics', 'iot']
    };

    for (const [category, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => content.includes(kw))) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ['general'];
  }

  private extractKeywords(title: string, description: string): string[] {
    const content = title + ' ' + description;
    const foundKeywords: string[] = [];

    // Check Danish keywords
    for (const keyword of this.danishKeywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    }

    // Check English keywords
    for (const keyword of this.englishKeywords) {
      if (content.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
      }
    }

    return foundKeywords;
  }

  private detectLanguage(title: string, description: string): string {
    const content = (title + ' ' + description).toLowerCase();
    
    const danishWords = ['og', 'det', 'er', 'den', 'til', 'at', 'på', 'med', 'for', 'af'];
    const englishWords = ['and', 'the', 'is', 'to', 'in', 'of', 'with', 'for', 'on', 'by'];
    const germanWords = ['und', 'der', 'die', 'ist', 'zu', 'in', 'mit', 'für', 'auf', 'von'];

    const danishCount = danishWords.filter(word => content.includes(word)).length;
    const englishCount = englishWords.filter(word => content.includes(word)).length;
    const germanCount = germanWords.filter(word => content.includes(word)).length;

    if (danishCount > englishCount && danishCount > germanCount) return 'da';
    if (germanCount > englishCount && germanCount > danishCount) return 'de';
    return 'en';
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&[^;]+;/g, ' ') // Remove HTML entities
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private updateMetrics(): void {
    const sources = Array.from(this.sources.values());
    
    this.metrics = {
      totalSources: sources.length,
      activeSources: sources.filter(s => s.isActive).length,
      tier1Sources: sources.filter(s => s.tier === 1).length,
      tier2Sources: sources.filter(s => s.tier === 2).length,
      tier3Sources: sources.filter(s => s.tier === 3).length,
      alertsLast24h: this.getAlertsInLastHours(24),
      criticalAlertsLast24h: this.getCriticalAlertsInLastHours(24),
      averageResponseTime: this.calculateAverageResponseTime(),
      successRate: this.calculateSuccessRate(),
      lastUpdateTime: new Date()
    };
  }

  private getAlertsInLastHours(hours: number): number {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.alerts.values()).filter(a => a.publishDate > cutoff).length;
  }

  private getCriticalAlertsInLastHours(hours: number): number {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.alerts.values()).filter(a => 
      a.publishDate > cutoff && a.severity === 'critical'
    ).length;
  }

  private calculateAverageResponseTime(): number {
    // Simplified calculation - would track actual response times
    return 1500; // ms
  }

  private calculateSuccessRate(): number {
    const sources = Array.from(this.sources.values());
    const successfulSources = sources.filter(s => s.status === 'online').length;
    return sources.length > 0 ? (successfulSources / sources.length) * 100 : 0;
  }

  // Public API methods
  public getMetrics(): CollectionMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  public getSources(): CERTSource[] {
    return Array.from(this.sources.values());
  }

  public getSourceById(id: string): CERTSource | undefined {
    return this.sources.get(id);
  }

  public getRecentAlerts(hours: number = 24): CERTAlert[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return Array.from(this.alerts.values())
      .filter(a => a.publishDate > cutoff)
      .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  }

  public getCriticalAlerts(): CERTAlert[] {
    return Array.from(this.alerts.values())
      .filter(a => a.severity === 'critical')
      .sort((a, b) => b.publishDate.getTime() - a.publishDate.getTime());
  }

  public async toggleSource(sourceId: string, active: boolean): Promise<boolean> {
    const source = this.sources.get(sourceId);
    if (!source) return false;

    source.isActive = active;
    
    if (active && this.isRunning) {
      await this.scheduleSourceCollection(source);
    } else if (!active && this.activeJobs.has(sourceId)) {
      clearInterval(this.activeJobs.get(sourceId)!);
      this.activeJobs.delete(sourceId);
    }

    return true;
  }

  public async forceCollectSource(sourceId: string): Promise<boolean> {
    const source = this.sources.get(sourceId);
    if (!source) return false;

    await this.collectFromSource(source);
    return true;
  }
}

export { EuropeanCERTCollector, type CERTSource, type CERTAlert, type CollectionMetrics };