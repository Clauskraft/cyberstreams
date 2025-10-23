import 'dotenv/config'

import logger from '../lib/logger.js'
import {
  ensureSourcesTable,
  saveAuthorizedSources,
  getAuthorizedSources
} from '../lib/authorizedSourceRepository.js'
import { AUTHORIZED_SOURCES } from '../src/services/AuthorizedSources.ts'

async function run() {
  await ensureSourcesTable()
  await saveAuthorizedSources(AUTHORIZED_SOURCES)
  const sources = await getAuthorizedSources()
  logger.info({ count: sources.length }, 'Authorized sources migration completed')
}

run()
  .then(() => process.exit())
  .catch((error) => {
    logger.error({ err: error }, 'Authorized sources migration failed')
    process.exit(1)
  })
