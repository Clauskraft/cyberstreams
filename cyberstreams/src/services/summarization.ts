import type { Request } from 'express'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - JavaScript implementation without type declarations
import {
  SummarizationService as SummarizationServiceImpl,
  summarizationService as summarizationServiceImpl,
  handleSummarizationRequest as handleSummarizationRequestImpl
} from '../../../services/summarization.js'

export interface SummarizationInput {
  text: string
  title?: string
  source?: string
  language?: 'da' | 'en'
  tags?: string[]
}

export interface SummaryRecord {
  id: string
  summary: string
  confidence: number
  unverified: boolean
  cves: string[]
  embeddingsStored: boolean
  createdAt: string
  tags?: string[]
}

export class SummarizationService extends (SummarizationServiceImpl as new () => any) {
  summarize(payload: SummarizationInput): Promise<SummaryRecord> {
    return super.summarize(payload)
  }
}

export const summarizationService = summarizationServiceImpl as SummarizationService

export const handleSummarizationRequest = async (req: Request) => {
  const result = await handleSummarizationRequestImpl(req)
  return result as SummaryRecord
}
