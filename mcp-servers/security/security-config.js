/**
 * MCP Security Configuration
 * Comprehensive security settings and policies
 */

export const securityConfig = {
  // Authentication settings
  authentication: {
    jwtSecret: process.env.MCP_JWT_SECRET || 'cyberstreams-mcp-secret-key-2025',
    jwtExpiresIn: process.env.MCP_JWT_EXPIRES_IN || '24h',
    refreshTokenExpiresIn: '7d',
    bcryptRounds: parseInt(process.env.MCP_BCRYPT_ROUNDS) || 12,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
  },

  // Rate limiting settings
  rateLimiting: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100, // requests per window
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
    keyGenerator: (req) => req.ip || req.connection.remoteAddress,
  },

  // CORS settings
  cors: {
    origin: process.env.MCP_CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  },

  // Security headers
  securityHeaders: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'",
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  },

  // Input validation rules
  validation: {
    maxInputLength: 10000,
    allowedFileTypes: ['.json', '.xml', '.txt'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    sanitizeHtml: true,
    validateJson: true,
  },

  // Logging settings
  logging: {
    logLevel: process.env.MCP_LOG_LEVEL || 'info',
    logSecurityEvents: true,
    logFailedAttempts: true,
    logSuccessfulLogins: false,
    logDataAccess: true,
    retentionDays: 90,
  },

  // Encryption settings
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    tagLength: 16,
  },

  // Session settings
  session: {
    secret: process.env.MCP_SESSION_SECRET || 'cyberstreams-session-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict',
    },
  },

  // API key settings
  apiKeys: {
    required: true,
    rotationPeriod: 90 * 24 * 60 * 60 * 1000, // 90 days
    maxKeysPerUser: 5,
    keyLength: 32,
  },

  // Audit settings
  audit: {
    enabled: true,
    logLevel: 'info',
    includeRequestBody: false,
    includeResponseBody: false,
    sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
  },

  // Threat detection
  threatDetection: {
    enabled: true,
    suspiciousPatterns: [
      /script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
    ],
    maxSuspiciousRequests: 10,
    blockDuration: 60 * 60 * 1000, // 1 hour
  },

  // Data protection
  dataProtection: {
    gdprCompliant: true,
    dataRetentionDays: 365,
    anonymizeLogs: true,
    encryptSensitiveData: true,
    dataClassification: {
      public: ['name', 'description'],
      internal: ['email', 'phone'],
      confidential: ['apiKey', 'token'],
      restricted: ['password', 'secret'],
    },
  },

  // Network security
  networkSecurity: {
    allowedIPs: process.env.MCP_ALLOWED_IPS?.split(',') || [],
    blockedIPs: [],
    maxConnectionsPerIP: 100,
    connectionTimeout: 30000, // 30 seconds
    requestTimeout: 10000, // 10 seconds
  },

  // Monitoring and alerting
  monitoring: {
    enabled: true,
    metricsEndpoint: '/metrics',
    healthCheckEndpoint: '/health',
    alertThresholds: {
      errorRate: 0.05, // 5%
      responseTime: 1000, // 1 second
      memoryUsage: 0.8, // 80%
      cpuUsage: 0.8, // 80%
    },
  },
};

/**
 * Security policies for different user roles
 */
export const rolePolicies = {
  admin: {
    permissions: ['read', 'write', 'delete', 'admin'],
    rateLimit: 1000,
    allowedEndpoints: ['*'],
    dataAccess: 'all',
  },
  user: {
    permissions: ['read', 'write'],
    rateLimit: 100,
    allowedEndpoints: ['/api/*'],
    dataAccess: 'own',
  },
  guest: {
    permissions: ['read'],
    rateLimit: 10,
    allowedEndpoints: ['/api/public/*'],
    dataAccess: 'public',
  },
  service: {
    permissions: ['read', 'write'],
    rateLimit: 500,
    allowedEndpoints: ['/api/service/*'],
    dataAccess: 'service',
  },
};

/**
 * Security validation schemas
 */
export const validationSchemas = {
  userRegistration: {
    username: { type: 'string', min: 3, max: 50, required: true },
    email: { type: 'string', format: 'email', required: true },
    password: { type: 'string', min: 8, max: 128, required: true },
  },
  userLogin: {
    email: { type: 'string', format: 'email', required: true },
    password: { type: 'string', required: true },
  },
  apiKeyRequest: {
    name: { type: 'string', min: 3, max: 50, required: true },
    permissions: { type: 'array', items: 'string', required: true },
  },
  mcpRequest: {
    endpoint: { type: 'string', required: true },
    method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'DELETE'], required: true },
    data: { type: 'object', required: false },
  },
};

export default securityConfig;



