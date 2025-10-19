import { createVectorStoreAdapter } from '../vector/VectorStoreFactory'
import {
  DeleteRequest,
  SearchMatch,
  SearchResponse,
  UpsertRequest,
  VectorDocumentInput,
  VectorStoreAdapter,
  VectorStoreConfig,
} from '../vector'
import { EncryptionSettings } from '../vector/types'

export type IntelDocumentType = 'article' | 'threat' | 'incident' | 'compliance'

export interface IntelDocument {
  id: string
  title: string
  body: string
  type: IntelDocumentType
  tags?: string[]
  source?: string
  timestamp?: string
  metadata?: Record<string, unknown>
  vector?: number[]
}

export interface IntelSeedPayload {
  articles?: IntelDocument[]
  threats?: IntelDocument[]
  incidents?: IntelDocument[]
  compliance?: IntelDocument[]
}

export interface IntelQueryContext {
  topK?: number
  filter?: Record<string, unknown>
  hybrid?: boolean
  includeVectors?: boolean
  namespace?: string
  encryption?: EncryptionSettings
}

export interface IntelSearchResult extends SearchResponse {
  matches: IntelResultItem[]
}

export interface IntelResultItem extends SearchMatch {
  title?: string
  source?: string
  timestamp?: string
  tags?: string[]
}

const NAMESPACE_BY_TYPE: Record<IntelDocumentType, string> = {
  article: 'intel-articles',
  threat: 'intel-threats',
  incident: 'intel-incidents',
  compliance: 'intel-compliance',
}

export class IntelVectorService {
  private readonly adapter: VectorStoreAdapter

  constructor(config: VectorStoreConfig | VectorStoreAdapter) {
    this.adapter = isAdapter(config) ? config : createVectorStoreAdapter(config)
  }

  async seed(payload: IntelSeedPayload, options: { encryption?: EncryptionSettings } = {}): Promise<void> {
    const tasks: Promise<unknown>[] = []

    const pushTask = (type: IntelDocumentType, docs?: IntelDocument[]) => {
      if (!docs?.length) return
      const namespace = NAMESPACE_BY_TYPE[type]
      const request: UpsertRequest = {
        documents: docs.map(toVectorDocument),
        namespace,
        tenantId: this.adapter.config.tenantId,
        sessionId: this.adapter.config.sessionId,
        encryption: options.encryption ?? this.adapter.config.encryption,
      }
      tasks.push(this.adapter.upsertDocuments(request))
    }

    pushTask('article', payload.articles)
    pushTask('threat', payload.threats)
    pushTask('incident', payload.incidents)
    pushTask('compliance', payload.compliance)

    await Promise.all(tasks)
  }

  async compose(query: string, context: IntelQueryContext = {}): Promise<IntelSearchResult> {
    return this.executeQuery(query, context)
  }

  async expandScope(
    query: string,
    existingIds: string[] = [],
    context: IntelQueryContext = {},
  ): Promise<IntelSearchResult> {
    const filter = {
      ...context.filter,
      notIn: existingIds,
    }
    return this.executeQuery(query, { ...context, filter })
  }

  async drillDown(documentId: string, context: IntelQueryContext = {}): Promise<IntelResultItem | null> {
    const response = await this.adapter.search({
      topK: 1,
      filter: {
        ...(context.filter ?? {}),
        id: documentId,
      },
      namespace: context.namespace,
      tenantId: this.adapter.config.tenantId,
      sessionId: this.adapter.config.sessionId,
      encryption: context.encryption ?? this.adapter.config.encryption,
    })

    if (!response.matches.length) {
      return null
    }

    return enrichMatch(response.matches[0])
  }

  async delete(ids: string[], context: { namespace?: string } = {}): Promise<void> {
    const request: DeleteRequest = {
      ids,
      namespace: context.namespace,
      tenantId: this.adapter.config.tenantId,
      sessionId: this.adapter.config.sessionId,
    }
    await this.adapter.deleteDocuments(request)
  }

  async health(): Promise<boolean> {
    return this.adapter.healthCheck()
  }

  private async executeQuery(query: string, context: IntelQueryContext): Promise<IntelSearchResult> {
    try {
      const response = await this.adapter.search({
        queryText: query,
        topK: context.topK,
        filter: context.filter,
        hybrid: context.hybrid ?? true,
        includeVectors: context.includeVectors,
        namespace: context.namespace,
        tenantId: this.adapter.config.tenantId,
        sessionId: this.adapter.config.sessionId,
        encryption: context.encryption ?? this.adapter.config.encryption,
      })

      return {
        ...response,
        matches: response.matches.map(enrichMatch),
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown vector search error'
      throw new Error(`Intel query failed: ${message}`)
    }
  }
}

function toVectorDocument(document: IntelDocument): VectorDocumentInput {
  return {
    id: document.id,
    text: `${document.title}\n${document.body}`,
    vector: document.vector,
    metadata: {
      ...document.metadata,
      title: document.title,
      source: document.source,
      timestamp: document.timestamp,
      tags: document.tags,
      type: document.type,
    },
  }
}

function enrichMatch(match: SearchMatch): IntelResultItem {
  const metadata = match.metadata ?? {}
  return {
    ...match,
    title: typeof metadata.title === 'string' ? metadata.title : undefined,
    source: typeof metadata.source === 'string' ? metadata.source : undefined,
    timestamp: typeof metadata.timestamp === 'string' ? metadata.timestamp : undefined,
    tags: Array.isArray(metadata.tags) ? (metadata.tags as string[]) : undefined,
    explanation: match.explanation ?? (typeof metadata.why === 'string' ? metadata.why : undefined),
  }
}

function isAdapter(config: VectorStoreConfig | VectorStoreAdapter): config is VectorStoreAdapter {
  return typeof (config as VectorStoreAdapter).search === 'function'
}
