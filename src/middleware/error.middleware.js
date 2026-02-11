/**
 * Global Error Handling Middleware
 * Centralizes error handling for all routes
 * Returns consistent error responses
 */

import { logger } from '../utils/logger.js';

/**
 * Custom API Error class
 * Allows specifying HTTP status code and error code
 */
export class APIError extends Error {
  /**
   * Creates an APIError
   * @param {string} message - Error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code='INTERNAL_ERROR'] - Error code
   * @param {Object} [details] - Additional error details
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response mapping
 * Maps error codes to HTTP status codes and messages
 */
const ERROR_MAP = {
  // File upload errors
  INVALID_FORMAT: { status: 400, message: 'Invalid audio format' },
  FILE_TOO_LARGE: { status: 413, message: 'File too large' },
  AUDIO_TOO_LONG: { status: 422, message: 'Audio too long' },
  NO_FILE: { status: 400, message: 'No file provided' },
  
  // Processing errors
  TRANSCRIPTION_ERROR: { status: 500, message: 'Transcription failed' },
  ANALYSIS_ERROR: { status: 502, message: 'Analysis failed' },
  EMPTY_TRANSCRIPTION: { status: 422, message: 'Could not transcribe audio' },
  
  // API errors
  RATE_LIMIT: { status: 429, message: 'Rate limit exceeded' },
  API_ERROR: { status: 503, message: 'AI service unavailable' },
  TIMEOUT: { status: 504, message: 'Request timeout' },
  
  // Generic errors
  INTERNAL_ERROR: { status: 500, message: 'Internal server error' }
};

/**
 * Global error handler middleware
 * Must have 4 parameters to be recognized as error handler
 */
export function errorHandler(err, req, res, next) {
  // Log the error
  logger.error('[ErrorHandler] Unhandled error', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path,
    method: req.method
  });

  // Handle APIError instances
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        timestamp: err.timestamp
      }
    });
  }

  // Map known error codes
  const mappedError = ERROR_MAP[err.code];
  if (mappedError) {
    return res.status(mappedError.status).json({
      success: false,
      error: {
        code: err.code,
        message: err.message || mappedError.message,
        details: err.details || null,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Handle OpenAI specific errors
  if (err.message?.includes('quota exceeded')) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'API_QUOTA_EXCEEDED',
        message: 'AI service quota exceeded',
        details: 'Please check your API billing',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (err.message?.includes('rate limit')) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT',
        message: 'Too many requests',
        details: 'Please try again later',
        timestamp: new Date().toISOString()
      }
    });
  }

  if (err.message?.includes('timeout') || err.code === 'ETIMEDOUT') {
    return res.status(504).json({
      success: false,
      error: {
        code: 'TIMEOUT',
        message: 'Request took too long',
        details: 'Please try with a shorter audio file',
        timestamp: new Date().toISOString()
      }
    });
  }

  // Default error response
  const isDev = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred',
      details: isDev ? err.stack : null,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * 404 Not Found handler
 * Handles requests to non-existent routes
 */
export function notFoundHandler(req, res) {
  logger.warn('[NotFound] Route not found', {
    path: req.path,
    method: req.method
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      details: null,
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * Async handler wrapper
 * Wraps async route handlers to catch errors automatically
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
