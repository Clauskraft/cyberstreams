import 'dotenv/config'
import Parser from 'rss-parser'
import { randomUUID } from 'crypto'

import logger from '../../lib/logger.js'
import createMispClient from '../../lib/mispClient.js'
import createOpenCtiClient from '../../lib/openCtiClient.js'
import createVectorClient from '../../lib/vectorClient.js'
import {
  ensureSourcesTable,
  saveAuthorizedSources,
  getAuthorizedSources
} from '../../lib/authorizedSourceRepository.js'
import { withClient, closePool } from '../../lib/postgres.js'
import { AUTHORIZED_SOURCES } from '../../src/services/AuthorizedSources.ts'

const parser = new Parser()
const mispClient = createMispClient()
const openCtiClient = createOpenCtiClient()
const vectorClient = createVectorClient()

const VECTOR_COLLECTION = 'cyberstreams-intel'
const VECTOR_SIZE = 4

interface NormalisedItem {
  id: string
  title: string
  link: string
  summary?: string
  publishedAt?: string
  sourceId: string
  sourceName: string
}

async function ensureIngestionTables() {
  const ingestionSql = `
    CREATE TABLE IF NOT EXISTS ingestion_runs (
      id UUID PRIMARY KEY,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      finished_at TIMESTAMPTZ,
      status TEXT NOT NULL,
      items_processed INTEGER DEFAULT 0,
      misp_created INTEGER DEFAULT 0,
      opencti_created INTEGER DEFAULT 0,
      vector_upserted INTEGER DEFAULT 0,
      error TEXT
    );
  `

  const itemsSql = `
    CREATE TABLE IF NOT EXISTS ingestion_observables (
      id UUID PRIMARY KEY,
      source_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT,
      url TEXT UNIQUE NOT NULL,
      published_at TIMESTAMPTZ,
      stix_id TEXT,
      misp_attribute_uuid TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `

  await withClient(async (client) => {
    await client.query(ingestionSql)
    await client.query(itemsSql)
  })
}

function computeVector(text: string): number[] {
  const normalized = (text || '').toLowerCase()
  const vowels = (normalized.match(/[aeiou]/g) || []).length
  const consonants = (normalized.match(/[bcdfghjklmnpqrstvwxyz]/g) || []).length
  const digits = (normalized.match(/\d/g) || []).length
  const length = Math.min(normalized.length / 100, 1)
  return [vowels / 50, consonants / 50, digits / 10, length]
}

function buildStixIndicator(item: NormalisedItem, recordId: string) {
  const created = item.publishedAt || new Date().toISOString()
  const stixId = `indicator--${randomUUID()}`
  return {
    stixId,
    recordId,
    indicator: {
      type: 'indicator',
      spec_version: '2.1',
      id: stixId,
      created,
      modified: created,
      name: item.title,
      description: item.summary || item.title,
      pattern_type: 'stix',
      pattern: `[url:value = '${item.link}']`,
      valid_from: created,
      labels: ['threat-report', item.sourceName.toLowerCase()]
    }
  }
}

async function collectRssItems(sources: Awaited<ReturnType<typeof getAuthorizedSources>>) {
  const feedSources = sources.filter((source) => source.rssUrl)
  const items: NormalisedItem[] = []

  for (const source of feedSources) {
    try {
      const feed = await parser.parseURL(source.rssUrl as string)
      for (const entry of feed.items) {
        if (!entry.link) continue
        items.push({
          id: randomUUID(),
          title: entry.title || 'Untitled entry',
          link: entry.link,
          summary: entry.contentSnippet || entry.content,
          publishedAt: entry.isoDate || entry.pubDate,
          sourceId: source.id,
          sourceName: source.name
        })
      }
    } catch (error) {
      logger.error({ err: error, source: source.id }, 'Failed to parse RSS feed')
    }
  }

  return items
}

async function persistObservables(items: NormalisedItem[]) {
  const inserted: { id: string; item: NormalisedItem }[] = []
  await withClient(async (client) => {
    for (const item of items) {
      const query = {
        text: `
          INSERT INTO ingestion_observables (id, source_id, title, summary, url, published_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (url) DO NOTHING
          RETURNING id
        `,
        values: [
          item.id,
          item.sourceId,
          item.title,
          item.summary,
          item.link,
          item.publishedAt ? new Date(item.publishedAt) : null
        ]
      }

      const result = await client.query(query)
      if (result.rowCount > 0) {
        inserted.push({ id: result.rows[0].id, item })
      }
    }
  })

  return inserted
}

