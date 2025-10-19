import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { summarizationService } from '../summarization'

const originalEnv = process.env

describe('SummarizationService', () => {
  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.OPENAI_API_KEY = ''
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ embedding: new Array(3).fill(0.1) }] })
    } as any)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = originalEnv
  })

  it('generates [Unverified] summaries with CVE enrichment', async () => {
    const result = await summarizationService.summarize({
      text: 'Critical remote code execution vulnerability CVE-2024-1234 allows attackers to escalate.',
      title: 'New CVE'
    })

    expect(result.summary).toContain('[Unverified]')
    expect(result.summary).toContain('CVE-2024-1234')
    expect(result.cves).toContain('CVE-2024-1234')
  })
})
