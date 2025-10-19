import logger from './logger.js'

export function createVectorClient() {
  const baseUrl = process.env.VECTOR_DB_URL
  if (!baseUrl) {
    logger.warn('Vector client disabled. Missing VECTOR_DB_URL')
    return new NullVectorClient()
  }

  return new VectorClient({ baseUrl, apiKey: process.env.VECTOR_DB_API_KEY })
}

class NullVectorClient {
  constructor() {
    this.isConfigured = false
  }

  async upsert() {
    return { skipped: true }
  }

  async search() {
    return []
  }
}

class VectorClient {
  constructor({ baseUrl, apiKey }) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
    this.isConfigured = true
  }

  headers() {
    return this.apiKey
      ? {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey
        }
      : { 'Content-Type': 'application/json' }
  }

  async ensureCollection(name, vectorSize) {
    try {
      const existing = await fetch(`${this.baseUrl}/collections/${name}`, {
        method: 'GET',
        headers: this.headers()
      })
      if (existing.ok) {
        return true
      }
    } catch (error) {
      logger.warn({ err: error }, 'Vector collection lookup failed, attempting to create')
    }

    try {
      const response = await fetch(`${this.baseUrl}/collections/${name}`, {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({
          vectors: {
            size: vectorSize,
            distance: 'Cosine'
          }
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Vector collection creation failed (${response.status}): ${text}`)
      }

      return true
    } catch (error) {
      logger.error({ err: error }, 'Failed to ensure vector collection exists')
      throw error
    }
  }

  async upsert(collection, points) {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${collection}/points`, {
        method: 'PUT',
        headers: this.headers(),
        body: JSON.stringify({ points })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Vector upsert failed (${response.status}): ${text}`)
      }

      return response.json()
    } catch (error) {
      logger.error({ err: error }, 'Failed to upsert into vector database')
      throw error
    }
  }

  async search(collection, vector, { limit = 10 } = {}) {
    try {
      const response = await fetch(`${this.baseUrl}/collections/${collection}/points/search`, {
        method: 'POST',
        headers: this.headers(),
        body: JSON.stringify({ vector, limit })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Vector search failed (${response.status}): ${text}`)
      }

      const data = await response.json()
      return data?.result || []
    } catch (error) {
      logger.error({ err: error }, 'Failed to query vector database')
      return []
    }
  }
}

export default createVectorClient
