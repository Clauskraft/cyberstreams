// Enhanced Scraper for Cyberstreams
// Handles multiple source types with keyword matching

const puppeteer = require('puppeteer')
const Parser = require('rss-parser')
const axios = require('axios')
const fs = require('fs').promises
const path = require('path')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/cyberstreams'
})

class EnhancedScraper {
  constructor(config) {
    this.keywords = config.keywords || []
    this.sources = config.sources || []
    this.outputPath = config.outputPath
    this.rssParser = new Parser()
    this.results = []
  }

  async scrapeAll() {
    console.log(`Starting scrape of ${this.sources.length} sources with ${this.keywords.length} keywords`)
    
    for (const source of this.sources) {
      try {
        await this.scrapeSource(source)
      } catch (err) {
        console.error(`Error scraping source ${source.url}:`, err.message)
      }
    }
    
    // Save results
    await this.saveResults()
    
    return {
      totalScraped: this.results.length,
      keywordMatches: this.results.filter(r => r.keywordMatches.length > 0).length
    }
  }

  async scrapeSource(source) {
    console.log(`Scraping ${source.source_type}: ${source.url}`)
    
    switch (source.source_type) {
      case 'web':
        await this.scrapeWebPage(source)
        break
      case 'social':
        await this.scrapeSocialMedia(source)
        break
      case 'documents':
        await this.scrapeDocuments(source)
        break
      case 'darkweb':
        await this.scrapeDarkWeb(source)
        break
      default:
        // Try RSS/feed parsing as default
        await this.scrapeRSSFeed(source)
    }
  }

