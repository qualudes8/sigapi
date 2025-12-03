const express = require('express');
const router = express.Router();
const config = require('../config');
const logger = require('../utils/logger');
const signalService = require('../services/signal');

/**
 * GET /qrcode
 * Get QR code link for linking new devices
 * 
 * Query params:
 * - device_name: Name for the new device (optional, default: "signal-api")
 */
router.get('/', async (req, res) => {
  try {
    const deviceName = req.query.device_name || 'signal-api';
    
    const qrLink = await signalService.getQRCodeLink(deviceName);
    
    logger.info('QR code link generated', { deviceName });

    res.json({
      success: true,
      deviceName,
      qrCodeLink: qrLink,
      instructions: 'Open Signal app > Settings > Linked Devices > + > Scan QR code'
    });

  } catch (error) {
    logger.error('Error getting QR code', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

