import { randomUUID } from 'node:crypto'
import { logger, createChildLogger } from './logger.js'

export class QdrantClient {
  constructor({ baseUrl, apiKey, collection = 'cyberstreams' }) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.collection = collection
    this.log = createChildLogger({ module: 'qdrant-client' })
  }

  async upsert(points) {
    if (!this.baseUrl) {
      this.log.warn('Qdrant base URL not configured, skipping upsert')
      return
    }

    const body = {
      points: points.map((point) => ({
        id: point.id || randomUUID(),
        vector: point.vector,
        payload: point.payload
      }))
    }

    await this.request(`/collections/${this.collection}/points?wait=true`, body)
  }

  async search(vector, limit = 10) {
    const body = {
      vector,
      limit
    }

    const result = await this.request(`/collections/${this.collection}/points/search`, body)
    return result || { result: [] }
  }

  async request(path, body) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'api-key': this.apiKey } : {})
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Qdrant error ${response.status}: ${text}`)
    }

    const json = await response.json()
    this.log.debug({ path }, 'Qdrant request successful')
    return json
  }
}

export class WeaviateClient {
  constructor({ baseUrl, apiKey, className = 'CyberstreamsDocument' }) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.className = className
    this.log = createChildLogger({ module: 'weaviate-client' })
  }

  async upsert(documents) {
    if (!this.baseUrl) {
      this.log.warn('Weaviate base URL not configured, skipping upsert')
      return
    }

    const response = await fetch(`${this.baseUrl}/v1/batch/objects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {})
      },
      body: JSON.stringify({
        objects: documents.map((doc) => ({
          class: this.className,
          id: doc.id || randomUUID(),
          properties: doc.properties,
          vector: doc.vector
        }))
      })
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`Weaviate error ${response.status}: ${text}`)
    }

    this.log.debug('Weaviate upsert successful')
  }
}

export async function createEmbedding(text, { apiKey = process.env.OPENAI_API_KEY, model = 'text-embedding-3-small' } = {}) {
  if (!apiKey) {
    logger.warn('OPENAI_API_KEY missing, returning zero-vector embedding')
    return new Array(1536).fill(0)
  }

  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      input: text,
      model
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Embedding API error ${response.status}: ${text}`)
  }

  const data = await response.json()
  return data.data[0]?.embedding || []
}