async function run() {
  const runId = randomUUID()
  await ensureSourcesTable()
  await ensureIngestionTables()
  await saveAuthorizedSources(AUTHORIZED_SOURCES)

  const authorizedSources = await getAuthorizedSources()
  logger.info({ sources: authorizedSources.length }, 'Starting ingestion pipeline')

  await withClient(async (client) => {
    await client.query(
      'INSERT INTO ingestion_runs (id, status, started_at) VALUES ($1, $2, NOW())',
      [runId, 'running']
    )
  })

  try {
    const rssItems = await collectRssItems(authorizedSources)
    const insertedItems = await persistObservables(rssItems)

    const stixIndicators = insertedItems.map(({ id, item }) => buildStixIndicator(item, id))
    const stixBundle = {
      type: 'bundle',
      id: `bundle--${randomUUID()}`,
      spec_version: '2.1',
      objects: stixIndicators.map(({ indicator }) => indicator)
    }

    let mispCreated = 0
    if (mispClient.isConfigured) {
      for (const indicator of stixIndicators) {
        try {
          await mispClient.pushObservable({
            uuid: indicator.stixId,
            value: indicator.indicator.pattern.match(/'(.+)'/)?.[1] || indicator.indicator.name,
            type: 'url',
            comment: indicator.indicator.description,
            tags: ['stix2', 'cyberstreams:auto']
          })
          mispCreated += 1
        } catch (error) {
          logger.error({ err: error, indicator: indicator.stixId }, 'Failed to push indicator to MISP')
        }
      }
    }

    let openCtiCreated = 0
    if (openCtiClient.isConfigured && stixIndicators.length > 0) {
      try {
        await openCtiClient.publishBundle(stixBundle)
        openCtiCreated = stixIndicators.length
      } catch (error) {
        logger.error({ err: error }, 'Failed to publish STIX bundle to OpenCTI')
      }
    }

    let vectorUpserted = 0
    if (vectorClient.isConfigured && stixIndicators.length > 0) {
      try {
        await vectorClient.ensureCollection(VECTOR_COLLECTION, VECTOR_SIZE)
        const points = stixIndicators.map(({ indicator, stixId, recordId }) => ({
          id: recordId,
          vector: computeVector(`${indicator.name} ${indicator.description}`),
          payload: {
            title: indicator.name,
            description: indicator.description,
            source: 'rss',
            url: indicator.pattern.match(/'(.+)'/)?.[1] || ''
          }
        }))
        await vectorClient.upsert(VECTOR_COLLECTION, points)
        vectorUpserted = points.length
      } catch (error) {
        logger.error({ err: error }, 'Failed to upsert items into vector database')
      }
    }

    await withClient(async (client) => {
      for (const indicator of stixIndicators) {
        await client.query(
          `UPDATE ingestion_observables SET stix_id = $2 WHERE id = $1`,
          [indicator.recordId, indicator.stixId]
        )
      }

      await client.query(
        `UPDATE ingestion_runs
           SET status = $2,
               finished_at = NOW(),
               items_processed = $3,
               misp_created = $4,
               opencti_created = $5,
               vector_upserted = $6
         WHERE id = $1`,
        [runId, 'completed', rssItems.length, mispCreated, openCtiCreated, vectorUpserted]
      )
    })

    logger.info(
      {
        runId,
        processed: rssItems.length,
        inserted: insertedItems.length,
        mispCreated,
        openCtiCreated,
        vectorUpserted
      },
      'Ingestion pipeline completed'
    )
  } catch (error) {
    logger.error({ err: error, runId }, 'Ingestion pipeline failed')
    await withClient(async (client) => {
      await client.query(
        `UPDATE ingestion_runs SET status = $2, finished_at = NOW(), error = $3 WHERE id = $1`,
        [runId, 'failed', error.message]
      )
    })
    process.exitCode = 1
  }
}

run()
  .catch((error) => {
    logger.error({ err: error }, 'Unhandled ingestion error')
    process.exitCode = 1
  })
  .finally(async () => {
    await closePool()
  })
