import { withClient } from './postgres.js'
import logger from './logger.js'

const DEFAULT_TABLE = process.env.AUTHORIZED_SOURCES_TABLE || 'sources'

const UPSERT_SOURCE_SQL = `
INSERT INTO ${DEFAULT_TABLE} (
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
FROM ${DEFAULT_TABLE}
WHERE verified = true
ORDER BY priority, credibility_score DESC
`

export async function ensureSourcesTable() {
  const createSql = `
    CREATE TABLE IF NOT EXISTS ${DEFAULT_TABLE} (
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

  await withClient(async (client) => {
    await client.query(createSql)
  })
}

export async function upsertAuthorizedSource(source) {
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

  return withClient(async (client) => client.query(UPSERT_SOURCE_SQL, values))
}

export async function getAuthorizedSources() {
  await ensureSourcesTable()
  const result = await withClient((client) => client.query(SELECT_SOURCES_SQL))
  return result.rows
}

export async function saveAuthorizedSources(sources) {
  await ensureSourcesTable()
  for (const source of sources) {
    try {
      await upsertAuthorizedSource(source)
    } catch (error) {
      logger.error({ err: error, source }, 'Failed to upsert authorized source')
    }
  }
}
