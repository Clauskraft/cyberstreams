import logger from './logger.js'

export function createOpenCtiClient() {
  const baseUrl = process.env.OPENCTI_API_URL
  const token = process.env.OPENCTI_TOKEN

  if (!baseUrl || !token) {
    logger.warn('OpenCTI client disabled. Missing OPENCTI_API_URL or OPENCTI_TOKEN')
    return new NullOpenCtiClient()
  }

  return new OpenCtiClient({ baseUrl, token })
}

class NullOpenCtiClient {
  constructor() {
    this.isConfigured = false
  }

  async listObservables() {
    return []
  }

  async publishBundle() {
    return { skipped: true }
  }
}

class OpenCtiClient {
  constructor({ baseUrl, token }) {
    this.baseUrl = baseUrl.replace(/\/$/, '')
    this.token = token
    this.isConfigured = true
  }

  async request(path, { method = 'POST', body } = {}) {
    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`
      },
      body: body ? JSON.stringify(body) : undefined
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`OpenCTI request failed (${response.status}): ${text}`)
    }

    return response.status === 204 ? null : response.json()
  }

  async listObservables({ search, first = 25 } = {}) {
    try {
      const query = `
        query Observables($search: String, $first: Int) {
          stixCyberObservables(search: $search, first: $first) {
            edges {
              node {
                id
                entity_type
                observable_value
                created_at
                updated_at
                creators {
                  name
                }
              }
            }
          }
        }
      `

      const result = await this.request('/graphql', {
        body: { query, variables: { search, first } }
      })

      return (
        result?.data?.stixCyberObservables?.edges || []
      ).map(({ node }) => ({
        id: node.id,
        type: node.entity_type,
        value: node.observable_value,
        createdAt: node.created_at,
        updatedAt: node.updated_at,
        creators: node.creators?.map((creator) => creator.name) || []
      }))
    } catch (error) {
      logger.error({ err: error }, 'Failed to fetch observables from OpenCTI')
      return []
    }
  }

  async publishBundle(bundle) {
    try {
      const mutation = `
        mutation ImportBundle($bundle: String!) {
          stix2_import(file: $bundle) {
            id
          }
        }
      `

      return await this.request('/graphql', {
        body: {
          query: mutation,
          variables: { bundle: JSON.stringify(bundle) }
        }
      })
    } catch (error) {
      logger.error({ err: error }, 'Failed to publish bundle to OpenCTI')
      throw error
    }
  }
}

export default createOpenCtiClient
