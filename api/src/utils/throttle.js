const config = require('../config');
const logger = require('./logger');

/**
 * Simple queue implementation with rate limiting
 * Uses p-queue for controlled concurrency and delays
 */

let PQueue;
let queue;

// Initialize the queue
async function initQueue() {
  if (!queue) {
    // Dynamic import for ES module
    const pQueueModule = await import('p-queue');
    PQueue = pQueueModule.default;
    
    queue = new PQueue({
      concurrency: config.maxConcurrent,  // Process one at a time
      interval: config.rateLimitDelayMs,  // Delay between operations
      intervalCap: 1                       // Only 1 operation per interval
    });

    // Log queue events
    queue.on('active', () => {
      logger.debug('Queue: Task started', {
        pending: queue.pending,
        size: queue.size
      });
    });

    queue.on('idle', () => {
      logger.debug('Queue: All tasks completed');
    });

    logger.info('Message queue initialized', {
      concurrency: config.maxConcurrent,
      delayMs: config.rateLimitDelayMs
    });
  }
  return queue;
}

/**
 * Add a task to the queue
 * @param {Function} task - Async function to execute
 * @returns {Promise} - Resolves when task completes
 */
async function addToQueue(task) {
  const q = await initQueue();
  return q.add(task);
}

/**
 * Get current queue status
 */
function getQueueStatus() {
  if (!queue) {
    return {
      initialized: false,
      pending: 0,
      size: 0
    };
  }
  
  return {
    initialized: true,
    pending: queue.pending,  // Currently running
    size: queue.size,        // Waiting in queue
    isPaused: queue.isPaused
  };
}

/**
 * Pause the queue (stop processing new items)
 */
async function pauseQueue() {
  const q = await initQueue();
  q.pause();
  logger.info('Queue paused');
}

/**
 * Resume the queue
 */
async function resumeQueue() {
  const q = await initQueue();
  q.start();
  logger.info('Queue resumed');
}

/**
 * Clear all pending items from the queue
 */
async function clearQueue() {
  const q = await initQueue();
  q.clear();
  logger.info('Queue cleared');
}

module.exports = {
  addToQueue,
  getQueueStatus,
  pauseQueue,
  resumeQueue,
  clearQueue
};

