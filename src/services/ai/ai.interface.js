/**
 * AI Service Interface
 * Defines the contract that all AI providers must implement
 * This allows seamless switching between providers (OpenAI, OpenRouter, etc.)
 * 
 * @interface
 */

/**
 * @typedef {Object} TranscriptionOptions
 * @property {string} [language] - Language code (e.g., 'es', 'en')
 * @property {string} [model] - Model to use for transcription
 */

/**
 * @typedef {Object} TranscriptionResult
 * @property {string} text - Transcribed text
 * @property {number} duration - Audio duration in seconds
 * @property {string} [language] - Detected language
 */

/**
 * @typedef {Object} AnalysisPrompt
 * @property {string} template - Prompt template with placeholders
 * @property {Object} variables - Variables to replace in template
 */

/**
 * @typedef {Object} AnalysisResult
 * @property {string} transcription - Full transcription text
 * @property {string} summary - Executive summary
 * @property {string[]} tasks - List of actionable tasks
 * @property {Object} email - Generated email
 * @property {string} email.subject - Email subject
 * @property {string} email.body - Email body
 */

/**
 * AI Service Interface
 * All AI providers must implement these methods
 */
export class AIServiceInterface {
  /**
   * Creates an instance of AIServiceInterface
   * @throws {Error} Cannot instantiate interface directly
   */
  constructor() {
    if (new.target === AIServiceInterface) {
      throw new Error('Cannot instantiate interface directly');
    }
  }

  /**
   * Transcribes audio to text
   * @param {Buffer} audioBuffer - Audio file buffer
   * @param {TranscriptionOptions} [options] - Transcription options
   * @returns {Promise<TranscriptionResult>} Transcription result
   * @throws {Error} If transcription fails
   */
  async transcribe(audioBuffer, options = {}) {
    throw new Error('Method transcribe() must be implemented');
  }

  /**
   * Analyzes transcription using LLM
   * @param {string} transcription - Text to analyze
   * @param {string} promptTemplate - Prompt template
   * @returns {Promise<AnalysisResult>} Analysis result
   * @throws {Error} If analysis fails
   */
  async analyze(transcription, promptTemplate) {
    throw new Error('Method analyze() must be implemented');
  }

  /**
   * Gets provider name
   * @returns {string} Provider identifier
   */
  getProviderName() {
    throw new Error('Method getProviderName() must be implemented');
  }

  /**
   * Checks if provider is available/healthy
   * @returns {Promise<boolean>} True if provider is ready
   */
  async isHealthy() {
    throw new Error('Method isHealthy() must be implemented');
  }
}
