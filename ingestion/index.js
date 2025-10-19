import cron from 'node-cron'
import RSSParser from 'rss-parser'
import cheerio from 'cheerio'
import { Pool } from 'pg'
import { randomUUID } from 'node:crypto'
import { logger, createChildLogger } from '../lib/logger.js'

const rssParser = new RSSParser()

const INGESTION_TABLE = 'cyberstreams_sources'

export class SourceRepository {
  constructor(connectionString) {
    this.pool = new Pool({ connectionString })
    this.log = createChildLogger({ module: 'source-repository' })
  }

  async init() {
    await this.pool.query(
      `CREATE TABLE IF NOT EXISTS ${INGESTION_TABLE} (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        configuration JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );`
    )
    this.log.info('Ensured ingestion table exists')
  }

  async getActiveSources() {
    const { rows } = await this.pool.query(
      `SELECT * FROM ${INGESTION_TABLE} WHERE enabled = TRUE`
    )
    return rows
  }

  async upsertSource(source) {
    const id = source.id || randomUUID()
    const query = {
      text: `INSERT INTO ${INGESTION_TABLE} (id, name, type, url, enabled, configuration)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT(id) DO UPDATE SET
               name = EXCLUDED.name,
               type = EXCLUDED.type,
               url = EXCLUDED.url,
               enabled = EXCLUDED.enabled,
               configuration = EXCLUDED.configuration,
               updated_at = NOW()
             RETURNING *`,
      values: [
        id,
        source.name,
        source.type,
        source.url,
        source.enabled ?? true,
        JSON.stringify(source.configuration || {})
      ]
    }

    const { rows } = await this.pool.query(query)
    return rows[0]
  }
}

class StixBuilder {
  static indicatorFromObservable(observable) {
    const id = `indicator--${randomUUID()}`
    return {
      type: 'indicator',
      id,
      spec_version: '2.1',
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      name: observable.title || 'Observed Threat Indicator',
      pattern_type: 'stix',
      pattern: `[${observable.observable_type}:${observable.observable_property} = '${observable.observable_value}']`,
      description: observable.summary,
      valid_from: new Date().toISOString(),
      confidence: observable.confidence ?? 40
    }
  }

  static observedDataFromDocument(doc) {
    return {
      type: 'observed-data',
      id: `observed-data--${randomUUID()}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      first_observed: doc.firstObserved || new Date().toISOString(),
      last_observed: doc.lastObserved || new Date().toISOString(),
      number_observed: doc.numberObserved || 1,
      objects: doc.objects || {}
    }
  }

  static relationship(source, target, relationshipType, confidence = 50) {
    return {
      type: 'relationship',
      id: `relationship--${randomUUID()}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      relationship_type: relationshipType,
      source_ref: source,
      target_ref: target,
      confidence
    }
  }
}

export class MispClient {
  constructor({ baseUrl, apiKey }) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.log = createChildLogger({ module: 'misp-client' })
  }

  async sendIndicator(indicator) {
    if (!this.baseUrl || !this.apiKey) {
      this.log.warn('MISP credentials missing, skipping publish')
      return
    }

    try {
      const response = await fetch(`${this.baseUrl}/attributes/restSearch`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnFormat: 'json',
          values: indicator.pattern,
          to_ids: true,
          comment: indicator.description,
          type: 'stix2-pattern'
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`MISP returned ${response.status}: ${text}`)
      }

      this.log.info({ indicator: indicator.id }, 'Pushed indicator to MISP')
    } catch (error) {
      this.log.error({ err: error, indicator: indicator.id }, 'Failed to send indicator to MISP')
    }
  }

  async fetchRecent(limit = 25) {
    if (!this.baseUrl || !this.apiKey) {
      this.log.warn('MISP credentials missing, returning empty search result')
      return []
    }

    try {
      const response = await fetch(`${this.baseUrl}/attributes/restSearch`, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          page: 1,
          limit,
          returnFormat: 'json'
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`MISP returned ${response.status}: ${text}`)
      }

      const data = await response.json()
      return data?.response?.Attribute || []
    } catch (error) {
      this.log.error({ err: error }, 'Failed to fetch data from MISP')
      return []
    }
  }
}

