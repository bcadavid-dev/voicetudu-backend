/**
 * OpenAI Service Implementation
 * Implements the AIServiceInterface using OpenAI's API
 * Handles transcription with Whisper and analysis with GPT-4o
 */

import OpenAI from 'openai';
import { AIServiceInterface } from '../ai.interface.js';
import { logger } from '../../../utils/logger.js';

/**
 * OpenAI service provider
 * @implements {AIServiceInterface}
 */
export class OpenAIService extends AIServiceInterface {
  /**
   * Creates an instance of OpenAIService
   * @param {Object} config - Configuration object
   * @param {string} config.apiKey - OpenAI API key
   * @param {string} config.model - Model for analysis (default: gpt-4o)
   * @param {string} config.whisperModel - Model for transcription (default: whisper-1)
   */
  constructor(config) {
    super();
    this.config = {
      model: config.model || 'gpt-4o',
      whisperModel: config.whisperModel || 'whisper-1'
    };
    
    this.client = new OpenAI({
      apiKey: config.apiKey
    });

    logger.info('[OpenAI] Service initialized', { 
      model: this.config.model,
      whisperModel: this.config.whisperModel 
    });
  }

  /**
   * Transcribes audio using OpenAI Whisper
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {Object} [options] - Transcription options
   * @param {string} [options.language] - Language hint (optional)
   * @returns {Promise<Object>} Transcription result
   */
  async transcribe(audioBuffer, options = {}) {
    const startTime = Date.now();
    
    try {
      logger.info('[OpenAI] Starting transcription', { 
        bufferSize: audioBuffer.length,
        language: options.language || 'auto-detect'
      });

      // Create a File-like object from buffer
      const file = new File([audioBuffer], 'audio.webm', { 
        type: 'audio/webm' 
      });

      const transcriptionOptions = {
        file: file,
        model: this.config.whisperModel,
        response_format: 'verbose_json'
      };

      // Add language hint if provided
      if (options.language) {
        transcriptionOptions.language = options.language;
      }

      const result = await this.client.audio.transcriptions.create(
        transcriptionOptions
      );

      const duration = Date.now() - startTime;
      logger.info('[OpenAI] Transcription completed', { 
        duration: `${duration}ms`,
        textLength: result.text?.length || 0
      });

      return {
        text: result.text,
        duration: result.duration || 0,
        language: result.language || 'unknown'
      };

    } catch (error) {
      logger.error('[OpenAI] Transcription failed', error);
      
      // Handle specific OpenAI errors
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      }
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your configuration.');
      }
      
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Analyzes transcription using GPT-4o
   * @param {string} transcription - Text to analyze
   * @param {string} promptTemplate - Prompt template with {{TRANSCRIPTION}} placeholder
   * @returns {Promise<Object>} Analysis result with summary, tasks, and email
   */
  async analyze(transcription, promptTemplate) {
    const startTime = Date.now();

    try {
      logger.info('[OpenAI] Starting analysis', { 
        transcriptionLength: transcription.length,
        model: this.config.model
      });

      // Replace placeholder in template
      const prompt = promptTemplate.replace('{{TRANSCRIPTION}}', transcription);

      const completion = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes transcriptions and returns structured JSON data.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const content = completion.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      // Parse the JSON response
      const result = JSON.parse(content);

      // Validate required fields
      const requiredFields = ['transcription', 'summary', 'tasks', 'email'];
      for (const field of requiredFields) {
        if (!(field in result)) {
          throw new Error(`Missing required field in response: ${field}`);
        }
      }

      const duration = Date.now() - startTime;
      logger.info('[OpenAI] Analysis completed', { 
        duration: `${duration}ms`,
        tokensUsed: completion.usage?.total_tokens || 'unknown'
      });

      return result;

    } catch (error) {
      logger.error('[OpenAI] Analysis failed', error);
      
      if (error instanceof SyntaxError) {
        throw new Error('Invalid JSON response from OpenAI');
      }
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing.');
      }
      if (error.code === 'rate_limit_exceeded') {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      }
      
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Gets provider name
   * @returns {string} Provider identifier
   */
  getProviderName() {
    return 'openai';
  }

  /**
   * Checks if OpenAI API is accessible
   * @returns {Promise<boolean>} True if healthy
   */
  async isHealthy() {
    try {
      // Simple check by listing models
      await this.client.models.list();
      return true;
    } catch (error) {
      logger.error('[OpenAI] Health check failed', error);
      return false;
    }
  }
}
