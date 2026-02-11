/**
 * File validation utilities
 * Handles validation of audio files for upload
 */

import { logger } from './logger.js';

// Allowed audio MIME types
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',      // MP3
  'audio/wav',       // WAV
  'audio/x-wav',     // WAV (alternative)
  'audio/mp4',       // M4A
  'audio/x-m4a',     // M4A (alternative)
  'audio/ogg',       // OGG
  'audio/webm'       // WEBM
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.ogg', '.webm'];

// Maximum file size in MB (default 25)
const DEFAULT_MAX_SIZE_MB = 25;

// Maximum audio duration in minutes
const MAX_DURATION_MINUTES = 10;

/**
 * Validates file type by MIME type and extension
 * @param {Object} file - Multer file object
 * @returns {boolean} True if valid
 */
export function validateFileType(file) {
  const mimeTypeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);
  
  const extension = file.originalname.toLowerCase().slice(file.originalname.lastIndexOf('.'));
  const extensionValid = ALLOWED_EXTENSIONS.includes(extension);

  logger.debug('File type validation', { 
    mimeType: file.mimetype, 
    extension,
    mimeTypeValid,
    extensionValid 
  });

  return mimeTypeValid || extensionValid;
}

/**
 * Validates file size
 * @param {Object} file - Multer file object
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean} True if valid
 */
export function validateFileSize(file, maxSizeMB = DEFAULT_MAX_SIZE_MB) {
  const maxBytes = maxSizeMB * 1024 * 1024;
  const isValid = file.size <= maxBytes;

  logger.debug('File size validation', { 
    size: file.size, 
    maxBytes,
    isValid 
  });

  return isValid;
}

/**
 * Estimates audio duration based on file size
 * This is a rough estimation - actual duration validation happens after transcription
 * @param {number} fileSize - File size in bytes
 * @param {string} mimeType - Audio MIME type
 * @returns {number} Estimated duration in minutes
 */
export function estimateDuration(fileSize, mimeType) {
  // Rough bitrate estimates by format (kbps)
  const bitrates = {
    'audio/mpeg': 128,
    'audio/wav': 1411,
    'audio/x-wav': 1411,
    'audio/mp4': 128,
    'audio/x-m4a': 128,
    'audio/ogg': 128,
    'audio/webm': 128
  };

  const bitrate = bitrates[mimeType] || 128;
  // Duration in seconds = (file size * 8) / (bitrate * 1000)
  const durationSeconds = (fileSize * 8) / (bitrate * 1000);
  const durationMinutes = durationSeconds / 60;

  logger.debug('Duration estimation', { 
    fileSize, 
    mimeType, 
    bitrate, 
    durationMinutes 
  });

  return durationMinutes;
}

/**
 * Validates if estimated duration is within limits
 * @param {number} fileSize - File size in bytes
 * @param {string} mimeType - Audio MIME type
 * @param {number} maxMinutes - Maximum duration in minutes
 * @returns {boolean} True if within limits
 */
export function validateDuration(fileSize, mimeType, maxMinutes = MAX_DURATION_MINUTES) {
  const estimatedMinutes = estimateDuration(fileSize, mimeType);
  const isValid = estimatedMinutes <= maxMinutes;

  logger.debug('Duration validation', { 
    estimatedMinutes, 
    maxMinutes, 
    isValid 
  });

  return isValid;
}

/**
 * Gets human-readable file size
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size (e.g., "5.2 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Gets file extension from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension with dot
 */
export function getExtensionFromMimeType(mimeType) {
  const mimeToExt = {
    'audio/mpeg': '.mp3',
    'audio/wav': '.wav',
    'audio/x-wav': '.wav',
    'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a',
    'audio/ogg': '.ogg',
    'audio/webm': '.webm'
  };
  return mimeToExt[mimeType] || '.bin';
}
