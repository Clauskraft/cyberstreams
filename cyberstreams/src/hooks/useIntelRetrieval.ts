import { useCallback, useMemo, useRef, useState } from 'react'
import { IntelVectorService, IntelResultItem, IntelSearchResult } from '@/services/intel/IntelVectorService'
import {
  VectorStoreConfig,
  VectorProvider,
  EncryptionSettings,
} from '@/services/vector'
import { intelSeedData } from '@/data/seed/intelSeedData'

export interface UseIntelRetrievalOptions {
  namespace?: string
  tenantId?: string
  sessionId?: string
  encryption?: EncryptionSettings
}

export interface IntelRetrievalState {
  results: IntelResultItem[]
  detail: IntelResultItem | null
  loading: boolean
  error: string | null
  lastQuery: string
}

export interface IntelRetrievalApi extends IntelRetrievalState {
  composeIntel: (query?: string) => Promise<IntelSearchResult | null>
  expandScope: (query?: string) => Promise<IntelSearchResult | null>
  drillDown: (id: string) => Promise<IntelResultItem | null>
  seedDefaultIntel: () => Promise<void>
  resetError: () => void
}

const DEFAULT_QUERY = 'critical cyber threats impacting danish critical infrastructure'

export function useIntelRetrieval(options: UseIntelRetrievalOptions = {}): IntelRetrievalApi {
  const [results, setResults] = useState<IntelResultItem[]>([])
  const [detail, setDetail] = useState<IntelResultItem | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQuery, setLastQuery] = useState(DEFAULT_QUERY)
  const hasSeeded = useRef(false)

  const config = useMemo<VectorStoreConfig | null>(() => {
    const provider = (import.meta.env.VITE_VECTOR_DB_PROVIDER as VectorProvider | undefined) ?? 'qdrant'
    const url = import.meta.env.VITE_VECTOR_DB_URL
    if (!url) {
      return null
    }
    return {
      provider,
      url,
      apiKey: import.meta.env.VITE_VECTOR_DB_API_KEY,
      collection: import.meta.env.VITE_VECTOR_DB_COLLECTION ?? 'cyberstreams',
      tenantId: options.tenantId ?? import.meta.env.VITE_VECTOR_DB_TENANT_ID ?? 'cyberstreams',
      sessionId: options.sessionId ?? import.meta.env.VITE_VECTOR_DB_SESSION_ID ?? 'admin-session',
      namespace: options.namespace ?? import.meta.env.VITE_VECTOR_DB_NAMESPACE ?? 'intel-admin',
      encryption: options.encryption ??
        (import.meta.env.VITE_VECTOR_DB_ENCRYPTION_KEY
          ? { enabled: true, keyId: import.meta.env.VITE_VECTOR_DB_ENCRYPTION_KEY }
          : undefined),
      topK: 10,
    }
  }, [options.encryption, options.namespace, options.sessionId, options.tenantId])

  const service = useMemo(() => {
    if (!config) {
      return null
    }
    return new IntelVectorService(config)
  }, [config])

  const runQuery = useCallback(
    async (query: string, mode: 'compose' | 'expand', existingIds: string[] = []) => {
      if (!service) {
        setError('Vector database is not configured. Sæt VITE_VECTOR_DB_URL i miljøet.')
        return null
      }
      setLoading(true)
      setError(null)
      try {
        let response: IntelSearchResult
        if (mode === 'expand') {
          response = await service.expandScope(query, existingIds, {
            namespace: config?.namespace,
            encryption: config?.encryption,
          })
        } else {
          response = await service.compose(query, {
            namespace: config?.namespace,
            encryption: config?.encryption,
          })
        }
        const mapped = dedupeResults(mode === 'expand' ? [...results, ...response.matches] : response.matches)
        setResults(mapped)
        if (mapped.length > 0) {
          setDetail(mapped[0])
        }
        setLastQuery(query)
        return response
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ukendt fejl ved forespørgsel til vector database')
        return null
      } finally {
        setLoading(false)
      }
    },
    [config?.encryption, config?.namespace, results, service],
  )

  const composeIntel = useCallback(
    async (query: string = DEFAULT_QUERY) => runQuery(query, 'compose'),
    [runQuery],
  )

  const expandScope = useCallback(
    async (query: string = lastQuery) => runQuery(query, 'expand', results.map(item => item.id)),
    [lastQuery, results, runQuery],
  )

  const drillDown = useCallback(
    async (id: string) => {
      if (!service) {
        setError('Vector database is not configured. Sæt VITE_VECTOR_DB_URL i miljøet.')
        return null
      }
      setLoading(true)
      try {
        const match = await service.drillDown(id, {
          namespace: config?.namespace,
          encryption: config?.encryption,
        })
        setDetail(match)
        return match
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Kunne ikke hente dokumentdetaljer')
        return null
      } finally {
        setLoading(false)
      }
    },
    [config?.encryption, config?.namespace, service],
  )

  const seedDefaultIntel = useCallback(async () => {
    if (!service || hasSeeded.current) {
      return
    }
    setLoading(true)
    try {
      await service.seed(intelSeedData)
      hasSeeded.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunne ikke indsætte seed data i vector database')
    } finally {
      setLoading(false)
    }
  }, [service])

  const resetError = useCallback(() => setError(null), [])

  return {
    results,
    detail,
    loading,
    error,
    lastQuery,
    composeIntel,
    expandScope,
    drillDown,
    seedDefaultIntel,
    resetError,
  }
}

function dedupeResults(matches: IntelResultItem[]): IntelResultItem[] {
  const seen = new Map<string, IntelResultItem>()
  for (const item of matches) {
    if (!seen.has(item.id)) {
      seen.set(item.id, item)
    } else {
      const existing = seen.get(item.id)!
      if ((item.metrics?.score ?? 0) > (existing.metrics?.score ?? 0)) {
        seen.set(item.id, item)
      }
    }
  }
  return Array.from(seen.values())
}
