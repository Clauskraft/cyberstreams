/**
 * Configuration loader with validation and defaults
 */

const config = {
  // Server configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS configuration
  corsOrigin: process.env.CORS_ORIGIN || '*',
  
  // Rate limiting configuration
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // Database configuration
  databaseUrl: process.env.DATABASE_URL,
  vectorDbUrl: process.env.VECTOR_DB_URL || process.env.DATABASE_URL,
  
  // Security configuration
  enableSecurityHeaders: process.env.ENABLE_SECURITY_HEADERS !== 'false',
  enableRateLimiting: process.env.ENABLE_RATE_LIMITING !== 'false',
  
  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',
  enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false'
}

// Validation
if (config.rateLimitWindowMs < 1000) {
  throw new Error('RATE_LIMIT_WINDOW_MS must be at least 1000ms')
}

if (config.rateLimitMaxRequests < 1) {
  throw new Error('RATE_LIMIT_MAX_REQUESTS must be at least 1')
}

module.exports = config
