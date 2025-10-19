import { BaseHttpVectorStoreAdapter } from '../BaseHttpVectorStoreAdapter'
import {
  DeleteRequest,
  QueryOptions,
  SearchMatch,
  SearchResponse,
  UpsertRequest,
  UpsertResponse,
} from '../types'

export class QdrantVectorStoreAdapter extends BaseHttpVectorStoreAdapter {
  protected override buildAuthHeaders(): Record<string, string> {
    if (!this.config.apiKey) {
      return {}
    }
    return { 'api-key': this.config.apiKey }
  }

  async upsertDocuments(request: UpsertRequest): Promise<UpsertResponse> {
    const namespace = request.namespace ?? this.config.namespace ?? 'default'
    const collection = this.config.collection ?? 'cyberstreams'

    const points = request.documents.map(doc => ({
      id: doc.id,
      vector: doc.vector,
      payload: {
        text: doc.text,
        metadata: {
          ...(doc.metadata ?? {}),
          tenantId: request.tenantId ?? this.config.tenantId,
          sessionId: request.sessionId ?? this.config.sessionId,
          namespace,
          encryption: request.encryption ?? this.config.encryption,
        },
        scoreOverride: doc.scoreOverride,
      },
    }))

    await this.fetchJson(`${this.config.url}/collections/${collection}/points?wait=true`, {
      method: 'PUT',
      headers: this.buildHeaders(),
      body: JSON.stringify({ points }),
    })

    return {
      updatedIds: points.map(point => point.id as string),
      failedIds: [],
    }
  }

  async search(request: QueryOptions): Promise<SearchResponse> {
    const namespace = request.namespace ?? this.config.namespace ?? 'default'
    const collection = this.config.collection ?? 'cyberstreams'
    const body: Record<string, unknown> = {
      with_payload: true,
      with_vector: request.includeVectors ?? false,
      limit: request.topK ?? this.config.topK ?? 10,
      filter: buildFilter(namespace, request.filter),
    }

    if (request.queryVector) {
      body.vector = request.queryVector
    }
    if (request.queryText) {
      body.with_payload = true
      body.score_threshold = request.hybrid ? undefined : 0.0
      body.with_vectors = request.includeVectors ?? false
      body.hnsw_ef = request.hybrid ? 128 : undefined
      body.params = request.hybrid ? { exact: false } : undefined
      body.filter = buildFilter(namespace, request.filter, request.queryText)
    }

    const response = await this.fetchJson<{ result: any[] }>(
      `${this.config.url}/collections/${collection}/points/search`,
      {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
      },
    )

    const matches: SearchMatch[] = (response.result ?? []).map(item => ({
      id: String(item.id ?? item.payload?.id),
      text: item.payload?.text,
      metadata: item.payload?.metadata ?? {},
      metrics: {
        score: item.score ?? 0,
        vectorDistance: item.score ?? undefined,
        bm25: item.payload?.metadata?.bm25Score,
      },
      explanation: item.payload?.metadata?.why ?? item.payload?.why,
    }))

    return { matches, query: request.queryText ?? 'vector-search' }
  }

  async deleteDocuments(request: DeleteRequest): Promise<void> {
    const namespace = request.namespace ?? this.config.namespace ?? 'default'
    const collection = this.config.collection ?? 'cyberstreams'

    await this.fetchJson(`${this.config.url}/collections/${collection}/points/delete`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        points: request.ids,
        filter: buildFilter(namespace),
      }),
    })
  }
}

function buildFilter(
  namespace: string,
  filter?: Record<string, unknown>,
  queryText?: string,
): Record<string, unknown> | undefined {
  const must: Record<string, unknown>[] = [
    { key: 'metadata.namespace', match: { value: namespace } },
  ]
  if (filter) {
    must.push({ key: 'metadata.custom', match: { value: filter } })
  }
  if (queryText) {
    must.push({ key: 'text', match: { text: queryText } })
  }
  return { must }
}
