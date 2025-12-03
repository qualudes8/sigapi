const express = require('express');
const router = express.Router();
const config = require('../config');
const logger = require('../utils/logger');
const signalService = require('../services/signal');

/**
 * GET /groups
 * List all groups the account is part of
 */
router.get('/', async (req, res) => {
  try {
    if (!config.signalNumber) {
      return res.status(500).json({
        success: false,
        error: 'SIGNAL_NUMBER not configured'
      });
    }

    const groups = await signalService.getGroups();
    
    logger.info('Groups listed', { count: groups.length });

    res.json({
      success: true,
      count: groups.length,
      groups: groups.map(g => ({
        id: g.id,
        name: g.name,
        memberCount: g.members?.length || 0
      }))
    });

  } catch (error) {
    logger.error('Error listing groups', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /groups
 * Create a new group
 * 
 * Body:
 * {
 *   "name": "Group Name",
 *   "members": ["+1234567890", "+0987654321"]
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { name, members } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'name is required and must be a non-empty string'
      });
    }

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'members is required and must be a non-empty array of phone numbers'
      });
    }

    if (!config.signalNumber) {
      return res.status(500).json({
        success: false,
        error: 'SIGNAL_NUMBER not configured'
      });
    }

    const group = await signalService.createGroup(name, members);
    
    logger.info('Group created', { name, memberCount: members.length });

    res.json({
      success: true,
      group: {
        id: group.id,
        name: group.name
      }
    });

  } catch (error) {
    logger.error('Error creating group', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

