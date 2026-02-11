/**
 * Environment configuration validation
 * Validates all required environment variables at startup
 */

const REQUIRED_VARS = [
  'AI_PROVIDER',
  'OPENAI_API_KEY'
];

const OPTIONAL_VARS = {
  PORT: '3000',
  NODE_ENV: 'development',
  MAX_FILE_SIZE: '25',
  ALLOWED_ORIGINS: 'http://localhost:5173,http://localhost:3000',
  OPENAI_MODEL: 'gpt-4o',
  OPENAI_WHISPER_MODEL: 'whisper-1'
};

/**
 * Validates environment variables and sets defaults
 * @throws {Error} If required variables are missing
 */
export function validateEnv() {
  const missing = [];

  for (const variable of REQUIRED_VARS) {
    if (!process.env[variable]) {
      missing.push(variable);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Set defaults for optional variables
  for (const [key, defaultValue] of Object.entries(OPTIONAL_VARS)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
      console.log(`[ENV] Set default value for ${key}: ${defaultValue}`);
    }
  }

  // Validate AI_PROVIDER value
  const validProviders = ['openai', 'openrouter'];
  if (!validProviders.includes(process.env.AI_PROVIDER)) {
    throw new Error(
      `Invalid AI_PROVIDER: ${process.env.AI_PROVIDER}. Must be one of: ${validProviders.join(', ')}`
    );
  }

  console.log(`[ENV] Configuration validated successfully`);
  console.log(`[ENV] AI Provider: ${process.env.AI_PROVIDER}`);
  console.log(`[ENV] Environment: ${process.env.NODE_ENV}`);
}

/**
 * Gets configuration object with all environment variables
 * Uses defaults if validateEnv() hasn't been called yet
 * @returns {Object} Configuration object
 */
export function getConfig() {
  return {
    aiProvider: process.env.AI_PROVIDER || 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      whisperModel: process.env.OPENAI_WHISPER_MODEL || 'whisper-1'
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY,
      model: process.env.OPENROUTER_MODEL
    },
    server: {
      port: parseInt(process.env.PORT, 10) || 3000,
      env: process.env.NODE_ENV || 'development',
      maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 25,
      allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
    }
  };
}
