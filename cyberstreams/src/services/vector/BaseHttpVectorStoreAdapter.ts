import { VectorStoreAdapter } from './VectorStoreAdapter'
import {
  DeleteRequest,
  QueryOptions,
  SearchResponse,
  UpsertRequest,
  UpsertResponse,
  VectorStoreConfig,
} from './types'

export abstract class BaseHttpVectorStoreAdapter implements VectorStoreAdapter {
  public readonly config: VectorStoreConfig

  constructor(config: VectorStoreConfig) {
    this.config = config
  }

  abstract upsertDocuments(request: UpsertRequest): Promise<UpsertResponse>
  abstract search(request: QueryOptions): Promise<SearchResponse>
  abstract deleteDocuments(request: DeleteRequest): Promise<void>

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchJson<{ status?: string; result?: string }>(`${this.config.url}/health`, {
        method: 'GET',
        headers: this.buildHeaders(),
      })
      return Boolean(response?.status === 'ok' || response?.result === 'ok' || response?.status === 'healthy')
    } catch (error) {
      console.warn('Vector store health check failed:', error)
      return false
    }
  }

  protected async fetchJson<T>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init)
    if (!response.ok) {
      const text = await response.text().catch(() => '')
      throw new Error(`Vector store request failed (${response.status}): ${text}`)
    }
    if (response.status === 204) {
      return undefined as unknown as T
    }
    return (await response.json()) as T
  }

  protected buildHeaders(additional?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additional,
    }

    const authHeaders = this.buildAuthHeaders()
    return { ...headers, ...authHeaders }
  }

  protected buildAuthHeaders(): Record<string, string> {
    if (!this.config.apiKey) {
      return {}
    }
    return { Authorization: `Bearer ${this.config.apiKey}` }
  }

  protected withTenantMetadata<T extends Record<string, unknown>>(
    payload: T,
    request: { tenantId?: string; sessionId?: string; namespace?: string; encryption?: UpsertRequest['encryption'] },
  ): T {
    const metadata = {
      tenantId: request.tenantId ?? this.config.tenantId,
      sessionId: request.sessionId ?? this.config.sessionId,
      namespace: request.namespace ?? this.config.namespace,
      encryption: request.encryption ?? this.config.encryption,
    }
    return { ...payload, metadata: { ...('metadata' in payload ? (payload as any).metadata : {}), ...metadata } }
  }
}
