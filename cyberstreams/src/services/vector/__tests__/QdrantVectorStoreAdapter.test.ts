import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QdrantVectorStoreAdapter } from '../adapters/QdrantVectorStoreAdapter'
import { UpsertRequest } from '../types'

const config = {
  provider: 'qdrant' as const,
  url: 'http://localhost:6333',
  apiKey: 'test-key',
  collection: 'intel_documents',
  tenantId: 'tenant-a',
  sessionId: 'session-a',
}

describe('QdrantVectorStoreAdapter', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ result: [] }),
      text: async () => '',
    })) as any
  })

  it('sends upsert request with tenant metadata', async () => {
    const adapter = new QdrantVectorStoreAdapter(config)
    const request: UpsertRequest = {
      documents: [
        {
          id: 'doc-1',
          text: 'Document text',
          vector: [0.1, 0.2],
          metadata: { severity: 'high' },
        },
      ],
      tenantId: 'tenant-a',
      sessionId: 'session-b',
    }

    await adapter.upsertDocuments(request)

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/collections/intel_documents/points?wait=true'),
      expect.objectContaining({
        method: 'PUT',
        headers: expect.objectContaining({ 'api-key': 'test-key' }),
      }),
    )

    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body as string)
    expect(body.points[0].payload.metadata.tenantId).toBe('tenant-a')
    expect(body.points[0].payload.metadata.severity).toBe('high')
  })

  it('parses search response including explanation data', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        result: [
          {
            id: 'doc-2',
            score: 0.88,
            payload: {
              text: 'payload text',
              metadata: {
                why: 'Vector score 0.88',
                bm25Score: 5.6,
                namespace: 'intel-articles',
              },
            },
          },
        ],
      }),
      text: async () => '',
    })

    const adapter = new QdrantVectorStoreAdapter(config)
    const response = await adapter.search({ queryText: 'payload', namespace: 'intel-articles' })

    expect(response.matches[0].metrics.score).toBeCloseTo(0.88)
    expect(response.matches[0].explanation).toBe('Vector score 0.88')
    expect(response.matches[0].metrics.bm25).toBe(5.6)
  })

  it('sends delete request with namespace filter', async () => {
    const adapter = new QdrantVectorStoreAdapter(config)
    await adapter.deleteDocuments({ ids: ['doc-5'], namespace: 'intel-threats' })

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/collections/intel_documents/points/delete'),
      expect.objectContaining({ method: 'POST' }),
    )

    const body = JSON.parse((global.fetch as any).mock.calls[0][1].body as string)
    expect(body.filter.must[0].match.value).toBe('intel-threats')
  })
})
