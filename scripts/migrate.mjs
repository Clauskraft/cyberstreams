#!/usr/bin/env node
import { Client } from 'pg'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set; aborting migrations.')
  process.exit(1)
}

const client = new Client({
  connectionString,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
})

async function run() {
  try {
    await client.connect()
    console.log('Connected to database')
  } catch (e) {
    console.error('Failed to connect to database:', e.message)
    process.exit(1)
  }

  try {
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS vector')
      console.log('pgvector extension ensured (if supported).')
    } catch (e) {
      console.warn('Skipping pgvector extension creation (may not be available):', e.message)
    }

    const migrationsDir = path.resolve(__dirname, 'migrations')
    const schemaPath = path.join(migrationsDir, 'schema.sql')

    const sql = await readFile(schemaPath, 'utf8').catch((e) => {
      if (e.code === 'ENOENT') return null
      throw e
    })

    if (!sql) {
      console.log('No schema.sql found; skipping schema apply.')
      return
    }

    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map(s => s.trim())
      .filter(s => s.length > 0)

    for (const stmt of statements) {
      try {
        await client.query(stmt)
      } catch (e) {
        console.error('Error executing statement:', stmt.slice(0, 200), '\n', e.message)
        throw e
      }
    }

    console.log('Schema applied.')
  } catch (e) {
    console.error('Migration failed:', e)
    process.exitCode = 1
  } finally {
    await client.end()
    console.log('Disconnected from DB.')
  }
}

run()
