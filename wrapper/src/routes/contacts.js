const express = require('express');
const router = express.Router();
const config = require('../config');
const logger = require('../utils/logger');
const signalService = require('../services/signal');

/**
 * GET /contacts
 * List all contacts
 */
router.get('/', async (req, res) => {
  try {
    if (!config.signalNumber) {
      return res.status(500).json({
        success: false,
        error: 'SIGNAL_NUMBER not configured'
      });
    }

    const contacts = await signalService.getContacts();
    
    logger.info('Contacts listed', { count: contacts.length });

    res.json({
      success: true,
      count: contacts.length,
      contacts: contacts.map(c => ({
        number: c.number,
        name: c.name || c.profile_name || null,
        blocked: c.blocked || false
      }))
    });

  } catch (error) {
    logger.error('Error listing contacts', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

