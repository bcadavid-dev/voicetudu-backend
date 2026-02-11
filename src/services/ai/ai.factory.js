/**
 * AI Service Factory
 * Creates AI service instances based on configuration
 * Implements Factory Pattern for provider selection
 * 
 * Usage:
 *   const aiService = createAIService(config);
 *   const result = await aiService.transcribe(audioBuffer);
 */

import { OpenAIService } from './providers/openai.service.js';
import { OpenRouterService } from './providers/openrouter.service.js';
import { logger } from '../../utils/logger.js';

/**
 * Available AI provider implementations
 */
const PROVIDERS = {
  openai: OpenAIService,
  openrouter: OpenRouterService
};

/**
 * Creates an AI service instance based on provider name
 * @param {Object} config - Configuration object
 * @param {string} config.aiProvider - Provider name ('openai' or 'openrouter')
 * @param {Object} config.openai - OpenAI configuration
 * @param {Object} config.openrouter - OpenRouter configuration
 * @returns {AIServiceInterface} AI service instance
 * @throws {Error} If provider is not supported
 */
export function createAIService(config) {
  const providerName = config.aiProvider?.toLowerCase();

  logger.info('[AIFactory] Creating AI service', { provider: providerName });

  if (!providerName || !PROVIDERS[providerName]) {
    const available = Object.keys(PROVIDERS).join(', ');
    throw new Error(
      `Unknown AI provider: ${providerName}. Available providers: ${available}`
    );
  }

  const ProviderClass = PROVIDERS[providerName];
  
  // Get provider-specific config
  let providerConfig;
  switch (providerName) {
    case 'openai':
      providerConfig = config.openai;
      if (!providerConfig?.apiKey) {
        throw new Error('OpenAI API key is required');
      }
      break;
    case 'openrouter':
      providerConfig = config.openrouter;
      if (!providerConfig?.apiKey) {
        throw new Error('OpenRouter API key is required');
      }
      break;
    default:
      throw new Error(`Configuration not defined for provider: ${providerName}`);
  }

  const service = new ProviderClass(providerConfig);
  
  logger.info('[AIFactory] AI service created successfully', { 
    provider: providerName,
    model: providerConfig.model || 'default'
  });

  return service;
}

/**
 * Gets list of available provider names
 * @returns {string[]} Array of provider names
 */
export function getAvailableProviders() {
  return Object.keys(PROVIDERS);
}

/**
 * Checks if a provider is supported
 * @param {string} providerName - Name of the provider
 * @returns {boolean} True if supported
 */
export function isProviderSupported(providerName) {
  return providerName?.toLowerCase() in PROVIDERS;
}
