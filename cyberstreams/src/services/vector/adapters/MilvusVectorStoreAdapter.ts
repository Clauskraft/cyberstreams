import { BaseHttpVectorStoreAdapter } from '../BaseHttpVectorStoreAdapter'
import {
  DeleteRequest,
  QueryOptions,
  SearchMatch,
  SearchResponse,
  UpsertRequest,
  UpsertResponse,
} from '../types'

export class MilvusVectorStoreAdapter extends BaseHttpVectorStoreAdapter {
  async upsertDocuments(request: UpsertRequest): Promise<UpsertResponse> {
    const collection = this.config.collection ?? 'intel_documents'
    const namespace = request.namespace ?? this.config.namespace ?? 'default'

    const entities = request.documents.map(doc => ({
      id: doc.id,
      vector: doc.vector,
      text: doc.text,
      metadata: {
        ...(doc.metadata ?? {}),
        tenantId: request.tenantId ?? this.config.tenantId,
        sessionId: request.sessionId ?? this.config.sessionId,
        namespace,
        encryption: request.encryption ?? this.config.encryption,
      },
    }))

    await this.fetchJson(`${this.config.url}/collections/${collection}/entities`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        namespace,
        entities,
      }),
    })

    return {
      updatedIds: entities.map(entity => entity.id),
      failedIds: [],
    }
  }

  async search(request: QueryOptions): Promise<SearchResponse> {
    const collection = this.config.collection ?? 'intel_documents'
    const namespace = request.namespace ?? this.config.namespace ?? 'default'

    const body: Record<string, unknown> = {
      namespace,
      topK: request.topK ?? this.config.topK ?? 10,
      includeVectors: request.includeVectors ?? false,
      filter: request.filter,
      hybrid: request.hybrid ?? true,
    }

    if (request.queryVector) {
      body.vector = request.queryVector
    }
    if (request.queryText) {
      body.text = request.queryText
    }

    const response = await this.fetchJson<{ results?: any[] }>(
      `${this.config.url}/collections/${collection}/search`,
      {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
      },
    )

    const matches: SearchMatch[] = (response.results ?? []).map(item => ({
      id: item.id,
      text: item.text,
      metadata: item.metadata ?? {},
      metrics: {
        score: item.score ?? 0,
        vectorDistance: item.distance,
        bm25: item.metadata?.bm25Score,
      },
      explanation: item.metadata?.why,
    }))

    return { matches, query: request.queryText ?? 'vector-search' }
  }

  async deleteDocuments(request: DeleteRequest): Promise<void> {
    const collection = this.config.collection ?? 'intel_documents'
    const namespace = request.namespace ?? this.config.namespace ?? 'default'

    await this.fetchJson(`${this.config.url}/collections/${collection}/entities/delete`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({ namespace, ids: request.ids }),
    })
  }
}
