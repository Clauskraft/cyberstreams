import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

let pool

export function getPool() {
  if (!pool) {
    const {
      POSTGRES_HOST = 'localhost',
      POSTGRES_PORT = '5432',
      POSTGRES_DB = 'cyberstreams',
      POSTGRES_USER = 'cyberstreams',
      POSTGRES_PASSWORD = 'cyberstreams'
    } = process.env

    pool = new Pool({
      host: POSTGRES_HOST,
      port: Number(POSTGRES_PORT),
      database: POSTGRES_DB,
      user: POSTGRES_USER,
      password: POSTGRES_PASSWORD,
      ssl: process.env.POSTGRES_SSL === 'true'
    })
  }

  return pool
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
