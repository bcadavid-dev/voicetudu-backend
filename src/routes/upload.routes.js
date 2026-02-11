/**
 * Upload Routes
 * Handles audio file upload and processing
 * POST /api/upload - Upload and process audio file
 */

import { Router } from 'express';
import { handleUpload } from '../middleware/upload.middleware.js';
import { transcriptionService } from '../services/transcription/transcription.service.js';
import { asyncHandler, APIError } from '../middleware/error.middleware.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * POST /api/upload
 * Uploads an audio file, transcribes it, and analyzes the content
 * 
 * Request:
 *   - Content-Type: multipart/form-data
 *   - Field: audio (file)
 * 
 * Response:
 *   - 200: Success with transcription, summary, tasks, and email
 *   - 400: Invalid file format or missing file
 *   - 413: File too large
 *   - 422: Audio too long
 *   - 500: Processing error
 */
router.post(
  '/upload',
  handleUpload,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    logger.info('[UploadRoute] Processing upload request', {
      filename: req.file.originalname,
      size: req.file.size
    });

    try {
      // Process audio with transcription service
      const result = await transcriptionService.processAudio(
        req.file.buffer,
        {
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      );

      // Add processing time to metadata
      result.metadata.processingTime = Date.now() - startTime;

      logger.info('[UploadRoute] Upload processed successfully', {
        processingTime: `${result.metadata.processingTime}ms`,
        provider: result.metadata.provider
      });

      res.json(result);

    } catch (error) {
      logger.error('[UploadRoute] Processing failed', error);

      // Classify errors for appropriate HTTP response
      if (error.message?.includes('Transcription failed')) {
        throw new APIError(
          'Failed to transcribe audio',
          500,
          'TRANSCRIPTION_ERROR',
          error.message
        );
      }

      if (error.message?.includes('Analysis failed')) {
        throw new APIError(
          'Failed to analyze transcription',
          502,
          'ANALYSIS_ERROR',
          error.message
        );
      }

      if (error.message?.includes('Empty transcription')) {
        throw new APIError(
          'Could not transcribe audio - no speech detected',
          422,
          'EMPTY_TRANSCRIPTION',
          error.message
        );
      }

      // Re-throw for generic handling
      throw error;
    }
  })
);

/**
 * GET /api/upload/formats
 * Returns supported audio formats
 */
router.get(
  '/upload/formats',
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      data: {
        formats: [
          { extension: '.mp3', mimeType: 'audio/mpeg', description: 'MP3 Audio' },
          { extension: '.wav', mimeType: 'audio/wav', description: 'WAV Audio' },
          { extension: '.m4a', mimeType: 'audio/mp4', description: 'M4A Audio' },
          { extension: '.ogg', mimeType: 'audio/ogg', description: 'OGG Audio' },
          { extension: '.webm', mimeType: 'audio/webm', description: 'WebM Audio' }
        ],
        maxFileSize: `${process.env.MAX_FILE_SIZE || 25}MB`,
        maxDuration: '10 minutes'
      }
    });
  })
);

export default router;
