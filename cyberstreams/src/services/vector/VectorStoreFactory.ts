import { VectorStoreAdapter } from './VectorStoreAdapter'
import { VectorStoreConfig } from './types'
import { QdrantVectorStoreAdapter } from './adapters/QdrantVectorStoreAdapter'
import { PineconeVectorStoreAdapter } from './adapters/PineconeVectorStoreAdapter'
import { WeaviateVectorStoreAdapter } from './adapters/WeaviateVectorStoreAdapter'
import { MilvusVectorStoreAdapter } from './adapters/MilvusVectorStoreAdapter'

export function createVectorStoreAdapter(config: VectorStoreConfig): VectorStoreAdapter {
  switch (config.provider) {
    case 'pinecone':
      return new PineconeVectorStoreAdapter(config)
    case 'weaviate':
      return new WeaviateVectorStoreAdapter(config)
    case 'milvus':
      return new MilvusVectorStoreAdapter(config)
    case 'qdrant':
    default:
      return new QdrantVectorStoreAdapter(config)
  }
}
