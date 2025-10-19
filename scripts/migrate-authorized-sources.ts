import 'dotenv/config'
import { SourceRepository } from '../ingestion/index.js'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Using TypeScript source directly with ts-node
import { AUTHORIZED_SOURCES } from '../cyberstreams/src/services/AuthorizedSources.ts'

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set before running the migration')
  }

  const repository = new SourceRepository(connectionString)
  await repository.init()

  for (const source of AUTHORIZED_SOURCES) {
    const url = source.rssUrl || source.apiUrl
    if (!url) continue

    const type = source.rssUrl ? 'rss' : 'api'

    await repository.upsertSource({
      name: source.name,
      type,
      url,
      enabled: source.verified,
      configuration: {
        selector: 'article',
        priority: source.priority,
        updateFrequency: source.updateFrequency,
        formats: source.formats
      }
    })
  }

  // Seed placeholder for dark web monitoring if configured via env
  if (process.env.DARKWEB_FEED_URL) {
    await repository.upsertSource({
      name: 'Dark Web Intelligence Feed',
      type: 'darkweb',
      url: process.env.DARKWEB_FEED_URL,
      configuration: {
        headers: {
          Authorization: process.env.DARKWEB_FEED_TOKEN
        }
      }
    })
  }

  console.log('Authorized sources migrated successfully')
}

main().catch((error) => {
  console.error('Failed to migrate authorized sources:', error)
  process.exit(1)
})
