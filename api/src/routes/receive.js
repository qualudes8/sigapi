const express = require('express');
const router = express.Router();
const config = require('../config');
const logger = require('../utils/logger');
const signalService = require('../services/signal');

/**
 * GET /receive
 * Get incoming messages
 */
router.get('/', async (req, res) => {
  try {
    if (!config.signalNumber) {
      return res.status(500).json({
        success: false,
        error: 'SIGNAL_NUMBER not configured'
      });
    }

    const messages = await signalService.receive();
    
    logger.info('Messages received', { count: messages.length });

    res.json({
      success: true,
      count: messages.length,
      messages: messages.map(m => ({
        timestamp: m.timestamp,
        source: m.sourceNumber || m.source,
        message: m.dataMessage?.message || null,
        groupId: m.dataMessage?.groupInfo?.groupId || null,
        attachments: m.dataMessage?.attachments?.length || 0
      }))
    });

  } catch (error) {
    logger.error('Error receiving messages', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

