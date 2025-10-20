/**
 * Centralized error handling middleware with proper status codes
 */

function errorHandlerMiddleware(err, req, res, next) {
  // Log error with correlation ID
  console.error(`[${new Date().toISOString()}] Error - ${req.correlationId || 'no-id'}:`, err)
  
  // Default error response
  let statusCode = 500
  let message = 'Internal Server Error'
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Unauthorized'
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403
    message = 'Forbidden'
  } else if (err.name === 'NotFoundError') {
    statusCode = 404
    message = 'Not Found'
  } else if (err.name === 'ConflictError') {
    statusCode = 409
    message = 'Conflict'
  } else if (err.name === 'TooManyRequestsError') {
    statusCode = 429
    message = 'Too Many Requests'
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    error: message,
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  })
}

module.exports = errorHandlerMiddleware
