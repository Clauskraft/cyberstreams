import { randomUUID } from 'crypto'
import logger from './logger.js'

export default function createAgenticOrchestrator() {
  const runs = new Map()
  const tools = new Map()

  function nowIso() {
    return new Date().toISOString()
  }

  function createRun({ goal }) {
    const id = randomUUID()
    const run = {
      id,
      goal: String(goal || '').trim(),
      status: 'created',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      steps: []
    }
    runs.set(id, run)
    return run
  }

  function getRun(id) {
    return runs.get(id) || null
  }

  function listRuns() {
    return Array.from(runs.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  }

  function addStep(id, step) {
    const run = runs.get(id)
    if (!run) throw new Error('run not found')
    const record = {
      id: randomUUID(),
      type: String(step?.type || 'generic'),
      input: step?.input ?? null,
      output: step?.output ?? null,
      status: step?.status || 'queued',
      createdAt: nowIso()
    }
    run.steps.push(record)
    run.updatedAt = nowIso()
    return record
  }

  function setStatus(id, status) {
    const run = runs.get(id)
    if (!run) throw new Error('run not found')
    run.status = status
    run.updatedAt = nowIso()
    return run
  }

  function registerTool({ name, kind, url, meta }) {
    const id = (name || randomUUID()).toString()
    const tool = { id, name: id, kind: kind || 'generic', url: url || null, meta: meta || {}, registeredAt: nowIso() }
    tools.set(id, tool)
    return tool
  }

  function listTools() {
    return Array.from(tools.values()).sort((a, b) => (a.registeredAt < b.registeredAt ? 1 : -1))
  }

  async function discover({ providers = [], query = '' } = {}) {
    // Stub discovery. In næste faser integreres HuggingFace/GitHub-API.
    const q = String(query || '').trim()
    const results = []
    if (!providers.length || providers.includes('github')) {
      results.push({ provider: 'github', name: 'OpenDevin', kind: 'dev-agent', repo: 'OpenDevin/OpenDevin' })
      results.push({ provider: 'github', name: 'OpenHands', kind: 'dev-agent', repo: 'All-Hands-AI/OpenHands' })
      results.push({ provider: 'github', name: 'CrewAI', kind: 'framework', repo: 'crewAIInc/crewAI' })
      results.push({ provider: 'github', name: 'AutoGen', kind: 'framework', repo: 'microsoft/autogen' })
    }
    if (!providers.length || providers.includes('huggingface')) {
      results.push({ provider: 'huggingface', name: 'transformers-agents', kind: 'framework', model: 'hf-agents' })
      results.push({ provider: 'huggingface', name: 'text-embedding', kind: 'embedding', model: 'sentence-transformers/all-MiniLM-L6-v2' })
    }
    if (q) {
      return results.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q.toLowerCase())))
    }
    return results
  }

  // Seed a few built-in tools
  ;['test-runner', 'data-fetcher', 'structurer', 'presenter', 'ui-optimizer', 'researcher', 'journalist'].forEach(t => {
    try { registerTool({ name: t, kind: 'builtin' }) } catch (e) { logger.warn({ err: e }, 'tool seed failed') }
  })

  return {
    createRun,
    getRun,
    listRuns,
    addStep,
    setStatus,
    registerTool,
    listTools,
    discover
  }
}


