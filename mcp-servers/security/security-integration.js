import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { securityConfig, rolePolicies } from './security-config.js';
import { 
  authenticateToken, 
  authorizeRole, 
  rateLimit as customRateLimit,
  validateInput,
  securityHeaders,
  requestLogger,
  hashPassword,
  verifyPassword,
  generateToken,
  validateApiKey
} from './auth-middleware.js';
import securityMonitor from './security-monitor.js';
import SecurityTester from './security-tests.js';

/**
 * MCP Security Integration
 * Comprehensive security integration for MCP servers
 */

class SecurityIntegration {
  constructor() {
    this.app = express();
    this.securityTester = new SecurityTester();
    this.setupSecurity();
  }

  /**
   * Setup comprehensive security
   */
  setupSecurity() {
    // Basic security middleware
    this.app.use(helmet(securityConfig.securityHeaders));
    this.app.use(cors(securityConfig.cors));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting
    const limiter = rateLimit(securityConfig.rateLimiting);
    this.app.use(limiter);

    // Custom security middleware
    this.app.use(securityHeaders);
    this.app.use(requestLogger);

    // Security monitoring
    this.app.use((req, res, next) => {
      securityMonitor.logSecurityEvent({
        type: 'request',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        details: {
          method: req.method,
          url: req.url,
          headers: req.headers
        }
      });
      next();
    });

    // API key validation for all routes
    this.app.use('/api', validateApiKey);

    // Authentication for secure routes
    this.app.use('/api/secure', authenticateToken);

    // Role-based authorization
    this.app.use('/api/admin', authorizeRole(['admin']));
    this.app.use('/api/user', authorizeRole(['user', 'admin']));
    this.app.use('/api/guest', authorizeRole(['guest', 'user', 'admin']));

    // Error handling
    this.app.use(this.errorHandler.bind(this));
  }

  /**
   * Error handler with security logging
   */
  errorHandler(err, req, res, next) {
    // Log security events for errors
    securityMonitor.logSecurityEvent({
      type: 'error',
      severity: 'medium',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      details: {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
      }
    });

    // Don't expose sensitive error information
    const errorResponse = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    };

    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = err.message;
      errorResponse.stack = err.stack;
    }

    res.status(500).json(errorResponse);
  }

  /**
   * Setup security routes
   */
  setupSecurityRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        security: {
          monitoring: 'enabled',
          rateLimiting: 'enabled',
          authentication: 'enabled',
          authorization: 'enabled'
        }
      });
    });

    // Metrics endpoint
    this.app.get('/metrics', authenticateToken, (req, res) => {
      const metrics = securityMonitor.getSecurityMetrics();
      res.json(metrics);
    });

    // Security status endpoint
    this.app.get('/api/security/status', authenticateToken, (req, res) => {
      res.json({
        security: {
          authentication: 'enabled',
          authorization: 'enabled',
          rateLimiting: 'enabled',
          monitoring: 'enabled',
          encryption: 'enabled',
          inputValidation: 'enabled'
        },
        policies: rolePolicies,
        timestamp: new Date().toISOString()
      });
    });

    // Security test endpoint
    this.app.post('/api/security/test', authenticateToken, authorizeRole(['admin']), async (req, res) => {
      try {
        const results = await this.securityTester.runAllSecurityTests();
        res.json({
          success: true,
          results,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          error: 'Security test failed',
          details: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // User authentication endpoints
    this.app.post('/api/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;
        
        // Validate input
        if (!email || !password) {
          return res.status(400).json({
            error: 'Email and password required',
            code: 'MISSING_CREDENTIALS',
            timestamp: new Date().toISOString()
          });
        }

        // Simulate user authentication (in production, validate against database)
        const user = await this.authenticateUser(email, password);
        
        if (!user) {
          securityMonitor.logSecurityEvent({
            type: 'failed_login',
            severity: 'medium',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            details: { email }
          });
          
          return res.status(401).json({
            error: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS',
            timestamp: new Date().toISOString()
          });
        }

        // Generate token
        const token = generateToken({
          userId: user.id,
          email: user.email,
          role: user.role
        });

        securityMonitor.logSecurityEvent({
          type: 'successful_login',
          severity: 'low',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: { userId: user.id, email: user.email }
        });

        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        res.status(500).json({
          error: 'Authentication failed',
          code: 'AUTH_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    });

    // User registration endpoint
    this.app.post('/api/auth/register', async (req, res) => {
      try {
        const { email, password, username } = req.body;
        
        // Validate input
        if (!email || !password || !username) {
          return res.status(400).json({
            error: 'Email, password, and username required',
            code: 'MISSING_FIELDS',
            timestamp: new Date().toISOString()
          });
        }

        // Hash password
        const hashedPassword = await hashPassword(password);
        
        // Create user (in production, save to database)
        const user = {
          id: crypto.randomUUID(),
          email,
          username,
          password: hashedPassword,
          role: 'user',
          createdAt: new Date().toISOString()
        };

        securityMonitor.logSecurityEvent({
          type: 'user_registration',
          severity: 'low',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: { userId: user.id, email: user.email }
        });

        res.json({
          success: true,
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role
          },
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        res.status(500).json({
          error: 'Registration failed',
          code: 'REGISTRATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }
    });

    // Secure endpoint example
    this.app.get('/api/secure/data', (req, res) => {
      res.json({
        message: 'This is secure data',
        user: req.user,
        timestamp: new Date().toISOString()
      });
    });

    // Admin endpoint example
    this.app.get('/api/admin/users', (req, res) => {
      res.json({
        message: 'Admin user data',
        user: req.user,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Simulate user authentication
   */
  async authenticateUser(email, password) {
    // In production, this would query a database
    const users = [
      {
        id: '1',
        email: 'admin@cyberstreams.dk',
        password: await hashPassword('admin123'),
        role: 'admin'
      },
      {
        id: '2',
        email: 'user@cyberstreams.dk',
        password: await hashPassword('user123'),
        role: 'user'
      }
    ];

    const user = users.find(u => u.email === email);
    if (user && await verifyPassword(password, user.password)) {
      return user;
    }
    return null;
  }

  /**
   * Get Express app
   */
  getApp() {
    return this.app;
  }

  /**
   * Start security monitoring
   */
  startSecurityMonitoring() {
    // Setup alert handlers
    securityMonitor.addAlertHandler((alert) => {
      console.log(`[Security Alert] ${alert.type}: ${alert.details}`);
      
      // In production, send alerts to monitoring systems
      if (alert.severity === 'critical' || alert.severity === 'high') {
        // Send email, Slack notification, etc.
        this.sendSecurityAlert(alert);
      }
    });

    // Export security events periodically
    setInterval(() => {
      securityMonitor.exportSecurityEvents(`security-events-${Date.now()}.json`);
    }, 24 * 60 * 60 * 1000); // Daily

    // Clear old events periodically
    setInterval(() => {
      securityMonitor.clearOldEvents(30); // 30 days
    }, 7 * 24 * 60 * 60 * 1000); // Weekly

    console.log('[Security Integration] Security monitoring started');
  }

  /**
   * Send security alert
   */
  sendSecurityAlert(alert) {
    // In production, implement actual alerting
    console.log(`[Security Alert] ${alert.type}: ${JSON.stringify(alert)}`);
  }

  /**
   * Run security tests
   */
  async runSecurityTests() {
    console.log('[Security Integration] Running security tests...');
    const results = await this.securityTester.runAllSecurityTests();
    return results;
  }
}

export default SecurityIntegration;



