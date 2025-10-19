import {
  DeleteRequest,
  QueryOptions,
  SearchResponse,
  UpsertRequest,
  UpsertResponse,
  VectorStoreConfig,
} from './types'

export interface VectorStoreAdapter {
  readonly config: VectorStoreConfig
  upsertDocuments(request: UpsertRequest): Promise<UpsertResponse>
  search(request: QueryOptions): Promise<SearchResponse>
  deleteDocuments(request: DeleteRequest): Promise<void>
  healthCheck(): Promise<boolean>
}
