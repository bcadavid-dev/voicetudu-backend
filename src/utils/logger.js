/**
 * Simple logger utility with timestamps
 * All logs include ISO timestamp for debugging
 */

/**
 * Gets current timestamp in ISO format
 * @returns {string} ISO timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Logger object with different log levels
 */
export const logger = {
  /**
   * Info level log
   * @param {string} message - Log message
   * @param {Object} [meta] - Additional metadata
   */
  info: (message, meta = null) => {
    const log = `[${getTimestamp()}] [INFO] ${message}`;
    console.log(log, meta ? JSON.stringify(meta) : '');
  },

  /**
   * Error level log
   * @param {string} message - Error message
   * @param {Error|Object} [error] - Error object or details
   */
  error: (message, error = null) => {
    const log = `[${getTimestamp()}] [ERROR] ${message}`;
    if (error) {
      console.error(log, error);
    } else {
      console.error(log);
    }
  },

  /**
   * Warning level log
   * @param {string} message - Warning message
   * @param {Object} [meta] - Additional metadata
   */
  warn: (message, meta = null) => {
    const log = `[${getTimestamp()}] [WARN] ${message}`;
    console.warn(log, meta ? JSON.stringify(meta) : '');
  },

  /**
   * Debug level log (only in development)
   * @param {string} message - Debug message
   * @param {Object} [meta] - Additional metadata
   */
  debug: (message, meta = null) => {
    if (process.env.NODE_ENV === 'development') {
      const log = `[${getTimestamp()}] [DEBUG] ${message}`;
      console.log(log, meta ? JSON.stringify(meta) : '');
    }
  }
};
