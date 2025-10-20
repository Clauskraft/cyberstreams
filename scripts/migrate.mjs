import { Client } from 'pg'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = new Client({
  connectionString,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
})

await client.connect()
console.log('Connected to database')

try {
  // Ensure pgvector if used; ignore if extension isn't available
  try {
    await client.query('CREATE EXTENSION IF NOT EXISTS vector')
    console.log('pgvector extension ensured')
  } catch (e) {
    console.warn('pgvector not available or not needed; continuing')
  }

  // Optional schema apply
  const migrationsDir = path.resolve(__dirname, 'migrations')
  const schemaPath = path.join(migrationsDir, 'schema.sql')
  const sql = await readFile(schemaPath, 'utf8').catch((e) => {
    if (e.code === 'ENOENT') return null
    throw e
  })
  if (sql) {
    await client.query(sql)
    console.log('Schema applied')
  } else {
    console.log('No schema.sql found; skipping schema apply')
  }
} catch (e) {
  console.error('Migration error:', e)
  process.exitCode = 1
} finally {
  await client.end()
  console.log('Disconnected')
}
