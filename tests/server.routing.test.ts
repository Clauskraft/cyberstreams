import request from 'supertest'
import { describe, it, expect } from 'vitest'
import { app } from '../server.js'

describe('health and readiness', () => {
  it('GET /healthz -> 200 ok', async () => {
    const res = await request(app).get('/healthz')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('GET /readyz -> 200 or 503 depending on boot', async () => {
    const res = await request(app).get('/readyz')
    expect([200, 503]).toContain(res.status)
  })
})

describe('routing and errors', () => {
  it('non-existent API route returns 404 JSON', async () => {
    const res = await request(app).get('/api/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })

  it('client catch-all does not handle /api/*', async () => {
    const res = await request(app).get('/api')
    expect(res.status).toBe(404)
  })
})
