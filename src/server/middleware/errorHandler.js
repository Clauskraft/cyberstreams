import logger from '../../../lib/logger.js'

/**
 * Centralized error handling middleware
 */
export function errorHandler(err, req, res, next) {
  // Log error with correlation ID for tracing
  logger.error({
    err,
    correlationId: req.correlationId,
    method: req.method,
    path: req.path
  }, 'Request error')

  // Determine status code
  const statusCode = err.statusCode || err.status || 500

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    correlationId: req.correlationId,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

/**
 * 404 Not Found handler
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Not found',
    path: req.path,
    correlationId: req.correlationId
  })
}
