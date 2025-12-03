const express = require('express');
const router = express.Router();
const config = require('../config');
const logger = require('../utils/logger');
const { addToQueue } = require('../utils/throttle');
const signalService = require('../services/signal');

/**
 * POST /send
 * Send a message to one or more recipients
 * 
 * Body (JSON):
 * {
 *   "recipients": ["+1234567890", "group.groupId"],
 *   "message": "Your message here"
 * }
 * 
 * Or multipart form-data:
 * - recipients: JSON array or comma-separated list
 * - message: text message
 * - media: file upload
 * 
 * Group format: Use "group.GROUPID" (with period) as returned by Signal API
 * Alternative: "group:GROUPID" (with colon) also works
 */
router.post('/', async (req, res) => {
  try {
    // Parse recipients
    let recipients = req.body.recipients;
    if (typeof recipients === 'string') {
      // Try to parse as JSON, otherwise split by comma
      try {
        recipients = JSON.parse(recipients);
      } catch {
        recipients = recipients.split(',').map(r => r.trim());
      }
    }
    
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'recipients is required and must be a non-empty array'
      });
    }

    const message = req.body.message;
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'message is required and must be a non-empty string'
      });
    }

    // Check if Signal number is configured
    if (!config.signalNumber) {
      return res.status(500).json({
        success: false,
        error: 'SIGNAL_NUMBER not configured. Set it in your .env file.'
      });
    }

    // Get media path (from file upload or body)
    let mediaPath = null;
    if (req.file) {
      mediaPath = req.file.path;
    } else if (req.body.media) {
      mediaPath = req.body.media;
    }

    // Create job ID for tracking
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('New send request received', {
      jobId,
      recipientCount: recipients.length,
      hasMedia: !!mediaPath,
      messageLength: message.length
    });

    // Queue messages for each recipient
    const results = [];
    const promises = recipients.map(async (recipient) => {
      return addToQueue(async () => {
        const result = await sendToRecipient(recipient, message, mediaPath, jobId);
        results.push(result);
        return result;
      });
    });

    // Wait for all messages to be queued and processed
    await Promise.all(promises);

    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    logger.info('Send request completed', {
      jobId,
      successful,
      failed,
      total: recipients.length
    });

    res.json({
      success: failed === 0,
      jobId,
      summary: {
        total: recipients.length,
        successful,
        failed
      },
      results
    });

  } catch (error) {
    logger.error('Error processing send request', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Check if recipient is a group
 * Accepts both "group.ID" (Signal format) and "group:ID" (alternative)
 */
function isGroupRecipient(recipient) {
  return recipient.startsWith('group.') || recipient.startsWith('group:');
}

/**
 * Extract group ID from recipient string
 * Handles both "group.ID" and "group:ID" formats
 */
function extractGroupId(recipient) {
  if (recipient.startsWith('group.')) {
    return recipient.slice(6); // Remove "group." prefix
  }
  if (recipient.startsWith('group:')) {
    return recipient.slice(6); // Remove "group:" prefix
  }
  return recipient;
}

/**
 * Send message to a single recipient
 */
async function sendToRecipient(recipient, message, mediaPath, jobId) {
  const startTime = Date.now();
  const isGroup = isGroupRecipient(recipient);
  
  try {
    let response;
    
    if (isGroup) {
      const groupId = extractGroupId(recipient);
      response = await signalService.sendToGroup(groupId, message, mediaPath);
    } else {
      response = await signalService.sendToUser(recipient, message, mediaPath);
    }

    const duration = Date.now() - startTime;
    
    logger.info('Message sent successfully', {
      jobId,
      recipient: isGroup ? `group:${extractGroupId(recipient).slice(0, 8)}...` : `${recipient.slice(0, 6)}...`,
      isGroup,
      duration,
      hasMedia: !!mediaPath
    });

    return {
      success: true,
      recipient,
      isGroup,
      timestamp: new Date().toISOString(),
      duration
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Failed to send message', {
      jobId,
      recipient: isGroup ? `group:${extractGroupId(recipient).slice(0, 8)}...` : `${recipient.slice(0, 6)}...`,
      isGroup,
      error: error.message,
      duration
    });

    return {
      success: false,
      recipient,
      isGroup,
      error: error.message,
      timestamp: new Date().toISOString(),
      duration
    };
  }
}

module.exports = router;
