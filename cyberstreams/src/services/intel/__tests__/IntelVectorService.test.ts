import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IntelVectorService, IntelSeedPayload } from '../IntelVectorService'
import {
  VectorStoreAdapter,
  UpsertRequest,
  UpsertResponse,
  DeleteRequest,
  SearchResponse,
} from '@/services/vector'

class MockVectorStoreAdapter implements VectorStoreAdapter {
  public config = {
    provider: 'qdrant' as const,
    url: 'http://localhost:6333',
    tenantId: 'tenant-a',
    sessionId: 'session-a',
  }

  upsertDocuments = vi.fn(async (_request: UpsertRequest): Promise<UpsertResponse> => ({
    updatedIds: _request.documents.map(doc => doc.id),
    failedIds: [],
  }))

  search = vi.fn(async (): Promise<SearchResponse> => ({ matches: [], query: '' }))

  deleteDocuments = vi.fn(async (_request: DeleteRequest) => {})

  healthCheck = vi.fn(async () => true)
}

const seedPayload: IntelSeedPayload = {
  articles: [
    { id: 'article-1', title: 'A', body: 'B', type: 'article' },
  ],
  threats: [
    { id: 'threat-1', title: 'T', body: 'Threat Body', type: 'threat' },
  ],
  incidents: [
    { id: 'incident-1', title: 'I', body: 'Incident', type: 'incident' },
  ],
  compliance: [
    { id: 'compliance-1', title: 'C', body: 'Compliance', type: 'compliance' },
  ],
}

describe('IntelVectorService', () => {
  let adapter: MockVectorStoreAdapter
  let service: IntelVectorService

  beforeEach(() => {
    adapter = new MockVectorStoreAdapter()
    service = new IntelVectorService(adapter)
    vi.clearAllMocks()
  })

  it('seeds payload into dedicated namespaces', async () => {
    await service.seed(seedPayload)

    expect(adapter.upsertDocuments).toHaveBeenCalledTimes(4)
    const namespaces = adapter.upsertDocuments.mock.calls.map(call => call[0].namespace)
    expect(namespaces).toContain('intel-articles')
    expect(namespaces).toContain('intel-threats')
    expect(namespaces).toContain('intel-incidents')
    expect(namespaces).toContain('intel-compliance')
  })

  it('performs compose query with hybrid search enabled', async () => {
    adapter.search.mockResolvedValueOnce({
      query: 'critical',
      matches: [
        {
          id: 'doc-1',
          text: 'Critical match',
          metadata: { source: 'cfcs.dk', why: 'Vector similarity 0.92' },
          metrics: { score: 0.92, vectorDistance: 0.08, bm25: 7.1 },
        },
      ],
    })

    const result = await service.compose('critical threats in dk', { topK: 5 })

    expect(adapter.search).toHaveBeenCalledWith(
      expect.objectContaining({
        queryText: 'critical threats in dk',
        topK: 5,
        hybrid: true,
      }),
    )
    expect(result.matches[0].source).toBe('cfcs.dk')
    expect(result.matches[0].explanation).toBe('Vector similarity 0.92')
  })

  it('expands scope excluding existing ids', async () => {
    adapter.search.mockResolvedValueOnce({
      query: 'critical',
      matches: [],
    })

    await service.expandScope('critical', ['doc-1', 'doc-2'])

    expect(adapter.search).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: expect.objectContaining({ notIn: ['doc-1', 'doc-2'] }),
      }),
    )
  })

  it('drillDown returns null when no matches found', async () => {
    adapter.search.mockResolvedValueOnce({ query: 'drill', matches: [] })
    const result = await service.drillDown('missing')
    expect(result).toBeNull()
  })

  it('drillDown returns enriched match', async () => {
    adapter.search.mockResolvedValueOnce({
      query: 'drill',
      matches: [
        {
          id: 'doc-2',
          text: 'Detailed doc',
          metadata: { title: 'Detailed', source: 'enisa.europa.eu', why: 'BM25 5.1' },
          metrics: { score: 0.77, vectorDistance: 0.23 },
        },
      ],
    })

    const result = await service.drillDown('doc-2')

    expect(result?.title).toBe('Detailed')
    expect(result?.explanation).toBe('BM25 5.1')
  })

  it('delete delegates to adapter with namespace', async () => {
    await service.delete(['doc-3'], { namespace: 'intel-threats' })
    expect(adapter.deleteDocuments).toHaveBeenCalledWith(
      expect.objectContaining({ ids: ['doc-3'], namespace: 'intel-threats' }),
    )
  })

  it('propagates adapter errors with descriptive message', async () => {
    adapter.search.mockRejectedValueOnce(new Error('network timeout'))
    await expect(service.compose('critical')).rejects.toThrow('Intel query failed: network timeout')
  })
})
