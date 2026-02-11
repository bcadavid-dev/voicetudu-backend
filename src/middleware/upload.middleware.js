/**
 * File Upload Middleware
 * Handles multipart/form-data file uploads using Multer
 * Validates file type, size, and other constraints
 */

import multer from 'multer';
import path from 'path';
import { getConfig } from '../config/env.config.js';
import { 
  validateFileType, 
  validateFileSize, 
  validateDuration,
  formatFileSize 
} from '../utils/validators.js';
import { logger } from '../utils/logger.js';

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/x-wav',
  'audio/mp4',
  'audio/x-m4a',
  'audio/ogg',
  'audio/webm'
];

// Storage configuration - memory storage for processing
const storage = multer.memoryStorage();

/**
 * File filter for Multer
 * Validates MIME type and file extension
 */
const fileFilter = (req, file, cb) => {
  logger.debug('[Upload] File filter check', { 
    originalname: file.originalname,
    mimetype: file.mimetype 
  });

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    logger.warn('[Upload] Invalid MIME type', { mimetype: file.mimetype });
    return cb(new Error('INVALID_FORMAT'), false);
  }

  // Check file extension
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.mp3', '.wav', '.m4a', '.ogg', '.webm'];
  
  if (!allowedExts.includes(ext)) {
    logger.warn('[Upload] Invalid file extension', { extension: ext });
    return cb(new Error('INVALID_FORMAT'), false);
  }

  cb(null, true);
};

/**
 * Creates Multer upload middleware with configured limits
 * @returns {Object} Multer instance
 */
let uploadInstance = null;

function getUploadMiddleware() {
  if (!uploadInstance) {
    const config = getConfig();
    const maxFileSizeMB = config.server.maxFileSize;
    const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;

    logger.info('[Upload] Middleware configured', { 
      maxFileSize: `${maxFileSizeMB}MB`,
      allowedTypes: ALLOWED_MIME_TYPES 
    });

    uploadInstance = multer({
      storage,
      fileFilter,
      limits: {
        fileSize: maxFileSizeBytes,
        files: 1 // Only allow single file upload
      }
    });
  }
  return uploadInstance;
}

/**
 * Middleware for handling single file upload
 * Wraps multer to provide better error handling
 */
export function handleUpload(req, res, next) {
  const singleUpload = getUploadMiddleware().single('audio');

  singleUpload(req, res, (err) => {
    if (err) {
      // Handle Multer errors
      if (err instanceof multer.MulterError) {
        logger.error('[Upload] Multer error', err);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: `File size exceeds maximum limit of ${getConfig().server.maxFileSize}MB`,
              details: 'Please upload a smaller file'
            }
          });
        }
        
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_FIELD',
              message: 'Invalid field name for file upload',
              details: 'Expected field name: "audio"'
            }
          });
        }

        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message,
            details: err.code
          }
        });
      }

      // Handle custom validation errors
      if (err.message === 'INVALID_FORMAT') {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FORMAT',
            message: 'Invalid audio format',
            details: 'Allowed formats: MP3, WAV, M4A, OGG, WEBM'
          }
        });
      }

      // Generic error
      logger.error('[Upload] Unknown error', err);
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_ERROR',
          message: 'Failed to upload file',
          details: err.message
        }
      });
    }

    // No file uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No audio file provided',
          details: 'Please select an audio file to upload'
        }
      });
    }

    // Validate file size again (double-check)
    if (!validateFileSize(req.file, getConfig().server.maxFileSize)) {
      return res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File size exceeds maximum limit`,
          details: `File: ${formatFileSize(req.file.size)}`
        }
      });
    }

    // Validate estimated duration
    if (!validateDuration(req.file.size, req.file.mimetype, 10)) {
      return res.status(422).json({
        success: false,
        error: {
          code: 'AUDIO_TOO_LONG',
          message: 'Audio duration exceeds maximum limit',
          details: 'Maximum allowed duration: 10 minutes'
        }
      });
    }

    logger.info('[Upload] File uploaded successfully', {
      filename: req.file.originalname,
      size: formatFileSize(req.file.size),
      mimetype: req.file.mimetype
    });

    next();
  });
}
