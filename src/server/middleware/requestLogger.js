import logger from '../../../lib/logger.js'

/**
 * Minimal request logger middleware without PII
 * Logs request method, path, status, and response time
 */
export function requestLogger(req, res, next) {
  const startTime = Date.now()

  // Capture the original end function
  const originalEnd = res.end

  // Override res.end to log after response
  res.end = function (...args) {
    const duration = Date.now() - startTime
    
    // Log request details without PII
    logger.info({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId: req.correlationId,
      userAgent: req.headers['user-agent']?.substring(0, 100) // Truncate to avoid excessive logging
    }, 'HTTP Request')

    // Call original end function
    originalEnd.apply(res, args)
  }

  next()
}
