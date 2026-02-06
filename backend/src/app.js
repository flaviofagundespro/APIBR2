import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { apiKeyAuth } from './middlewares/apiKeyAuth.js';
import { metricsMiddleware } from './middlewares/metricsMiddleware.js';
import { CacheService } from './infrastructure/cacheService.js';
import { apiRoutes } from './routes/api.js';

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Metrics collection
app.use(metricsMiddleware);

// Rate limiting
app.use(rateLimiter);

// API Key authentication for /api routes
app.use('/api', apiKeyAuth);

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  const cacheService = CacheService.getInstance();

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    cache: cacheService.getStats(),
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found',
  });
});

export { app };

