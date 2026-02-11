/**
 * Transcription Service
 * Orchestrates the transcription and analysis workflow
 * Uses AI Factory to get the appropriate provider
 */

import { createAIService } from '../ai/ai.factory.js';
import { getConfig } from '../../config/env.config.js';
import { logger } from '../../utils/logger.js';

// Analysis prompt template
const ANALYSIS_PROMPT = `Eres un asistente que analiza transcripciones de audio para extraer información clave.

Analiza la siguiente transcripción y genera un JSON con:
1. **transcription**: La transcripción completa y limpia
2. **summary**: Un resumen ejecutivo conciso (máximo 150 palabras)
3. **tasks**: Lista de tareas accionables encontradas (si no hay, devolver array vacío)
4. **email**: Un correo electrónico profesional basado en el contenido

IMPORTANTE: Responde ÚNICAMENTE con el JSON, sin texto adicional.

Formato JSON requerido:
{
  "transcription": "texto completo aquí",
  "summary": "resumen conciso aquí",
  "tasks": ["tarea 1", "tarea 2", "tarea 3"],
  "email": {
    "subject": "asunto profesional y relevante",
    "body": "cuerpo del email formal con saludo, contenido y despedida"
  }
}

Transcripción a analizar:
"""
{{TRANSCRIPTION}}
"""`;

/**
 * Transcription service singleton
 * Manages AI provider instance
 */
class TranscriptionService {
  constructor() {
    this.aiService = null;
    this.initialized = false;
  }

  /**
   * Initializes the transcription service with AI provider
   */
  initialize() {
    if (this.initialized) return;

    try {
      const config = getConfig();
      this.aiService = createAIService(config);
      this.initialized = true;
      
      logger.info('[TranscriptionService] Initialized with provider', {
        provider: this.aiService.getProviderName()
      });
    } catch (error) {
      logger.error('[TranscriptionService] Initialization failed', error);
      throw error;
    }
  }

  /**
   * Processes audio file: transcribe and analyze
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {Object} metadata - File metadata
   * @param {string} metadata.originalName - Original filename
   * @param {number} metadata.size - File size in bytes
   * @param {string} metadata.mimetype - MIME type
   * @returns {Promise<Object>} Processing result
   */
  async processAudio(audioBuffer, metadata) {
    const startTime = Date.now();
    
    if (!this.initialized) {
      this.initialize();
    }

    logger.info('[TranscriptionService] Starting audio processing', {
      filename: metadata.originalName,
      size: metadata.size,
      mimetype: metadata.mimetype
    });

    try {
      // Step 1: Transcribe audio
      logger.info('[TranscriptionService] Step 1/2: Transcribing audio');
      const transcriptionResult = await this.aiService.transcribe(audioBuffer, {
        language: 'es' // Default to Spanish, can be made configurable
      });

      if (!transcriptionResult.text || transcriptionResult.text.trim().length === 0) {
        throw new Error('Transcription resulted in empty text');
      }

      logger.info('[TranscriptionService] Transcription complete', {
        textLength: transcriptionResult.text.length,
        duration: transcriptionResult.duration,
        language: transcriptionResult.language
      });

      // Step 2: Analyze transcription
      logger.info('[TranscriptionService] Step 2/2: Analyzing transcription');
      const analysisResult = await this.aiService.analyze(
        transcriptionResult.text,
        ANALYSIS_PROMPT
      );

      const processingTime = Date.now() - startTime;

      logger.info('[TranscriptionService] Processing complete', {
        processingTime: `${processingTime}ms`,
        summaryLength: analysisResult.summary?.length || 0,
        tasksCount: analysisResult.tasks?.length || 0
      });

      return {
        success: true,
        data: {
          transcription: analysisResult.transcription || transcriptionResult.text,
          summary: analysisResult.summary,
          tasks: analysisResult.tasks || [],
          email: analysisResult.email
        },
        metadata: {
          processingTime,
          audioSize: metadata.size,
          audioDuration: transcriptionResult.duration,
          provider: this.aiService.getProviderName()
        }
      };

    } catch (error) {
      logger.error('[TranscriptionService] Processing failed', error);
      throw error;
    }
  }

  /**
   * Gets current provider name
   * @returns {string|null} Provider name or null if not initialized
   */
  getProviderName() {
    return this.aiService?.getProviderName() || null;
  }

  /**
   * Checks if service is healthy
   * @returns {Promise<boolean>} True if healthy
   */
  async isHealthy() {
    if (!this.aiService) {
      return false;
    }
    return await this.aiService.isHealthy();
  }
}

// Export singleton instance
export const transcriptionService = new TranscriptionService();