export class OpenCTIClient {
  constructor({ baseUrl, apiToken }) {
    this.baseUrl = baseUrl
    this.apiToken = apiToken
    this.log = createChildLogger({ module: 'opencti-client' })
  }

  async sendBundle(bundle) {
    if (!this.baseUrl || !this.apiToken) {
      this.log.warn('OpenCTI credentials missing, skipping publish')
      return
    }

    try {
      const response = await fetch(`${this.baseUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          query: `mutation ImportBundle($bundle: String!) {
            stix2_import(file: $bundle) { id }
          }`,
          variables: {
            bundle: JSON.stringify(bundle)
          }
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`OpenCTI returned ${response.status}: ${text}`)
      }

      this.log.info('Sent bundle to OpenCTI')
    } catch (error) {
      this.log.error({ err: error }, 'Failed to send bundle to OpenCTI')
    }
  }

  async fetchPredictedThreats(limit = 10) {
    if (!this.baseUrl || !this.apiToken) {
      this.log.warn('OpenCTI credentials missing, returning empty predictions')
      return []
    }

    try {
      const response = await fetch(`${this.baseUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiToken}`
        },
        body: JSON.stringify({
          query: `query Predictions($first: Int!) {
            predictions: stixDomainObjects(types: ["Note"], first: $first, orderBy: created_at, orderMode: desc) {
              edges {
                node {
                  id
                  entity_type
                  created
                  modified
                  description
                  confidence
                  createdBy { ... on Identity { name } }
                  objectLabel { edges { node { value } } }
                }
              }
            }
          }`,
          variables: { first: limit }
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`OpenCTI returned ${response.status}: ${text}`)
      }

      const data = await response.json()
      const edges = data?.data?.predictions?.edges || []
      return edges.map((edge) => edge.node)
    } catch (error) {
      this.log.error({ err: error }, 'Failed to fetch predictions from OpenCTI')
      return []
    }
  }
}

export class IngestionPipeline {
  constructor({
    dbConnectionString,
    misp,
    opencti
  }) {
    this.repository = new SourceRepository(dbConnectionString)
    this.misp = new MispClient(misp)
    this.opencti = new OpenCTIClient(opencti)
    this.log = createChildLogger({ module: 'ingestion-pipeline' })
  }

  async init() {
    await this.repository.init()
  }

  async execute() {
    this.log.info('Starting ingestion pipeline run')
    const sources = await this.repository.getActiveSources()
    const collected = []

    for (const source of sources) {
      try {
        const items = await this.collectFromSource(source)
        collected.push(...items)
      } catch (error) {
        this.log.error({ err: error, source: source.id }, 'Failed collecting from source')
      }
    }

    const stixObjects = collected.map((item) => this.normalizeToStix(item))
    const indicators = stixObjects.filter((obj) => obj.type === 'indicator')

    for (const indicator of indicators) {
      await this.misp.sendIndicator(indicator)
    }

    const bundle = {
      type: 'bundle',
      id: `bundle--${randomUUID()}`,
      spec_version: '2.1',
      objects: stixObjects
    }

    await this.opencti.sendBundle(bundle)
    this.log.info({ collected: collected.length }, 'Finished ingestion pipeline run')
    return stixObjects
  }

  async collectFromSource(source) {
    const configuration = this.parseConfig(source.configuration)
    const sourceWithConfig = { ...source, configuration }
    switch (source.type) {
      case 'rss':
        return this.collectRss(sourceWithConfig)
      case 'html':
        return this.collectHtml(sourceWithConfig)
      case 'api':
        return this.collectApi(sourceWithConfig)
      case 'darkweb':
        return this.collectDarkWeb(sourceWithConfig)
      default:
        this.log.warn({ source }, 'Unknown source type, skipping')
        return []
    }
  }

  async collectRss(source) {
    const feed = await rssParser.parseURL(source.url)
    return feed.items.map((item) => ({
      id: item.guid || item.link,
      title: item.title,
      url: item.link,
      summary: item.contentSnippet || item.content,
      published: item.isoDate,
      confidence: 60,
      source: source.name,
      observable: this.extractObservable(item.link)
    }))
  }

  async collectHtml(source) {
    const response = await fetch(source.url)
    const html = await response.text()
    const $ = cheerio.load(html)
    const articles = []
    $(source.configuration?.selector || 'article').each((_, element) => {
      const title = $(element).find('h1, h2, h3').first().text().trim()
      const summary = $(element).find('p').first().text().trim()
      if (title) {
        articles.push({
          id: randomUUID(),
          title,
          summary,
          url: source.url,
          confidence: 40,
          source: source.name,
          observable: this.extractObservable(summary)
        })
      }
    })
    return articles
  }

  async collectApi(source) {
    const response = await fetch(source.url, {
      method: source.configuration?.method || 'GET',
      headers: source.configuration?.headers
    })

    if (!response.ok) {
      throw new Error(`API source returned ${response.status}`)
    }

    const data = await response.json()
    const items = Array.isArray(data) ? data : data.items || []
    return items.map((item) => ({
      id: item.id || randomUUID(),
      title: item.title || item.name,
      summary: item.summary || item.description,
      url: item.url || source.url,
      confidence: item.confidence || 50,
      source: source.name,
      observable: this.extractObservable(item.indicator || item.url)
    }))
  }

  async collectDarkWeb(source) {
    const response = await fetch(source.url, {
      headers: source.configuration?.headers
    })

    if (!response.ok) {
      throw new Error(`Dark web source returned ${response.status}`)
    }

    const payload = await response.json()
    const posts = Array.isArray(payload) ? payload : payload.posts || []
    return posts.map((post) => ({
      id: post.id || randomUUID(),
      title: post.title,
      summary: post.body,
      url: post.url,
      confidence: post.confidence || 30,
      source: source.name,
      observable: this.extractObservable(post.body)
    }))
  }

  parseConfig(configuration) {
    if (!configuration) {
      return {}
    }

    if (typeof configuration === 'object') {
      return configuration
    }

    try {
      return JSON.parse(configuration)
    } catch (error) {
      this.log.warn({ err: error }, 'Failed parsing source configuration, defaulting to empty object')
      return {}
    }
  }

  extractObservable(text) {
    if (!text) {
      return null
    }
    const cveMatch = text.match(/CVE-\d{4}-\d{4,7}/i)
    if (cveMatch) {
      return {
        observable_type: 'vulnerability',
        observable_property: 'name',
        observable_value: cveMatch[0]
      }
    }

    const ipMatch = text.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)
    if (ipMatch) {
      return {
        observable_type: 'ipv4-addr',
        observable_property: 'value',
        observable_value: ipMatch[0]
      }
    }

    return null
  }

  normalizeToStix(item) {
    if (item.observable) {
      return StixBuilder.indicatorFromObservable({
        ...item,
        summary: item.summary
      })
    }

    return {
      type: 'note',
      id: `note--${randomUUID()}`,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      content: item.summary,
      object_refs: [],
      confidence: item.confidence ?? 30
    }
  }
}

let scheduledJob

export async function startIngestionScheduler(config) {
  const pipeline = new IngestionPipeline(config)
  await pipeline.init()

  if (scheduledJob) {
    scheduledJob.stop()
  }

  scheduledJob = cron.schedule('0 * * * *', async () => {
    await pipeline.execute()
  })

  logger.info('Ingestion pipeline scheduled to run hourly')
  return pipeline
}
