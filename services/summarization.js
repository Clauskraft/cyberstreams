import { randomUUID } from 'node:crypto'
import { createEmbedding, QdrantClient, WeaviateClient } from '../lib/vectorClient.js'
import { logger, createChildLogger } from '../lib/logger.js'

export class SummarizationService {
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    this.apiKey = apiKey
    this.misp = {
      baseUrl: process.env.MISP_URL,
      apiKey: process.env.MISP_KEY
    }
    this.opencti = {
      baseUrl: process.env.OPENCTI_URL,
      apiToken: process.env.OPENCTI_TOKEN
    }
    this.qdrant = new QdrantClient({
      baseUrl: process.env.QDRANT_URL,
      apiKey: process.env.QDRANT_API_KEY,
      collection: process.env.QDRANT_COLLECTION || 'cyberstreams_summaries'
    })
    this.weaviate = new WeaviateClient({
      baseUrl: process.env.WEAVIATE_URL,
      apiKey: process.env.WEAVIATE_API_KEY,
      className: process.env.WEAVIATE_CLASS || 'CyberstreamsSummary'
    })
    this.log = createChildLogger({ module: 'summarization-service' })
  }

  async summarize(input) {
    const { text, title, language = 'da', tags = [] } = input
    if (!text) {
      throw new Error('Missing text payload for summarization')
    }

    const summary = await this.generateSummary(text, language)
    const unverifiedSummary = summary.includes('[Unverified]')
      ? summary
      : `[Unverified] ${summary}`
    const cves = this.extractCves(`${text}\n${summary}`)
    const enrichedSummary = this.appendCves(unverifiedSummary, cves)
    const confidence = this.estimateConfidence(text, summary)

    const record = {
      id: randomUUID(),
      summary: enrichedSummary,
      confidence,
      unverified: true,
      cves,
      embeddingsStored: false,
      createdAt: new Date().toISOString(),
      tags
    }

    await this.persistToThreatPlatforms(record, input)
    record.embeddingsStored = await this.storeEmbeddings(record, input)

    return record
  }

  async generateSummary(text, language) {
    if (!this.apiKey) {
      this.log.warn('OPENAI_API_KEY missing, using heuristic summarisation')
      return this.fallbackSummary(text)
    }

    const prompt = this.buildPrompt(text, language)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: process.env.SUMMARIZATION_MODEL || 'gpt-4o-mini',
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content: language === 'da'
              ? 'Du er en cybersikkerhedsekspert der laver korte faktuelle resuméer.'
              : 'You are a cyber security analyst generating concise factual summaries.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      const textResponse = await response.text()
      this.log.error({ status: response.status, body: textResponse }, 'Summarisation API failed')
      return this.fallbackSummary(text)
    }

    const payload = await response.json()
    const content = payload.choices?.[0]?.message?.content?.trim()
    if (!content) {
      return this.fallbackSummary(text)
    }
    return content
  }

  buildPrompt(text, language) {
    const baseInstruction = language === 'da'
      ? 'Opsummer sikkerhedsrapporten i 2 sætninger. Inkludér påvirkede aktører, TTP og anbefalet handling.'
      : 'Summarize the security report in two sentences, including impacted actors, TTPs, and recommended action.'
    return `${baseInstruction}\n\nTekst:\n${text}`
  }

  fallbackSummary(text) {
    const sentences = text.split(/(?<=[.!?])\s+/).slice(0, 2)
    return sentences.join(' ').slice(0, 280)
  }

  estimateConfidence(text, summary) {
    const overlap = summary.split(' ').filter((word) => text.includes(word)).length
    const ratio = summary.length ? overlap / summary.split(' ').length : 0
    return Math.round(Math.min(1, Math.max(0.3, ratio)) * 100) / 100
  }

  async persistToThreatPlatforms(record, input) {
    const stixNote = {
      type: 'note',
      id: `note--${record.id}`,
      spec_version: '2.1',
      created: record.createdAt,
      modified: record.createdAt,
      content: record.summary,
      confidence: Math.round(record.confidence * 100),
      object_refs: [],
      labels: ['summary', ...(input.tags || [])]
    }

    await Promise.all([
      this.pushToMisp(record, input),
      this.pushToOpenCti(stixNote, record)
    ])
  }

  async pushToMisp(record, input) {
    if (!this.misp?.baseUrl || !this.misp?.apiKey) {
      this.log.warn('MISP integration is not configured')
      return
    }

    try {
      const response = await fetch(`${this.misp.baseUrl}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.misp.apiKey
        },
        body: JSON.stringify({
          info: input.title || 'Cyberstreams Summary',
          distribution: 0,
          threat_level_id: 2,
          analysis: 1,
          Attribute: [
            {
              type: 'comment',
              category: 'Other',
              value: record.summary
            },
            ...record.cves.map((cve) => ({
              type: 'vulnerability',
              category: 'External analysis',
              value: cve,
              to_ids: true
            }))
          ]
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`MISP responded with ${response.status}: ${text}`)
      }
    } catch (error) {
      this.log.error({ err: error }, 'Failed to push summary to MISP')
    }
  }

  async pushToOpenCti(stixNote, record) {
    if (!this.opencti?.baseUrl || !this.opencti?.apiToken) {
      this.log.warn('OpenCTI integration is not configured')
      return
    }

    try {
      const response = await fetch(`${this.opencti.baseUrl}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.opencti.apiToken}`
        },
        body: JSON.stringify({
          query: `mutation ImportSummary($bundle: String!) {
            stix2_import(file: $bundle) { id }
          }`,
          variables: {
            bundle: JSON.stringify({
              type: 'bundle',
              id: `bundle--${record.id}`,
              objects: [stixNote]
            })
          }
        })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`OpenCTI responded with ${response.status}: ${text}`)
      }
    } catch (error) {
      this.log.error({ err: error }, 'Failed to push summary to OpenCTI')
    }
  }

  async storeEmbeddings(record, input) {
    try {
      const embedding = await createEmbedding(`${input.title || ''}\n${input.text}\n${record.summary}`)
      const payload = {
        id: record.id,
        vector: embedding,
        payload: {
          title: input.title,
          summary: record.summary,
          cves: record.cves,
          createdAt: record.createdAt
        }
      }
      await Promise.all([
        this.qdrant.upsert([payload]).catch((error) => {
          this.log.error({ err: error }, 'Failed storing embedding in Qdrant')
        }),
        this.weaviate.upsert([
          {
            id: record.id,
            properties: {
              title: input.title,
              summary: record.summary,
              cves: record.cves,
              createdAt: record.createdAt
            },
            vector: embedding
          }
        ]).catch((error) => {
          this.log.error({ err: error }, 'Failed storing embedding in Weaviate')
        })
      ])
      return true
    } catch (error) {
      this.log.error({ err: error }, 'Embedding generation failed')
      return false
    }
  }

  extractCves(text) {
    const matches = text.match(/CVE-\d{4}-\d{4,7}/gi) || []
    return Array.from(new Set(matches.map((match) => match.toUpperCase())))
  }

  appendCves(summary, cves) {
    if (!cves.length) {
      return summary
    }
    const suffix = ` CVE: ${cves.join(', ')}`
    return summary.includes('[Unverified]') ? `${summary}${suffix}` : `[Unverified] ${summary}${suffix}`
  }
}

export const summarizationService = new SummarizationService()

export async function handleSummarizationRequest(req) {
  const record = await summarizationService.summarize(req.body)
  return record
}

logger.info('Summarization service initialised')
