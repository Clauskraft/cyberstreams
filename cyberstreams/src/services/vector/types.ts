export type VectorProvider = 'qdrant' | 'pinecone' | 'weaviate' | 'milvus'

export interface EncryptionSettings {
  enabled: boolean
  keyId?: string
  mode?: 'aes-gcm' | 'fernet' | 'kms'
  secret?: string
}

export interface TenantMetadata {
  tenantId: string
  sessionId?: string
  namespace?: string
}

export interface VectorStoreConfig extends TenantMetadata {
  provider: VectorProvider
  url: string
  apiKey?: string
  collection?: string
  topK?: number
  encryption?: EncryptionSettings
  consistency?: 'strong' | 'eventual'
}

export interface VectorDocumentInput {
  id: string
  text: string
  metadata?: Record<string, unknown>
  vector?: number[]
  scoreOverride?: number
}

export interface UpsertRequest extends TenantMetadata {
  documents: VectorDocumentInput[]
  namespace?: string
  encryption?: EncryptionSettings
}

export interface UpsertResponse {
  updatedIds: string[]
  failedIds: string[]
}

export interface DeleteRequest extends TenantMetadata {
  ids: string[]
  namespace?: string
}

export interface QueryOptions extends TenantMetadata {
  topK?: number
  queryVector?: number[]
  queryText?: string
  filter?: Record<string, unknown>
  hybrid?: boolean
  includeVectors?: boolean
  namespace?: string
  encryption?: EncryptionSettings
}

export interface SearchMetrics {
  score: number
  vectorDistance?: number
  bm25?: number
}

export interface SearchMatch {
  id: string
  text?: string
  metadata?: Record<string, unknown>
  metrics: SearchMetrics
  explanation?: string
}

export interface SearchResponse {
  matches: SearchMatch[]
  query: string
}