  async scrapeWebPage(source) {
    let browser
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      
      const page = await browser.newPage()
      await page.goto(source.url, { waitUntil: 'networkidle2', timeout: 30000 })
      
      // Extract text content
      const content = await page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style')
        scripts.forEach(s => s.remove())
        
        // Get text content
        return document.body.innerText
      })
      
      // Extract metadata
      const metadata = await page.evaluate(() => {
        const title = document.title
        const description = document.querySelector('meta[name="description"]')?.content || ''
        const keywords = document.querySelector('meta[name="keywords"]')?.content || ''
        
        return { title, description, keywords }
      })
      
      // Process content
      const processed = this.processContent(content, source, metadata)
      if (processed) {
        this.results.push(processed)
      }
      
    } catch (err) {
      console.error(`Error scraping web page ${source.url}:`, err.message)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  async scrapeRSSFeed(source) {
    try {
      const feed = await this.rssParser.parseURL(source.url)
      
      for (const item of feed.items) {
        const content = `${item.title || ''} ${item.content || ''} ${item.contentSnippet || ''}`
        const metadata = {
          title: item.title,
          link: item.link,
          pubDate: item.pubDate,
          author: item.creator || item.author
        }
        
        const processed = this.processContent(content, source, metadata)
        if (processed) {
          this.results.push(processed)
        }
      }
    } catch (err) {
      console.error(`Error parsing RSS feed ${source.url}:`, err.message)
    }
  }

  async scrapeSocialMedia(source) {
    // Placeholder for social media API integration
    // This would typically use Twitter API, Facebook Graph API, etc.
    console.log(`Social media scraping for ${source.url} - implementation needed`)
    
    // Example structure for Twitter
    if (source.url.includes('twitter.com') || source.url.includes('x.com')) {
      // Would use Twitter API here
      const mockTweets = [
        { text: 'Security alert: New ransomware variant detected', created_at: new Date() }
      ]
      
      for (const tweet of mockTweets) {
        const processed = this.processContent(tweet.text, source, { 
          type: 'tweet',
          timestamp: tweet.created_at 
        })
        if (processed) {
          this.results.push(processed)
        }
      }
    }
  }

  async scrapeDocuments(source) {
    // Handle local document sources or document URLs
    try {
      if (source.url.startsWith('http')) {
        // Download document
        const response = await axios.get(source.url, { responseType: 'arraybuffer' })
        const content = response.data.toString('utf-8')
        
        const processed = this.processContent(content, source, { 
          type: 'document',
          url: source.url 
        })
        if (processed) {
          this.results.push(processed)
        }
      } else {
        // Local file path
        const content = await fs.readFile(source.url, 'utf-8')
        
        const processed = this.processContent(content, source, { 
          type: 'document',
          path: source.url 
        })
        if (processed) {
          this.results.push(processed)
        }
      }
    } catch (err) {
      console.error(`Error scraping document ${source.url}:`, err.message)
    }
  }

  async scrapeDarkWeb(source) {
    // IMPORTANT: Dark web scraping requires special handling
    // This is a placeholder - actual implementation would need:
    // - Tor network connection
    // - Special authentication
    // - Legal compliance checks
    
    console.log(`Dark web monitoring for ${source.url} - requires specialized implementation`)
    
    // Mock data for demonstration
    const mockDarkWebData = {
      content: 'Ransomware group claims new victim: Example Corp',
      metadata: {
        type: 'darkweb_monitor',
        source: 'threat_intel_feed',
        timestamp: new Date()
      }
    }
    
    const processed = this.processContent(mockDarkWebData.content, source, mockDarkWebData.metadata)
    if (processed) {
      this.results.push(processed)
    }
  }

  processContent(content, source, metadata = {}) {
    if (!content || content.length < 50) {
      return null
    }
    
    // Clean content
    const cleanContent = content
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000) // Limit content length
    
    // Match keywords
    const keywordMatches = this.findKeywordMatches(cleanContent)
    
    // Calculate relevance score
    const relevanceScore = this.calculateRelevance(cleanContent, keywordMatches)
    
    return {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: source.url,
      sourceType: source.source_type,
      content: cleanContent,
      metadata: {
        ...metadata,
        scraped_at: new Date(),
        source_id: source.id
      },
      keywordMatches,
      relevanceScore,
      timestamp: new Date()
    }
  }

  findKeywordMatches(content) {
    const contentLower = content.toLowerCase()
    const matches = []
    
    for (const keyword of this.keywords) {
      const keywordLower = keyword.toLowerCase()
      if (contentLower.includes(keywordLower)) {
        // Find context around keyword
        const index = contentLower.indexOf(keywordLower)
        const start = Math.max(0, index - 100)
        const end = Math.min(content.length, index + keyword.length + 100)
        const context = content.slice(start, end)
        
        matches.push({
          keyword,
          context,
          count: (contentLower.match(new RegExp(keywordLower, 'g')) || []).length
        })
      }
    }
    
    return matches
  }

  calculateRelevance(content, keywordMatches) {
    // Base relevance on keyword matches
    let score = Math.min(keywordMatches.length * 0.2, 1)
    
    // Boost for high-priority terms
    const threatTerms = ['ransomware', 'breach', 'vulnerability', 'exploit', 'zero-day', 'CVE', 'attack']
    const contentLower = content.toLowerCase()
    
    for (const term of threatTerms) {
      if (contentLower.includes(term)) {
        score = Math.min(score + 0.1, 1)
      }
    }
    
    // Boost for multiple keyword matches
    if (keywordMatches.length > 3) {
      score = Math.min(score + 0.2, 1)
    }
    
    return score
  }

  async saveResults() {
    try {
      // Save to JSON file
      if (this.outputPath) {
        await fs.writeFile(
          this.outputPath,
          JSON.stringify(this.results, null, 2),
          'utf-8'
        )
      }
      
      // Store high-relevance results in database
      for (const result of this.results) {
        if (result.relevanceScore > 0.5) {
          await this.storeInDatabase(result)
        }
      }
      
      console.log(`Saved ${this.results.length} scraped documents`)
    } catch (err) {
      console.error('Error saving results:', err)
    }
  }

  async storeInDatabase(result) {
    try {
      // Get keyword IDs for matched keywords
      const keywordIds = []
      for (const match of result.keywordMatches) {
        const keywordResult = await pool.query(
          'SELECT id FROM keywords WHERE keyword = $1',
          [match.keyword]
        )
        if (keywordResult.rows.length > 0) {
          keywordIds.push(keywordResult.rows[0].id)
        }
      }
      
      // Store result for each matched keyword
      for (const keywordId of keywordIds) {
        await pool.query(
          `INSERT INTO monitoring_results (keyword_id, source_id, content, relevance_score) 
           VALUES ($1, $2, $3, $4)`,
          [keywordId, result.metadata.source_id, result.content, result.relevanceScore]
        )
      }
    } catch (err) {
      console.error('Error storing result in database:', err)
    }
  }
}

// Main execution
if (require.main === module) {
  const input = JSON.parse(process.argv[2])
  const scraper = new EnhancedScraper(input)
  
  scraper.scrapeAll()
    .then(stats => {
      console.log(JSON.stringify(stats))
      process.exit(0)
    })
    .catch(err => {
      console.error('Scraping failed:', err)
      process.exit(1)
    })
}

module.exports = EnhancedScraper
