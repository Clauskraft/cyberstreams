import 'dotenv/config'

/**
 * Server configuration with validation and defaults
 */
class Config {
  constructor() {
    this.port = this.getPort()
    this.nodeEnv = this.getNodeEnv()
    this.corsOrigin = this.getCorsOrigin()
    this.rateLimitWindowMs = this.getRateLimitWindowMs()
    this.rateLimitMaxRequests = this.getRateLimitMaxRequests()
  }

  getPort() {
    const port = Number(process.env.PORT || 3001)
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new Error(`Invalid PORT: ${process.env.PORT}. Must be between 1 and 65535.`)
    }
    return port
  }

  getNodeEnv() {
    const env = process.env.NODE_ENV || 'development'
    const validEnvs = ['development', 'test', 'production']
    if (!validEnvs.includes(env)) {
      console.warn(`Invalid NODE_ENV: ${env}. Using 'development'.`)
      return 'development'
    }
    return env
  }

  getCorsOrigin() {
    return process.env.CORS_ORIGIN || 'http://localhost:5173'
  }

  getRateLimitWindowMs() {
    const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 900000) // 15 minutes default
    if (!Number.isInteger(windowMs) || windowMs < 1000) {
      console.warn(`Invalid RATE_LIMIT_WINDOW_MS: ${process.env.RATE_LIMIT_WINDOW_MS}. Using default 900000ms.`)
      return 900000
    }
    return windowMs
  }

  getRateLimitMaxRequests() {
    const maxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 100)
    if (!Number.isInteger(maxRequests) || maxRequests < 1) {
      console.warn(`Invalid RATE_LIMIT_MAX_REQUESTS: ${process.env.RATE_LIMIT_MAX_REQUESTS}. Using default 100.`)
      return 100
    }
    return maxRequests
  }

  isProduction() {
    return this.nodeEnv === 'production'
  }

  isDevelopment() {
    return this.nodeEnv === 'development'
  }

  isTest() {
    return this.nodeEnv === 'test'
  }
}

export default new Config()
