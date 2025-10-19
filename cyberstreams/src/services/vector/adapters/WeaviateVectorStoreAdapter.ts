import { BaseHttpVectorStoreAdapter } from '../BaseHttpVectorStoreAdapter'
import {
  DeleteRequest,
  QueryOptions,
  SearchMatch,
  SearchResponse,
  UpsertRequest,
  UpsertResponse,
} from '../types'

export class WeaviateVectorStoreAdapter extends BaseHttpVectorStoreAdapter {
  protected override buildAuthHeaders(): Record<string, string> {
    if (!this.config.apiKey) {
      return {}
    }
    return { Authorization: `Bearer ${this.config.apiKey}` }
  }

  async upsertDocuments(request: UpsertRequest): Promise<UpsertResponse> {
    const namespace = request.namespace ?? this.config.namespace ?? 'default'

    const objects = request.documents.map(doc => ({
      id: doc.id,
      class: this.config.collection ?? 'IntelDocument',
      properties: {
        text: doc.text,
        metadata: {
          ...(doc.metadata ?? {}),
          tenantId: request.tenantId ?? this.config.tenantId,
          sessionId: request.sessionId ?? this.config.sessionId,
          namespace,
          encryption: request.encryption ?? this.config.encryption,
        },
      },
      vector: doc.vector,
    }))

    await this.fetchJson(`${this.config.url}/v1/batch/objects`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({ objects }),
    })

    return {
      updatedIds: objects.map(obj => obj.id),
      failedIds: [],
    }
  }

  async search(request: QueryOptions): Promise<SearchResponse> {
    const namespace = request.namespace ?? this.config.namespace ?? 'default'
    const className = this.config.collection ?? 'IntelDocument'

    const body: Record<string, unknown> = {
      query: `{
        Get {
          ${className}(
            limit: ${request.topK ?? this.config.topK ?? 10}
            hybrid: ${request.hybrid ? '{ alpha: 0.5 }' : 'null'}
            where: {
              path: ["metadata", "namespace"]
              operator: Equal
              valueText: "${namespace}"
            }
          ) {
            _additional {
              score
              distance
              explainScore
            }
            text
            metadata
          }
        }
      }`,
    }

    const response = await this.fetchJson<{ data?: { Get?: Record<string, any> } }>(`${this.config.url}/v1/graphql`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(body),
    })

    const matchesRaw = response.data?.Get?.[className] ?? []
    const matches: SearchMatch[] = matchesRaw.map((item: any) => ({
      id: item.id ?? item._additional?.id ?? item.metadata?.id,
      text: item.text,
      metadata: item.metadata ?? {},
      metrics: {
        score: Number(item._additional?.score ?? 0),
        vectorDistance: item._additional?.distance,
        bm25: item.metadata?.bm25Score,
      },
      explanation: item._additional?.explainScore ?? item.metadata?.why,
    }))

    return { matches, query: request.queryText ?? 'hybrid-search' }
  }

  async deleteDocuments(request: DeleteRequest): Promise<void> {
    const namespace = request.namespace ?? this.config.namespace ?? 'default'
    const className = this.config.collection ?? 'IntelDocument'

    const where = {
      operator: 'And',
      operands: [
        { path: ['metadata', 'namespace'], operator: 'Equal', valueText: namespace },
        { path: ['id'], operator: 'ContainsAny', valueStringArray: request.ids },
      ],
    }

    await this.fetchJson(`${this.config.url}/v1/objects/delete`, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify({ class: className, where }),
    })
  }
}
