import { randomUUID } from 'crypto'

/**
 * Middleware to add correlation ID to requests for tracing
 */
export function correlationId(req, res, next) {
  const correlationId = req.headers['x-correlation-id'] || randomUUID()
  req.correlationId = correlationId
  res.setHeader('X-Correlation-ID', correlationId)
  next()
}
