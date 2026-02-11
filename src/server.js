/**
 * Voicetudu Backend Server
 * Express server handling audio upload, transcription, and analysis
 */

import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { validateEnv } from './config/env.config.js';
import { createCorsMiddleware } from './middleware/cors.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import uploadRoutes from './routes/upload.routes.js';
import { logger } from './utils/logger.js';
import { transcriptionService } from './services/transcription/transcription.service.js';

// Load environment variables
dotenv.config();

/**
 * Initialize and start the server
 */
async function startServer() {
  try {
    // Validate environment variables
    validateEnv();
    
    const app = express();
    const PORT = process.env.PORT || 3000;

    // Security middleware
    app.use(helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));

    // CORS middleware
    app.use(createCorsMiddleware());

    // Body parsing middleware
    app.use(express.json({ limit: '1mb' }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    // Request logging middleware
    app.use((req, res, next) => {
      logger.info(`[Request] ${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
      });
      next();
    });

    // Health check endpoint
    app.get('/health', async (req, res) => {
      const aiHealthy = await transcriptionService.isHealthy();
      
      res.json({
        status: aiHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          server: 'up',
          ai: aiHealthy ? 'up' : 'down'
        },
        provider: transcriptionService.getProviderName()
      });
    });

    // API routes
    app.use('/api', uploadRoutes);

    // Root endpoint
    app.get('/', (req, res) => {
      res.json({
        name: 'Voicetudu API',
        version: '1.0.0',
        description: 'Audio transcription and analysis API',
        endpoints: {
          upload: 'POST /api/upload',
          formats: 'GET /api/upload/formats',
          health: 'GET /health'
        }
      });
    });

    // 404 handler - must be before error handler
    app.use(notFoundHandler);

    // Global error handler
    app.use(errorHandler);

    // Start server
    app.listen(PORT, () => {
      logger.info(`[Server] Voicetudu backend running on port ${PORT}`);
      logger.info(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`[Server] Health check: http://localhost:${PORT}/health`);
    });

  } catch (error) {
    logger.error('[Server] Failed to start server', error);
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('[Process] Uncaught exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('[Process] Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('[Process] SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('[Process] SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();
