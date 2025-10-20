/**
 * Minimal request logging middleware without PII
 */

function requestLoggerMiddleware(req, res, next) {
  const startTime = Date.now()
  
  // Log request start
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.correlationId || 'no-id'}`)
  
  // Override res.end to log response
  const originalEnd = res.end
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - ${req.correlationId || 'no-id'}`)
    originalEnd.call(this, chunk, encoding)
  }
  
  next()
}

module.exports = requestLoggerMiddleware
