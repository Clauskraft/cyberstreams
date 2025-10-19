import { Agent } from 'undici'
import logger from './logger.js'

const JSON_HEADERS = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
}

export function createMispClient() {
  const baseUrl = process.env.MISP_BASE_URL
  const apiKey = process.env.MISP_API_KEY
  const verifyTls = process.env.MISP_VERIFY_TLS !== 'false'

  if (!baseUrl || !apiKey) {
    logger.warn('MISP client disabled. Missing MISP_BASE_URL or MISP_API_KEY')
    return new NullMispClient()
  }

  return new MispClient({ baseUrl, apiKey, verifyTls })
}

class NullMispClient {
  constructor() {
    this.isConfigured = false
    this.baseUrl = ''
  }

  async listEvents() {
    return []
  }

  async pushObservable() {
    return { skipped: true }
  }
}

class MispClient {
  constructor({ baseUrl, apiKey, verifyTls }) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.apiKey = apiKey
    this.isConfigured = true
    if (!verifyTls) {
      logger.warn('⚠️  TLS verification disabled for MISP - use only in development environments')
    }

    this.dispatcher = new Agent({
      connect: {
        rejectUnauthorized: verifyTls
      }
    })
  }

  async request(path, options = {}) {
    const url = `${this.baseUrl}${path}`
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: this.apiKey,
        ...JSON_HEADERS,
        ...(options.headers || {})
      },
      dispatcher: this.dispatcher
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`MISP request failed (${response.status}): ${text}`)
    }

    if (response.status === 204) {
      return null
    }

    return response.json()
  }

  async listEvents({ limit = 50, published = true } = {}) {
    try {
      const body = {
        returnFormat: 'json',
        limit,
        published
      }

      const result = await this.request('/events/restSearch', {
        method: 'POST',
        body: JSON.stringify(body)
      })

      return (result?.response || []).map((event) => ({
        id: event.Event?.uuid || event.Event?.id,
        title: event.Event?.info,
        timestamp: event.Event?.timestamp,
        attributes: event.Event?.Attribute || [],
        tags: event.Event?.Tag || []
      }))
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch MISP events')
      return []
    }
  }

  async pushObservable({ uuid, value, type, comment, tags = [] }) {
    const body = {
      Attribute: {
        uuid,
        value,
        type,
        comment,
        Tag: tags.map((tag) => ({ name: tag }))
      }
    }

    try {
      return await this.request('/attributes/add', {
        method: 'POST',
        body: JSON.stringify(body)
      })
    } catch (error) {
      logger.error({ err: error, value }, 'Failed to push observable to MISP')
      throw error
    }
  }
}

export default createMispClient
