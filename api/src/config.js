/**
 * Configuration settings for the Signal API Wrapper
 */

const config = {
  // Server settings
  port: parseInt(process.env.PORT) || 3000,
  
  // Signal API settings
  signalApiUrl: process.env.SIGNAL_API_URL || 'http://localhost:8080',
  signalNumber: process.env.SIGNAL_NUMBER || '',
  
  // Rate limiting
  rateLimitDelayMs: parseInt(process.env.RATE_LIMIT_DELAY_MS) || 1000,
  maxConcurrent: 1,  // Process one message at a time
  
  // File upload limits
  maxFileSize: 100 * 1024 * 1024,  // 100MB max file size
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logDir: process.env.LOG_DIR || './logs',
};

// Validation
if (!config.signalNumber) {
  console.warn('WARNING: SIGNAL_NUMBER not set. You must set this before sending messages.');
}

module.exports = config;

