import { describe, it, expect } from 'vitest'
import { IngestionPipeline } from '../index.js'

describe('IngestionPipeline observable extraction', () => {
  const pipeline = new IngestionPipeline({
    dbConnectionString: 'postgres://user:pass@localhost:5432/test',
    misp: {},
    opencti: {}
  })

  it('detects CVE references', () => {
    const observable = pipeline.extractObservable('Exploiting CVE-2024-2222 leads to privilege escalation')
    expect(observable?.observable_type).toBe('vulnerability')
    expect(observable?.observable_value).toBe('CVE-2024-2222')
  })

  it('detects IPv4 addresses', () => {
    const observable = pipeline.extractObservable('C2 beacon observed at 10.0.0.5 during attack chain')
    expect(observable?.observable_type).toBe('ipv4-addr')
    expect(observable?.observable_value).toBe('10.0.0.5')
  })
})
