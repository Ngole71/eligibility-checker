import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import Joi from 'joi';
import winston from 'winston';
import dotenv from 'dotenv';
import { setupTelemetry } from './telemetry';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';

// Load environment variables
dotenv.config();

// Setup telemetry first
setupTelemetry();

const app = express();
const port = process.env.PORT || 3000;

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'eligibility-backend' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'eligibility_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    logger.error('Error acquiring client', { error: err.stack });
  } else {
    logger.info('Database connected successfully');
    release();
  }
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:4200',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger(logger));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Validation schemas
const userSchema = Joi.object({
  firstName: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name must contain only letters, spaces, hyphens, and apostrophes',
      'string.min': 'First name must be at least 1 character long',
      'string.max': 'First name cannot exceed 50 characters'
    }),
  lastName: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name must contain only letters, spaces, hyphens, and apostrophes',
      'string.min': 'Last name must be at least 1 character long',
      'string.max': 'Last name cannot exceed 50 characters'
    }),
  dateOfBirth: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    })
});

// Helper function to calculate age
function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

// Routes
app.post('/api/check-eligibility', async (req, res, next) => {
  try {
    // Validate input
    const { error, value } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    const { firstName, lastName, dateOfBirth } = value;
    
    // Calculate age
    const age = calculateAge(dateOfBirth);
    const isEligible = age >= 18;

    // Store in database
    const query = `
      INSERT INTO users (first_name, last_name, date_of_birth, age, is_eligible, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, created_at
    `;
    
    const result = await pool.query(query, [
      firstName.trim(),
      lastName.trim(),
      dateOfBirth,
      age,
      isEligible
    ]);
    
    const userId = result.rows[0]?.id;
    
    logger.info('User eligibility checked', {
      userId,
      age,
      eligible: isEligible,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({
      id: userId,
      age,
      eligible: isEligible,
      message: isEligible 
        ? 'You are eligible for the program' 
        : 'You are not eligible for the program',
      timestamp: result.rows[0]?.created_at
    });

  } catch (error) {
    logger.error('Error checking eligibility', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      ip: req.ip
    });
    next(error);
  }
});

// Get user statistics (for demo purposes)
app.get('/api/stats', async (req, res, next) => {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_eligible = true) as eligible_users,
        COUNT(*) FILTER (WHERE is_eligible = false) as ineligible_users,
        ROUND(AVG(age), 2) as average_age
      FROM users
    `;
    
    const result = await pool.query(query);
    const stats = result.rows[0];
    
    logger.info('Statistics requested', { ip: req.ip });
    
    res.json({
      statistics: {
        totalUsers: parseInt(stats.total_users),
        eligibleUsers: parseInt(stats.eligible_users),
        ineligibleUsers: parseInt(stats.ineligible_users),
        averageAge: parseFloat(stats.average_age) || 0
      }
    });

  } catch (error) {
    logger.error('Error fetching statistics', { 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    next(error);
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await pool.query('SELECT 1');
    
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// Ready check endpoint (for Kubernetes)
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Eligibility Checker API',
    version: '1.0.0',
    endpoints: {
      'POST /api/check-eligibility': 'Check user eligibility for the program',
      'GET /api/stats': 'Get application statistics',
      'GET /health': 'Health check endpoint',
      'GET /ready': 'Readiness check endpoint'
    },
    documentation: 'https://github.com/your-username/eligibility-checker#api'
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler(logger));

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully');
  
  await pool.end();
  logger.info('Database connections closed');
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  
  await pool.end();
  logger.info('Database connections closed');
  
  process.exit(0);
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    logger.info(`Server running on port ${port}`, {
      environment: process.env.NODE_ENV,
      nodeVersion: process.version
    });
  });
}

export default app;