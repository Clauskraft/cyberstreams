import { afterEach, vi, expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

if (!global.fetch) {
  global.fetch = vi.fn()
}

// Global mocks for external libs used by unrelated test suites
vi.mock('../lib/vectorClient.js', async () => {
  const actual = await vi.importActual<any>('../lib/vectorClient.js')
  class QdrantClientMock {
    constructor() {}
    upsert() { return Promise.resolve() }
  }
  class WeaviateClientMock {
    constructor() {}
    upsert() { return Promise.resolve() }
  }
  return {
    ...actual,
    QdrantClient: QdrantClientMock as any,
    WeaviateClient: WeaviateClientMock,
    createEmbedding: async () => new Array(3).fill(0.1),
  }
})

vi.mock('node-cron', () => {
  return {
    default: {
      schedule: () => ({ start: () => {}, stop: () => {} })
    },
    schedule: () => ({ start: () => {}, stop: () => {} })
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

expect.extend(matchers)
