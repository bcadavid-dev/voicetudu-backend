/**
 * CORS Middleware Configuration
 * Handles cross-origin requests for development and production
 */

import cors from 'cors';
import { getConfig } from '../config/env.config.js';
import { logger } from '../utils/logger.js';

/**
 * Creates CORS middleware with configured options
 * @returns {Function} CORS middleware
 */
export function createCorsMiddleware() {
  const config = getConfig();
  const allowedOrigins = config.server.allowedOrigins;

  const corsOptions = {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Check if origin is allowed
      if (allowedOrigins.includes(origin)) {
        logger.debug('[CORS] Origin allowed', { origin });
        return callback(null, true);
      }

      // In development, allow all origins
      if (config.server.env === 'development') {
        logger.debug('[CORS] Development mode - allowing all origins', { origin });
        return callback(null, true);
      }

      logger.warn('[CORS] Origin not allowed', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    exposedHeaders: ['Content-Length', 'X-Request-ID'],
    maxAge: 86400 // 24 hours
  };

  logger.info('[CORS] Middleware configured', { 
    allowedOrigins,
    environment: config.server.env 
  });

  return cors(corsOptions);
}
