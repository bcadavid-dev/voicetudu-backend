/**
 * OpenRouter Service Implementation
 * Implements the AIServiceInterface using OpenRouter's API
 * This is a skeleton for future migration from OpenAI to OpenRouter
 * 
 * To migrate:
 * 1. Implement transcribe() method using OpenRouter's audio endpoints
 * 2. Implement analyze() method using OpenRouter's chat completions
 * 3. Add OPENROUTER_API_KEY to .env
 * 4. Change AI_PROVIDER=openrouter in .env
 */

import { AIServiceInterface } from '../ai.interface.js';
import { logger } from '../../../utils/logger.js';

/**
 * OpenRouter service provider
 * @implements {AIServiceInterface}
 */
export class OpenRouterService extends AIServiceInterface {
  /**
   * Creates an instance of OpenRouterService
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - OpenRouter API key
   * @param {string} config.model - Model for analysis (default: openai/gpt-4o)
   */
  constructor(config) {
    super();
    this.config = {
      model: config.model || 'openai/gpt-4o'
    };
    this.apiKey = config.apiKey;
    this.baseUrl = 'https://openrouter.ai/api/v1';

    logger.info('[OpenRouter] Service initialized', { 
      model: this.config.model 
    });

    // NOTE: This is a skeleton implementation
    // Full implementation requires OpenRouter API integration
    logger.warn('[OpenRouter] Service is not fully implemented yet');
  }

  /**
   * Transcribes audio using OpenRouter
   * TODO: Implement using OpenRouter's audio transcription endpoint
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {Object} [options] - Transcription options
   * @returns {Promise<Object>} Transcription result
   */
  async transcribe(audioBuffer, options = {}) {
    logger.info('[OpenRouter] Starting transcription', { 
      bufferSize: audioBuffer.length 
    });

    try {
      // TODO: Implement OpenRouter transcription
      // OpenRouter doesn't directly support Whisper-style transcription
      // You may need to:
      // 1. Use a different service for transcription (e.g., local Whisper)
      // 2. Or use OpenAI for transcription and OpenRouter for analysis
      
      throw new Error('Transcription not yet implemented for OpenRouter. ' +
        'Consider using OpenAI for transcription or implement a local Whisper solution.');

    } catch (error) {
      logger.error('[OpenRouter] Transcription failed', error);
      throw error;
    }
  }

  /**
   * Analyzes transcription using OpenRouter's LLM
   * TODO: Implement using OpenRouter's chat completions endpoint
   * @param {string} transcription - Text to analyze
   * @param {string} promptTemplate - Prompt template
   * @returns {Promise<Object>} Analysis result
   */
  async analyze(transcription, promptTemplate) {
    logger.info('[OpenRouter] Starting analysis', { 
      transcriptionLength: transcription.length 
    });

    try {
      // TODO: Implement OpenRouter chat completion
      // Example structure:
      // const response = await fetch(`${this.baseUrl}/chat/completions`, {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${this.apiKey}`,
      //     'Content-Type': 'application/json',
      //     'HTTP-Referer': 'https://your-app.com',
      //     'X-Title': 'Voicetudu'
      //   },
      //   body: JSON.stringify({
      //     model: this.config.model,
      //     messages: [
      //       { role: 'system', content: 'You are a helpful assistant...' },
      //       { role: 'user', content: prompt }
      //     ]
      //   })
      // });

      throw new Error('Analysis not yet implemented for OpenRouter');

    } catch (error) {
      logger.error('[OpenRouter] Analysis failed', error);
      throw error;
    }
  }

  /**
   * Gets provider name
   * @returns {string} Provider identifier
   */
  getProviderName() {
    return 'openrouter';
  }

  /**
   * Checks if OpenRouter API is accessible
   * @returns {Promise<boolean>} True if healthy
   */
  async isHealthy() {
    try {
      // TODO: Implement health check
      // const response = await fetch(`${this.baseUrl}/models`, {
      //   headers: { 'Authorization': `Bearer ${this.apiKey}` }
      // });
      // return response.ok;
      
      return false; // Not implemented yet
    } catch (error) {
      logger.error('[OpenRouter] Health check failed', error);
      return false;
    }
  }
}

/**
 * Migration Guide: OpenAI to OpenRouter
 * 
 * 1. Update .env:
 *    AI_PROVIDER=openrouter
 *    OPENROUTER_API_KEY=your_key_here
 *    OPENROUTER_MODEL=openai/gpt-4o
 * 
 * 2. Implement the methods above following OpenRouter's API docs:
 *    https://openrouter.ai/docs
 * 
 * 3. For transcription, consider these options:
 *    a) Keep using OpenAI Whisper for transcription
 *    b) Use a local Whisper instance (e.g., via whisper.cpp)
 *    c) Use another transcription service
 * 
 * 4. Test the migration thoroughly before deploying
 */
