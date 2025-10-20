/**
 * Correlation ID middleware for distributed tracing
 */

const { v4: uuidv4 } = require('uuid')

function correlationIdMiddleware(req, res, next) {
  // Use existing correlation ID from header or generate new one
  const correlationId = req.headers['x-correlation-id'] || uuidv4()
  
  // Add to request object for use in other middleware
  req.correlationId = correlationId
  
  // Add to response headers
  res.set('X-Correlation-ID', correlationId)
  
  next()
}

module.exports = correlationIdMiddleware
