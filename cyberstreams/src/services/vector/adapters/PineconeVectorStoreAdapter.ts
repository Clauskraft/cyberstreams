import { BaseHttpVectorStoreAdapter } from '../BaseHttpVectorStoreAdapter'
import {
  DeleteRequest,
  QueryOptions,
  SearchMatch,
  SearchResponse,
  UpsertRequest,
  UpsertResponse,
} from '../types'

export class PineconeVectorStoreAdapter extends BaseHttpVectorStoreAdapter {
  protected override buildAuthHeaders(): Record<string, string> {
    if (!this.config.apiKey) {
      return {}
    }
    return { 'Api-Key': this.config.apiKey }
  }

  async upsertDocuments(request: UpsertRequest): Promise<UpsertResponse> {
    const namespace = request.namespace ?? this.config.namespace ?? 'default'
    const vectors = request.documents.map(doc => ({
      id: doc.id,
      values: doc.vector ?? [],
      metadata: {
        text: doc.text,
        ...doc.metadata,
        tenantId: request.tenantId ?? this.config.tenantId,
        sessionId: request.sessionId ?? this.config.sessionId,
        namespace,
        encryption: request.encryption ?? this.config.encryption,
      },
    }))

    await this.fetchJson(`${this.config.url}/vectors/upsert`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        namespace,
        vectors,
      }),
    })

    return {
      updatedIds: vectors.map(vector => vector.id),
      failedIds: [],
    }
  }

  async search(request: QueryOptions): Promise<SearchResponse> {
    const namespace = request.namespace ?? this.config.namespace ?? 'default'
    const body: Record<string, unknown> = {
      namespace,
      includeMetadata: true,
      includeValues: request.includeVectors ?? false,
      topK: request.topK ?? this.config.topK ?? 10,
    }

    if (request.queryVector) {
      body.vector = request.queryVector
    }
    if (request.queryText) {
      body.filter = {
        $and: [
          { namespace },
          { text: { $contains: request.queryText } },
          ...(request.filter ? [request.filter] : []),
        ],
      }
    } else if (request.filter) {
      body.filter = { $and: [{ namespace }, request.filter] }
    }

    const response = await this.fetchJson<{ matches?: any[] }>(`${this.config.url}/query`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    })

    const matches: SearchMatch[] = (response.matches ?? []).map(match => ({
      id: match.id,
      text: match.metadata?.text,
      metadata: match.metadata ?? {},
      metrics: {
        score: match.score ?? 0,
        vectorDistance: match.score ?? undefined,
        bm25: match.metadata?.bm25Score,
      },
      explanation: match.metadata?.why,
    }))

    return { matches, query: request.queryText ?? 'vector-search' }
  }

  async deleteDocuments(request: DeleteRequest): Promise<void> {
    const namespace = request.namespace ?? this.config.namespace ?? 'default'

    await this.fetchJson(`${this.config.url}/vectors/delete`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({
        namespace,
        ids: request.ids,
      }),
    })
  }
}
