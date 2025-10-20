import { withClient } from './postgres.js'
import logger from './logger.js'

let useInMemoryStore = false
const inMemorySources = new Map()

function normalizeSourceForMemory(source) {
  const identifier = source.id || source.domain || `source_${Date.now()}`
  const normalized = {
    id: identifier,
    name: source.name,
    domain: source.domain,
    sourceType: source.type || source.sourceType || 'osint',
    credibilityScore: source.credibilityScore ?? 50,
    timelinessScore: source.timelinessScore ?? 50,
    accuracyScore: source.accuracyScore ?? 50,
    contextScore: source.contextScore ?? 50,
    relevanceScore: source.relevanceScore ?? 50,
    rssUrl: source.rssUrl || null,
    apiUrl: source.apiUrl || null,
    formats: source.formats || [],
    updateFrequency: source.updateFrequency ?? 60,
    logoUrl: source.logoUrl || null,
    verified: source.verified ?? true,
    priority: source.priority || 'medium',
    geography: source.geography || [],
    sectors: source.sectors || [],
    languages: source.languages || []
  }

  inMemorySources.set(identifier, normalized)
  return normalized
}

function databaseUnavailable(error) {
  if (!error) {
    return false
  }

  const message = typeof error.message === 'string' ? error.message : ''
  if (message.includes('PostgreSQL configuration missing')) {
    return true
  }

  return ['ECONNREFUSED', 'ENOTFOUND', 'ECONNRESET', 'EAI_AGAIN'].includes(error.code)
}

function handleDatabaseFailure(error) {
  if (!useInMemoryStore && databaseUnavailable(error)) {
    useInMemoryStore = true
    logger.warn({ err: error }, 'PostgreSQL source repository unavailable. Using in-memory store.')
    return true
  }

  return useInMemoryStore
}

function listInMemorySources() {
  return Array.from(inMemorySources.values())
}

const VALID_TABLE_NAME = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const configuredTable = process.env.AUTHORIZED_SOURCES_TABLE || 'sources'

const TABLE_NAME = VALID_TABLE_NAME.test(configuredTable)
  ? configuredTable
  : (() => {
      logger.warn(
        {
          configuredTable
        },
        'Invalid AUTHORIZED_SOURCES_TABLE provided. Falling back to "sources".'
      )
      return 'sources'
    })()

const UPSERT_SOURCE_SQL = `
INSERT INTO ${TABLE_NAME} (
  id,
  name,
  domain,
  source_type,
  credibility_score,
  timeliness_score,
  accuracy_score,
  context_score,
  relevance_score,
  rss_url,
  api_url,
  formats,
  update_frequency,
  logo_url,
  verified,
  priority,
  geography,
  sectors,
  languages,
  created_at,
  updated_at
) VALUES (
  $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  domain = EXCLUDED.domain,
  source_type = EXCLUDED.source_type,
  credibility_score = EXCLUDED.credibility_score,
  timeliness_score = EXCLUDED.timeliness_score,
  accuracy_score = EXCLUDED.accuracy_score,
  context_score = EXCLUDED.context_score,
  relevance_score = EXCLUDED.relevance_score,
  rss_url = EXCLUDED.rss_url,
  api_url = EXCLUDED.api_url,
  formats = EXCLUDED.formats,
  update_frequency = EXCLUDED.update_frequency,
  logo_url = EXCLUDED.logo_url,
  verified = EXCLUDED.verified,
  priority = EXCLUDED.priority,
  geography = EXCLUDED.geography,
  sectors = EXCLUDED.sectors,
  languages = EXCLUDED.languages,
  updated_at = NOW()
`

const SELECT_SOURCES_SQL = `
SELECT id,
       name,
       domain,
       source_type AS "sourceType",
       credibility_score AS "credibilityScore",
       timeliness_score AS "timelinessScore",
       accuracy_score AS "accuracyScore",
       context_score AS "contextScore",
       relevance_score AS "relevanceScore",
       rss_url AS "rssUrl",
       api_url AS "apiUrl",
       formats,
       update_frequency AS "updateFrequency",
       logo_url AS "logoUrl",
       verified,
       priority,
       geography,
       sectors,
       languages
FROM ${TABLE_NAME}
WHERE verified = true
ORDER BY priority, credibility_score DESC
`

export async function ensureSourcesTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT NOT NULL,
      source_type TEXT NOT NULL,
      credibility_score INTEGER NOT NULL,
      timeliness_score INTEGER NOT NULL,
      accuracy_score INTEGER NOT NULL,
      context_score INTEGER NOT NULL,
      relevance_score INTEGER NOT NULL,
      rss_url TEXT,
      api_url TEXT,
      formats TEXT[] DEFAULT ARRAY[]::TEXT[],
      update_frequency INTEGER DEFAULT 60,
      logo_url TEXT,
      verified BOOLEAN DEFAULT true,
      priority TEXT DEFAULT 'medium',
      geography TEXT[] DEFAULT ARRAY[]::TEXT[],
      sectors TEXT[] DEFAULT ARRAY[]::TEXT[],
      languages TEXT[] DEFAULT ARRAY[]::TEXT[],
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  if (useInMemoryStore) {
    return false
  }

  try {
    await withClient(async (client) => {
      await client.query(createSql)
    })
    return true
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      return false
    }
    throw error
  }
}

export async function upsertAuthorizedSource(source) {
  if (useInMemoryStore) {
    normalizeSourceForMemory(source)
    return
  }

  const values = [
    source.id,
    source.name,
    source.domain,
    source.type,
    source.credibilityScore,
    source.timelinessScore,
    source.accuracyScore,
    source.contextScore,
    source.relevanceScore,
    source.rssUrl || null,
    source.apiUrl || null,
    source.formats || [],
    source.updateFrequency || 60,
    source.logoUrl || null,
    source.verified ?? true,
    source.priority || 'medium',
    source.geography || [],
    source.sectors || [],
    source.languages || []
  ]

  try {
    return await withClient(async (client) => client.query(UPSERT_SOURCE_SQL, values))
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      normalizeSourceForMemory(source)
      return
    }
    throw error
  }
}

export async function getAuthorizedSources() {
  const tableReady = await ensureSourcesTable()
  if (!tableReady) {
    return listInMemorySources()
  }

  try {
    const result = await withClient((client) => client.query(SELECT_SOURCES_SQL))
    return result.rows
  } catch (error) {
    if (handleDatabaseFailure(error)) {
      return listInMemorySources()
    }
    throw error
  }
}

export async function saveAuthorizedSources(sources) {
  const tableReady = await ensureSourcesTable()
  for (const source of sources) {
    try {
      if (!tableReady || useInMemoryStore) {
        normalizeSourceForMemory(source)
      } else {
        await upsertAuthorizedSource(source)
      }
    } catch (error) {
      if (handleDatabaseFailure(error)) {
        normalizeSourceForMemory(source)
      } else {
        logger.error({ err: error, source }, 'Failed to upsert authorized source')
      }
    }
  }
}
