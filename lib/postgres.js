import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

let pool

function buildSslConfig() {
  const { POSTGRES_SSL, POSTGRES_SSL_REJECT_UNAUTHORIZED } = process.env

  if (!POSTGRES_SSL || POSTGRES_SSL === 'false') {
    return undefined
  }

  const rejectUnauthorized = POSTGRES_SSL_REJECT_UNAUTHORIZED !== 'false'
  return {
    rejectUnauthorized
  }
}

function createPool() {
  if (pool) {
    return pool
  }

  const { DATABASE_URL } = process.env
  const ssl = buildSslConfig()

  if (DATABASE_URL) {
    pool = new Pool({
      connectionString: DATABASE_URL,
      ssl
    })
    return pool
  }

  const {
    POSTGRES_HOST = 'localhost',
    POSTGRES_PORT = '5432',
    POSTGRES_DB,
    POSTGRES_USER,
    POSTGRES_PASSWORD
  } = process.env

  if (!POSTGRES_DB || !POSTGRES_USER || !POSTGRES_PASSWORD) {
    throw new Error(
      'PostgreSQL configuration missing. Set DATABASE_URL or POSTGRES_DB, POSTGRES_USER and POSTGRES_PASSWORD.'
    )
  }

  pool = new Pool({
    host: POSTGRES_HOST,
    port: Number(POSTGRES_PORT),
    database: POSTGRES_DB,
    user: POSTGRES_USER,
    password: POSTGRES_PASSWORD,
    ssl
  })

  return pool
}

export function getPool() {
  return createPool()
}

export async function withClient(callback) {
  const client = await getPool().connect()
  try {
    return await callback(client)
  } finally {
    client.release()
  }
}

export async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
